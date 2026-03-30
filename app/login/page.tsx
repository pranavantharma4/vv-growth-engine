'use client'
export const dynamic = "force-dynamic"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Invalid email or password.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '11px 14px', marginBottom: 14,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#faf8f5', fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f0e0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, padding: '48px 44px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 600, fontStyle: 'italic', color: '#faf8f5', letterSpacing: 3, lineHeight: 1, marginBottom: 6 }}>VV</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(250,248,245,0.3)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>Vanguard Visuals · Growth Ad Engine</div>
        <form onSubmit={submit}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>Email Address</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={field} />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>Password</div>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required style={field} />
          <div style={{ minHeight: 18, marginBottom: 6, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#c94c4c', textAlign: 'center' }}>{err}</div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, background: loading ? '#5a4010' : '#8b6914', border: 'none', borderRadius: 6, color: '#faf8f5', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.12)', textAlign: 'center', marginTop: 32, letterSpacing: 1 }}>Vanguard Visuals · Confidential Client Portal</div>
      </div>
    </div>
  )
}
