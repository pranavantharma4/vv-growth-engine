import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe, SITE_URL } from '@/lib/stripe'
import { adminDb, getPrimaryClientId } from '@/lib/account'

export const dynamic = 'force-dynamic'

// POST /api/stripe/portal — opens the Stripe billing portal so the customer can
// update their card, change or cancel the plan, and see invoices. Returns { url }.
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await getPrimaryClientId(user.id)
  if (!clientId) return NextResponse.json({ error: 'No account found' }, { status: 400 })

  const db = adminDb()
  const { data: client } = await db
    .from('clients')
    .select('stripe_customer_id')
    .eq('id', clientId)
    .single()

  if (!client?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account yet. Start a subscription first.' }, { status: 400 })
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: client.stripe_customer_id,
    return_url: `${SITE_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
