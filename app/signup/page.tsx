'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

/**
 * Self-serve signup (email + password). On success we provision the account
 * (clients + client_users, 7-day trial) and drop the user into onboarding.
 * If the Supabase project requires email confirmation, signUp returns no
 * session — we show a "check your email" state and provisioning happens in
 * /auth/callback when they confirm.
 */
export default function SignupPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  // Founders intent from the homepage selection flow (/signup?plan=founders).
  // Read client-side from the URL (not useSearchParams) to avoid Next's static
  // prerender bailout that requires a Suspense boundary at build time.
  // ROUTE-ONLY for now: we surface founders framing and record the intent, but
  // the actual seat claim (insert founders_seats, set is_founder, skip billing)
  // is a deliberate follow-up pending sign-off — a normal 7-day trial is created.
  const [isFounders, setIsFounders] = useState(false)
  useEffect(() => {
    setIsFounders(new URLSearchParams(window.location.search).get('plan') === 'founders')
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"
  const gold  = '#c9a84c'
  const ink   = 'rgba(250,248,245,0.92)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const rule  = 'rgba(250,248,245,0.08)'

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Enter your email and password.'); return }
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return }
    setLoading(true)
    setError('')

    // Record founders intent for the follow-up seat-claim wiring / analytics.
    if (isFounders) { try { sessionStorage.setItem('vv_plan_intent', 'founders') } catch {} }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || null },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) { setError(err.message); setLoading(false); return }

    // Confirmation off → session exists now. Provision, then onboard.
    if (data.session) {
      try {
        const r = await fetch('/api/account/provision', { method: 'POST' })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          setError(j.error || 'Could not set up your account. Please try again.')
          setLoading(false)
          return
        }
      } catch {
        setError('Could not set up your account. Please try again.')
        setLoading(false)
        return
      }
      sessionStorage.setItem('vv_just_logged_in', '1')
      router.push('/dashboard/onboarding')
      return
    }

    // Confirmation on → no session yet; account is provisioned on callback.
    setConfirmSent(true)
    setLoading(false)
  }

  const fi: React.CSSProperties = {
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${rule}`, borderRadius: 4, color: ink,
    fontFamily: sans, fontSize: 14, outline: 'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px',
    textTransform: 'uppercase', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        input::placeholder { color: rgba(250,248,245,0.22); }
        input:focus { border-color: rgba(201,168,76,0.4) !important; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, fontStyle: 'italic', color: ink, letterSpacing: 2, lineHeight: 1, marginBottom: 8 }}>VV</div>
          <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 2 }}>Vanguard Visuals</div>
          <div style={{ fontFamily: mono, fontSize: 7, color: 'rgba(250,248,245,0.18)', letterSpacing: '2px', textTransform: 'uppercase' }}>Growth Ad Engine</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 8, padding: '32px 36px' }}>
          {confirmSent ? (
            <>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Account</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: ink, marginBottom: 8 }}>Confirm your email</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '14px 16px', margin: '16px 0', letterSpacing: '0.5px', lineHeight: 1.7 }}>
                ✓ We sent a confirmation link to {email}. Click it to activate your 7-day trial and start connecting Meta.
              </div>
              <a href="/login" style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: '1px', textDecoration: 'underline' }}>← Back to sign in</a>
            </>
          ) : (
            <>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>{isFounders ? 'Founders Program' : 'Get started'}</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: ink, marginBottom: 6 }}>Create your account</div>
              {isFounders && (
                <div style={{ fontFamily: mono, fontSize: 8, color: gold, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 4, padding: '10px 12px', marginBottom: 14, letterSpacing: '0.5px', lineHeight: 1.7 }}>
                  ★ Claiming a founding seat — the full $149/mo engine, free for life. Create your account to get started.
                </div>
              )}
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px', lineHeight: 1.7, marginBottom: 24 }}>
                7 days free. No card required. Read-only — nothing changes in your ad account.
              </div>

              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: 14 }}>
                  <div style={lbl}>Name or brand</div>
                  <input style={fi} type="text" placeholder="Acme Skincare" value={name} onChange={e => setName(e.target.value)} autoComplete="organization" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={lbl}>Email</div>
                  <input style={fi} type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={lbl}>Password</div>
                  <input style={fi} type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                </div>

                {error && (
                  <div style={{ fontFamily: mono, fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '10px 12px', marginBottom: 16, letterSpacing: '0.5px' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#050509', background: loading ? 'rgba(201,168,76,0.5)' : gold, border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Creating account...' : 'Start Free Trial →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px' }}>
                Already have an account? <a href="/login" style={{ color: gold, textDecoration: 'underline' }}>Sign in</a>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontFamily: mono, fontSize: 7, color: 'rgba(250,248,245,0.15)', letterSpacing: '1.5px' }}>
          VANGUARD VISUALS · GROWTH AD ENGINE
        </div>
      </div>
    </div>
  )
}
