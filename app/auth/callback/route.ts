import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Auth callback for two flows:
 *  - Magic link / invite: Supabase email links carry ?token_hash=...&type=...
 *    → verified server-side with verifyOtp.
 *  - OAuth / PKCE: ?code=... → exchanged with exchangeCodeForSession.
 * On success the session cookie is set and we hand off to /dashboard/onboarding;
 * middleware re-routes already-onboarded clients and admins on to /dashboard.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const code = url.searchParams.get('code')

  const supabase = createRouteHandlerClient({ cookies })
  let authed = false

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) console.error('auth/callback verifyOtp failed:', error.message)
    authed = !error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) console.error('auth/callback exchangeCodeForSession failed:', error.message)
    authed = !error
  } else {
    console.error('auth/callback hit with no token_hash or code')
  }

  return NextResponse.redirect(
    new URL(authed ? '/dashboard/onboarding' : '/login', url.origin)
  )
}
