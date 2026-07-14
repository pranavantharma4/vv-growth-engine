import Stripe from 'stripe'

/**
 * Lazily-constructed Stripe client. Instantiating at module load would throw
 * during build if STRIPE_SECRET_KEY isn't present in that environment, so we
 * only construct on first use inside a request handler.
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key) // use the account's default API version
  }
  return _stripe
}

/** The single $149/mo plan's Stripe Price ID. */
export function priceId(): string {
  const id = process.env.STRIPE_PRICE_ID
  if (!id) throw new Error('STRIPE_PRICE_ID is not set')
  return id
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vngrdvisuals.com'

/** Map a Stripe subscription status to our clients.subscription_status enum. */
export function mapStripeStatus(s: string): string {
  switch (s) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'none' // incomplete, paused, etc.
  }
}
