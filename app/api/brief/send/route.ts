import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

function getWeekRef() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  return `W${week}-${now.getFullYear()}`
}

function fmtMoney(n: number): string {
  return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + Math.round(n)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { clientId } = await req.json()

    // Get client info
    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const today = new Date().toISOString().split('T')[0]
    const weekRef = getWeekRef()
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    // Get campaigns and leaks
    const [{ data: campaigns }, { data: leaks }] = await Promise.all([
      supabase.from('campaign_snapshots').select('*').eq('client_id', clientId).eq('snapshot_date', today).order('spend', { ascending: false }),
      supabase.from('biggest_leaks').select('*').eq('client_id', clientId),
    ])

    const camps = campaigns || []
    const leak = leaks?.[0] || null
    const totalSpend = camps.reduce((s: number, c: any) => s + Number(c.spend), 0)
    const totalWasted = camps.filter((c: any) => c.health === 'dead' || c.health === 'bleeding').reduce((s: number, c: any) => s + Number(c.spend), 0)
    const blendedROAS = totalSpend > 0 ? camps.reduce((s: number, c: any) => s + Number(c.roas) * Number(c.spend), 0) / totalSpend : 0

    const recommendations = [
      leak ? `Pause ${leak.campaign_name} immediately — ${fmtMoney(Number(leak.spend))}/mo at ${Number(leak.roas).toFixed(1)}x ROAS is a clear loss. Reallocate budget to your strongest campaign this week.` : null,
      camps.find((c: any) => c.health === 'strong') ? `Scale ${camps.find((c: any) => c.health === 'strong').campaign_name} — ${Number(camps.find((c: any) => c.health === 'strong').roas).toFixed(1)}x ROAS with room to grow. Increase budget 20-30% and monitor CPM for 7 days.` : null,
      camps.find((c: any) => c.health === 'bleeding') ? `Refresh creative on ${camps.find((c: any) => c.health === 'bleeding').campaign_name} — frequency is likely at saturation. New variants needed within 7 days.` : null,
    ].filter(Boolean) as string[]

    // Build HTML email
    const campaignRows = camps.slice(0, 6).map((c: any) => {
      const roasColor = Number(c.roas) >= 3 ? '#1a5c1a' : Number(c.roas) >= 1.5 ? '#8b6914' : '#8b1a1a'
      const healthBg: Record<string,string> = { strong: '#f0f7f0', weak: '#fdf6e3', bleeding: '#fef3e8', dead: '#fdf0f0' }
      const healthColor: Record<string,string> = { strong: '#1a5c1a', weak: '#8b6914', bleeding: '#7a4010', dead: '#8b1a1a' }
      return `
        <tr style="border-bottom:1px solid #f2efe9;">
          <td style="padding:8px 0;font-size:12px;color:#1a1714;font-weight:500;">${c.campaign_name}</td>
          <td style="padding:8px 0;text-align:center;">
            <span style="background:${healthBg[c.health]||'#f2efe9'};color:${healthColor[c.health]||'#8b6914'};padding:2px 8px;border-radius:3px;font-family:monospace;font-size:9px;font-weight:600;">${c.health.toUpperCase()}</span>
          </td>
          <td style="padding:8px 0;text-align:right;font-family:monospace;font-size:10px;color:#4a4540;">${fmtMoney(Number(c.spend))}</td>
          <td style="padding:8px 0;text-align:right;font-family:'Georgia',serif;font-size:17px;color:${roasColor};">${Number(c.roas).toFixed(1)}x</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f2efe9;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <div style="padding:28px 36px;border-bottom:2px solid #1a1714;">
    <table width="100%"><tr>
      <td>
        <div style="font-family:'Georgia',serif;font-size:34px;font-weight:700;font-style:italic;color:#1a1714;letter-spacing:2px;">VV</div>
        <div style="font-family:monospace;font-size:8px;color:#9a9390;letter-spacing:3px;margin-top:2px;">VANGUARD VISUALS · GROWTH AD ENGINE</div>
        <div style="font-family:monospace;font-size:8px;color:#9a9390;margin-top:1px;">Weekly Intelligence Brief</div>
      </td>
      <td style="text-align:right;font-family:monospace;font-size:8px;color:#9a9390;line-height:1.8;">
        ${dateStr}<br>
        <strong style="color:#1a1714;">${client.name}</strong><br>
        <span style="color:#8b6914;font-weight:600;">${weekRef}</span>
      </td>
    </tr></table>
  </div>

  <div style="padding:28px 36px;">

    ${leak ? `
    <div style="background:#fdf0f0;border-left:3px solid #8b1a1a;padding:14px 16px;margin-bottom:22px;border-radius:0 6px 6px 0;">
      <div style="font-family:monospace;font-size:8px;color:#8b1a1a;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">BIGGEST LEAK THIS WEEK</div>
      <div style="font-size:14px;font-weight:600;color:#1a1714;margin-bottom:4px;">${leak.campaign_name} — ${fmtMoney(Number(leak.spend))}/mo at ${Number(leak.roas).toFixed(1)}x ROAS</div>
      <div style="font-family:monospace;font-size:10px;color:#8b1a1a;">${fmtMoney(Number(leak.spend))} recoverable this month</div>
    </div>` : ''}

    <table width="100%" style="margin-bottom:22px;">
      <tr>
        ${[
          ['Total Spend', fmtMoney(totalSpend), ''],
          ['Blended ROAS', blendedROAS.toFixed(1) + 'x', blendedROAS >= 3 ? '#1a5c1a' : blendedROAS >= 1.5 ? '#8b6914' : '#8b1a1a'],
          ['Recoverable', fmtMoney(totalWasted), '#8b1a1a'],
        ].map(([l, v, c]) => `
        <td style="text-align:center;background:#f2efe9;border-radius:6px;padding:12px 8px;margin:0 3px;">
          <div style="font-family:monospace;font-size:7px;color:#9a9390;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">${l}</div>
          <div style="font-family:'Georgia',serif;font-size:24px;color:${c||'#1a1714'};">${v}</div>
        </td>`).join('')}
      </tr>
    </table>

    <div style="margin-bottom:22px;">
      <div style="font-family:monospace;font-size:8px;color:#8b6914;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #e8e3da;">CAMPAIGN HEALTH</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="border-bottom:1px solid #e8e3da;">
          ${['CAMPAIGN','HEALTH','SPEND','ROAS'].map(h => `<th style="font-family:monospace;font-size:7px;color:#9a9390;text-align:left;padding-bottom:7px;font-weight:400;letter-spacing:1px;">${h}</th>`).join('')}
        </tr>
        ${campaignRows}
      </table>
    </div>

    ${recommendations.length > 0 ? `
    <div style="margin-bottom:22px;">
      <div style="font-family:monospace;font-size:8px;color:#8b6914;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #e8e3da;">THIS WEEK'S RECOMMENDED ACTIONS</div>
      ${recommendations.map((r, i) => `
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <div style="font-family:monospace;font-size:10px;color:#8b6914;flex-shrink:0;">${i + 1}.</div>
        <div style="font-size:12px;color:#4a4540;line-height:1.7;">${r}</div>
      </div>`).join('')}
    </div>` : ''}

    <div style="border-top:1px solid #e8e3da;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-family:monospace;font-size:7px;color:#9a9390;letter-spacing:1px;">Vanguard Visuals · Growth Ad Engine · Confidential</div>
      <div style="font-family:monospace;font-size:8px;color:#8b6914;background:#fdf6e3;padding:3px 8px;border-radius:3px;">${weekRef}</div>
    </div>

  </div>
</div>
</body>
</html>`

    // Try to send via Resend
    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'intelligence@vanguardvisuals.com'
    const toEmail = client.contact_email || session.user.email

    if (resendKey && resendKey !== 'your_resend_api_key_here') {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: `Your Weekly VV Intelligence Brief — ${weekRef}`,
          html,
        }),
      })
      if (!emailRes.ok) {
        const err = await emailRes.json()
        console.error('Resend error:', err)
      }
    }

    // Always save to Supabase regardless of email send status
    const { error } = await supabase.from('weekly_briefs').upsert({
      client_id: clientId,
      week_ref: weekRef,
      biggest_leak_campaign: leak?.campaign_name || null,
      biggest_leak_amount: leak ? Number(leak.spend) : null,
      biggest_leak_platform: leak?.platform || null,
      total_spend: totalSpend,
      total_wasted: totalWasted,
      blended_roas: blendedROAS,
      campaign_summary: camps as any,
      recommendations: recommendations as any,
      brief_html: html,
      sent_at: new Date().toISOString(),
      sent_to: toEmail,
    }, { onConflict: 'client_id,week_ref' })

    if (error) console.error('Supabase upsert error:', error)

    return NextResponse.json({ success: true, weekRef, sentTo: toEmail })
  } catch (err: any) {
    console.error('Brief send error:', err)
    return NextResponse.json({ error: 'Failed: ' + (err?.message || 'unknown') }, { status: 500 })
  }
}
