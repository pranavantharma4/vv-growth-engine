import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: cu } = await supabase.from('client_users').select('role').eq('user_id', user.id).single()
    if (cu?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, email, company, plan, monthly_spend, notes } = await req.json()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

    const { data: invite, error } = await supabase.from('client_invites').insert({
      email, name, company, plan: plan || 'managed',
      monthly_spend: monthly_spend || 0,
      notes: notes || '',
      invited_by: user.id,
      status: 'pending',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, invite })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}