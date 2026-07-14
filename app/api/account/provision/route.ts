import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { provisionAccountForUser } from '@/lib/provision'

export const dynamic = 'force-dynamic'

// POST /api/account/provision — creates the caller's account (clients +
// client_users) on first login after self-serve signup. Idempotent: the signup
// page calls it when a session exists immediately, and /auth/callback calls it
// after email confirmation, so whichever fires first wins and the other no-ops.
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const name = (user.user_metadata?.name as string | undefined) ?? null
  const result = await provisionAccountForUser(user.id, user.email ?? '', name)

  if (!result.ok) {
    console.error('account provision failed:', result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, clientId: result.clientId, created: result.created })
}
