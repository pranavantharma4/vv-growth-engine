import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/account'

export const dynamic = 'force-dynamic'

// POST /api/admin/grant-founder { client_id, revoke? } — admin-only.
// Grants (or revokes) free-for-life Founders status and keeps the public seat
// counter in sync: granting inserts a founders_seats row, revoking removes it.
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin check — never .single() on client_users.
  const { data: adminRows } = await supabase
    .from('client_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .limit(1)
  if (!adminRows || adminRows.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { client_id, revoke } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const db = adminDb()
  const { data: client } = await db.from('clients').select('id, name').eq('id', client_id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (revoke) {
    await db.from('clients').update({ is_founder: false, founder_granted_at: null }).eq('id', client_id)
    await db.from('founders_seats').delete().eq('client_id', client_id)
    return NextResponse.json({ ok: true, is_founder: false })
  }

  await db.from('clients')
    .update({ is_founder: true, founder_granted_at: new Date().toISOString() })
    .eq('id', client_id)

  // One seat per client — don't double-count on repeat grants.
  const { data: seat } = await db.from('founders_seats').select('id').eq('client_id', client_id).limit(1)
  if (!seat || seat.length === 0) {
    await db.from('founders_seats').insert({ client_id, brand: client.name })
  }

  return NextResponse.json({ ok: true, is_founder: true })
}
