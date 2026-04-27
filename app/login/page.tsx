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
  const [introPhase, setIntroPhase] = useState(0)
  const [introDone, setIntroDone] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timers: ReturnType<typeof setTimeout>[] = []
    const seen = sessionStorage.getItem('vv_portal_intro')
    if (seen) {
      setIntroPhase(5)
      setIntroDone(true)
    } else {
      sessionStorage.setItem('vv_portal_intro', '1')
      timers.push(setTimeout(() => setIntroPhase(1), 80))    // symbols in
      timers.push(setTimeout(() => setIntroPhase(2), 480))   // symbols out, VV in
      timers.push(setTimeout(() => setIntroPhase(3), 880))   // version tag in
      timers.push(setTimeout(() => setIntroPhase(4), 1080))  // fade out
      timers.push(setTimeout(() => { setIntroPhase(5); setIntroDone(true) }, 1480))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

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
    setSigningIn(true)
    setTimeout(() => router.push('/dashboard'), 700)
  }

  if (!mounted) return null

  const G = '#c9a84c'
  const INK = 'rgba(245,243,239,0.95)'
  const I2 = 'rgba(245,243,239,0.55)'
  const I3 = 'rgba(245,243,239,0.28)'
  const I4 = 'rgba(245,243,239,0.11)'
  const MONO = "'DM Mono',monospace"
  const SERIF = "'Cormorant Garamond',serif"
  const SANS = "'DM Sans',sans-serif"

  const symVisible = introPhase === 1
  const vvVisible  = introPhase >= 2 && introPhase <= 4
  const tagVisible = introPhase >= 3
  const overlayOn  = introPhase < 4

  return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; }

        @keyframes noiseShift { 0%{background-position:0 0} 100%{background-position:200px 200px} }
        @keyframes scanMove  { 0%{top:0} 100%{top:100vh} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.15} }

        @keyframes formIn {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes formOut {
          0%   { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(1.012) translateY(-6px); }
        }

        .form-wrap { animation: formIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .form-exit  { animation: formOut 0.65s cubic-bezier(0.4,0,1,1) both; pointer-events: none; }

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
          background-image: linear-gradient(rgba(255,255,255,0.011) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.011) 1px, transparent 1px);
          background-size: 84px 84px;
        }

        input::placeholder { color: ${I4}; }
        input:focus { outline: none; border-color: rgba(201,168,76,0.4) !important; }
        input { transition: border-color 0.2s ease; }

        .btn-submit { transition: background 0.18s ease, opacity 0.15s ease, transform 0.1s ease; }
        .btn-submit:hover:not(:disabled) { background: #b8972a !important; }
        .btn-submit:active:not(:disabled) { transform: scale(0.98); }

        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Atmosphere */}
      <div className="noise" />
      <div className="scanline" />
      <div className="atm-grid" />
      <div style={{ position: 'fixed', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '80vh', background: 'radial-gradient(ellipse,rgba(80,82,200,0.055) 0%,transparent 72%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ─── PORTAL INTRO ─── */}
      {!introDone && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#020203',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: overlayOn ? 1 : 0,
          transition: introPhase >= 4 ? 'opacity 0.4s cubic-bezier(0.4,0,1,1)' : 'none',
          pointerEvents: introPhase >= 4 ? 'none' : 'all',
          overflow: 'hidden',
        }}>
          {/* Grain */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23f)'/%3E%3C/svg%3E\")", backgroundSize: '200px', pointerEvents: 'none' }} />

          {/* Ambient glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '50vw', height: '35vh', background: 'radial-gradient(ellipse,rgba(201,168,76,0.04) 0%,transparent 72%)', opacity: vvVisible ? 1 : 0, transition: 'opacity 2s ease', pointerEvents: 'none' }} />

          {/* Top rule */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) translateY(-72px)', height: '1px', width: introPhase >= 1 ? '240px' : '0', background: `linear-gradient(to right,transparent,${G},transparent)`, transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)', opacity: 0.28 }} />

          {/* Bottom rule */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) translateY(76px)', height: '1px', width: introPhase >= 1 ? '240px' : '0', background: `linear-gradient(to right,transparent,${G},transparent)`, transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1) 0.15s', opacity: 0.28 }} />

          {/* Symbols ↑ · ↓ */}
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 24, opacity: symVisible ? 1 : 0, transition: symVisible ? 'opacity 0.2s ease' : 'opacity 0.12s ease' }}>
            {[
              { s: '↑', c: 'rgba(74,222,128,0.65)', d: '0ms' },
              { s: '·', c: 'rgba(245,243,239,0.14)', d: '55ms' },
              { s: '↓', c: 'rgba(248,113,113,0.65)', d: '110ms' },
            ].map((x, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: 12, color: x.c, opacity: symVisible ? 1 : 0, transform: symVisible ? 'none' : 'translateY(3px)', transition: `opacity 0.2s ease ${x.d}, transform 0.2s ease ${x.d}` }}>{x.s}</span>
            ))}
          </div>

          {/* VV + version */}
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontFamily: SERIF,
              fontSize: 'clamp(80px,17vw,148px)',
              fontWeight: 300, fontStyle: 'italic',
              color: INK, letterSpacing: '1px', lineHeight: 1,
              userSelect: 'none',
              opacity: vvVisible ? 1 : 0,
              transform: vvVisible ? 'none' : 'scale(0.97)',
              transition: vvVisible
                ? 'opacity 0.32s cubic-bezier(0.16,1,0.3,1), transform 0.38s cubic-bezier(0.16,1,0.3,1)'
                : 'opacity 0.18s ease, transform 0.18s ease',
            }}>VV</div>

            {/* Growth Ad Engine v1.1 — appears on hold */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: tagVisible ? 1 : 0,
              transform: tagVisible ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '4px', textTransform: 'uppercase' }}>Growth Ad Engine</div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '3px', textTransform: 'uppercase' }}>v1.1</div>
            </div>
          </div>

          {/* HUD corners */}
          <div style={{ position: 'absolute', top: 26, left: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase', opacity: vvVisible ? 0.55 : 0, transition: 'opacity 0.8s ease 0.3s' }}>vngrdvisuals.com</div>
          <div style={{ position: 'absolute', top: 26, right: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase', opacity: vvVisible ? 0.55 : 0, transition: 'opacity 0.8s ease 0.5s' }}>Intelligence Platform</div>
          <div style={{ position: 'absolute', bottom: 26, left: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px', opacity: tagVisible ? 0.45 : 0, transition: 'opacity 0.8s ease 0.2s' }}>Secured access</div>
          <div style={{ position: 'absolute', bottom: 26, right: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px', opacity: tagVisible ? 0.45 : 0, transition: 'opacity 0.8s ease 0.4s' }}>Est. 2026</div>
        </div>
      )}

      {/* ─── LOGIN FORM ─── */}
      <div className={`form-wrap${signingIn ? ' form-exit' : ''}`} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 300, fontStyle: 'italic', color: INK, letterSpacing: '2px', lineHeight: 1, marginBottom: 10 }}>VV</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3.5px', textTransform: 'uppercase', marginBottom: 5 }}>Vanguard Visuals</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ height: 1, width: 20, background: `rgba(201,168,76,0.2)` }} />
            <div style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Growth Ad Engine · v1.1</div>
            <div style={{ height: 1, width: 20, background: `rgba(201,168,76,0.2)` }} />
          </div>
        </div>

        {/* Card */}
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