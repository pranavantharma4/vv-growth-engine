import { createClient } from '@supabase/supabase-js'

/** Service-role client for billing reads/writes (bypasses RLS). Server-only. */
export function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * The billing account for a user. Self-serve owners have exactly one client;
 * for users linked to several (e.g. agency), we take the one they belong to as
 * a plain member first, else the first link. Returns null if unlinked.
 */
export async function getPrimaryClientId(userId: string): Promise<string | null> {
  const db = adminDb()
  const { data } = await db
    .from('client_users')
    .select('client_id, role')
    .eq('user_id', userId)
  if (!data || data.length === 0) return null
  const own = data.find(l => l.role === 'client' || l.role === 'owner')
  return (own ?? data[0]).client_id
}
