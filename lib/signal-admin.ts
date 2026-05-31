import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Service-role client — bypasses RLS. signal_content has RLS enabled with no
// public policies, so ALL access goes through the admin-gated routes below.
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Schema-agnostic admin gate: an authenticated user is admin if they own a
// client_users row with role='admin'. We select '*' and match on whichever
// link column exists (user_id / auth_user_id / id) or email, so this works
// regardless of the exact client_users shape. Never uses .single().
export async function requireAdmin(): Promise<
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number }
> {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401 }

  const { data: admins } = await supabase
    .from('client_users')
    .select('*')
    .eq('role', 'admin')

  const email = (user.email || '').toLowerCase()
  const isAdmin = (admins || []).some((r: any) =>
    r.user_id === user.id ||
    r.auth_user_id === user.id ||
    r.auth_id === user.id ||
    r.id === user.id ||
    (r.email && String(r.email).toLowerCase() === email)
  )

  if (!isAdmin) return { ok: false, status: 403 }
  return { ok: true, userId: user.id, email: user.email ?? null }
}
