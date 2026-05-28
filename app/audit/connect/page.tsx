'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'
const META_APP_ID = '4462090677412633'

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"
const GOLD = '#c9a84c'
const INK = 'rgba(250,248,245,0.92)'
const INK2 = 'rgba(250,248,245,0.6)'
const INK3 = 'rgba(250,248,245,0.32)'
const RULE = 'rgba(250,248,245,0.08)'

type Stage = 'form' | 'connect'

export default function VisionDropConnect() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Surface OAuth callback errors that come back via ?error=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthErr = params.get('error')
    if (oauthErr) {
      setErr(decodeURIComponent(oauthErr))
      // Stay on the connect stage if user already submitted the form earlier
      const remembered = sessionStorage.getItem('vd_lead')
      if (remembered) {
        try {
          const p = JSON.parse(remembered)
          setName(p.name || '')
          setEmail(p.email || '')
          setStage('connect')
        } catch {}
      }
      window.history.replaceState({}, '', '/audit/connect')
    }
  }, [])

  // Listen for the popup → parent postMessage on successful OAuth
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'VISION_DROP_META_CONNECTED') {
        setConnected(true)
        // Tiny pause so the green confirm has a beat before the redirect kicks in
        setTimeout(() => router.push('/audit/analyzing'), 600)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router])

  async function saveLead(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!name.trim()) return setErr('Your first name is required')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address')
    setSaving(true)
    try {
      const res = await fetch('/api/vision-drop/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not save')
      sessionStorage.setItem('vd_lead', JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }))
      setStage('connect')
    } catch (e: any) {
      setErr(e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function connectMeta() {
    setErr(null)
    const leadEmail = email.trim().toLowerCase()
    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`
    const scope = 'ads_read,ads_management,business_management'
    const returnUrl = `${window.location.origin}/auth/vision-drop-success`
    const state = encodeURIComponent(
      JSON.stringify({ source: 'vision_drop', lead_email: leadEmail, return_url: returnUrl }),
    )
    const oauthUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&response_type=code`
    const popup = window.open(oauthUrl, 'VisionDropMeta', 'width=600,height=720,scrollbars=yes')
    if (!popup) {
      setErr('Popup blocked — please allow popups for this site and try again')
    }
  }

  return (
    <main style={{ fontFamily: SANS, color: INK, minHeight: '100vh' }}>
      <header style={{ padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${RULE}` }}>
        <a href="/audit" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: INK, letterSpacing: 2 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Ad Vision Drop</span>
        </a>
        <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {stage === 'form' ? 'Step 1 of 2 — Your details' : 'Step 2 of 2 — Connect Meta'}
        </div>
      </header>

      <section style={{ maxWidth: 520, margin: '0 auto', padding: '72px 32px 100px' }}>
        {stage === 'form' && (
          <form onSubmit={saveLead}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>
              ◎ Free · No credit card
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 300, lineHeight: 1.1, color: INK, margin: '0 0 18px', letterSpacing: '-0.5px' }}>
              Where should we send your <span style={{ fontStyle: 'italic', color: GOLD }}>Vision Drop?</span>
            </h1>
            <p style={{ fontSize: 14, color: INK2, lineHeight: 1.75, marginBottom: 36 }}>
              Two quick details so we can email you the saved report after your audit. We don't sell or share your info — ever.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 }}>
              <Field label="First name" value={name} onChange={setName} placeholder="What should we call you?" autoComplete="given-name" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@brand.com" type="email" autoComplete="email" />
            </div>

            {err && <ErrorBanner message={err} />}

            <button
              type="submit"
              disabled={saving}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: '#050509',
                background: GOLD,
                border: 'none',
                padding: '15px 32px',
                borderRadius: 4,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                width: '100%',
              }}
            >
              {saving ? 'Saving…' : 'Continue → Connect Meta'}
            </button>
          </form>
        )}

        {stage === 'connect' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>
              ◉ Final step
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 300, lineHeight: 1.1, color: INK, margin: '0 0 18px', letterSpacing: '-0.5px' }}>
              Connect your <span style={{ fontStyle: 'italic', color: GOLD }}>Meta Ads</span> account.
            </h1>
            <p style={{ fontSize: 14, color: INK2, lineHeight: 1.75, marginBottom: 32 }}>
              You'll authorize <strong style={{ color: INK }}>read-only</strong> access. VAI will pull the last 30 days of campaign data, generate your audit, and disconnect when you're done — we never run ads on your behalf.
            </p>

            {/* Connect card */}
            <div style={{ border: `1px solid ${connected ? 'rgba(74,222,128,0.3)' : RULE}`, background: connected ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.025)', borderRadius: 6, padding: '22px 24px', marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>f</div>
                  <div>
                    <div style={{ fontFamily: SANS, fontSize: 14, color: INK, fontWeight: 500 }}>Meta Ads — read-only OAuth</div>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '1px', marginTop: 3 }}>Facebook + Instagram · revoke anytime</div>
                  </div>
                </div>
                {connected ? (
                  <span style={{ fontFamily: MONO, fontSize: 9, color: '#4ade80', background: 'rgba(74,222,128,0.09)', border: '1px solid rgba(74,222,128,0.25)', padding: '5px 12px', borderRadius: 3, letterSpacing: '1.5px' }}>✓ CONNECTED</span>
                ) : (
                  <button onClick={connectMeta} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: '#fff', background: '#1877f2', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer' }}>
                    Connect →
                  </button>
                )}
              </div>
            </div>

            {connected && (
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#4ade80', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center', marginBottom: 18 }}>
                ✓ Connected — pulling your data…
              </div>
            )}

            {err && <ErrorBanner message={err} />}

            <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '0.5px', lineHeight: 1.7, marginTop: 22, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: `1px solid ${RULE}` }}>
              ⓘ A Meta popup will open in a new window. Approve the read-only permissions and the window will close itself — we'll take you to your analysis automatically.
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          padding: '13px 15px',
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${RULE}`,
          borderRadius: 4,
          color: INK,
          fontFamily: SANS,
          fontSize: 14,
          outline: 'none',
        }}
      />
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: 4, padding: '12px 14px', marginBottom: 20, fontFamily: MONO, fontSize: 10, color: '#fca5a5', letterSpacing: '0.5px' }}>
      ✕ {message}
    </div>
  )
}
