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

  // Anonymous users have nothing else to gate
  if (!session) return res

  // Resolve this user's client links + role.
  // NEVER use .single() on client_users — an admin can be linked to many clients.
  async function getUserState() {
    const { data: links } = await supabase
      .from('client_users')
      .select('client_id, role')
      .eq('user_id', session!.user.id)

    if (!links || links.length === 0) {
      return { hasClient: false, isAdmin: false, onboarded: false }
    }

    const isAdmin = links.some(l => l.role === 'admin')

    // Admins never go through the client onboarding flow
    if (isAdmin) return { hasClient: true, isAdmin: true, onboarded: true }

    // Onboarded if EITHER signal says so: clients.onboarding_complete is the
    // reliable flag (the clients row always exists); onboarding.completed_at
    // covers clients onboarded through the older flow.
    const clientIds = links.map(l => l.client_id)
    const [{ data: clientRows }, { data: obRows }] = await Promise.all([
      supabase.from('clients').select('onboarding_complete').in('id', clientIds),
      supabase.from('onboarding').select('completed_at').in('client_id', clientIds),
    ])

    const onboarded =
      !!(clientRows && clientRows.some(c => c.onboarding_complete)) ||
      !!(obRows && obRows.some(o => o.completed_at))
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

    // A logged-in user with no client link can't use the dashboard
    if (!hasClient) return NextResponse.redirect(new URL('/login', req.url))

    const onOnboarding = path === '/dashboard/onboarding'

    // Incomplete onboarding → force the connect flow (admins exempt)
    if (!onboarded && !isAdmin && !onOnboarding) {
      return NextResponse.redirect(new URL('/dashboard/onboarding', req.url))
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
