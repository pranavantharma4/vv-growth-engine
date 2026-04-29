import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { campaign } = await req.json()
    if (!campaign) return NextResponse.json({ error: 'Campaign data required' }, { status: 400 })

    const client = new Anthropic()

    const ctr = campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0'
    const cpa = campaign.conversions > 0
      ? (campaign.spend / campaign.conversions).toFixed(2)
      : '0'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a senior paid media strategist with 10+ years experience managing DTC ad accounts on Meta, Google, and TikTok.

A client's campaign requires an optimization blueprint. Here are the campaign details:

Campaign: ${campaign.campaign_name}
Platform: ${campaign.platform.toUpperCase()}
Health Status: ${campaign.health.toUpperCase()}
Monthly Spend: $${Number(campaign.spend).toLocaleString()}
Monthly Revenue: $${Number(campaign.revenue).toLocaleString()}
ROAS: ${Number(campaign.roas).toFixed(2)}x
CTR: ${ctr}%
CPA: $${cpa}
Conversions: ${campaign.conversions}
Impressions: ${Number(campaign.impressions).toLocaleString()}
Clicks: ${Number(campaign.clicks).toLocaleString()}

Generate a precise, actionable optimization blueprint. Structure your response exactly like this:

## Diagnosis
2-3 sentences on exactly what is wrong with this campaign and why.

## Priority Actions
Number each action 1-5. Each action must be:
- Specific (exact % changes, exact audiences, exact creative directions)
- Measurable (state the expected impact)
- Time-bound (state when to do it)

## Budget Recommendation
Exact budget allocation recommendation with reasoning.

## 30-Day Projection
If these actions are taken, what should the ROAS look like in 30 days? Be specific.

## Red Flags to Watch
2-3 specific metrics or signals that would indicate the campaign is not responding to optimization.

Be direct, specific, and professional. No generic advice. Every recommendation must be tied to the specific numbers above.`
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ blueprint: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}