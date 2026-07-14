'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isEntitled, trialDaysLeft } from '@/lib/entitlement'

type Billing = {
  subscription_status: string | null
  trial_ends_at: string | null
  is_founder: boolean | null
  current_period_end: string | null
  stripe_customer_id: string | null
  name: string | null
}

export default function BillingPage() {
  const supabase = createClientComponentClient()
  const [billing, setBilling] = useState<Billing | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState('')

  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"
  const gold  = '#c9a84c'
  const ink   = 'rgba(250,248,245,0.92)'
  const ink2  = 'rgba(250,248,245,0.55)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const rule  = 'rgba(250,248,245,0.08)'

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: links } = await supabase.from('client_users').select('client_id, role').eq('user_id', user.id)
      const link = links?.find(l => l.role === 'client' || l.role === 'owner') || links?.[0]
      if (!link) { setLoading(false); return }
      const { data: c } = await supabase
        .from('clients')
        .select('name, subscription_status, trial_ends_at, is_founder, current_period_end, stripe_customer_id')
        .eq('id', link.client_id)
        .single()
      setBilling(c as Billing)
      setLoading(false)
    })()
  }, [supabase])

  async function go(kind: 'checkout' | 'portal') {
    setBusy(kind); setError('')
    try {
      const r = await fetch(`/api/stripe/${kind}`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok || !j.url) { setError(j.error || 'Something went wrong.'); setBusy(null); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong.'); setBusy(null)
    }
  }

  const btn = (primary: boolean): React.CSSProperties => ({
    fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase',
    padding: '13px 26px', borderRadius: 4, cursor: 'pointer',
    color: primary ? '#050509' : ink2, background: primary ? gold : 'transparent',
    border: primary ? 'none' : `1px solid ${rule}`,
  })

  const days = trialDaysLeft(billing)
  const entitled = isEntitled(billing)
  const status = billing?.subscription_status ?? 'none'

  let headline = 'Your subscription'
  let sub = ''
  if (billing?.is_founder) { headline = 'Founders Program'; sub = 'Free for life. No billing — thank you for being early.' }
  else if (status === 'active') { headline = 'VV Growth Ad Engine'; sub = `$149/mo · renews ${billing?.current_period_end ? new Date(billing.current_period_end).toLocaleDateString() : '—'}` }
  else if (status === 'trialing' && days > 0) { headline = `${days} day${days === 1 ? '' : 's'} left in your trial`; sub = 'Add a card to keep the Engine running when your trial ends.' }
  else if (status === 'past_due') { headline = 'Payment needed'; sub = 'Your last payment failed. Update your card to restore access.' }
  else { headline = 'Your trial has ended'; sub = 'Subscribe to keep classifying campaigns and receiving reports.' }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px', fontFamily: sans }}>
      <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Billing</div>
      <div style={{ fontFamily: serif, fontSize: 30, color: ink, marginBottom: 6 }}>{loading ? '…' : headline}</div>
      <div style={{ fontFamily: sans, fontSize: 14, color: ink2, lineHeight: 1.7, marginBottom: 28 }}>{loading ? '' : sub}</div>

      {!loading && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 8, padding: '28px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: 22, color: ink }}>The Engine</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginTop: 4 }}>
                READ-ONLY META INTELLIGENCE · RECURRING REPORTS
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: serif, fontSize: 34, color: gold }}>$149</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: ink3 }}> /mo</span>
            </div>
          </div>

          <div style={{ height: 1, background: rule, margin: '4px 0 22px' }} />

          {error && (
            <div style={{ fontFamily: mono, fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '10px 12px', marginBottom: 16 }}>{error}</div>
          )}

          {billing?.is_founder ? (
            <div style={{ fontFamily: mono, fontSize: 10, color: '#4ade80', letterSpacing: '1px' }}>✓ FREE FOR LIFE — FOUNDERS SEAT</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {status === 'active' || status === 'past_due' || billing?.stripe_customer_id ? (
                <button style={btn(status !== 'active')} disabled={busy !== null} onClick={() => go('portal')}>
                  {busy === 'portal' ? 'Opening…' : 'Manage billing'}
                </button>
              ) : null}
              {status !== 'active' && (
                <button style={btn(true)} disabled={busy !== null} onClick={() => go('checkout')}>
                  {busy === 'checkout' ? 'Opening…' : status === 'trialing' && days > 0 ? 'Add card →' : 'Subscribe →'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !entitled && !billing?.is_founder && (
        <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px', marginTop: 20, lineHeight: 1.7 }}>
          Your dashboard is paused until you subscribe. Cancel anytime from the billing portal.
        </div>
      )}
    </div>
  )
}
