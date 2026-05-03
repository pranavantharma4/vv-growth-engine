import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const {
      to, campaign_name, client_name, analysis,
      simple_analysis, platform, health, spend, roas
    } = await req.json()

    if (!to || !analysis) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Convert markdown-ish to clean HTML
    const analysisHtml = analysis
      .replace(/\*\*/g, '')
      .split('\n')
      .map((line: string) => {
        if (line.startsWith('## ')) return `<h3 style="font-family:'Georgia',serif;font-size:18px;font-weight:400;color:#faf8f5;margin:28px 0 10px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">${line.replace('## ', '')}</h3>`
        if (line.match(/^\d+\./)) return `<p style="font-size:13px;color:rgba(250,248,245,0.7);line-height:1.8;margin:0 0 8px;padding-left:16px;">${line}</p>`
        if (line.startsWith('- ') || line.startsWith('• ')) return `<p style="font-size:13px;color:rgba(250,248,245,0.7);line-height:1.8;margin:0 0 6px;padding-left:16px;">— ${line.replace(/^[-•]\s/, '')}</p>`
        if (line.trim() === '') return '<div style="height:8px;"></div>'
        return `<p style="font-size:13px;color:rgba(250,248,245,0.7);line-height:1.8;margin:0 0 6px;">${line}</p>`
      }).join('')

    await resend.emails.send({
      from: 'VAI Intelligence <intelligence@vngrdvisuals.com>',
      to,
      subject: `VAI Analysis: ${campaign_name} — ${health.toUpperCase()} · ${Number(roas).toFixed(1)}x ROAS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#050509;font-family:'DM Sans',Arial,sans-serif;color:#faf8f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#050509;padding:40px 24px;">
            <tr><td align="center">
              <table width="580" cellpadding="0" cellspacing="0" style="background:#0c0b0f;border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;max-width:580px;">

                <!-- Header -->
                <tr><td style="padding:32px 36px 0;">
                  <div style="font-family:'Georgia',serif;font-size:11px;font-weight:300;color:#c9a84c;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px;">VAI · Vanguard AI Intelligence</div>
                  <div style="font-family:'Georgia',serif;font-size:28px;font-weight:300;font-style:italic;color:#faf8f5;margin-bottom:4px;">Campaign Analysis</div>
                  <div style="font-size:12px;color:rgba(250,248,245,0.4);margin-bottom:24px;">${client_name} · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </td></tr>

                <!-- Campaign stats strip -->
                <tr><td style="padding:0 36px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:4px;border:1px solid rgba(255,255,255,0.07);">
                    <tr>
                      <td style="padding:14px 16px;border-right:1px solid rgba(255,255,255,0.07);">
                        <div style="font-size:9px;color:rgba(250,248,245,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Campaign</div>
                        <div style="font-size:13px;color:#faf8f5;font-weight:500;">${campaign_name}</div>
                      </td>
                      <td style="padding:14px 16px;border-right:1px solid rgba(255,255,255,0.07);">
                        <div style="font-size:9px;color:rgba(250,248,245,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Platform</div>
                        <div style="font-size:13px;color:#faf8f5;">${platform.toUpperCase()}</div>
                      </td>
                      <td style="padding:14px 16px;border-right:1px solid rgba(255,255,255,0.07);">
                        <div style="font-size:9px;color:rgba(250,248,245,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Spend</div>
                        <div style="font-size:13px;color:#faf8f5;">$${Number(spend).toLocaleString()}/mo</div>
                      </td>
                      <td style="padding:14px 16px;">
                        <div style="font-size:9px;color:rgba(250,248,245,0.35);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">ROAS</div>
                        <div style="font-size:18px;color:${Number(roas) >= 3 ? '#4ade80' : Number(roas) >= 1.5 ? '#fbbf24' : '#f87171'};font-family:'Georgia',serif;">${Number(roas).toFixed(2)}x</div>
                      </td>
                    </tr>
                  </table>
                </td></tr>

                ${simple_analysis ? `
                <!-- Simple summary -->
                <tr><td style="padding:0 36px 20px;">
                  <div style="background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.18);border-radius:4px;padding:16px 18px;">
                    <div style="font-size:9px;color:#c9a84c;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">Summary</div>
                    <div style="font-size:14px;color:rgba(250,248,245,0.85);line-height:1.8;">${simple_analysis}</div>
                  </div>
                </td></tr>` : ''}

                <!-- Full analysis -->
                <tr><td style="padding:0 36px 36px;">
                  <div style="font-size:9px;color:rgba(250,248,245,0.3);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">Full VAI Analysis</div>
                  ${analysisHtml}
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
                  <div style="font-size:10px;color:rgba(250,248,245,0.2);letter-spacing:1px;">
                    Vanguard Visuals · VAI Intelligence · intelligence@vngrdvisuals.com · vngrdvisuals.com
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
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}