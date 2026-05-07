import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: cuRows } = await supabase
      .from('client_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1)
    if (!cuRows || cuRows.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { client_id, invite_id, client_name, client_email, reason } = await req.json()
    if (!client_id && !invite_id) {
      return NextResponse.json({ error: 'client_id or invite_id required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // If we have a full client account — remove everything
    if (client_id) {
      // Remove campaign snapshots
      await supabaseAdmin.from('campaign_snapshots').delete().eq('client_id', client_id)
      // Remove ad connections
      await supabaseAdmin.from('ad_connections').delete().eq('client_id', client_id)
      // Remove weekly briefs
      await supabaseAdmin.from('weekly_briefs').delete().eq('client_id', client_id)
      // Remove ai analyses
      await supabaseAdmin.from('ai_analyses').delete().eq('client_id', client_id)
      // Remove optimization blueprints
      await supabaseAdmin.from('optimization_blueprints').delete().eq('client_id', client_id)
      // Remove client users links
      await supabaseAdmin.from('client_users').delete().eq('client_id', client_id)
      // Remove onboarding
      await supabaseAdmin.from('onboarding').delete().eq('client_id', client_id)
      // Remove client record
      await supabaseAdmin.from('clients').delete().eq('id', client_id)
    }

    // Remove from pipeline
    if (invite_id) {
      await supabaseAdmin.from('client_invites').delete().eq('id', invite_id)
    }

    // Send termination email if we have their email
    if (client_email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Vanguard Visuals <team@vngrdvisuals.com>',
          to: client_email,
          subject: 'Your VV Growth Ad Engine subscription — an update',
          html: generateTerminationEmail(client_name || 'there', reason || ''),
        })
      } catch (emailErr: any) {
        console.error('Termination email failed:', emailErr.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Remove client error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function generateTerminationEmail(name: string, reason: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',Georgia,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 24px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Logo bar -->
        <tr><td style="padding:0 0 32px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:32px;font-weight:300;font-style:italic;color:#1a1714;letter-spacing:3px;">VV</div>
          <div style="font-size:8px;color:rgba(26,23,20,0.4);letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Vanguard Visuals</div>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">

          <!-- Top accent bar -->
          <tr><td style="background:linear-gradient(135deg,#1a1714 0%,#2d2a26 100%);padding:40px 48px 36px;">
            <div style="font-size:10px;color:rgba(201,168,76,0.8);letter-spacing:3px;text-transform:uppercase;margin-bottom:14px;">Account Update</div>
            <div style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#faf8f5;line-height:1.2;margin-bottom:8px;">
              A chapter closes,<br><em style="color:#c9a84c;">another begins.</em>
            </div>
          </td></tr>

          <!-- Body -->
          <tr><td style="padding:40px 48px;">
            <p style="font-size:15px;color:#3a3733;line-height:1.85;margin:0 0 20px;">
              Hi ${name},
            </p>
            <p style="font-size:15px;color:#3a3733;line-height:1.85;margin:0 0 20px;">
              We're reaching out to let you know that your VV Growth Ad Engine subscription has been concluded${reason ? ` — ${reason}` : ''}. Your access to the platform and all associated services has been closed as of today.
            </p>
            <p style="font-size:15px;color:#3a3733;line-height:1.85;margin:0 0 28px;">
              We genuinely valued working with you. The intelligence your account generated — the campaigns diagnosed, the budget leaks identified, the optimizations uncovered — that work was real, and we hope it moved the needle for your business.
            </p>

            <!-- Divider with icon -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="height:1px;background:linear-gradient(to right,transparent,#e8e4de,transparent);"></td>
              </tr>
            </table>

            <!-- What you keep -->
            <div style="background:#f5f4f0;border-radius:8px;padding:24px 28px;margin-bottom:28px;">
              <div style="font-size:9px;color:rgba(26,23,20,0.4);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:16px;">What stays with you</div>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#c9a84c;font-size:16px;margin-right:12px;">◈</span>
                  </td>
                  <td style="padding:6px 0;">
                    <span style="font-size:13px;color:#3a3733;line-height:1.7;">Every insight, analysis, and blueprint you exported during your time on the platform</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#c9a84c;font-size:16px;margin-right:12px;">◈</span>
                  </td>
                  <td style="padding:6px 0;">
                    <span style="font-size:13px;color:#3a3733;line-height:1.7;">The strategic direction your account identified — that knowledge belongs to you</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#c9a84c;font-size:16px;margin-right:12px;">◈</span>
                  </td>
                  <td style="padding:6px 0;">
                    <span style="font-size:13px;color:#3a3733;line-height:1.7;">A standing invitation to return — whenever you're ready, so are we</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size:14px;color:#6b6560;line-height:1.85;margin:0 0 28px;">
              Ad performance doesn't pause when intelligence does. The campaigns that were bleeding when you left are still bleeding. The budget leaks we identified don't fix themselves. If there comes a moment when you're ready to return — we'll be here, and your history won't be forgotten.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
              <tr>
                <td style="background:#1a1714;border-radius:6px;">
                  <a href="https://www.vngrdvisuals.com"
                     style="display:inline-block;padding:14px 32px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-decoration:none;text-transform:uppercase;">
                    Return Anytime →
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#9a9590;line-height:1.7;margin:20px 0 0;">
              Questions about your account or data? Reply directly to this email or reach us at team@vngrdvisuals.com. We respond within 24 hours.
            </p>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background:#f5f4f0;border-top:1px solid #e8e4de;padding:24px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-family:Georgia,serif;font-size:16px;font-style:italic;color:#1a1714;letter-spacing:2px;">VV</div>
                  <div style="font-size:9px;color:rgba(26,23,20,0.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Growth Ad Engine</div>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="font-size:10px;color:#9a9590;">team@vngrdvisuals.com</div>
                  <div style="font-size:10px;color:#9a9590;">vngrdvisuals.com</div>
                </td>
              </tr>
            </table>
          </td></tr>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}