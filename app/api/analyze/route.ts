import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const ACTIONS: Record<string, string> = {
  dead:     'Pause immediately. Redirect 100% of budget to your strongest campaign. This campaign needs a structural rebuild before reactivation.',
  bleeding: 'Reduce budget by 50% within 48 hours. Refresh creative or expand audience. Pause entirely if ROAS does not recover within 14 days.',
  strong:   'Scale budget 20-30% this week. Monitor CPM daily. Prepare new creative variants to deploy when saturation signals appear.',
  weak:     'Introduce new creative variants within 7 days. Tighten audience targeting. Reassess with 14 days of fresh data before structural changes.',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign, clientId } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'PASTE_YOUR_ANTHROPIC_KEY_HERE') {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `You are a senior paid media strategist at Vanguard Visuals, a premium growth intelligence agency. Your job is to diagnose ad campaign performance and tell business owners exactly what is happening and what to do about it.

Write a diagnosis of exactly 3-4 sentences. Requirements:
- State precisely what is happening with this campaign right now
- Explain the specific reason based on the metrics provided
- Give one clear, unambiguous action to take
- Use plain English — no jargon, no hedging, no filler phrases
- Do NOT use bullet points, headers, or lists
- Write as if speaking directly to the business owner who is paying for this account

Campaign data:
Platform: ${campaign.platform}
Campaign: ${campaign.campaign_name}
Monthly Spend: $${Number(campaign.spend).toLocaleString()}
Impressions: ${Number(campaign.impressions).toLocaleString()}
CTR: ${Number(campaign.ctr || 0).toFixed(2)}%
Conversions: ${campaign.conversions}
Cost Per Acquisition: $${Number(campaign.cpa || 0).toFixed(2)}
ROAS: ${Number(campaign.roas).toFixed(2)}x
Health Status: ${campaign.health.toUpperCase()}

Respond with only the diagnosis paragraph. Begin immediately with the diagnosis — no preamble.`

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysis = (msg.content[0] as { type: string; text: string }).text
    const recommended_action = ACTIONS[campaign.health] || ACTIONS.weak

    // Cache in Supabase
    await supabase.from('ai_analyses').insert({
      client_id: clientId,
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      platform: campaign.platform,
      analysis,
      recommended_action,
      health_at_analysis: campaign.health,
      roas_at_analysis: Number(campaign.roas),
    })

    return NextResponse.json({ analysis, recommended_action })
  } catch (err: any) {
    console.error('Analyze error:', err?.message || err)
    return NextResponse.json({ error: 'Analysis failed: ' + (err?.message || 'unknown error') }, { status: 500 })
  }
}
