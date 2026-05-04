import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use limit(1) not single() — admin may have multiple client rows
    const { data: cuRows } = await supabase
      .from('client_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1)

    if (!cuRows || cuRows.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, company, plan, monthly_spend, notes, account_type, agency_name } = await req.json()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

    const { data: invite, error } = await supabase
      .from('client_invites')
      .insert({
        email,
        name,
        company: company || '',
        plan: plan || 'managed',
        monthly_spend: monthly_spend || 0,
        notes: notes || '',
        invited_by: user.id,
        status: 'pending',
        account_type: account_type || 'brand',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, invite })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}