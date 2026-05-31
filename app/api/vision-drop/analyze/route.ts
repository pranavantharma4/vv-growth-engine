import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { STRICT_SYSTEM_RULES, buildGranularBlock, type Granular, type Segment } from '../../../../lib/vai-granular'

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
  frequency: number
}

const VD_GRAPH = 'https://graph.facebook.com/v19.0'
const isPurchaseVD = (t: string) => t === 'purchase' || t === 'offsite_conversion.fb_pixel_purchase'

// Account-wide granular breakdowns (age/gender, placement, 14-day daily trend)
// aggregated across all campaigns — feeds the free audit so it cites exact
// demographic, placement, frequency and trend numbers. Degrades to empty.
async function fetchAccountGranular(
  accountId: string,
  token: string,
  datePreset: 'last_7d' | 'last_30d',
): Promise<Granular> {
  const today = new Date()
  const trendSince = new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0]
  const until = today.toISOString().split('T')[0]
  const get = async (qs: Record<string, string>) => {
    try {
      const res = await fetch(`${VD_GRAPH}/act_${accountId}/insights?` + new URLSearchParams(qs))
      const j = await res.json()
      return j?.data ?? []
    } catch { return [] }
  }
  const perf = (r: any) => {
    const spend = Number(r.spend || 0)
    const conv = (r.actions || []).find((a: any) => isPurchaseVD(a.action_type))
    const conversions = conv ? Number(conv.value) : 0
    const val = (r.action_values || []).find((a: any) => isPurchaseVD(a.action_type))
    let revenue = val ? Number(val.value) : 0
    let roas = Array.isArray(r.purchase_roas) && r.purchase_roas[0]
      ? Number(r.purchase_roas[0].value) : (spend > 0 ? revenue / spend : 0)
    if (revenue === 0 && roas > 0 && spend > 0) revenue = roas * spend
    return { spend, conversions, roas }
  }
  const agg = (rows: any[], keys: string[]): Segment[] => {
    const m: Record<string, { spend: number; rev: number; conv: number }> = {}
    for (const r of rows) {
      const label = keys.map((k) => r[k] ?? 'unknown').join(' / ')
      const p = perf(r)
      const e = m[label] ||= { spend: 0, rev: 0, conv: 0 }
      e.spend += p.spend; e.rev += p.roas * p.spend; e.conv += p.conversions
    }
    return Object.entries(m)
      .map(([segment, e]) => ({ segment, spend: Math.round(e.spend), roas: e.spend > 0 ? Math.round((e.rev / e.spend) * 100) / 100 : 0, conversions: e.conv }))
      .sort((a, b) => b.spend - a.spend)
  }

  const [demoRows, placeRows, trendRows, acctRows] = await Promise.all([
    get({ level: 'campaign', breakdowns: 'age,gender', date_preset: datePreset, fields: 'spend,impressions,actions,action_values,purchase_roas', limit: '2000', access_token: token }),
    get({ level: 'campaign', breakdowns: 'publisher_platform,platform_position', date_preset: datePreset, fields: 'spend,impressions,actions,action_values,purchase_roas', limit: '2000', access_token: token }),
    get({ level: 'account', time_increment: '1', time_range: `{"since":"${trendSince}","until":"${until}"}`, fields: 'spend,actions,action_values,purchase_roas', limit: '60', access_token: token }),
    get({ level: 'account', date_preset: datePreset, fields: 'frequency,cpm,reach', limit: '1', access_token: token }),
  ])

  const trend = (trendRows || []).map((r: any) => {
    const p = perf(r)
    return { date: r.date_start, spend: Math.round(p.spend), roas: Math.round(p.roas * 100) / 100, conversions: p.conversions }
  }).sort((a: any, b: any) => (a.date < b.date ? -1 : 1))

  const acct = acctRows?.[0] ?? {}
  return {
    frequency: acct.frequency ? Number(acct.frequency) : null,
    cpm: acct.cpm ? Number(acct.cpm) : null,
    reach: acct.reach ? Number(acct.reach) : null,
    demographic_breakdown: agg(demoRows, ['age', 'gender']).slice(0, 10),
    placement_breakdown: agg(placeRows, ['publisher_platform', 'platform_position']).slice(0, 8),
    daily_trend: trend,
  }
}

type Findings = {
  biggest_leak: { campaign_name: string; monthly_waste: number; why: string }
  best_performer: { campaign_name: string; roas: number; why: string }
  immediate_action: string
}

// Pull campaign-level insights for a given window. Returns mapped per-campaign
// metrics + account totals, or { error } if the Meta API rejected the call.
async function fetchCampaignMetrics(
  accountId: string,
  accessToken: string,
  datePreset: 'last_7d' | 'last_30d',
): Promise<
  | { error: { message: string } }
  | { campaigns: CampaignMetric[]; totalSpend: number; totalRevenue: number; blendedRoas: number }
> {
  const insightsUrl =
    `https://graph.facebook.com/v19.0/act_${accountId}/insights` +
    `?level=campaign` +
    `&date_preset=${datePreset}` +
    `&fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,frequency,actions,action_values,purchase_roas` +
    `&limit=200` +
    `&access_token=${accessToken}`

  const res = await fetch(insightsUrl)
  const data = await res.json()
  if (data.error) return { error: data.error }

  const rows: any[] = data.data || []
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
      frequency: Number(r.frequency || 0),
    }
  })

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  return { campaigns, totalSpend, totalRevenue, blendedRoas }
}

// POST /api/vision-drop/analyze — pulls the lead's connected Meta account,
// computes per-campaign metrics (7-day window, falling back to 30-day if the
// 7-day window is empty), then asks Claude to distill the 3 must-see findings
// + a longer analysis. If both windows are empty the account has no recent
// activity and we bail without inventing data. Saves to vision_drop_reports
// and flips report_generated=true on the lead.
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

    // 2. Pull campaign-level insights. Start with a 7-day window so recently
    //    launched accounts surface real numbers fast. If 7 days shows no
    //    campaigns or $0 spend, retry with a 30-day window. If 30 days is also
    //    empty, the account has no recent activity — bail without inventing data.
    const windows = [
      { preset: 'last_7d' as const, days: 7 },
      { preset: 'last_30d' as const, days: 30 },
    ]

    let campaigns: CampaignMetric[] = []
    let totalSpend = 0
    let totalRevenue = 0
    let blendedRoas = 0
    let windowDays = 7

    for (const w of windows) {
      const result = await fetchCampaignMetrics(
        lead.meta_account_id,
        lead.meta_access_token,
        w.preset,
      )
      if ('error' in result) {
        console.error('Meta insights error:', result.error)
        return NextResponse.json(
          { error: `Meta API: ${result.error.message}` },
          { status: 502 },
        )
      }
      if (result.campaigns.length > 0 && result.totalSpend > 0) {
        campaigns = result.campaigns
        totalSpend = result.totalSpend
        totalRevenue = result.totalRevenue
        blendedRoas = result.blendedRoas
        windowDays = w.days
        break
      }
    }

    // No spend in either window — do not generate findings on empty data.
    if (campaigns.length === 0 || totalSpend === 0) {
      return NextResponse.json(
        {
          error:
            'Your account has no recent campaign activity in the last 30 days. Connect an account with active campaigns to see your VAI audit.',
          empty: true,
        },
        { status: 422 },
      )
    }

    const windowLabel = windowDays === 7 ? 'last 7 days' : 'last 30 days'

    // Account-wide granular data (demographics, placements, frequency, 14-day
    // trend) so the free audit cites exact segment/placement/frequency numbers.
    const granular = await fetchAccountGranular(
      lead.meta_account_id,
      lead.meta_access_token,
      windowDays === 7 ? 'last_7d' : 'last_30d',
    )
    const granularBlock = buildGranularBlock(granular)

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
          'You are a senior performance marketing analyst auditing a Meta Ads account for a prospect. Be specific, candid, and quantitative. Reference real dollar amounts and ROAS figures pulled from the data. Never invent campaign names. Every finding must be actionable regardless of account size — single-campaign accounts get their own framing, not "n/a".\n\n' +
          STRICT_SYSTEM_RULES,
        messages: [
          {
            role: 'user',
            content:
              `Account snapshot — ${windowLabel}:\n` +
              `Total spend: $${Math.round(totalSpend).toLocaleString()}\n` +
              `Total revenue: $${Math.round(totalRevenue).toLocaleString()}\n` +
              `Blended ROAS: ${blendedRoas.toFixed(2)}x\n` +
              `Campaign count: ${campaigns.length}\n\n` +
              `Campaigns (top 25 by ${windowDays}-day spend):\n${JSON.stringify(compactCampaigns, null, 2)}\n` +
              `${granularBlock}\n\n` +
              `The "immediate_action" and "full_analysis" MUST quote exact numbers from the granular data above — name the exact best/worst age-gender segment and its ROAS, the exact winning placement, the exact account frequency (flag saturation if it exceeds 3.0), and whether the 14-day trend is improving or declining with specific figures.\n\n` +
              `Return ONLY a single valid JSON object — no prose, no markdown fences. Shape:\n` +
              `{\n` +
              `  "biggest_leak": { "campaign_name": "...", "monthly_waste": <number USD>, "why": "<1 sentence>" },\n` +
              `  "best_performer": { "campaign_name": "...", "roas": <number>, "why": "<1 sentence>" },\n` +
              `  "immediate_action": "<one specific action for the next 48 hours, 1-2 sentences>",\n` +
              `  "full_analysis": "<3-4 paragraphs of plain-English analysis of the account, no markdown>"\n` +
              `}\n\n` +
              `Rules:\n` +
              (windowDays === 7
                ? `- monthly_waste is a MONTHLY-equivalent USD figure. The data above is 7 days — multiply 7-day waste by ~4.3 to project monthly. Always return a number, never null.\n`
                : `- monthly_waste is a MONTHLY USD figure. The data above already covers ~30 days — use it directly as the monthly figure, do not multiply. Always return a number, never null.\n`) +
              `- biggest_leak: pick the campaign losing the most money (low ROAS × spend). If every campaign is healthy, return the SLOWEST grower with a why like "Not bleeding, but underdelivering vs. its potential."\n` +
              `- best_performer: pick the strongest ROAS campaign with meaningful spend. Always populate this — never say "no best performer".\n` +
              `- SINGLE-CAMPAIGN ACCOUNTS (campaign_count == 1): best_performer = that one campaign, with why like "Your only active campaign — focus all optimization energy here before launching new ones." biggest_leak = the SAME campaign, framed as the largest opportunity to improve (e.g. "It's also your only leak — every dollar lost here is the entire account's loss"). The two findings must be different angles, not duplicate copy.\n` +
              `- TWO-CAMPAIGN ACCOUNTS: pick the better as best_performer and the weaker as biggest_leak even if both look healthy — frame the weaker one as "underperforming relative to your other campaign by X%".\n` +
              `- immediate_action: always name a specific campaign and an exact change (pause / cut budget by X% / scale by X% / refresh creative / test new audience / etc). For a single healthy campaign: scale or test a creative variant. For a single struggling one: the cleanest single intervention.\n` +
              `- full_analysis: write as if this is a real account brief — even if there's only one campaign or one week of data, give them 3-4 paragraphs they could act on tomorrow. Acknowledge data limits without hedging the recommendation.`,
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

    // Fallback if Claude failed or account is empty — surface something useful.
    // Mirrors the prompt rules so single-/two-campaign accounts get a real
    // finding instead of a "—" placeholder.
    if (!findings) {
      const sorted = campaigns.slice().sort((a, b) => b.spend - a.spend)
      const byRoas = sorted.slice().sort((a, b) => b.roas - a.roas)
      const monthlyMultiplier = 30 / windowDays // window spend → monthly equivalent
      const single = campaigns.length === 1 ? campaigns[0] : null

      if (single) {
        const monthlyWaste = Math.round(
          single.spend * monthlyMultiplier * (single.roas < 1 ? 1 : single.roas < 2 ? 0.4 : 0.15),
        )
        findings = {
          biggest_leak: {
            campaign_name: single.name,
            monthly_waste: monthlyWaste,
            why: `It's also your only active campaign — every dollar lost here is the entire account's loss. Current ROAS: ${single.roas.toFixed(2)}x.`,
          },
          best_performer: {
            campaign_name: single.name,
            roas: Number(single.roas.toFixed(2)),
            why: 'Your only active campaign — focus all optimization energy here before launching new ones.',
          },
          immediate_action:
            single.roas >= 2
              ? `Scale "${single.name}" by 20% over the next 48 hours and watch CPA daily — you've earned the right to feed it more budget.`
              : `Pause "${single.name}" for 24 hours, refresh the creative, then relaunch with a tightened audience. It's your only signal source — make sure it's clean.`,
        }
      } else {
        const worst = sorted.find((c) => c.roas < 1.5 && c.spend > 25) || sorted[sorted.length - 1] || sorted[0]
        const best = byRoas[0]
        findings = {
          biggest_leak: worst
            ? {
                campaign_name: worst.name,
                monthly_waste: Math.round(
                  worst.spend * monthlyMultiplier * (worst.roas < 1 ? 1 : 0.5),
                ),
                why: `Spending $${Math.round(worst.spend * monthlyMultiplier).toLocaleString()}/mo at ${worst.roas.toFixed(2)}x ROAS — well under break-even.`,
              }
            : { campaign_name: '—', monthly_waste: 0, why: 'Not enough recent activity to flag a leak.' },
          best_performer: best
            ? {
                campaign_name: best.name,
                roas: Number(best.roas.toFixed(2)),
                why: `Highest ROAS in the account at ${best.roas.toFixed(2)}x on $${Math.round(best.spend * monthlyMultiplier).toLocaleString()}/mo equivalent spend.`,
              }
            : { campaign_name: '—', roas: 0, why: 'No campaign with meaningful spend this week.' },
          immediate_action: worst && best && worst.name !== best.name
            ? `Cut "${worst.name}" by 50% in the next 24 hours and reallocate to "${best.name}".`
            : 'Add a fresh creative variant to your top campaign and watch CTR over the next 7 days.',
        }
      }

      fullAnalysis =
        fullAnalysis ||
        `Your account ran $${Math.round(totalSpend).toLocaleString()} in spend over the ${windowLabel} at a blended ${blendedRoas.toFixed(2)}x ROAS across ${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}. Full structural analysis available on the call.`
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
      window_days: windowDays,
    })
  } catch (e: any) {
    console.error('vision-drop analyze error:', e)
    return NextResponse.json({ error: e?.message || 'Analysis failed' }, { status: 500 })
  }
}
