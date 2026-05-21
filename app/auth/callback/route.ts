import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Honor ?next= but only for safe, same-origin relative paths
  let next = requestUrl.searchParams.get('next') || '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) next = '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Land them on the dashboard — middleware routes incomplete clients
  // into /dashboard/onboarding automatically.
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
