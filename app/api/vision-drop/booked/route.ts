import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// POST /api/vision-drop/booked — fired from /vision-drop/results when the
// prospect clicks the Calendly CTA. Marks the lead as booked, emails them
// their 3 findings + a preview, and pings agency.vanguardia@gmail.com.
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

    const { data: lead } = await supabase
      .from('vision_drop_leads')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const { data: report } = await supabase
      .from('vision_drop_reports')
      .select('findings, full_analysis, total_spend, total_revenue, blended_roas')
      .eq('lead_email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    await supabase
      .from('vision_drop_leads')
      .update({ calendly_booked: true })
      .eq('email', normalizedEmail)

    // Best-effort email side-effects — don't fail the response if Resend is down
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && report?.findings) {
      const f = report.findings as any
      const leadName = lead?.name || 'there'
      const fmt = (n: number) =>
        '$' + Math.round(Number(n) || 0).toLocaleString()

      const prospectHtml = `<!DOCTYPE html><html><body style="margin:0;background:#050509;font-family:'DM Sans',Arial,sans-serif;color:#faf8f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050509;padding:40px 24px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0c0b0f;border:1px solid rgba(255,255,255,0.07);border-radius:8px;max-width:600px;">
  <tr><td style="padding:36px 40px 0;">
    <div style="font-size:9px;color:#c9a84c;letter-spacing:5px;text-transform:uppercase;margin-bottom:8px;">VAI · Vision Drop</div>
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:300;font-style:italic;color:#faf8f5;margin-bottom:4px;">Your Ad Vision Drop</div>
    <div style="font-size:11px;color:rgba(250,248,245,0.35);margin-bottom:28px;">Saved snapshot · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </td></tr>
  <tr><td style="padding:0 40px 24px;">
    <p style="font-size:14px;color:rgba(250,248,245,0.82);line-height:1.7;margin:0 0 22px;">Hi ${leadName}, here's your Vision Drop saved to your inbox. Your call is on the calendar — we'll walk you through the full blueprint then.</p>
  </td></tr>
  <tr><td style="padding:0 40px 18px;">
    <div style="background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.22);border-radius:4px;padding:18px 20px;margin-bottom:14px;">
      <div style="font-size:8px;color:#f87171;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">⚠ Biggest Leak</div>
      <div style="font-family:Georgia,serif;font-size:18px;color:#faf8f5;margin-bottom:6px;">${f.biggest_leak?.campaign_name || '—'}</div>
      <div style="font-family:Georgia,serif;font-size:24px;color:#f87171;margin-bottom:8px;">${fmt(f.biggest_leak?.monthly_waste || 0)}/mo wasted</div>
      <div style="font-size:12px;color:rgba(250,248,245,0.7);line-height:1.7;">${f.biggest_leak?.why || ''}</div>
    </div>
    <div style="background:rgba(74,222,128,0.05);border:1px solid rgba(74,222,128,0.2);border-radius:4px;padding:18px 20px;margin-bottom:14px;">
      <div style="font-size:8px;color:#4ade80;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">★ Best Performer</div>
      <div style="font-family:Georgia,serif;font-size:18px;color:#faf8f5;margin-bottom:6px;">${f.best_performer?.campaign_name || '—'}</div>
      <div style="font-family:Georgia,serif;font-size:24px;color:#4ade80;margin-bottom:8px;">${Number(f.best_performer?.roas || 0).toFixed(2)}x ROAS</div>
      <div style="font-size:12px;color:rgba(250,248,245,0.7);line-height:1.7;">${f.best_performer?.why || ''}</div>
    </div>
    <div style="background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.22);border-radius:4px;padding:18px 20px;">
      <div style="font-size:8px;color:#c9a84c;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">→ Next 48 Hours</div>
      <div style="font-size:14px;color:rgba(250,248,245,0.88);line-height:1.75;">${f.immediate_action || ''}</div>
    </div>
  </td></tr>
  <tr><td style="padding:24px 40px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <div style="font-size:8px;color:rgba(250,248,245,0.32);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:10px;">Preview · Full VAI Analysis</div>
    <div style="font-size:13px;color:rgba(250,248,245,0.72);line-height:1.85;">${(report.full_analysis || '').slice(0, 600)}…</div>
    <div style="font-size:10px;color:rgba(250,248,245,0.32);letter-spacing:0.6px;margin-top:14px;">The full blueprint — including 30-day strategic moves and per-campaign actions — will be delivered on your call.</div>
  </td></tr>
  <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);">
    <div style="font-size:10px;color:rgba(250,248,245,0.22);letter-spacing:0.8px;">Vanguard Visuals · VAI Intelligence · team@vngrdvisuals.com</div>
  </td></tr>
</table></td></tr></table></body></html>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VAI Vision Drop <team@vngrdvisuals.com>',
          to: normalizedEmail,
          subject: `Your Ad Vision Drop — ${f.biggest_leak?.campaign_name || 'snapshot'}`,
          html: prospectHtml,
        }),
      }).catch((e) => console.error('prospect email send failed:', e))

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Vanguard Visuals <team@vngrdvisuals.com>',
          to: 'agency.vanguardia@gmail.com',
          subject: `New Vision Drop call booked — ${leadName} (${normalizedEmail})`,
          html:
            `<p><strong>${leadName}</strong> (${normalizedEmail}) just booked a Vision Drop call.</p>` +
            `<p>30-day spend: ${fmt(report.total_spend as any)} · ROAS: ${Number(report.blended_roas).toFixed(2)}x</p>` +
            `<p>Biggest leak: <strong>${f.biggest_leak?.campaign_name}</strong> — ${fmt(f.biggest_leak?.monthly_waste)}/mo wasted</p>` +
            `<p>Best performer: <strong>${f.best_performer?.campaign_name}</strong> — ${Number(f.best_performer?.roas || 0).toFixed(2)}x ROAS</p>` +
            `<p>Immediate action queued: ${f.immediate_action}</p>`,
        }),
      }).catch((e) => console.error('agency email send failed:', e))
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('vision-drop booked error:', e)
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
