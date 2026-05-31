import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { classifyCampaign, fatigueForecast } from './vai-rules.ts'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_KEY    = Deno.env.get('RESEND_API_KEY') ?? ''

// All outbound email sends from the verified vngrdvisuals.com domain
const FROM_EMAIL = 'Vanguard Visuals <team@vngrdvisuals.com>'

// Strict grounding rules — keep in sync with lib/vai-granular.ts
const STRICT_RULES = `You are analyzing real account data. Every single claim you make MUST reference a specific number from this account's data. Never give generic advice that could apply to any account. If you identify a problem, quote the exact metric that proves it (e.g. 'your frequency is 4.2x' not 'your frequency may be high'). If you recommend moving budget, state the exact dollar amount and the exact destination campaign. If you cite a demographic insight, name the exact age/gender segment and its exact performance. Vague advice is a failure. Generic advice is a failure. Every sentence must be grounded in this account's actual numbers.`

// Render a campaign's granular columns (frequency, demographics, placements,
// daily trend, bid strategy) into a compact block for the brief prompt.
function granularBlock(c: any): string {
  const arr = (v: any) => {
    if (!v) return []
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
    return v
  }
  const demo = arr(c.demographic_breakdown)
  const place = arr(c.placement_breakdown)
  const trend = arr(c.daily_trend)
  const L: string[] = []
  if (c.frequency != null) L.push(`  frequency ${Number(c.frequency).toFixed(2)}x`)
  if (c.cpm != null) L.push(`CPM $${Number(c.cpm).toFixed(2)}`)
  if (c.ctr != null) L.push(`CTR ${Number(c.ctr).toFixed(2)}%`)
  if (c.cost_per_result != null) L.push(`cost/result $${Number(c.cost_per_result).toFixed(2)}`)
  if (c.objective) L.push(`objective ${c.objective}`)
  if (c.bid_strategy) L.push(`bid ${c.bid_strategy}`)
  const head = L.length ? `  metrics: ${L.join(', ')}` : ''
  const demoTop = [...demo].filter((d: any) => (d.spend ?? 0) > 0).sort((a: any, b: any) => (b.roas ?? 0) - (a.roas ?? 0))
  const demoStr = demoTop.length
    ? `  demographics — best ${demoTop[0].segment} ${(demoTop[0].roas ?? 0).toFixed(2)}x, worst ${demoTop[demoTop.length - 1].segment} ${(demoTop[demoTop.length - 1].roas ?? 0).toFixed(2)}x`
    : ''
  const placeTop = [...place].filter((p: any) => (p.spend ?? 0) > 0).sort((a: any, b: any) => (b.roas ?? 0) - (a.roas ?? 0))
  const placeStr = placeTop.length ? `  best placement ${placeTop[0].segment} ${(placeTop[0].roas ?? 0).toFixed(2)}x` : ''
  const trendStr = trend.length
    ? `  14d trend: ${trend.map((t: any) => `${t.date}:$${Math.round(t.spend ?? 0)}/${(t.roas ?? 0).toFixed(1)}x`).join(', ')}`
    : ''
  return [head, demoStr, placeStr, trendStr].filter(Boolean).join('\n')
}

Deno.serve(async (req) => {
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
  const targetClientId: string | null = body.client_id ?? null

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const clientQuery = supabase.from('clients').select('*').eq('status', 'active')
  if (targetClientId) clientQuery.eq('id', targetClientId)
  const { data: clients, error: clientsErr } = await clientQuery
  if (clientsErr || !clients?.length) {
    return new Response(JSON.stringify({ error: 'No clients found', detail: clientsErr }), { status: 400 })
  }

  const today = new Date()
  const weekNum = getWeekNumber(today)
  const weekRef = `W${weekNum}-${today.getFullYear()}`
  const results: any[] = []

  for (const client of clients) {
    try {
      const result = await generateBriefForClient(supabase, client, weekRef)
      results.push({ client: client.name, status: 'ok', ...result })
    } catch (e: any) {
      results.push({ client: client.name, status: 'error', error: e.message })
    }
  }

  return new Response(JSON.stringify({ weekRef, results }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function generateBriefForClient(supabase: any, client: any, weekRef: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: campaigns } = await supabase
    .from('campaign_snapshots')
    .select('*')
    .eq('client_id', client.id)
    .eq('snapshot_date', today)
    .order('spend', { ascending: false })

  if (!campaigns?.length) return { skipped: 'no campaigns today' }

  const totalSpend  = campaigns.reduce((s: number, c: any) => s + Number(c.spend), 0)
  const totalRev    = campaigns.reduce((s: number, c: any) => s + Number(c.revenue), 0)
  const blendedRoas = totalSpend > 0 ? totalRev / totalSpend : 0
  const wasted      = campaigns
    .filter((c: any) => c.health === 'dead' || c.health === 'bleeding')
    .reduce((s: number, c: any) => s + Number(c.spend), 0)
  const biggestLeak = campaigns
    .filter((c: any) => c.health === 'dead' || c.health === 'bleeding')
    .sort((a: any, b: any) => Number(b.spend) - Number(a.spend))[0] ?? null

  // Granular detail for the biggest leak + the top campaigns by spend.
  const focusCampaigns = (biggestLeak ? [biggestLeak] : []).concat(
    campaigns.filter((c: any) => c.campaign_name !== biggestLeak?.campaign_name).slice(0, 3),
  )
  const granularSection = focusCampaigns
    .map((c: any) => {
      const cls = classifyCampaign({
        spend: Number(c.spend), conversions: Number(c.conversions), roas: Number(c.roas),
        impressions: Number(c.impressions), clicks: Number(c.clicks),
        ctr: c.ctr, cpm: c.cpm, frequency: c.frequency, cost_per_result: c.cost_per_result,
        daily_trend: c.daily_trend,
      })
      const fc = fatigueForecast(c.daily_trend, { frequency: c.frequency, ctr: c.ctr })
      const block = granularBlock(c)
      return [
        `${c.campaign_name} — ${cls.health.toUpperCase()}: ${cls.primaryReason}`,
        block,
        `  fatigue forecast: ${fc.text}`,
      ].filter(Boolean).join('\n')
    })
    .join('\n\n')

  const prompt = `You are Vanguard Intelligence, an AI-powered ad performance analyst for ${client.name}.

${STRICT_RULES}

Generate a concise weekly intelligence brief for ${weekRef}.

Campaign Data:
${campaigns.map((c: any) => `- ${c.campaign_name} (${c.platform}): $${Number(c.spend).toFixed(0)}/mo spend, ${Number(c.roas).toFixed(1)}x ROAS, health: ${c.health}`).join('\n')}

Summary:
- Total Spend: $${totalSpend.toFixed(0)}
- Blended ROAS: ${blendedRoas.toFixed(1)}x
- Recoverable Waste: $${wasted.toFixed(0)}
${biggestLeak ? `- Biggest Leak: ${biggestLeak.campaign_name} ($${Number(biggestLeak.spend).toFixed(0)}/mo at ${Number(biggestLeak.roas).toFixed(1)}x ROAS)` : ''}
${granularSection ? `\nGRANULAR DATA + VAI CLASSIFICATION & FATIGUE FORECAST (quote these exact numbers; reproduce the fatigue forecast verbatim — never invent a day count):\n${granularSection}` : ''}

VAI THRESHOLDS — DEAD: spend>$100 & 0 conv, OR ROAS<0.5x & spend>$200, OR CTR<0.4% after 2,000+ impr & 0 conv. BLEEDING: ROAS 0.5x–1.5x, OR frequency>3.5 & ROAS declining (14d), OR cost-per-result up >30% (14d) while conversions flat/declining. WEAK: ROAS 1.5x–2.5x, OR frequency 2.5–3.5, OR CTR 0.4%–0.8%, OR <50 conversions with meaningful spend (learning). STRONG: ROAS>2.5x AND frequency<2.5 AND stable/improving 14-day trend.

Write 3 sections:
1. WEEK SUMMARY — 2 sentences on overall account health, citing the blended ROAS and total spend figures
2. CRITICAL ACTIONS — 2-3 bullet points. For the biggest leak, state WHY it is classified the way it is using the EXACT threshold and its real numbers (e.g. "BLEEDING because ROAS is 1.8x and frequency hit 3.6 while the 14-day trend shows CTR declining"). Quote exact metrics, include the fatigue forecast verbatim, and state exact dollar reallocations and destination campaigns.
3. OPPORTUNITY — 1 thing this week to improve ROAS, grounded in a specific number above (a demographic, placement, or trend figure)

Be direct, specific, and use exact numbers from this account. No generic advice. Write as their embedded growth strategist.`

  // Generate the AI summary. Fail LOUDLY — never persist or email a blank brief.
  if (!ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set for the weekly-brief edge function — set it via `supabase secrets set`.')
  }
  let aiSummary = ''
  let aiError = ''
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const aiData = await aiRes.json()
    if (!aiRes.ok || aiData?.error) {
      // Anthropic returns 200-with-error rarely, but 4xx/5xx carry { error: { message } }.
      aiError = `Anthropic API error (HTTP ${aiRes.status}): ${aiData?.error?.message ?? JSON.stringify(aiData).slice(0, 300)}`
    } else {
      aiSummary = aiData.content?.[0]?.text ?? ''
      if (!aiSummary.trim()) aiError = 'Anthropic returned a 200 with no text content'
    }
  } catch (e: any) {
    aiError = `Anthropic request failed: ${e?.message ?? String(e)}`
  }

  // A blank/failed summary must not be saved or emailed — surface it to the caller
  // (the per-client catch in the handler records it as status:"error").
  if (aiError || !aiSummary.trim()) {
    console.error(`weekly-brief: ${aiError || 'empty summary'} for client ${client.name} (${client.id})`)
    throw new Error(aiError || 'Anthropic returned an empty summary — brief not sent.')
  }

  const campaignSummary = campaigns.map((c: any) => ({
    name: c.campaign_name,
    platform: c.platform,
    spend: Number(c.spend),
    roas: Number(c.roas),
    health: c.health,
  }))

  // Health breakdown + week start — consumed by brief/page.tsx and reports/page.tsx
  const strongCount   = campaigns.filter((c: any) => c.health === 'strong').length
  const weakCount     = campaigns.filter((c: any) => c.health === 'weak').length
  const bleedingCount = campaigns.filter((c: any) => c.health === 'bleeding').length
  const deadCount     = campaigns.filter((c: any) => c.health === 'dead').length

  const now = new Date()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7))
  const weekStart = monday.toISOString().split('T')[0]

  await supabase.from('weekly_briefs').upsert({
    client_id: client.id,
    week_ref: weekRef,
    week_start: weekStart,
    biggest_leak_campaign: biggestLeak?.campaign_name ?? null,
    biggest_leak_amount: biggestLeak ? Number(biggestLeak.spend) : null,
    biggest_leak_platform: biggestLeak?.platform ?? null,
    total_spend: totalSpend,
    total_wasted: wasted,
    blended_roas: blendedRoas,
    strong_count: strongCount,
    weak_count: weakCount,
    bleeding_count: bleedingCount,
    dead_count: deadCount,
    summary: aiSummary,
    campaign_summary: campaignSummary,
    recommendations: { ai_summary: aiSummary },
    brief_html: aiSummary,
    sent_to: client.contact_email,
    sent_at: new Date().toISOString(),
  }, { onConflict: 'client_id,week_ref' })

  // Send email — works with Resend test sender to verified emails
  // or any email once vanguardvisuals.com domain is verified
  let emailSent = false
  let emailError = ''
  if (RESEND_KEY && client.contact_email) {
    const emailHtml = buildEmailHtml(client, weekRef, {
      totalSpend, blendedRoas, wasted, biggestLeak, campaigns, aiSummary
    })
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [client.contact_email],
          subject: `${client.name} · Weekly Intelligence Brief · ${weekRef}`,
          html: emailHtml,
        })
      })
      const emailData = await emailRes.json()
      emailSent = emailRes.ok
      if (!emailRes.ok) emailError = emailData.message ?? 'Send failed'
    } catch (e: any) {
      emailError = e.message
    }
  }

  return { totalSpend, blendedRoas, wasted, emailSent, emailError, campaignCount: campaigns.length }
}

function buildEmailHtml(client: any, weekRef: string, data: any): string {
  const { totalSpend, blendedRoas, wasted, biggestLeak, campaigns, aiSummary } = data
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06060a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f0ebe4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06060a;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0d0c10;border:1px solid #2a2630;border-radius:8px;overflow:hidden;">
<tr><td style="padding:32px 40px;border-bottom:1px solid #2a2630;">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b7355;margin-bottom:8px;">Vanguard Visuals · Growth Ad Engine</div>
  <div style="font-size:24px;font-weight:300;color:#f0ebe4;">Weekly Intelligence Brief</div>
  <div style="font-size:11px;color:#6b6478;margin-top:6px;">${date} · ${weekRef} · ${client.name}</div>
</td></tr>
${biggestLeak ? `
<tr><td style="padding:24px 40px;border-bottom:1px solid #2a2630;background:#1a0808;">
  <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#cc2200;margin-bottom:8px;">⚠ Biggest Leak This Week</div>
  <div style="font-size:18px;font-weight:400;color:#f0ebe4;">${biggestLeak.campaign_name} — $${Number(biggestLeak.spend).toFixed(0)}/mo at ${Number(biggestLeak.roas).toFixed(1)}x ROAS</div>
  <div style="font-size:11px;color:#cc2200;margin-top:6px;">$${Number(biggestLeak.spend).toFixed(0)} recoverable this month · Action required this week</div>
</td></tr>` : ''}
<tr><td style="padding:24px 40px;border-bottom:1px solid #2a2630;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="30%" style="text-align:center;padding:16px;background:#13111a;border-radius:6px;">
      <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6b6478;margin-bottom:8px;">Total Spend</div>
      <div style="font-size:26px;font-weight:300;color:#f0ebe4;">$${totalSpend>=1000?(totalSpend/1000).toFixed(1)+'k':totalSpend.toFixed(0)}</div>
    </td>
    <td width="5%"></td>
    <td width="30%" style="text-align:center;padding:16px;background:#13111a;border-radius:6px;">
      <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6b6478;margin-bottom:8px;">Blended ROAS</div>
      <div style="font-size:26px;font-weight:300;color:${blendedRoas>=3?'#4a8c5c':blendedRoas>=2?'#c8922a':'#cc2200'};">${blendedRoas.toFixed(1)}x</div>
    </td>
    <td width="5%"></td>
    <td width="30%" style="text-align:center;padding:16px;background:#13111a;border-radius:6px;">
      <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6b6478;margin-bottom:8px;">Recoverable</div>
      <div style="font-size:26px;font-weight:300;color:#cc2200;">$${wasted>=1000?(wasted/1000).toFixed(1)+'k':wasted.toFixed(0)}</div>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:24px 40px;border-bottom:1px solid #2a2630;">
  <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8b7355;margin-bottom:14px;">Intelligence Summary</div>
  <div style="font-size:13px;line-height:1.8;color:#c8c0b8;white-space:pre-line;">${aiSummary.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</td></tr>
<tr><td style="padding:24px 40px;border-bottom:1px solid #2a2630;">
  <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8b7355;margin-bottom:14px;">Campaign Health</div>
  ${campaigns.slice(0,6).map((c:any)=>`
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
    <td style="font-size:12px;color:#c8c0b8;padding:8px 0;">${c.campaign_name}<br>
      <span style="font-size:10px;color:#6b6478;">${c.platform.toUpperCase()} · $${Number(c.spend).toFixed(0)}/mo</span></td>
    <td align="right" style="padding:8px 0;">
      <span style="padding:2px 8px;border-radius:3px;font-size:9px;letter-spacing:1px;text-transform:uppercase;
        background:${c.health==='strong'?'#0d1f14':c.health==='weak'?'#1a1508':c.health==='bleeding'?'#1a0d00':'#1a0808'};
        color:${c.health==='strong'?'#4a8c5c':c.health==='weak'?'#c8922a':c.health==='bleeding'?'#c85c00':'#cc2200'};">${c.health}</span>
      <span style="font-size:13px;font-weight:300;color:${Number(c.roas)>=3?'#4a8c5c':Number(c.roas)>=2?'#c8922a':'#cc2200'};margin-left:10px;">${Number(c.roas).toFixed(1)}x</span>
    </td>
  </tr></table>`).join('')}
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;">
  <a href="https://vv-growth-engine.vercel.app/dashboard" style="display:inline-block;padding:12px 28px;background:#8b7355;border-radius:5px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#faf8f5;text-decoration:none;margin-bottom:16px;">View Full Dashboard →</a>
  <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#4a3f56;margin-top:12px;">Vanguard Visuals · Growth Ad Engine · Confidential</div>
  <div style="font-size:9px;color:#4a3f56;margin-top:4px;">Generated automatically every Monday at 7:00 AM</div>
</td></tr>
</table></td></tr></table>
</body></html>`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
