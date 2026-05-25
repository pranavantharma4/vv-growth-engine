import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Not logged in — protect the dashboard
  if (path.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
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
      return { hasClient: false, isAdmin: false, onboarded: false }
    }

    // Admins skip the client onboarding flow entirely.
    if (links.some(l => l.role === 'admin')) {
      return { hasClient: true, isAdmin: true, onboarded: true }
    }

    // For pure clients, treat onboarded as TRUE only when clients.onboarding_complete
    // is explicitly true on at least one linked client. The onboarding-table
    // completed_at signal is a fallback for the older flow.
    const clientIds = links.map(l => l.client_id)
    const [clientsQ, obQ] = await Promise.all([
      supabase.from('clients').select('id, onboarding_complete').in('id', clientIds),
      supabase.from('onboarding').select('client_id, completed_at').in('client_id', clientIds),
    ])

    const clientsDone = (clientsQ.data || []).some(c => c.onboarding_complete === true)
    const obDone = (obQ.data || []).some(o => o.completed_at !== null)
    const onboarded = clientsDone || obDone

    return { hasClient: true, isAdmin: false, onboarded }
  }

  // Logged in + hitting /login — send somewhere useful
  if (path === '/login') {
    const { hasClient, onboarded } = await getUserState()
    if (!hasClient) return res
    return NextResponse.redirect(
      new URL(onboarded ? '/dashboard' : '/dashboard/onboarding', req.url)
    )
  }

  // Logged in + inside the dashboard — enforce the onboarding gate
  if (path.startsWith('/dashboard')) {
    const { hasClient, isAdmin, onboarded } = await getUserState()

    // Logged-in user with no client link can't use the dashboard
    if (!hasClient) return NextResponse.redirect(new URL('/login', req.url))

    const onOnboarding = path === '/dashboard/onboarding'

    // Incomplete onboarding → force the connect flow (admins exempt).
    // This covers /dashboard, /dashboard/add-campaign, /dashboard/connect,
    // /dashboard/campaigns — every dashboard route except onboarding itself.
    if (!onboarded && !isAdmin && !onOnboarding) {
      const url = new URL('/dashboard/onboarding', req.url)
      return NextResponse.redirect(url)
    }

    // Already onboarded → no reason to see the onboarding screen again
    if (onboarded && onOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
