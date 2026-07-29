import type { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LandingClient from './LandingClient'

// Session check reads cookies, so the route is dynamic regardless.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'VV — Know which Meta campaigns make money, and which quietly waste it',
  description:
    'VV connects to your Meta ad account read-only and tells you which campaigns make money, which waste it, and what to fix first. Free 60-second audit.',
  openGraph: {
    title: 'VV — Know what your money is doing.',
    description:
      'VV connects to your Meta ad account read-only and tells you which campaigns make money, which waste it, and what to fix first.',
    url: '/',
    siteName: 'Vanguard Visuals',
    type: 'website',
  },
}

export default async function Root() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/dashboard')

  return <LandingClient />
}
