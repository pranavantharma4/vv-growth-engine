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

    const {
      name, email, company, plan, monthly_spend,
      notes, invite_id, account_type, agency_name
    } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    let authUserId: string

    if (existingUser) {
      authUserId = existingUser.id
    } else {
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name, company },
      })
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
      authUserId = authUser.user.id
    }

    const isAgency = account_type === 'agency'

    const { data: clientRecord, error: clientErr } = await supabaseAdmin
      .from('clients')
      .insert({
        name: company || name,
        plan: plan || 'managed',
        status: 'active',
        monthly_ad_spend: monthly_spend || 0,
        contact_name: name,
        contact_email: email,
        notes: notes || '',
        onboarding_complete: false,
        onboarding_step: 'connect',
        invited_by: user.id,
        account_type: account_type || 'brand',
        agency_name: isAgency ? (agency_name || company || name) : null,
        white_label_reports: isAgency,
      })
      .select()
      .single()

    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 400 })

    // Link user to client — check if already linked
    const { data: existingLink } = await supabaseAdmin
      .from('client_users')
      .select('id')
      .eq('user_id', authUserId)
      .eq('client_id', clientRecord.id)
      .limit(1)

    if (!existingLink || existingLink.length === 0) {
      await supabaseAdmin.from('client_users').insert({
        user_id: authUserId,
        client_id: clientRecord.id,
        role: isAgency ? 'admin' : 'client',
      })
    }

    // Create onboarding record
    try {
      await supabaseAdmin.from('onboarding').insert({
        client_id: clientRecord.id,
        step: 'connect',
        completed_steps: [],
      })
    } catch (_) {}

    // Mark invite accepted
    if (invite_id) {
      await supabaseAdmin
        .from('client_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite_id)
    }

    // Generate magic link — redirects through auth callback.
    // Fall back to the production domain so the link is never malformed.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vngrdvisuals.com'
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      },
    })

    if (linkErr) {
      console.error('Magic link error:', linkErr)
      return NextResponse.json({ error: linkErr.message }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: true,
        client_id: clientRecord.id,
        warning: 'Account created but email not sent — RESEND_API_KEY missing',
      })
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const emailResult = await resend.emails.send({
        from: 'Vanguard Visuals <team@vngrdvisuals.com>',
        to: email,
        subject: isAgency
          ? 'Your VV Growth Ad Engine agency portal is ready'
          : 'Your VV Growth Ad Engine portal is ready',
        html: generateWelcomeEmail(name, linkData.properties.action_link, isAgency),
      })

      console.log('Resend result:', JSON.stringify(emailResult))

      if (emailResult.error) {
        console.error('Resend error:', emailResult.error)
        return NextResponse.json({
          success: true,
          client_id: clientRecord.id,
          email_error: emailResult.error.message,
        })
      }
    } catch (emailErr: any) {
      console.error('Email failed:', emailErr.message)
      return NextResponse.json({
        success: true,
        client_id: clientRecord.id,
        email_error: emailErr.message,
      })
    }

    return NextResponse.json({ success: true, client_id: clientRecord.id })
  } catch (e: any) {
    console.error('Create client error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function generateWelcomeEmail(name: string, link: string, isAgency = false): string {
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

        <tr><td style="padding:0 0 32px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:32px;font-weight:300;font-style:italic;color:#1a1714;letter-spacing:3px;">VV</div>
          <div style="font-size:8px;color:rgba(26,23,20,0.4);letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Vanguard Visuals</div>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">

          <tr><td style="background:linear-gradient(135deg,#1a1714 0%,#2d2a26 100%);padding:44px 48px 40px;">
            <div style="font-size:10px;color:rgba(201,168,76,0.8);letter-spacing:3px;text-transform:uppercase;margin-bottom:14px;">
              ${isAgency ? 'Agency Intelligence Platform' : 'Intelligence Platform'}
            </div>
            <div style="font-family:Georgia,serif;font-size:34px;font-weight:300;color:#faf8f5;line-height:1.15;margin-bottom:12px;">
              Your portal is<br><em style="color:#c9a84c;">ready.</em>
            </div>
            <div style="font-size:13px;color:rgba(250,248,245,0.5);letter-spacing:0.5px;line-height:1.7;">
              VV Growth Ad Engine &middot; ${isAgency ? 'Agency Portal' : 'Confidential Access'}
            </div>
          </td></tr>

          <tr><td style="background:#f9f8f5;border-bottom:1px solid #eeebe6;padding:20px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;border-right:1px solid #e8e4de;padding:0 20px 0 0;">
                  <div style="font-family:Georgia,serif;font-size:28px;color:#1a1714;font-weight:300;">VAI</div>
                  <div style="font-size:8px;color:#9a9590;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">AI Analysis</div>
                </td>
                <td style="text-align:center;border-right:1px solid #e8e4de;padding:0 20px;">
                  <div style="font-family:Georgia,serif;font-size:28px;color:#1a1714;font-weight:300;">7AM</div>
                  <div style="font-size:8px;color:#9a9590;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Monday Brief</div>
                </td>
                <td style="text-align:center;padding:0 0 0 20px;">
                  <div style="font-family:Georgia,serif;font-size:28px;color:#c9a84c;font-weight:300;">&infin;</div>
                  <div style="font-size:8px;color:#9a9590;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Intelligence</div>
                </td>
              </tr>
            </table>
          </td></tr>

          <tr><td style="padding:40px 48px;">
            <p style="font-size:15px;color:#3a3733;line-height:1.85;margin:0 0 20px;">Hi ${name},</p>
            <p style="font-size:15px;color:#3a3733;line-height:1.85;margin:0 0 20px;">
              Welcome to VV Growth Ad Engine. Your account is ready &mdash; one click takes you inside.
            </p>
            <p style="font-size:14px;color:#6b6560;line-height:1.85;margin:0 0 32px;">
              ${isAgency
                ? "Connect your clients' ad accounts and VAI begins working immediately &mdash; classifying every campaign, identifying budget leaks across your entire portfolio, and generating white-labelled intelligence briefs you can deliver directly to your clients."
                : 'Connect your ad accounts and VAI begins working &mdash; classifying every campaign, finding your biggest budget leaks, and delivering a plain-English intelligence brief every Monday morning at 7AM.'
              }
            </p>

            <div style="background:#f5f4f0;border-radius:8px;padding:24px 28px;margin-bottom:32px;">
              <div style="font-size:9px;color:rgba(26,23,20,0.4);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:16px;">What happens next</div>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:28px;">
                    <div style="width:20px;height:20px;background:#1a1714;border-radius:50%;text-align:center;line-height:20px;font-size:9px;color:#c9a84c;font-weight:700;">1</div>
                  </td>
                  <td style="padding:8px 0 8px 12px;">
                    <div style="font-size:13px;color:#3a3733;font-weight:500;margin-bottom:2px;">Enter your portal</div>
                    <div style="font-size:12px;color:#9a9590;line-height:1.6;">Click the button below &mdash; your account is already set up and waiting</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:28px;">
                    <div style="width:20px;height:20px;background:#1a1714;border-radius:50%;text-align:center;line-height:20px;font-size:9px;color:#c9a84c;font-weight:700;">2</div>
                  </td>
                  <td style="padding:8px 0 8px 12px;">
                    <div style="font-size:13px;color:#3a3733;font-weight:500;margin-bottom:2px;">Connect your Meta Ads</div>
                    <div style="font-size:12px;color:#9a9590;line-height:1.6;">One-click OAuth &mdash; read only, we never touch your campaigns</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:28px;">
                    <div style="width:20px;height:20px;background:#1a1714;border-radius:50%;text-align:center;line-height:20px;font-size:9px;color:#c9a84c;font-weight:700;">3</div>
                  </td>
                  <td style="padding:8px 0 8px 12px;">
                    <div style="font-size:13px;color:#3a3733;font-weight:500;margin-bottom:2px;">Monday 7AM &mdash; your first brief</div>
                    <div style="font-size:12px;color:#9a9590;line-height:1.6;">Your biggest budget leak, identified. One action to take. Plain English.</div>
                  </td>
                </tr>
              </table>
            </div>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${link}"
                     style="display:inline-block;background:#1a1714;border-radius:6px;padding:16px 40px;font-family:'Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-decoration:none;text-transform:uppercase;">
                    Enter Your Portal &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#9a9590;text-align:center;line-height:1.7;margin:0;">
              This link expires in 24 hours and can only be used once.<br>
              Questions? Reply here or contact team@vngrdvisuals.com
            </p>
          </td></tr>

          <tr><td style="background:#f5f4f0;border-top:1px solid #e8e4de;padding:24px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-family:Georgia,serif;font-size:16px;font-style:italic;color:#1a1714;letter-spacing:2px;">VV</div>
                  <div style="font-size:9px;color:rgba(26,23,20,0.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Growth Ad Engine</div>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="font-size:10px;color:#9a9590;margin-bottom:2px;">team@vngrdvisuals.com</div>
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