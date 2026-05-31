'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Item = {
  id: string
  platform: 'x' | 'linkedin' | 'instagram' | string
  content: string
  angle: string | null
  created_at: string
  used: boolean
}

const ANGLES = ['proof', 'education', 'behind-the-scenes', 'provocative', 'contrarian']
function todaysAngle(): string {
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), 0, 0)
  const doy = Math.floor((Date.now() - start) / 86_400_000)
  return ANGLES[doy % ANGLES.length]
}

const PLATFORMS: { key: string; label: string; note: string }[] = [
  { key: 'x', label: 'X', note: '15 posts · under 280 chars' },
  { key: 'linkedin', label: 'LinkedIn', note: '5 story-driven posts' },
  { key: 'instagram', label: 'Instagram', note: '3 captions · pair with an image' },
]

export default function SignalPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authState, setAuthState] = useState<'checking' | 'denied' | 'ok'>('checking')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [angle, setAngle] = useState<string>(todaysAngle())

  // ── admin gate (defense in depth; the API routes enforce it server-side) ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: admins } = await supabase.from('client_users').select('*').eq('role', 'admin')
      const email = (user.email || '').toLowerCase()
      const isAdmin = (admins || []).some((r: any) =>
        r.user_id === user.id || r.auth_user_id === user.id || r.auth_id === user.id ||
        r.id === user.id || (r.email && String(r.email).toLowerCase() === email))
      if (cancelled) return
      if (!isAdmin) { setAuthState('denied'); router.replace('/dashboard'); return }
      setAuthState('ok')
    })()
    return () => { cancelled = true }
  }, [supabase, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/signal/list', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setItems(data.items || [])
    } catch (_) { /* noop */ }
  }, [])

  useEffect(() => { if (authState === 'ok') load() }, [authState, load])

  const generate = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/signal/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      if (data.angle) setAngle(data.angle)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleUsed = async (it: Item) => {
    const next = !it.used
    setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, used: next } : x)))
    try {
      await fetch('/api/signal/mark-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: it.id, used: next }),
      })
    } catch (_) {
      setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, used: it.used } : x)))
    }
  }

  if (authState !== 'ok') {
    return (
      <div style={{ padding: 48, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, color: 'var(--ink3)' }}>
        {authState === 'denied' ? 'Admin only — redirecting…' : 'Checking access…'}
      </div>
    )
  }

  const total = items.length

  return (
    <div className="sig">
      <style>{CSS}</style>

      <header className="sig-head">
        <div>
          <p className="eyebrow">VV SIGNAL · INTERNAL</p>
          <h1 className="title">Content engine.</h1>
          <p className="sub">VV&rsquo;s daily marketing content, generated in our voice. {total > 0 ? `${total} pieces on file.` : 'Nothing generated yet.'}</p>
        </div>
        <div className="head-right">
          <div className="angle-chip">ANGLE OF THE DAY · <span>{angle}</span></div>
          <button className="gen-btn" onClick={generate} disabled={loading}>
            {loading ? 'GENERATING…' : "GENERATE TODAY'S CONTENT →"}
          </button>
        </div>
      </header>

      {error && <div className="err">{error}</div>}

      {PLATFORMS.map((p) => {
        const list = items.filter((i) => i.platform === p.key)
        return (
          <section className="block" key={p.key}>
            <div className="block-head">
              <h2 className="block-title">{p.label}</h2>
              <span className="block-note">{p.note} · {list.length} on file</span>
            </div>
            {list.length === 0 ? (
              <p className="empty">No {p.label} content yet — hit Generate.</p>
            ) : (
              <div className="grid">
                {list.map((it) => (
                  <Card key={it.id} it={it} onToggle={() => toggleUsed(it)} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Card({ it, onToggle }: { it: Item; onToggle: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(it.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch (_) { /* noop */ }
  }
  const d = new Date(it.created_at)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className={`card${it.used ? ' used' : ''}`}>
      <div className="card-body">{it.content}</div>
      <div className="card-foot">
        <span className="card-meta">{it.content.length} ch · {it.angle || '—'} · {date}</span>
        <div className="card-actions">
          <button className="act" onClick={copy}>{copied ? 'COPIED ✓' : 'COPY'}</button>
          <button className={`act used-btn${it.used ? ' on' : ''}`} onClick={onToggle}>
            {it.used ? 'POSTED ✓' : 'MARK POSTED'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CSS = `
.sig{padding:36px 40px 80px;max-width:1180px;}
.sig *{box-sizing:border-box;}
.sig .eyebrow{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:3px;color:var(--gold);margin:0 0 10px;}
.sig .title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:40px;color:var(--ink);margin:0 0 8px;line-height:1;}
.sig .sub{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink2);margin:0;max-width:520px;line-height:1.6;}
.sig .sig-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:36px;}
.sig .head-right{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.sig .angle-chip{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--ink3);text-transform:uppercase;}
.sig .angle-chip span{color:var(--gold);}
.sig .gen-btn{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;color:#050509;background:var(--gold);border:none;padding:13px 22px;border-radius:5px;cursor:pointer;transition:transform .15s,opacity .15s;white-space:nowrap;}
.sig .gen-btn:hover{transform:translateY(-1px);}
.sig .gen-btn:disabled{opacity:.5;cursor:default;transform:none;}
.sig .err{font-family:'DM Mono',monospace;font-size:11px;color:var(--red);background:var(--redpaper,rgba(248,113,113,.08));border:1px solid var(--redborder,rgba(248,113,113,.25));border-radius:6px;padding:12px 14px;margin-bottom:24px;}
.sig .block{margin-bottom:40px;}
.sig .block-head{display:flex;align-items:baseline;gap:12px;border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:18px;}
.sig .block-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:26px;color:var(--ink);margin:0;}
.sig .block-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}
.sig .empty{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink3);margin:0;}
.sig .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
.sig .card{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:10px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;transition:border-color .15s;}
.sig .card:hover{border-color:var(--goldborder,rgba(201,168,76,.25));}
.sig .card.used{opacity:.55;}
.sig .card-body{font-family:'DM Sans',sans-serif;font-size:13.5px;line-height:1.65;color:var(--ink);white-space:pre-wrap;}
.sig .card-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
.sig .card-meta{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;color:var(--ink3);text-transform:uppercase;}
.sig .card-actions{display:flex;gap:6px;}
.sig .act{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--ink2);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.1));border-radius:4px;padding:6px 9px;cursor:pointer;transition:all .15s;text-transform:uppercase;}
.sig .act:hover{color:var(--ink);border-color:var(--goldborder,rgba(201,168,76,.4));}
.sig .used-btn.on{color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.4));}
@media (max-width:640px){
  .sig{padding:24px 18px 60px;}
  .sig .sig-head{flex-direction:column;}
  .sig .head-right{align-items:flex-start;}
  .sig .grid{grid-template-columns:1fr;}
}
`
