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
  image_prompt?: string | null
}

const ANGLES = ['proof', 'education', 'behind-the-scenes', 'provocative', 'contrarian']
function todaysAngle(): string {
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), 0, 0)
  const doy = Math.floor((Date.now() - start) / 86_400_000)
  return ANGLES[doy % ANGLES.length]
}

const PLATFORMS: { key: string; label: string; note: string }[] = [
  { key: 'x', label: 'X', note: '15 posts · under 280 chars · 1-3 hashtags' },
  { key: 'linkedin', label: 'LinkedIn', note: '5 story-driven posts · 3-5 hashtags' },
  { key: 'instagram', label: 'Instagram', note: '3 captions · 8-12 hashtags · image prompt' },
]

function dayLabel(iso: string): string {
  const d = new Date((iso || '').slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SignalPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authState, setAuthState] = useState<'checking' | 'denied' | 'ok'>('checking')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [angle, setAngle] = useState<string>(todaysAngle())

  // ── admin gate (API routes also enforce it server-side) ──
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

  // Optional browser reminder while the tab is open.
  const remind = (unposted: number) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    Notification.requestPermission().then((p) => {
      if (p === 'granted') {
        new Notification('VV Signal — posting reminder', { body: `${unposted} piece${unposted === 1 ? '' : 's'} still to publish today.` })
      }
    })
  }

  if (authState !== 'ok') {
    return (
      <div style={{ padding: 48, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, color: 'var(--ink3)' }}>
        {authState === 'denied' ? 'Admin only — redirecting…' : 'Checking access…'}
      </div>
    )
  }

  // Group by day (newest first).
  const byDay: Record<string, Item[]> = {}
  for (const it of items) {
    const d = (it.created_at || '').slice(0, 10)
    ;(byDay[d] ||= []).push(it)
  }
  const days = Object.keys(byDay).filter(Boolean).sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="sig">
      <style>{CSS}</style>

      <header className="sig-head">
        <div>
          <p className="eyebrow">VV SIGNAL · INTERNAL</p>
          <h1 className="title">Content engine.</h1>
          <p className="sub">VV&rsquo;s daily marketing content, generated in our voice and organized by day.</p>
        </div>
        <div className="head-right">
          <div className="angle-chip">ANGLE OF THE DAY · <span>{angle}</span></div>
          <button className="gen-btn" onClick={generate} disabled={loading}>
            {loading ? 'GENERATING…' : "GENERATE TODAY'S CONTENT →"}
          </button>
        </div>
      </header>

      {error && <div className="err">{error}</div>}

      {days.length === 0 && <p className="empty">Nothing generated yet — hit Generate to create today&rsquo;s batch.</p>}

      {days.map((d) => {
        const dayItems = byDay[d]
        const total = dayItems.length
        const posted = dayItems.filter((i) => i.used).length
        const unposted = total - posted
        const pct = total > 0 ? Math.round((posted / total) * 100) : 0
        return (
          <section className="day" key={d}>
            <div className="day-head">
              <div className="day-left">
                <h2 className="day-title">{dayLabel(d)}</h2>
                <span className="day-count">{posted} of {total} posted</span>
              </div>
              <div className="day-right">
                <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                {unposted > 0 && <button className="remind-btn" onClick={() => remind(unposted)}>🔔 Remind</button>}
              </div>
            </div>

            {PLATFORMS.map((p) => {
              const list = dayItems.filter((i) => i.platform === p.key)
              if (!list.length) return null
              return (
                <div className="block" key={p.key}>
                  <div className="block-head">
                    <h3 className="block-title">{p.label}</h3>
                    <span className="block-note">{p.note} · {list.filter((i) => i.used).length}/{list.length} posted</span>
                  </div>
                  <div className="grid">
                    {list.map((it) => <Card key={it.id} it={it} onToggle={() => toggleUsed(it)} />)}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}

function Card({ it, onToggle }: { it: Item; onToggle: () => void }) {
  const [copied, setCopied] = useState(false)
  const [copiedImg, setCopiedImg] = useState(false)
  const copy = async (text: string, which: 'content' | 'img') => {
    try {
      await navigator.clipboard.writeText(text)
      if (which === 'content') { setCopied(true); setTimeout(() => setCopied(false), 1400) }
      else { setCopiedImg(true); setTimeout(() => setCopiedImg(false), 1400) }
    } catch (_) { /* noop */ }
  }
  return (
    <div className={`card${it.used ? ' used' : ''}`}>
      <div className="card-body">{it.content}</div>

      {it.platform === 'instagram' && it.image_prompt && (
        <div className="img-prompt">
          <div className="img-prompt-head">
            <span>IMAGE PROMPT — paste into Claude or an image tool</span>
            <button className="act" onClick={() => copy(it.image_prompt as string, 'img')}>{copiedImg ? 'COPIED ✓' : 'COPY'}</button>
          </div>
          <div className="img-prompt-body">{it.image_prompt}</div>
        </div>
      )}

      <div className="card-foot">
        <span className="card-meta">{it.content.length} ch · {it.angle || '—'}</span>
        <div className="card-actions">
          <button className="act" onClick={() => copy(it.content, 'content')}>{copied ? 'COPIED ✓' : 'COPY'}</button>
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
.sig .sig-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:32px;}
.sig .head-right{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.sig .angle-chip{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--ink3);text-transform:uppercase;}
.sig .angle-chip span{color:var(--gold);}
.sig .gen-btn{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;color:#050509;background:var(--gold);border:none;padding:13px 22px;border-radius:5px;cursor:pointer;transition:transform .15s,opacity .15s;white-space:nowrap;}
.sig .gen-btn:hover{transform:translateY(-1px);}
.sig .gen-btn:disabled{opacity:.5;cursor:default;transform:none;}
.sig .err{font-family:'DM Mono',monospace;font-size:11px;color:var(--red);background:var(--redpaper,rgba(248,113,113,.08));border:1px solid var(--redborder,rgba(248,113,113,.25));border-radius:6px;padding:12px 14px;margin-bottom:24px;}
.sig .empty{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink3);}

.sig .day{margin-bottom:40px;}
.sig .day-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--rule2,rgba(255,255,255,.1));padding-bottom:12px;margin-bottom:20px;position:sticky;top:0;background:var(--bg);z-index:2;}
.sig .day-left{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;}
.sig .day-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:26px;color:var(--ink);margin:0;}
.sig .day-count{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--gold);}
.sig .day-right{display:flex;align-items:center;gap:12px;}
.sig .progress{width:120px;height:3px;background:var(--rule);border-radius:2px;overflow:hidden;}
.sig .progress-fill{height:100%;background:var(--gold);border-radius:2px;transition:width .3s ease;}
.sig .remind-btn{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--ink2);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.12));border-radius:4px;padding:5px 9px;cursor:pointer;}
.sig .remind-btn:hover{color:var(--ink);border-color:var(--goldborder,rgba(201,168,76,.4));}

.sig .block{margin-bottom:24px;}
.sig .block-head{display:flex;align-items:baseline;gap:12px;margin-bottom:14px;}
.sig .block-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:20px;color:var(--ink);margin:0;}
.sig .block-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}
.sig .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
.sig .card{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:10px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;transition:border-color .15s;}
.sig .card:hover{border-color:var(--goldborder,rgba(201,168,76,.25));}
.sig .card.used{opacity:.55;}
.sig .card-body{font-family:'DM Sans',sans-serif;font-size:13.5px;line-height:1.65;color:var(--ink);white-space:pre-wrap;}
.sig .img-prompt{border:1px solid var(--goldborder,rgba(201,168,76,.22));background:var(--goldpaper,rgba(201,168,76,.06));border-radius:7px;padding:11px 12px;}
.sig .img-prompt-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;}
.sig .img-prompt-head span{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase;}
.sig .img-prompt-body{font-family:'DM Mono',monospace;font-size:11px;line-height:1.6;color:var(--ink2);white-space:pre-wrap;}
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
