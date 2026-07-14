import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isEntitled } from '@/lib/entitlement'

// Dashboard responses must never be served from disk/back-forward cache. After
// onboarding flips onboarding_complete=true, the next /dashboard navigation
// needs a fresh middleware pass so it doesn't bounce back to /onboarding.
function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  return response
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')

  // Not logged in — protect the dashboard
  if (isDashboard && !session) {
    return noStore(NextResponse.redirect(new URL('/login', req.url)))
  }

  if (!session) return res

  // Resolve the user's client links + onboarding state. NEVER use .single() on
  // client_users — an admin can be linked to many clients.
  async function getUserState() {
    const { data: links } = await supabase
      .from('client_users')
      .select('client_id, role')
      .eq('user_id', session!.user.id)

    if (!links || links.length === 0) {
      return { hasClient: false, isAdmin: false, onboarded: false, entitled: false }
    }

    // Admins skip the client onboarding flow and the billing gate entirely.
    if (links.some(l => l.role === 'admin')) {
      return { hasClient: true, isAdmin: true, onboarded: true, entitled: true }
    }

    // For pure clients, treat onboarded as TRUE only when clients.onboarding_complete
    // is explicitly true on at least one linked client. The onboarding-table
    // completed_at signal is a fallback for the older flow.
    const clientIds = links.map(l => l.client_id)
    const [clientsQ, obQ] = await Promise.all([
      supabase.from('clients')
        .select('id, onboarding_complete, is_founder, subscription_status, trial_ends_at')
        .in('id', clientIds),
      supabase.from('onboarding').select('client_id, completed_at').in('client_id', clientIds),
    ])

    const clientsDone = (clientsQ.data || []).some(c => c.onboarding_complete === true)
    const obDone = (obQ.data || []).some(o => o.completed_at !== null)
    const onboarded = clientsDone || obDone

    // Entitled if any linked account is a Founder or has a live subscription/trial.
    const entitled = (clientsQ.data || []).some(c => isEntitled(c))

    return { hasClient: true, isAdmin: false, onboarded, entitled }
  }

  // Logged in + hitting /login — send somewhere useful
  if (path === '/login') {
    const { hasClient, onboarded } = await getUserState()
    if (!hasClient) return res
    return NextResponse.redirect(
      new URL(onboarded ? '/dashboard' : '/dashboard/onboarding', req.url)
    )
  }

  // Logged in + inside the dashboard — enforce billing + onboarding gates
  if (isDashboard) {
    const { hasClient, isAdmin, onboarded, entitled } = await getUserState()

    // Logged-in user with no client link can't use the dashboard
    if (!hasClient) return noStore(NextResponse.redirect(new URL('/login', req.url)))

    const onOnboarding = path === '/dashboard/onboarding'
    const onBilling = path === '/dashboard/billing'

    // Billing gate — an expired trial / cancelled account (non-Founder) must
    // resolve billing before anything else. The billing page is always reachable.
    if (!isAdmin && !entitled && !onBilling) {
      return noStore(NextResponse.redirect(new URL('/dashboard/billing', req.url)))
    }

    // Incomplete onboarding → force the connect flow (admins exempt). Billing
    // stays reachable so a trialing user can add a card before onboarding.
    if (!onboarded && !isAdmin && !onOnboarding && !onBilling) {
      return noStore(NextResponse.redirect(new URL('/dashboard/onboarding', req.url)))
    }

    // Already onboarded → no reason to see the onboarding screen again
    if (onboarded && onOnboarding) {
      return noStore(NextResponse.redirect(new URL('/dashboard', req.url)))
    }

    return noStore(res)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
