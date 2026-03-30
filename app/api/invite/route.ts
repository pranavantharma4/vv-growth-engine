import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { name, email, contact, industry, plan, monthly_spend } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Verify caller is admin
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminCheck } = await supabase
      .from('client_users').select('role').eq('user_id', user.id).eq('role', 'admin').single()
    if (!adminCheck) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    // Use service role for privileged operations
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Create client record
    const { data: client, error: clientErr } = await admin
      .from('clients')
      .insert({ name, contact_name: contact, contact_email: email, industry, plan: plan || 'managed', status: 'active', monthly_ad_spend: monthly_spend || 0 })
      .select().single()

    if (clientErr) throw new Error('Failed to create client: ' + clientErr.message)

    // 2. Send Supabase auth invite — they receive email to set password
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vv-growth-engine.vercel.app'
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/onboarding`,
      data: { client_id: client.id, client_name: name }
    })

    if (inviteErr) {
      // Roll back client if invite fails
      await admin.from('clients').delete().eq('id', client.id)
      throw new Error('Failed to send invite: ' + inviteErr.message)
    }

    // 3. Link auth user to client
    const authUserId = inviteData.user?.id
    if (authUserId) {
      await admin.from('client_users').insert({ user_id: authUserId, client_id: client.id, role: 'client' })
    }

    // 4. Create onboarding record (not complete — they need to go through flow)
    await admin.from('onboarding').insert({ client_id: client.id, step: 'welcome', completed_steps: [] })

    return NextResponse.json({
      success: true,
      client_id: client.id,
      email,
      message: `Invite sent to ${email}`
    })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
