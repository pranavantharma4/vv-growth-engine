import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: cu } = await supabase
      .from('client_users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (cu?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, email, company, plan, monthly_spend, notes, invite_id, account_type, agency_name } = await req.json()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, company },
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

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

    await supabaseAdmin.from('client_users').insert({
      user_id: authUser.user.id,
      client_id: clientRecord.id,
      role: isAgency ? 'admin' : 'client',
    })

    try {
      await supabaseAdmin.from('onboarding').insert({
        client_id: clientRecord.id,
        step: 'connect',
        completed_steps: [],
      })
    } catch (_) {}

    if (invite_id) {
      await supabaseAdmin
        .from('client_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite_id)
    }

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?onboarding=1`,
      },
    })
    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 400 })

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const subjectLine = isAgency
      ? `Your VV Growth Ad Engine agency portal is ready`
      : `Your VV Growth Ad Engine access is ready`

    const welcomeMessage = isAgency
      ? `Your agency account on VV Growth Ad Engine is ready. You can now connect your clients' ad accounts, generate white-labelled intelligence briefs, and manage all their campaigns from one place.`
      : `Your VV Growth Ad Engine account is ready. Connect your ad accounts and receive your first intelligence brief on Monday morning.`

    await resend.emails.send({
      from: 'Vanguard Visuals <intelligence@vngrdvisuals.com>',
      to: email,
      subject: subjectLine,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#050509;font-family:'DM Sans',Arial,sans-serif;color:#faf8f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#050509;padding:48px 24px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#0c0b0f;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;">
                <tr><td style="padding:36px 40px 0;">
                  <div style="font-family:'Georgia',serif;font-size:36px;font-weight:300;font-style:italic;color:#faf8f5;letter-spacing:2px;margin-bottom:4px;">VV</div>
                  <div style="font-size:9px;color:rgba(250,248,245,0.35);letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;">Vanguard Visuals · Growth Ad Engine${isAgency ? ' · Agency Portal' : ''}</div>
                  <div style="font-size:9px;color:rgba(201,168,76,0.6);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">You're in.</div>
                  <div style="font-family:'Georgia',serif;font-size:26px;font-weight:300;color:#faf8f5;margin-bottom:18px;line-height:1.3;">Welcome${isAgency ? ` to the agency portal` : ''}, ${name}.</div>
                  <div style="font-size:14px;color:rgba(250,248,245,0.55);line-height:1.85;margin-bottom:28px;">${welcomeMessage}</div>
                </td></tr>
                <tr><td style="padding:0 40px 20px;">
                  <a href="${linkData.properties.action_link}" style="display:inline-block;background:#c9a84c;color:#050509;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;">
                    Enter Your Portal →
                  </a>
                </td></tr>
                <tr><td style="padding:0 40px 36px;">
                  <div style="font-size:12px;color:rgba(250,248,245,0.3);line-height:1.7;margin-top:12px;">
                    This link expires in 24 hours. Questions? Reply here or contact intelligence@vngrdvisuals.com
                  </div>
                  <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);font-size:10px;color:rgba(250,248,245,0.2);letter-spacing:1px;">
                    Vanguard Visuals · Confidential Client Portal · vngrdvisuals.com
                  </div>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, client_id: clientRecord.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}