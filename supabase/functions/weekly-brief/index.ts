import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_KEY    = Deno.env.get('RESEND_API_KEY') ?? ''

// Use Resend's shared test sender until domain is verified
// Once vanguardvisuals.com is added to Resend, change this to:
// 'Vanguard Intelligence <intelligence@vanguardvisuals.com>'
const FROM_EMAIL = 'Vanguard Intelligence <onboarding@resend.dev>'

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

  const prompt = `You are Vanguard Intelligence, an AI-powered ad performance analyst for ${client.name}.

Generate a concise weekly intelligence brief for ${weekRef}.

Campaign Data:
${campaigns.map((c: any) => `- ${c.campaign_name} (${c.platform}): $${Number(c.spend).toFixed(0)}/mo spend, ${Number(c.roas).toFixed(1)}x ROAS, health: ${c.health}`).join('\n')}

Summary:
- Total Spend: $${totalSpend.toFixed(0)}
- Blended ROAS: ${blendedRoas.toFixed(1)}x
- Recoverable Waste: $${wasted.toFixed(0)}
${biggestLeak ? `- Biggest Leak: ${biggestLeak.campaign_name} ($${Number(biggestLeak.spend).toFixed(0)}/mo at ${Number(biggestLeak.roas).toFixed(1)}x ROAS)` : ''}

Write 3 sections:
1. WEEK SUMMARY — 2 sentences on overall account health
2. CRITICAL ACTIONS — 2-3 bullet points, specific and actionable with exact numbers
3. OPPORTUNITY — 1 thing they should do this week to improve ROAS

Be direct, specific, and use exact numbers. No fluff. Write as their embedded growth strategist.`

  let aiSummary = ''
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
    aiSummary = aiData.content?.[0]?.text ?? ''
  } catch (_) {
    aiSummary = 'AI analysis unavailable this week. Your VV manager will follow up.'
  }

  const campaignSummary = campaigns.map((c: any) => ({
    name: c.campaign_name,
    platform: c.platform,
    spend: Number(c.spend),
    roas: Number(c.roas),
    health: c.health,
  }))

  await supabase.from('weekly_briefs').upsert({
    client_id: client.id,
    week_ref: weekRef,
    biggest_leak_campaign: biggestLeak?.campaign_name ?? null,
    biggest_leak_amount: biggestLeak ? Number(biggestLeak.spend) : null,
    biggest_leak_platform: biggestLeak?.platform ?? null,
    total_spend: totalSpend,
    total_wasted: wasted,
    blended_roas: blendedRoas,
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
