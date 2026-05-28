import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type CampaignMetric = {
  id: string
  name: string
  status: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
}

type Findings = {
  biggest_leak: { campaign_name: string; monthly_waste: number; why: string }
  best_performer: { campaign_name: string; roas: number; why: string }
  immediate_action: string
}

// POST /api/vision-drop/analyze — pulls the lead's connected Meta account,
// computes per-campaign metrics for the last 30 days, then asks Claude to
// distill the 3 must-see findings + a longer analysis. Saves to
// vision_drop_reports and flips report_generated=true on the lead.
export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Load the lead (need token + account id)
    const { data: lead, error: leadErr } = await supabase
      .from('vision_drop_leads')
      .select('id, name, email, meta_access_token, meta_account_id, meta_token_expires_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    if (!lead.meta_access_token || !lead.meta_account_id) {
      return NextResponse.json({ error: 'Meta account not connected' }, { status: 400 })
    }
    if (lead.meta_token_expires_at && new Date(lead.meta_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Meta token expired — reconnect required' }, { status: 401 })
    }

    // 2. Pull campaign-level insights for the last 30 days
    const since = new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]
    const until = new Date().toISOString().split('T')[0]
    const insightsUrl =
      `https://graph.facebook.com/v19.0/act_${lead.meta_account_id}/insights` +
      `?level=campaign` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
      `&fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions,action_values,purchase_roas` +
      `&limit=200` +
      `&access_token=${lead.meta_access_token}`

    const insightsRes = await fetch(insightsUrl)
    const insightsData = await insightsRes.json()
    if (insightsData.error) {
      console.error('Meta insights error:', insightsData.error)
      return NextResponse.json(
        { error: `Meta API: ${insightsData.error.message}` },
        { status: 502 },
      )
    }

    const rows: any[] = insightsData.data || []
    const campaigns: CampaignMetric[] = rows.map((r) => {
      const spend = Number(r.spend || 0)
      const purchases = (r.actions || []).find((a: any) => a.action_type === 'purchase')
      const conversions = purchases ? Number(purchases.value) : 0
      const purchaseValue = (r.action_values || []).find((a: any) => a.action_type === 'purchase')
      let revenue = purchaseValue ? Number(purchaseValue.value) : 0
      let roas =
        Array.isArray(r.purchase_roas) && r.purchase_roas[0]
          ? Number(r.purchase_roas[0].value)
          : spend > 0 ? revenue / spend : 0
      // If we got purchase_roas but no action_values revenue, back-fill revenue
      if (revenue === 0 && roas > 0 && spend > 0) revenue = roas * spend

      return {
        id: r.campaign_id,
        name: r.campaign_name || 'Untitled campaign',
        status: 'active',
        spend,
        revenue,
        roas,
        conversions,
        impressions: Number(r.impressions || 0),
        clicks: Number(r.clicks || 0),
        ctr: Number(r.ctr || 0),
        cpc: Number(r.cpc || 0),
      }
    })

    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
    const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

    // 3. Ask Claude for the 3 findings + full analysis as JSON
    const compactCampaigns = campaigns
      .slice()
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 25)
      .map((c) => ({
        name: c.name,
        spend: Math.round(c.spend),
        revenue: Math.round(c.revenue),
        roas: Number(c.roas.toFixed(2)),
        conversions: c.conversions,
        ctr: Number(c.ctr.toFixed(2)),
      }))

    const anthropic = new Anthropic()
    let findings: Findings | null = null
    let fullAnalysis = ''

    if (compactCampaigns.length > 0) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2200,
        system:
          'You are a senior performance marketing analyst auditing a Meta Ads account for a prospect. Be specific, candid, and quantitative. Reference real dollar amounts and ROAS figures pulled from the data. Never invent campaign names.',
        messages: [
          {
            role: 'user',
            content:
              `Account 30-day summary:\n` +
              `Total spend: $${Math.round(totalSpend).toLocaleString()}\n` +
              `Total revenue: $${Math.round(totalRevenue).toLocaleString()}\n` +
              `Blended ROAS: ${blendedRoas.toFixed(2)}x\n` +
              `Campaign count: ${campaigns.length}\n\n` +
              `Campaigns (top 25 by spend):\n${JSON.stringify(compactCampaigns, null, 2)}\n\n` +
              `Return ONLY a single valid JSON object — no prose, no markdown fences. Shape:\n` +
              `{\n` +
              `  "biggest_leak": { "campaign_name": "...", "monthly_waste": <number USD>, "why": "<1 sentence>" },\n` +
              `  "best_performer": { "campaign_name": "...", "roas": <number>, "why": "<1 sentence>" },\n` +
              `  "immediate_action": "<one specific action for the next 48 hours, 1-2 sentences>",\n` +
              `  "full_analysis": "<3-4 paragraphs of plain-English analysis of the account, no markdown>"\n` +
              `}\n\n` +
              `Rules:\n` +
              `- biggest_leak: pick the campaign losing the most money (low ROAS × spend). monthly_waste = spend the prospect could likely recover.\n` +
              `- best_performer: pick the strongest ROAS campaign with meaningful spend (>$50 in 30d).\n` +
              `- immediate_action: name the campaign and the exact change (pause / cut budget by X% / refresh creative / etc).\n` +
              `- If only one campaign exists, biggest_leak and best_performer can both refer to it with different angles.`,
          },
        ],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      try {
        const cleaned = text.trim().replace(/^```json\s*|\s*```$/g, '')
        const parsed = JSON.parse(cleaned)
        findings = {
          biggest_leak: parsed.biggest_leak,
          best_performer: parsed.best_performer,
          immediate_action: parsed.immediate_action,
        }
        fullAnalysis = String(parsed.full_analysis || '')
      } catch (e) {
        console.error('Claude JSON parse failed:', e, 'raw:', text.slice(0, 500))
      }
    }

    // Fallback if Claude failed or account is empty — surface something useful
    if (!findings) {
      const sorted = campaigns.slice().sort((a, b) => b.spend - a.spend)
      const worst = sorted.find((c) => c.roas < 1.5 && c.spend > 50) || sorted[0]
      const best = sorted.slice().sort((a, b) => b.roas - a.roas)[0]
      findings = {
        biggest_leak: worst
          ? {
              campaign_name: worst.name,
              monthly_waste: Math.round(worst.spend * (worst.roas < 1 ? 1 : 0.5)),
              why: `Spending $${Math.round(worst.spend).toLocaleString()}/mo at ${worst.roas.toFixed(2)}x ROAS — well under break-even.`,
            }
          : { campaign_name: '—', monthly_waste: 0, why: 'Not enough data in the last 30 days to flag a leak.' },
        best_performer: best
          ? {
              campaign_name: best.name,
              roas: Number(best.roas.toFixed(2)),
              why: `Highest ROAS in the account at ${best.roas.toFixed(2)}x on $${Math.round(best.spend).toLocaleString()} spend.`,
            }
          : { campaign_name: '—', roas: 0, why: 'No campaign with meaningful spend in the last 30 days.' },
        immediate_action: worst
          ? `Pause or cut "${worst.name}" by 50% in the next 24 hours and reallocate to your top-ROAS campaign.`
          : 'Add fresh creative to your top campaign and watch CTR over the next 7 days.',
      }
      fullAnalysis =
        fullAnalysis ||
        `Your account ran $${Math.round(totalSpend).toLocaleString()} in spend over the last 30 days at a blended ${blendedRoas.toFixed(2)}x ROAS across ${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}. Full structural analysis available on the call.`
    }

    // 4. Save the report + flip the flag on the lead
    const { error: reportErr } = await supabase.from('vision_drop_reports').insert({
      lead_email: normalizedEmail,
      findings,
      full_analysis: fullAnalysis,
      total_spend: totalSpend,
      total_revenue: totalRevenue,
      blended_roas: blendedRoas,
    })
    if (reportErr) {
      console.error('vision_drop_reports insert error:', reportErr)
      // Don't fail the user-facing response — they can still see findings live
    }

    await supabase
      .from('vision_drop_leads')
      .update({ report_generated: true })
      .eq('email', normalizedEmail)

    return NextResponse.json({
      findings,
      total_spend: totalSpend,
      total_revenue: totalRevenue,
      blended_roas: blendedRoas,
      campaign_count: campaigns.length,
    })
  } catch (e: any) {
    console.error('vision-drop analyze error:', e)
    return NextResponse.json({ error: e?.message || 'Analysis failed' }, { status: 500 })
  }
}
