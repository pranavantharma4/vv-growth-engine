import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { clientName, email } = await req.json()
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return NextResponse.json({ success: true })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'intelligence@vanguardvisuals.com',
        to: 'agency.vanguardia@gmail.com',
        subject: `Audit Request — ${clientName}`,
        html: `<p><strong>${clientName}</strong> has requested a custom audit.</p><p>Client email: ${email || 'not set'}</p><p>Follow up within 24 hours.</p>`,
      }),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}