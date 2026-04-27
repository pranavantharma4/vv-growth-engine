'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    // Supabase puts the token in the hash — we need to let the client pick it up
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setReady(true)
    } else {
      setMessage('Invalid or expired reset link.')
    }
  }, [])

  async function handleReset() {
    if (!password || password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.')
      return
    }
    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Password updated. Redirecting...')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  const SERIF = "'Cormorant Garamond',serif"
  const MONO = "'DM Mono',monospace"
  const SANS = "'DM Sans',sans-serif"
  const INK = 'rgba(245,243,239,0.95)'
  const I2 = 'rgba(245,243,239,0.55)'
  const I3 = 'rgba(245,243,239,0.28)'
  const I4 = 'rgba(245,243,239,0.11)'
  const G = '#c9a84c'

  return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:${I4};}
        input:focus{outline:none;border-color:rgba(201,168,76,0.4)!important;}
      `}</style>

      <div style={{ background: '#0c0b0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '44px', maxWidth: 420, width: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, fontStyle: 'italic', letterSpacing: 2, color: INK }}>VV</span>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vanguard Visuals</div>
            <div style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase' }}>Growth Ad Engine</div>
          </div>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Account</div>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: INK, marginBottom: 28 }}>Set new password</div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontFamily: SERIF, fontSize: 44, color: G, lineHeight: 1, marginBottom: 14 }}>✓</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(201,168,76,0.6)', letterSpacing: 1 }}>Password updated. Redirecting to dashboard...</div>
          </div>
        ) : ready ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>New Password</div>
              <input type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: INK, fontFamily: SANS, fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Confirm Password</div>
              <input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: INK, fontFamily: SANS, fontSize: 13 }} />
            </div>
            {message && (
              <div style={{ fontFamily: MONO, fontSize: 8, color: status === 'error' ? 'rgba(248,113,113,0.7)' : I3, letterSpacing: 0.5 }}>{message}</div>
            )}
            <button onClick={handleReset} disabled={status === 'loading'}
              style={{ marginTop: 8, padding: '13px', borderRadius: 3, fontSize: 10, background: G, color: '#050509', border: 'none', cursor: 'pointer', fontFamily: MONO, fontWeight: 600, letterSpacing: '1.5px', opacity: status === 'loading' ? 0.6 : 1 }}>
              {status === 'loading' ? 'Updating...' : 'Set Password →'}
            </button>
          </div>
        ) : (
          <div style={{ fontFamily: MONO, fontSize: 9, color: message ? 'rgba(248,113,113,0.7)' : I3, letterSpacing: 0.5 }}>
            {message || 'Verifying reset link...'}
          </div>
        )}
      </div>
    </div>
  )
}