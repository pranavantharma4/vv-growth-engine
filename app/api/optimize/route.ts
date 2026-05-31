import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { STRICT_SYSTEM_RULES, buildGranularBlock, granularFromRow } from '../../../lib/vai-granular'
import { buildVaiRulesBlock } from '../../../lib/vai-rules'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign, client_id } = await req.json()
    if (!campaign) return NextResponse.json({ error: 'Campaign data required' }, { status: 400 })

    // Get client context
    let agencyContext = { isAgency: false, agencyName: '', brandName: '' }
    if (client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('name, account_type, agency_name, white_label_reports')
        .eq('id', client_id)
        .maybeSingle()
      agencyContext = {
        isAgency: !!(clientData?.white_label_reports || clientData?.account_type === 'agency'),
        agencyName: clientData?.agency_name || '',
        brandName: clientData?.name || '',
      }
    }

    const anthropic = new Anthropic()

    // Pull the freshest granular snapshot so the blueprint cites exact numbers.
    let granularRow: any = campaign
    if (client_id && !campaign?.demographic_breakdown && !campaign?.frequency) {
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
    const rulesBlock = buildVaiRulesBlock({
      spend: Number(granularRow.spend ?? campaign.spend),
      conversions: Number(granularRow.conversions ?? campaign.conversions),
      roas: Number(granularRow.roas ?? campaign.roas),
      impressions: Number(granularRow.impressions ?? campaign.impressions),
      clicks: Number(granularRow.clicks ?? campaign.clicks),
      ctr: granularRow.ctr ?? null,
      cpm: granularRow.cpm ?? null,
      frequency: granularRow.frequency ?? null,
      cost_per_result: granularRow.cost_per_result ?? granularRow.cpa ?? null,
      daily_trend: granularRow.daily_trend ?? null,
    })

    const ctr = campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0'
    const cpa = campaign.conversions > 0
      ? (campaign.spend / campaign.conversions).toFixed(2)
      : '0'

    const baseSystem = agencyContext.isAgency
      ? `You are a senior paid media strategist at ${agencyContext.agencyName}. You are preparing an optimization blueprint for ${agencyContext.brandName}, a client of the agency. Write professionally and authoritatively — this will be delivered directly to the client. Use "we" for agency recommendations. Never reference any third-party tool or platform by name.`
      : `You are a senior paid media strategist with 10+ years experience managing DTC ad accounts on Meta, Google, and TikTok. Be direct, specific, and professional.`
    const systemPrompt = `${baseSystem}\n\n${STRICT_SYSTEM_RULES}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate a precise, actionable optimization blueprint for this campaign.

Campaign: ${campaign.campaign_name}
Platform: ${campaign.platform.toUpperCase()}
Health Status: ${campaign.health.toUpperCase()}
Monthly Spend: $${Number(campaign.spend).toLocaleString()}
Monthly Revenue: $${Number(campaign.revenue || 0).toLocaleString()}
ROAS: ${Number(campaign.roas).toFixed(2)}x
CTR: ${ctr}%
CPA: $${cpa}
Conversions: ${campaign.conversions || 0}
Impressions: ${Number(campaign.impressions || 0).toLocaleString()}
Clicks: ${Number(campaign.clicks || 0).toLocaleString()}
${granularBlock}
${rulesBlock}

Structure your response exactly like this:

## Diagnosis
2-3 sentences on exactly what is happening and why, tied to the specific numbers.

## Priority Actions
Number each action 1-5. Each must be specific (exact % changes, exact audiences, exact creative directions), measurable (expected impact), and time-bound (when to do it).

## Budget Recommendation
Exact budget allocation recommendation with reasoning tied to current ROAS and spend.

## 30-Day Projection
Specific ROAS and revenue projection if actions are taken. Be precise.

## Red Flags to Watch
2-3 specific metrics that would signal the campaign is not responding to optimization.`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ blueprint: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}