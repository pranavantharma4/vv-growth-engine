'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [resetSent, setResetSent] = useState(false)

  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"
  const gold  = '#c9a84c'
  const ink   = 'rgba(250,248,245,0.92)'
  const ink2  = 'rgba(250,248,245,0.55)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const rule  = 'rgba(250,248,245,0.08)'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    sessionStorage.setItem('vv_just_logged_in', '1')
    router.push('/dashboard')
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Enter your email address.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setResetSent(true)
    setLoading(false)
  }

  const fi: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${rule}`,
    borderRadius: 4,
    color: ink,
    fontFamily: sans,
    fontSize: 14,
    outline: 'none',
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

          {mode === 'login' ? (
            <>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Account</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: ink, marginBottom: 24 }}>Sign in to your portal</div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
                  <input
                    style={fi}
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Password</div>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError('') }}
                      style={{ fontFamily: mono, fontSize: 7, color: gold, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '1px', textDecoration: 'underline', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    style={fi}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div style={{ fontFamily: mono, fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '10px 12px', marginBottom: 16, letterSpacing: '0.5px' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '13px', fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#050509', background: loading ? 'rgba(201,168,76,0.5)' : gold, border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Signing in...' : 'Enter Portal →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px' }}>
                New to VV? <a href="/signup" style={{ color: gold, textDecoration: 'underline' }}>Start a free trial</a>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Account</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: ink, marginBottom: 8 }}>Reset your password</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px', lineHeight: 1.7, marginBottom: 24 }}>
                Enter your email and we'll send you a link to set a new password.
              </div>

              {resetSent ? (
                <div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '14px 16px', marginBottom: 20, letterSpacing: '0.5px', lineHeight: 1.7 }}>
                    ✓ Reset link sent to {email}. Check your inbox and spam folder.
                  </div>
                  <button
                    onClick={() => { setMode('login'); setResetSent(false); setError('') }}
                    style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: `1px solid ${rule}`, borderRadius: 4, padding: '10px 18px', cursor: 'pointer', letterSpacing: '1px' }}
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
                    <input
                      style={fi}
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <div style={{ fontFamily: mono, fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '10px 12px', marginBottom: 16, letterSpacing: '0.5px' }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError('') }}
                      style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: `1px solid ${rule}`, borderRadius: 4, padding: '12px 18px', cursor: 'pointer', letterSpacing: '1px' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ flex: 1, padding: '12px', fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#050509', background: loading ? 'rgba(201,168,76,0.5)' : gold, border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link →'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontFamily: mono, fontSize: 7, color: 'rgba(250,248,245,0.15)', letterSpacing: '1.5px' }}>
          VANGUARD VISUALS · CONFIDENTIAL CLIENT PORTAL
        </div>
      </div>
    </div>
  )
}