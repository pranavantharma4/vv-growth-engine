import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign, client_id, all_campaigns } = await req.json()
    if (!campaign || !client_id) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    // Get client context
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, account_type, agency_name, white_label_reports, industry')
      .eq('id', client_id)
      .single()

    const isAgency = !!(clientData?.white_label_reports || clientData?.account_type === 'agency')
    const agencyName = clientData?.agency_name || 'our team'
    const brandName = clientData?.name || 'the brand'
    const industry = clientData?.industry || 'e-commerce'

    const anthropic = new Anthropic()

    // Derived metrics
    const ctr = campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0'
    const cpa = campaign.conversions > 0
      ? (campaign.spend / campaign.conversions).toFixed(2)
      : 'N/A'
    const aov = campaign.conversions > 0 && campaign.revenue > 0
      ? (campaign.revenue / campaign.conversions).toFixed(2)
      : 'N/A'
    const cpClick = campaign.clicks > 0
      ? (campaign.spend / campaign.clicks).toFixed(2)
      : 'N/A'

    // Portfolio context
    let portfolioContext = ''
    if (all_campaigns && all_campaigns.length > 1) {
      const others = all_campaigns.filter((c: any) => c.id !== campaign.id)
      const avgPortfolioRoas = others.reduce((s: number, c: any) => s + Number(c.roas), 0) / others.length
      const totalPortfolioSpend = all_campaigns.reduce((s: number, c: any) => s + Number(c.spend), 0)
      const thisSpendShare = ((Number(campaign.spend) / totalPortfolioSpend) * 100).toFixed(0)
      const strongCampaigns = others
        .filter((c: any) => c.health === 'strong')
        .map((c: any) => `${c.campaign_name} (${Number(c.roas).toFixed(1)}x ROAS)`)
        .slice(0, 3)
      const roasVsAvg = Number(campaign.roas) > avgPortfolioRoas
        ? `+${(((Number(campaign.roas) / avgPortfolioRoas) - 1) * 100).toFixed(0)}% above`
        : `-${(((avgPortfolioRoas / Math.max(Number(campaign.roas), 0.01)) - 1) * 100).toFixed(0)}% below`

      portfolioContext = `
PORTFOLIO CONTEXT:
- This campaign represents ${thisSpendShare}% of total account spend
- Account average ROAS (excluding this campaign): ${avgPortfolioRoas.toFixed(2)}x
- Total account spend: $${Number(totalPortfolioSpend).toLocaleString()}/mo
- Top performing campaigns: ${strongCampaigns.join(', ') || 'none identified'}
- This campaign ROAS vs account average: ${roasVsAvg} average`
    }

    const systemPrompt = isAgency
      ? `You are a senior performance marketing analyst at ${agencyName}. You are preparing a detailed campaign analysis for ${brandName}. This analysis will be delivered directly to the client as the agency's own work — write in first person plural ("we identified", "our analysis shows"). Be authoritative, specific, and professional. Never reference any third-party tool. The agency owns this insight.`
      : `You are a senior performance marketing analyst with 12+ years managing paid media across Meta, Google, and TikTok for ${industry} brands. You have deep expertise in funnel analysis, creative strategy, audience segmentation, and bid optimization. Speak directly and candidly — give the unvarnished truth about what is happening and exactly what must change.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Provide a comprehensive, expert-level campaign analysis. This is not a surface-level summary — go deep.

CAMPAIGN DETAILS:
Campaign Name: ${campaign.campaign_name}
Platform: ${campaign.platform.toUpperCase()}
Health Classification: ${campaign.health.toUpperCase()}
Monthly Spend: $${Number(campaign.spend).toLocaleString()}
Monthly Revenue Generated: $${Number(campaign.revenue || 0).toLocaleString()}
ROAS: ${Number(campaign.roas).toFixed(2)}x
Click-Through Rate (CTR): ${ctr}%
Cost Per Click (CPC): $${cpClick}
Cost Per Acquisition (CPA): $${cpa}
Average Order Value: $${aov}
Conversions: ${campaign.conversions || 0}
Total Impressions: ${Number(campaign.impressions || 0).toLocaleString()}
Total Clicks: ${Number(campaign.clicks || 0).toLocaleString()}
${portfolioContext}

Write your analysis in exactly this structure:

## What's Happening
In 3-4 sentences, describe precisely what this campaign is doing — not what the numbers say in isolation, but what they reveal about the funnel, the audience behavior, and the economics. Reference the specific metrics. Make it feel like you've been watching this campaign for months.

## Root Cause Diagnosis
Identify the most likely 1-2 root causes of this campaign's current performance. For a STRONG campaign, explain the structural or strategic reasons it's working and what risks could break it. For WEAK/BLEEDING/DEAD campaigns, diagnose whether the problem is at the awareness level (impressions/CTR), interest level (CTR/clicks), or conversion level (CPA/ROAS). Be specific — is this a creative fatigue issue? Audience saturation? Bid strategy mismatch? Landing page disconnect? Attribution problem? Budget pacing?

## The Numbers That Matter Most
Call out the 2-3 specific metrics in this campaign that are either the signal of the problem or the proof of success. Explain what each metric is telling you and why it matters in this specific context.

## Immediate Action Required
State the single most important action to take in the next 48-72 hours. Be surgical — specify exact percentages, exact audience segments, exact creative directions, or exact bid changes.

## Strategic Direction (Next 30 Days)
2-3 strategic moves for the next month. Each must include a specific expected outcome with directional numbers.

## Pattern Recognition
For a STRONG campaign: What is working that should be replicated in other campaigns?
For WEAK/BLEEDING/DEAD: What does this campaign's failure pattern reveal about a broader account issue?`,
      }],
    })

    const analysis = message.content[0].type === 'text' ? message.content[0].text : ''

    // Cache the analysis — wrapped in try/catch, non-fatal
    try {
      await supabase.from('ai_analyses').insert({
        client_id,
        campaign_id: campaign.id || `${campaign.platform}_${campaign.campaign_name}`,
        campaign_name: campaign.campaign_name,
        platform: campaign.platform,
        analysis,
        health_at_analysis: campaign.health,
        roas_at_analysis: campaign.roas,
        recommended_action: '',
      })
    } catch (_) {
      // non-fatal — analysis still returns even if caching fails
    }

    return NextResponse.json({ analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}