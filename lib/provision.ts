import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Self-serve account provisioning.
 *
 * When someone signs up (email/password), they have an auth.users row but no
 * clients row and no client_users link — so the dashboard has nothing to show
 * and middleware can't resolve them. This creates that account exactly once,
 * mirroring app/api/admin/create-client but for a self-provisioned owner.
 *
 * Idempotent: if the user already owns/belongs to a client, it no-ops. Safe to
 * call from both the signup page (when confirmation is off and a session exists
 * immediately) and /auth/callback (when the user confirms via email first).
 *
 * New accounts start on a 7-day no-card trial (subscription_status='trialing'),
 * so they reach the dashboard immediately; billing (Phase 3) converts them to
 * 'active' before the trial ends, or the entitlement gate sends them to /billing.
 *
 * The 7-day trial belongs ONLY to the $149/mo standard plan and is the default
 * for every self-serve signup here. The Founders Program is free-for-life, NOT a
 * trial: founding seats are granted manually via /api/admin/grant-founder (sets
 * is_founder=true), which makes isEntitled() short-circuit true and bypass all
 * trial/billing gates. A ?plan=founders signup therefore lands on a normal trial
 * until its seat is granted — intentional (route-only), so the 4 free seats are
 * protected from anyone self-claiming free-for-life. The free Ad Vision Drop
 * audit is no-login and never creates a clients row, so it has no trial at all.
 */

const TRIAL_DAYS = 7

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export type ProvisionResult =
  | { ok: true; clientId: string; created: boolean }
  | { ok: false; error: string }

export async function provisionAccountForUser(
  userId: string,
  email: string,
  name?: string | null,
): Promise<ProvisionResult> {
  const db = admin()

  // Already linked to a client? Nothing to do.
  const { data: existing, error: exErr } = await db
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .limit(1)
  if (exErr) return { ok: false, error: exErr.message }
  if (existing && existing.length > 0) {
    return { ok: true, clientId: existing[0].client_id, created: false }
  }

  const cleanEmail = email.trim().toLowerCase()
  const displayName =
    (name && name.trim()) || cleanEmail.split('@')[0] || 'My Brand'
  const trialEnds = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Create the account (clients row) on a fresh trial.
  const { data: client, error: clientErr } = await db
    .from('clients')
    .insert({
      name: displayName,
      plan: 'engine',
      status: 'active',
      account_type: 'brand',
      contact_name: name?.trim() || null,
      contact_email: cleanEmail,
      onboarding_complete: false,
      onboarding_step: 'connect',
      subscription_status: 'trialing',
      trial_ends_at: trialEnds,
    })
    .select('id')
    .single()
  if (clientErr) return { ok: false, error: clientErr.message }

  // Link the user to their client. Use role 'client' (not 'owner') to match the
  // existing brand path — app/dashboard/layout.tsx selects a non-admin's client
  // by role === 'client', so any other value would hide their own account. If
  // this insert fails the account is unreachable, so roll back the clients row
  // rather than orphan it (same failure mode guarded in admin/create-client).
  const { error: linkErr } = await db.from('client_users').insert({
    user_id: userId,
    client_id: client.id,
    role: 'client',
  })
  if (linkErr) {
    await db.from('clients').delete().eq('id', client.id)
    return { ok: false, error: `Failed to link account: ${linkErr.message}` }
  }

  // Onboarding record — non-load-bearing (middleware also reads
  // clients.onboarding_complete) but keeps the connect flow consistent.
  await db.from('onboarding').insert({
    client_id: client.id,
    step: 'connect',
    completed_steps: [],
  })

  return { ok: true, clientId: client.id, created: true }
}
