/**
 * Single source of truth for "can this account use the Engine?"
 *
 * An account is entitled when it's a Founders Program member (free for life)
 * OR it has a live subscription: active, or still inside its trial window.
 * Used by middleware (the access gate) and the billing UI.
 */

export type BillingFields = {
  is_founder?: boolean | null
  subscription_status?: string | null // none | trialing | active | past_due | canceled
  trial_ends_at?: string | null
}

export function isEntitled(c: BillingFields | null | undefined): boolean {
  if (!c) return false
  if (c.is_founder) return true

  switch (c.subscription_status) {
    case 'active':
      return true
    case 'trialing':
      // No end date recorded → treat as active trial; otherwise must not be past.
      if (!c.trial_ends_at) return true
      return new Date(c.trial_ends_at).getTime() > Date.now()
    default:
      return false
  }
}

/** Whole days left in the trial (0 if none / expired). For the billing UI. */
export function trialDaysLeft(c: BillingFields | null | undefined): number {
  if (!c || c.subscription_status !== 'trialing' || !c.trial_ends_at) return 0
  const ms = new Date(c.trial_ends_at).getTime() - Date.now()
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000))
}
