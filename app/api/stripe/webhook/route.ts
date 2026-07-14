import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, mapStripeStatus } from '@/lib/stripe'
import { adminDb } from '@/lib/account'

export const dynamic = 'force-dynamic'

// POST /api/stripe/webhook — Stripe → us. Keeps clients.subscription_status,
// current_period_end and stripe_subscription_id in sync with Stripe. Verifies
// the signature against STRIPE_WEBHOOK_SECRET; must read the RAW body.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch (e: any) {
    console.error('stripe webhook signature failed:', e?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = adminDb()

  // Apply a subscription's state to the matching client (by customer id, with
  // client_id metadata as a fallback).
  async function applySubscription(sub: Stripe.Subscription) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const patch = {
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      subscription_status: mapStripeStatus(sub.status),
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    }
    const clientId = sub.metadata?.client_id
    if (clientId) {
      await db.from('clients').update(patch).eq('id', clientId)
    } else {
      await db.from('clients').update(patch).eq('stripe_customer_id', customerId)
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const sub = await getStripe().subscriptions.retrieve(subId)
          if (session.metadata?.client_id && !sub.metadata?.client_id) {
            sub.metadata = { ...sub.metadata, client_id: session.metadata.client_id }
          }
          await applySubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }
  } catch (e: any) {
    console.error('stripe webhook handler error:', e?.message)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
