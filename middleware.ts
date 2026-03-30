import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Not logged in — send to login
  if ((path.startsWith('/dashboard') || path.startsWith('/onboarding')) && !session)
    return NextResponse.redirect(new URL('/login', req.url))

  // Logged in + hitting login — send somewhere useful
  if (path === '/login' && session) {
    // Check if they have completed onboarding
    const { data: cu } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', session.user.id)
      .single()

    if (!cu) {
      // No client linked yet — go to onboarding
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    const { data: ob } = await supabase
      .from('onboarding')
      .select('completed_at')
      .eq('client_id', cu.client_id)
      .single()

    if (!ob?.completed_at) {
      // Has client but onboarding not complete
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Logged in + hitting dashboard — check onboarding first
  if (path.startsWith('/dashboard') && session) {
    const { data: cu } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', session.user.id)
      .single()

    if (cu) {
      const { data: ob } = await supabase
        .from('onboarding')
        .select('completed_at')
        .eq('client_id', cu.client_id)
        .single()

      // Skip onboarding check for admin users
      const { data: isAdmin } = await supabase
        .from('client_users')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single()

      if (!ob?.completed_at && !isAdmin) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/onboarding/:path*', '/onboarding']
}
