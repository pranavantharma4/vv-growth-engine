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

    const { campaign, client_id } = await req.json()
    if (!campaign || !client_id) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    // Get client context including agency info
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, account_type, agency_name, white_label_reports, parent_agency_id')
      .eq('id', client_id)
      .single()

    // Determine tone — agency white-label vs direct brand
    const isAgency = clientData?.white_label_reports || clientData?.account_type === 'agency'
    const agencyName = clientData?.agency_name || 'your agency'
    const brandName = clientData?.name || 'the client'

    const anthropic = new Anthropic()

    const ctr = campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0'
    const cpa = campaign.conversions > 0
      ? (campaign.spend / campaign.conversions).toFixed(2)
      : '0'

    const systemPrompt = isAgency
      ? `You are a senior paid media analyst at ${agencyName}. You are preparing a campaign analysis for ${brandName}, one of the agency's clients. Write in a professional, authoritative tone suitable for client-facing delivery. The agency presents these insights as their own strategic work. Never mention any third-party platform or tool. Use "we" to refer to the agency team.`
      : `You are a senior paid media strategist. You are analyzing a campaign for ${brandName} and providing direct, actionable intelligence.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this campaign and provide a clear, actionable diagnosis.

Campaign: ${campaign.campaign_name}
Platform: ${campaign.platform.toUpperCase()}
Health: ${campaign.health.toUpperCase()}
Monthly Spend: $${Number(campaign.spend).toLocaleString()}
Monthly Revenue: $${Number(campaign.revenue || 0).toLocaleString()}
ROAS: ${Number(campaign.roas).toFixed(2)}x
CTR: ${ctr}%
CPA: $${cpa}
Conversions: ${campaign.conversions || 0}
Impressions: ${Number(campaign.impressions || 0).toLocaleString()}
Clicks: ${Number(campaign.clicks || 0).toLocaleString()}

Provide:
1. DIAGNOSIS — What is happening and why (2-3 sentences, specific to the numbers)
2. ROOT CAUSE — The single most likely reason for this performance
3. IMMEDIATE ACTION — The one thing to do in the next 48 hours
4. EXPECTED OUTCOME — What changes if the action is taken

Be specific, direct, and professional. Reference the actual numbers. No generic advice.`,
      }],
    })

    const analysis = message.content[0].type === 'text' ? message.content[0].text : ''

    // Cache the analysis
    const { error: insertErr } = await supabase.from('ai_analyses').insert({
      client_id,
      campaign_id: campaign.id || `${campaign.platform}_${campaign.campaign_name}`,
      campaign_name: campaign.campaign_name,
      platform: campaign.platform,
      analysis,
      health_at_analysis: campaign.health,
      roas_at_analysis: campaign.roas,
      recommended_action: '',
    })

    return NextResponse.json({ analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}