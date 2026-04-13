import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, spend } = await req.json()
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return NextResponse.json({ success: true })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'intelligence@vanguardvisuals.com',
        to: 'agency.vanguardia@gmail.com',
        subject: `Call Request — ${name} · ${company || 'No company'}`,
        html: `
          <h2>New Call Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || '—'}</p>
          <p><strong>Monthly Ad Spend:</strong> ${spend || '—'}</p>
          <p>Reply to this email to confirm their call time.</p>
        `,
        reply_to: email,
      }),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}