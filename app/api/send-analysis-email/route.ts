import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const {
      to, campaign_name, client_name, analysis,
      simple_analysis, platform, health, spend, roas
    } = await req.json()

    if (!to || !analysis) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

    const resend = new Resend(process.env.RESEND_API_KEY)

    const healthColour = Number(roas) >= 3 ? '#4ade80' : Number(roas) >= 1.5 ? '#fbbf24' : '#f87171'

    const analysisHtml = (analysis as string)
      .replace(/\*\*/g, '')
      .split('\n')
      .map((line: string) => {
        if (line.startsWith('## ')) {
          return `<h3 style="font-family:'Georgia',serif;font-size:17px;font-weight:400;color:#faf8f5;margin:28px 0 10px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.07);">${line.replace('## ', '')}</h3>`
        }
        if (line.match(/^\d+\./)) {
          return `<p style="font-size:13px;color:rgba(250,248,245,0.72);line-height:1.82;margin:0 0 10px;padding-left:0;">${line}</p>`
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return `<p style="font-size:13px;color:rgba(250,248,245,0.72);line-height:1.82;margin:0 0 6px;padding-left:12px;">— ${line.replace(/^[-•]\s/, '')}</p>`
        }
        if (line.trim() === '') return '<div style="height:8px;"></div>'
        return `<p style="font-size:13px;color:rgba(250,248,245,0.72);line-height:1.82;margin:0 0 6px;">${line}</p>`
      })
      .join('')

    await resend.emails.send({
      from: 'VAI Intelligence <intelligence@vngrdvisuals.com>',
      to,
      subject: `VAI Analysis: ${campaign_name} — ${health.toUpperCase()} · ${Number(roas).toFixed(1)}x ROAS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>VAI Campaign Analysis</title></head>
        <body style="margin:0;padding:0;background:#050509;font-family:'DM Sans',Arial,sans-serif;color:#faf8f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#050509;padding:40px 24px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#0c0b0f;border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;max-width:600px;">

                <tr><td style="padding:36px 40px 0;">
                  <div style="font-size:9px;color:#c9a84c;letter-spacing:5px;text-transform:uppercase;margin-bottom:8px;">VAI · Vanguard AI Intelligence</div>
                  <div style="font-family:'Georgia',serif;font-size:30px;font-weight:300;font-style:italic;color:#faf8f5;margin-bottom:4px;">Campaign Analysis</div>
                  <div style="font-size:11px;color:rgba(250,248,245,0.35);margin-bottom:28px;">${client_name} &middot; ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </td></tr>

                <tr><td style="padding:0 40px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:4px;">
                    <tr>
                      <td style="padding:16px 18px;border-right:1px solid rgba(255,255,255,0.07);">
                        <div style="font-size:8px;color:rgba(250,248,245,0.32);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">Campaign</div>
                        <div style="font-size:13px;color:#faf8f5;font-weight:500;line-height:1.3;">${campaign_name}</div>
                      </td>
                      <td style="padding:16px 18px;border-right:1px solid rgba(255,255,255,0.07);">
                        <div style="font-size:8px;color:rgba(250,248,245,0.32);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">Platform</div>
                        <div style="font-size:13px;color:#faf8f5;">${(platform as string).toUpperCase()}</div>
                      </td>
                      <td style="padding:16px 18px;border-right:1px solid rgba(255,255,255,0.07);">
                        <div style="font-size:8px;color:rgba(250,248,245,0.32);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">Monthly Spend</div>
                        <div style="font-size:13px;color:#faf8f5;">$${Number(spend).toLocaleString()}</div>
                      </td>
                      <td style="padding:16px 18px;">
                        <div style="font-size:8px;color:rgba(250,248,245,0.32);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">ROAS</div>
                        <div style="font-family:'Georgia',serif;font-size:22px;color:${healthColour};">${Number(roas).toFixed(2)}x</div>
                      </td>
                    </tr>
                  </table>
                </td></tr>

                ${simple_analysis ? `
                <tr><td style="padding:0 40px 24px;">
                  <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.16);border-radius:4px;padding:18px 20px;">
                    <div style="font-size:8px;color:#c9a84c;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:10px;">Summary</div>
                    <div style="font-size:14px;color:rgba(250,248,245,0.88);line-height:1.85;">${simple_analysis}</div>
                  </div>
                </td></tr>` : ''}

                <tr><td style="padding:0 40px 40px;">
                  <div style="font-size:8px;color:rgba(250,248,245,0.28);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">Full VAI Analysis</div>
                  ${analysisHtml}
                </td></tr>

                <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                  <div style="font-size:10px;color:rgba(250,248,245,0.2);letter-spacing:0.8px;">
                    Vanguard Visuals &middot; VAI Intelligence &middot; intelligence@vngrdvisuals.com &middot; vngrdvisuals.com
                  </div>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Email send error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}