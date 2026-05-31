import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { STRICT_SYSTEM_RULES, buildGranularBlock, granularFromRow } from '../../../lib/vai-granular'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign, client_id, all_campaigns } = await req.json()
    if (!campaign || !client_id) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]

    // ── Check cache first — if same campaign analyzed today, serve it ──
    const { data: cached } = await supabase
      .from('ai_analyses')
      .select('analysis, simple_analysis')
      .eq('client_id', client_id)
      .eq('campaign_id', campaign.id || `${campaign.platform}_${campaign.campaign_name}`)
      .eq('snapshot_date', today)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached?.analysis) {
      return NextResponse.json({
        analysis: cached.analysis,
        simple_analysis: cached.simple_analysis || '',
        cached: true,
      })
    }

    // ── Get client context ──
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, account_type, agency_name, white_label_reports, industry')
      .eq('id', client_id)
      .maybeSingle()

    const isAgency  = !!(clientData?.white_label_reports || clientData?.account_type === 'agency')
    const agencyName = clientData?.agency_name || 'our team'
    const brandName  = clientData?.name || 'the brand'
    const industry   = clientData?.industry || 'e-commerce'

    const anthropic = new Anthropic()

    // ── Pull the latest granular snapshot for this campaign (frequency,
    //    demographics, placements, daily trend, bid strategy) so VAI can quote
    //    exact account numbers. Prefer fields already on the passed campaign;
    //    fall back to the freshest campaign_snapshots row by name. ──
    let granularRow: any = campaign
    if (!campaign?.demographic_breakdown && !campaign?.frequency) {
      const { data: snap } = await supabase
        .from('campaign_snapshots')
        .select('*')
        .eq('client_id', client_id)
        .eq('campaign_name', campaign.campaign_name)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (snap) granularRow = { ...campaign, ...snap }
    }
    const granularBlock = buildGranularBlock(granularFromRow(granularRow))

    // ── Derived metrics ──
    const ctr    = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0'
    const cpa    = campaign.conversions > 0 ? (campaign.spend / campaign.conversions).toFixed(2) : 'N/A'
    const aov    = campaign.conversions > 0 && campaign.revenue > 0 ? (campaign.revenue / campaign.conversions).toFixed(2) : 'N/A'
    const cpClick = campaign.clicks > 0 ? (campaign.spend / campaign.clicks).toFixed(2) : 'N/A'

    // ── Portfolio context ──
    let portfolioContext = ''
    if (all_campaigns && all_campaigns.length > 1) {
      const others = all_campaigns.filter((c: any) => c.id !== campaign.id)
      const avgPortfolioRoas = others.reduce((s: number, c: any) => s + Number(c.roas), 0) / others.length
      const totalPortfolioSpend = all_campaigns.reduce((s: number, c: any) => s + Number(c.spend), 0)
      const thisSpendShare = ((Number(campaign.spend) / totalPortfolioSpend) * 100).toFixed(0)
      const strongCampaigns = others.filter((c: any) => c.health === 'strong')
        .map((c: any) => `${c.campaign_name} (${Number(c.roas).toFixed(1)}x ROAS)`).slice(0, 3)
      const roasVsAvg = Number(campaign.roas) > avgPortfolioRoas
        ? `+${(((Number(campaign.roas) / avgPortfolioRoas) - 1) * 100).toFixed(0)}% above`
        : `-${(((avgPortfolioRoas / Math.max(Number(campaign.roas), 0.01)) - 1) * 100).toFixed(0)}% below`

      portfolioContext = `
PORTFOLIO CONTEXT:
- This campaign = ${thisSpendShare}% of total account spend ($${Number(totalPortfolioSpend).toLocaleString()}/mo)
- Account average ROAS (excl. this campaign): ${avgPortfolioRoas.toFixed(2)}x
- This campaign vs account average: ${roasVsAvg}
- Top performing campaigns: ${strongCampaigns.join(', ') || 'none identified'}`
    }

    const baseSystem = isAgency
      ? `You are a senior performance marketing analyst at ${agencyName}. Preparing a campaign analysis for ${brandName}. Write in first person plural ("we identified", "our analysis shows"). Professional, authoritative, client-facing. Never reference any third-party tool.`
      : `You are a senior performance marketing analyst with 12+ years managing paid media across Meta, Google, and TikTok for ${industry} brands. Speak directly and candidly. Reference specific numbers throughout.`
    const systemPrompt = `${baseSystem}\n\n${STRICT_SYSTEM_RULES}`

    const campaignDetails = `
Campaign: ${campaign.campaign_name}
Platform: ${campaign.platform.toUpperCase()}
Health: ${campaign.health.toUpperCase()}
Monthly Spend: $${Number(campaign.spend).toLocaleString()}
Monthly Revenue: $${Number(campaign.revenue || 0).toLocaleString()}
ROAS: ${Number(campaign.roas).toFixed(2)}x
CTR: ${ctr}%  |  CPC: $${cpClick}  |  CPA: $${cpa}  |  AOV: $${aov}
Conversions: ${campaign.conversions || 0}
Impressions: ${Number(campaign.impressions || 0).toLocaleString()}  |  Clicks: ${Number(campaign.clicks || 0).toLocaleString()}
${portfolioContext}
${granularBlock}`

    // ── Generate FULL analysis + SIMPLE analysis in one call ──
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this campaign and produce TWO versions of analysis separated by the delimiter ===SIMPLE===

${campaignDetails}

FIRST — Write the FULL ANALYSIS in exactly this structure:

## What's Happening
3-4 sentences describing precisely what this campaign is doing — what the numbers reveal about funnel behavior and economics. Reference specific metrics. Make it feel like you've been watching this campaign for months.

## Root Cause Diagnosis
The 1-2 most likely root causes. Is this creative fatigue? Audience saturation? Bid strategy mismatch? Landing page disconnect? Attribution problem? For STRONG campaigns, what structural reasons explain success and what risks could break it?

## The Numbers That Matter Most
The 2-3 specific metrics that are either the signal of the problem or proof of success. Explain what each is telling you.

## Immediate Action Required
The single most important action in the next 48-72 hours. Exact percentages, exact audience segments, exact creative directions, exact bid changes. No vague advice.

## Strategic Direction (Next 30 Days)
2-3 strategic moves. Each must include a specific expected outcome with directional numbers.

## Pattern Recognition
What does this campaign reveal that applies to the broader account strategy?

===SIMPLE===

SECOND — Write a SIMPLE SUMMARY (3-4 sentences max, zero jargon, written for a business owner who doesn't know ads). Cover: what is happening with this campaign in plain English, is it working or not, what is the one thing they need to know, and what should happen next. No percentages, no ad terminology, no acronyms — speak like explaining to a friend.`,
      }],
    })

    const fullText = message.content[0].type === 'text' ? message.content[0].text : ''
    const parts = fullText.split('===SIMPLE===')
    const analysis = parts[0]?.trim() || fullText
    const simple_analysis = parts[1]?.trim() || ''

    // ── Cache to DB ──
    try {
      await supabase.from('ai_analyses').insert({
        client_id,
        campaign_id: campaign.id || `${campaign.platform}_${campaign.campaign_name}`,
        campaign_name: campaign.campaign_name,
        platform: campaign.platform,
        analysis,
        simple_analysis,
        health_at_analysis: campaign.health,
        roas_at_analysis: campaign.roas,
        recommended_action: '',
        snapshot_date: today,
      })
    } catch (_) {}

    return NextResponse.json({ analysis, simple_analysis, cached: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}