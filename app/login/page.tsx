'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setLoading(false)
      setError('Invalid email or password.')
      return
    }
    // Set flag so dashboard layout plays the portal intro once
    sessionStorage.setItem('vv_just_logged_in', '1')
    setSigningIn(true)
    setTimeout(() => router.push('/dashboard'), 120)
  }

  if (!mounted) return null

  const G = '#c9a84c'
  const INK = 'rgba(245,243,239,0.95)'
  const I3 = 'rgba(245,243,239,0.28)'
  const I4 = 'rgba(245,243,239,0.11)'
  const MONO = "'DM Mono',monospace"
  const SERIF = "'Cormorant Garamond',serif"
  const SANS = "'DM Sans',sans-serif"

  return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; }

        @keyframes noiseShift { 0%{background-position:0 0} 100%{background-position:200px 200px} }
        @keyframes scanMove { 0%{top:0} 100%{top:100vh} }
        @keyframes formIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes formOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.01)} }

        .noise {
          position: fixed; inset: 0; opacity: 0.025; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23f)'/%3E%3C/svg%3E");
          background-size: 200px; animation: noiseShift 8s steps(4) infinite;
        }
        .scanline {
          position: fixed; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.06), transparent);
          pointer-events: none; z-index: 1; animation: scanMove 18s linear infinite;
        }
        .atm-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(255,255,255,0.011) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.011) 1px, transparent 1px);
          background-size: 84px 84px;
        }
        .form-wrap { animation: formIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .form-exit  { animation: formOut 0.2s ease both; pointer-events: none; }

        input::placeholder { color: ${I4}; }
        input:focus { outline: none; border-color: rgba(201,168,76,0.4) !important; }
        input { transition: border-color 0.2s ease; }
        .btn-submit { transition: background 0.18s ease, opacity 0.15s ease, transform 0.1s ease; }
        .btn-submit:hover:not(:disabled) { background: #b8972a !important; }
        .btn-submit:active:not(:disabled) { transform: scale(0.98); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div className="noise" />
      <div className="scanline" />
      <div className="atm-grid" />
      <div style={{ position: 'fixed', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '80vh', background: 'radial-gradient(ellipse,rgba(80,82,200,0.055) 0%,transparent 72%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className={`form-wrap${signingIn ? ' form-exit' : ''}`} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: '0 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 300, fontStyle: 'italic', color: INK, letterSpacing: '2px', lineHeight: 1, marginBottom: 10 }}>VV</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3.5px', textTransform: 'uppercase', marginBottom: 5 }}>Vanguard Visuals</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ height: 1, width: 20, background: 'rgba(201,168,76,0.2)' }} />
            <div style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Growth Ad Engine · v1.1</div>
            <div style={{ height: 1, width: 20, background: 'rgba(201,168,76,0.2)' }} />
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '30px 26px' }}>
          <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,168,76,0.45)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>Secured Access</div>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 300, color: INK, marginBottom: 22 }}>Sign in</div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Email Address</div>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                style={{ width: '100%', padding: '10px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: INK, fontFamily: SANS, fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Password</div>
              <input type="password" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                style={{ width: '100%', padding: '10px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: INK, fontFamily: SANS, fontSize: 13 }} />
            </div>

            {error && (
              <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(248,113,113,0.7)', letterSpacing: '0.5px', padding: '8px 11px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)', borderRadius: 3 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || signingIn} className="btn-submit"
              style={{ marginTop: 4, padding: '12px', borderRadius: 4, fontSize: 10, background: G, color: '#050509', border: 'none', cursor: loading || signingIn ? 'not-allowed' : 'pointer', fontFamily: MONO, fontWeight: 600, letterSpacing: '1.5px', opacity: loading || signingIn ? 0.7 : 1 }}>
              {signingIn ? 'Entering...' : loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px' }}>
          Vanguard Visuals · Confidential Client Portal
        </div>
      </div>
    </div>
  )
}