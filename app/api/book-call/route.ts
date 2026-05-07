import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { name, email, company, spend } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Parse spend string like "$10,000/mo" → number
    const spendNum = spend
      ? parseFloat(spend.replace(/[^0-9.]/g, '')) || 0
      : 0

    // Upsert into client_invites
    const { error: inviteErr } = await supabaseAdmin
      .from('client_invites')
      .upsert({
        email,
        name,
        company: company || '',
        monthly_spend: spendNum,
        plan: spendNum >= 15000 ? 'embedded' : spendNum >= 5000 ? 'managed' : 'starter',
        status: 'pending',
        notes: `Applied via landing page book-a-call. Spend: ${spend || 'not provided'}`,
      }, { onConflict: 'email' })

    if (inviteErr) {
      console.error('Invite upsert error:', inviteErr)
    }

    // Send notification email to you
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      const notifyResult = await resend.emails.send({
        from: 'VV Growth Ad Engine <team@vngrdvisuals.com>',
        to: 'agency.vanguardia@gmail.com',
        subject: `New call request: ${name} — ${company || 'No company'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:32px;background:#050509;font-family:'DM Sans',Arial,sans-serif;color:#faf8f5;">
            <div style="max-width:500px;margin:0 auto;background:#0c0b0f;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:36px;">
              <div style="font-family:'Georgia',serif;font-size:26px;font-weight:300;font-style:italic;color:#faf8f5;margin-bottom:4px;">VV</div>
              <div style="font-size:8px;color:rgba(201,168,76,0.6);letter-spacing:3px;text-transform:uppercase;margin-bottom:28px;">New Call Request</div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;color:rgba(250,248,245,0.38);letter-spacing:1.5px;text-transform:uppercase;width:38%;">Name</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#faf8f5;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;color:rgba(250,248,245,0.38);letter-spacing:1.5px;text-transform:uppercase;">Email</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#c9a84c;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;color:rgba(250,248,245,0.38);letter-spacing:1.5px;text-transform:uppercase;">Company</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#faf8f5;">${company || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:10px;color:rgba(250,248,245,0.38);letter-spacing:1.5px;text-transform:uppercase;">Monthly Spend</td>
                  <td style="padding:10px 0;font-size:13px;color:#faf8f5;">${spend || '—'}</td>
                </tr>
              </table>

              <div style="margin-top:28px;padding:16px 18px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:4px;font-size:12px;color:rgba(201,168,76,0.85);line-height:1.7;">
                This person has been added to your client pipeline automatically. Go to your dashboard to review and provision their account.
              </div>

              <a href="https://www.vngrdvisuals.com/dashboard/invite"
                 style="display:inline-block;margin-top:20px;background:#c9a84c;color:#050509;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:1.5px;padding:12px 24px;border-radius:4px;font-family:'Courier New',monospace;">
                View Pipeline →
              </a>

              <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);font-size:10px;color:rgba(250,248,245,0.2);">
                Vanguard Visuals · team@vngrdvisuals.com · vngrdvisuals.com
              </div>
            </div>
          </body>
          </html>
        `,
      })

      console.log('Book call notification result:', JSON.stringify(notifyResult))
    } else {
      console.error('RESEND_API_KEY not set — notification email not sent')
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Book call error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}