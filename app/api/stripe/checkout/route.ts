import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe, priceId, SITE_URL } from '@/lib/stripe'
import { adminDb, getPrimaryClientId } from '@/lib/account'

export const dynamic = 'force-dynamic'

// POST /api/stripe/checkout — starts a subscription checkout for the caller's
// account ($149/mo single plan). If the account is still inside its app trial,
// the Stripe subscription's trial_end is aligned to it so the card isn't
// charged until the trial they already have runs out. Returns { url }.
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await getPrimaryClientId(user.id)
  if (!clientId) return NextResponse.json({ error: 'No account found' }, { status: 400 })

  const db = adminDb()
  const { data: client } = await db
    .from('clients')
    .select('id, name, contact_email, stripe_customer_id, trial_ends_at, is_founder')
    .eq('id', clientId)
    .single()
  if (!client) return NextResponse.json({ error: 'No account found' }, { status: 400 })
  if (client.is_founder) {
    return NextResponse.json({ error: 'Founders accounts are free for life.' }, { status: 400 })
  }

  const stripe = getStripe()

  // Reuse or create the Stripe customer, tagged with our client_id.
  let customerId = client.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: client.contact_email ?? user.email ?? undefined,
      name: client.name ?? undefined,
      metadata: { client_id: clientId },
    })
    customerId = customer.id
    await db.from('clients').update({ stripe_customer_id: customerId }).eq('id', clientId)
  }

  // Don't charge until the existing app trial ends.
  const trialEnd = client.trial_ends_at ? Math.floor(new Date(client.trial_ends_at).getTime() / 1000) : null
  const nowSec = Math.floor(Date.now() / 1000)
  const subscriptionData =
    trialEnd && trialEnd > nowSec ? { trial_end: trialEnd } : undefined

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId(), quantity: 1 }],
    subscription_data: { ...subscriptionData, metadata: { client_id: clientId } },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/dashboard/billing?checkout=success`,
    cancel_url: `${SITE_URL}/dashboard/billing?checkout=cancelled`,
    metadata: { client_id: clientId },
  })

  return NextResponse.json({ url: session.url })
}
