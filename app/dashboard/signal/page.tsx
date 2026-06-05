'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type TikTokPost = { caption?: string; on_screen_text?: string }
type ImagePrompt = { slide?: number; prompt?: string }
type DailyPayload = {
  core_idea?: string
  post?: { x?: string; linkedin?: string; instagram?: string; tiktok?: TikTokPost }
  carousel?: { title?: string; slides?: string[]; instagram_caption?: string; tiktok_caption?: string; image_prompts?: ImagePrompt[] }
  reel?: { concept?: string; hook?: string; shots?: string[]; on_screen_captions?: string[]; instagram_caption?: string; tiktok_caption?: string }
  _posted?: Record<string, boolean>
}
type Item = {
  id: string
  content_date: string
  angle: string | null
  payload: DailyPayload
  posted: boolean
  created_at: string
}

// All posting tasks that make up "X of Y posted" for a given day.
const POST_KEYS = [
  'post:x', 'post:linkedin', 'post:instagram', 'post:tiktok',
  'carousel:ig', 'carousel:tiktok',
  'reel:ig', 'reel:tiktok',
] as const

const ANGLES = ['proof', 'education', 'contrarian', 'behind-the-scenes', 'build-in-public']
function todaysAngle(): string {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 0)
  const doy = Math.floor((Date.now() - start) / 86_400_000)
  return ANGLES[doy % ANGLES.length]
}

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
  const angle = todaysAngle()

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

  // Load cached docs. Never auto-generates — re-opening the page costs no API call.
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/signal/list', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setItems(data.items || [])
    } catch (_) { /* noop */ }
  }, [])

  useEffect(() => { if (authState === 'ok') load() }, [authState, load])

  // Explicit "Generate Today" — the only thing that burns a Claude call.
  const generate = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/signal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      await load()
    } catch (e: any) {
      setError(e?.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  // Optimistic per-item posted toggle → persists into payload._posted.
  const togglePosted = async (item: Item, key: string) => {
    const cur = !!item.payload?._posted?.[key]
    const next = !cur
    setItems((arr) => arr.map((x) => x.id === item.id
      ? { ...x, payload: { ...x.payload, _posted: { ...(x.payload._posted || {}), [key]: next } } }
      : x))
    try {
      await fetch('/api/signal/mark-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, key, posted: next }),
      })
    } catch (_) {
      setItems((arr) => arr.map((x) => x.id === item.id
        ? { ...x, payload: { ...x.payload, _posted: { ...(x.payload._posted || {}), [key]: cur } } }
        : x))
    }
  }

  if (authState !== 'ok') {
    return (
      <div style={{ padding: 48, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, color: 'var(--ink3)' }}>
        {authState === 'denied' ? 'Admin only — redirecting…' : 'Checking access…'}
      </div>
    )
  }

  const days = [...items].sort((a, b) => (a.content_date < b.content_date ? 1 : -1))

  return (
    <div className="sig">
      <style>{CSS}</style>

      <header className="sig-head">
        <div>
          <p className="eyebrow">VV SIGNAL · INTERNAL</p>
          <h1 className="title">Today&rsquo;s drop.</h1>
          <p className="sub">One core idea, posted everywhere — the multi-platform post, the carousel, and the reel for the day.</p>
        </div>
        <div className="head-right">
          <div className="angle-chip">ANGLE OF THE DAY · <span>{angle}</span></div>
          <button className="gen-btn" onClick={generate} disabled={loading}>
            {loading ? 'GENERATING…' : 'GENERATE TODAY →'}
          </button>
        </div>
      </header>

      {error && <div className="err">{error}</div>}

      {days.length === 0 && <p className="empty">Nothing generated yet — hit Generate Today to create the day&rsquo;s drop.</p>}

      {days.map((item) => <DayView key={item.id} item={item} onToggle={(k) => togglePosted(item, k)} />)}
    </div>
  )
}

function DayView({ item, onToggle }: { item: Item; onToggle: (key: string) => void }) {
  const p = item.payload || {}
  const postedMap = p._posted || {}
  const postedCount = POST_KEYS.filter((k) => postedMap[k]).length
  const total = POST_KEYS.length
  const pct = Math.round((postedCount / total) * 100)

  return (
    <section className="day">
      <div className="day-head">
        <div className="day-left">
          <h2 className="day-title">{dayLabel(item.content_date)}</h2>
          <span className="day-count">{postedCount} of {total} posted</span>
          {item.angle && <span className="day-angle">{item.angle}</span>}
        </div>
        <div className="day-right">
          <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      {p.core_idea && (
        <div className="core">
          <span className="core-tag">CORE IDEA</span>
          <p className="core-text">{p.core_idea}</p>
        </div>
      )}

      <PostSection post={p.post} posted={postedMap} onToggle={onToggle} />
      <CarouselSection carousel={p.carousel} posted={postedMap} onToggle={onToggle} />
      <ReelSection reel={p.reel} posted={postedMap} onToggle={onToggle} />
    </section>
  )
}

// ── Today's Post: one idea, four platform variants ──
const POST_TABS: { key: string; label: string; pkey: string }[] = [
  { key: 'x', label: 'X', pkey: 'post:x' },
  { key: 'linkedin', label: 'LinkedIn', pkey: 'post:linkedin' },
  { key: 'instagram', label: 'Instagram', pkey: 'post:instagram' },
  { key: 'tiktok', label: 'TikTok', pkey: 'post:tiktok' },
]

function PostSection({ post, posted, onToggle }: { post?: Item['payload']['post']; posted: Record<string, boolean>; onToggle: (k: string) => void }) {
  const [tab, setTab] = useState('x')
  if (!post) return null

  const tiktok = post.tiktok
  const text =
    tab === 'x' ? (post.x || '') :
    tab === 'linkedin' ? (post.linkedin || '') :
    tab === 'instagram' ? (post.instagram || '') :
    (tiktok?.caption || '')

  const activeTab = POST_TABS.find((t) => t.key === tab)!

  return (
    <div className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Today&rsquo;s Post</h3>
        <span className="sec-note">one idea · four platforms</span>
      </div>
      <div className="tabs">
        {POST_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? ' on' : ''}${posted[t.pkey] ? ' done' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}{posted[t.pkey] ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-body">{text}</div>
        {tab === 'tiktok' && tiktok?.on_screen_text && (
          <div className="aside">
            <div className="aside-head">
              <span>ON-SCREEN TEXT</span>
              <Copy text={tiktok.on_screen_text} />
            </div>
            <div className="aside-body">{tiktok.on_screen_text}</div>
          </div>
        )}
        <div className="panel-foot">
          <span className="meta">{text.length} ch{tab === 'x' ? ' / 280' : ''}</span>
          <div className="actions">
            <Copy text={text} label="COPY POST" />
            <PostedBtn on={!!posted[activeTab.pkey]} onClick={() => onToggle(activeTab.pkey)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Today's Carousel: IG + TikTok, slides written out, image prompts ──
function CarouselSection({ carousel, posted, onToggle }: { carousel?: Item['payload']['carousel']; posted: Record<string, boolean>; onToggle: (k: string) => void }) {
  if (!carousel) return null
  const slides = carousel.slides || []
  const prompts = carousel.image_prompts || []
  const allSlides = slides.map((s, i) => `Slide ${i + 1}: ${s}`).join('\n\n')

  return (
    <div className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Today&rsquo;s Carousel</h3>
        <span className="sec-note">{carousel.title || 'Instagram + TikTok'}</span>
      </div>

      <div className="panel">
        <div className="slides">
          {slides.map((s, i) => (
            <div className="slide" key={i}>
              <div className="slide-head">
                <span className="slide-n">SLIDE {i + 1}</span>
                <Copy text={s} />
              </div>
              <div className="slide-body">{s}</div>
            </div>
          ))}
        </div>
        {slides.length > 0 && (
          <div className="row-actions"><Copy text={allSlides} label="COPY ALL SLIDES" /></div>
        )}

        {prompts.length > 0 && (
          <div className="prompts">
            {prompts.map((ip, i) => (
              <div className="aside" key={i}>
                <div className="aside-head">
                  <span>IMAGE PROMPT{ip.slide ? ` · SLIDE ${ip.slide}` : ''} — paste into an image tool</span>
                  <Copy text={ip.prompt || ''} />
                </div>
                <div className="aside-body">{ip.prompt}</div>
              </div>
            ))}
          </div>
        )}

        <CaptionRow label="Instagram caption" text={carousel.instagram_caption} pkey="carousel:ig" posted={posted} onToggle={onToggle} />
        <CaptionRow label="TikTok caption" text={carousel.tiktok_caption} pkey="carousel:tiktok" posted={posted} onToggle={onToggle} />
      </div>
    </div>
  )
}

// ── Today's Reel: hook, shot list, on-screen captions, IG + TikTok captions ──
function ReelSection({ reel, posted, onToggle }: { reel?: Item['payload']['reel']; posted: Record<string, boolean>; onToggle: (k: string) => void }) {
  if (!reel) return null
  const shots = reel.shots || []
  const oscaps = reel.on_screen_captions || []

  return (
    <div className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Today&rsquo;s Reel</h3>
        <span className="sec-note">{reel.concept || 'shootable in under 20 min'}</span>
      </div>

      <div className="panel">
        {reel.hook && (
          <div className="hook">
            <div className="hook-head"><span>HOOK · FIRST 3 SECONDS</span><Copy text={reel.hook} /></div>
            <div className="hook-body">{reel.hook}</div>
          </div>
        )}

        {shots.length > 0 && (
          <div className="list">
            <div className="list-head"><span className="list-title">SHOT LIST</span><Copy text={shots.map((s, i) => `${i + 1}. ${s}`).join('\n')} label="COPY SHOTS" /></div>
            <ol className="ol">{shots.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        )}

        {oscaps.length > 0 && (
          <div className="list">
            <div className="list-head"><span className="list-title">ON-SCREEN CAPTIONS</span><Copy text={oscaps.join('\n')} label="COPY CAPTIONS" /></div>
            <ul className="ul">{oscaps.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}

        <CaptionRow label="Instagram caption" text={reel.instagram_caption} pkey="reel:ig" posted={posted} onToggle={onToggle} />
        <CaptionRow label="TikTok caption" text={reel.tiktok_caption} pkey="reel:tiktok" posted={posted} onToggle={onToggle} />
      </div>
    </div>
  )
}

function CaptionRow({ label, text, pkey, posted, onToggle }: { label: string; text?: string; pkey: string; posted: Record<string, boolean>; onToggle: (k: string) => void }) {
  if (!text) return null
  return (
    <div className="caption">
      <div className="caption-head">
        <span className="caption-label">{label}</span>
        <div className="actions">
          <Copy text={text} />
          <PostedBtn on={!!posted[pkey]} onClick={() => onToggle(pkey)} />
        </div>
      </div>
      <div className="caption-body">{text}</div>
    </div>
  )
}

function Copy({ text, label = 'COPY' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="act"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch (_) { /* noop */ }
      }}
    >{copied ? 'COPIED ✓' : label}</button>
  )
}

function PostedBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={`act used-btn${on ? ' on' : ''}`} onClick={onClick}>
      {on ? 'POSTED ✓' : 'MARK POSTED'}
    </button>
  )
}

const CSS = `
.sig{padding:36px 40px 80px;max-width:980px;}
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

.sig .day{margin-bottom:52px;}
.sig .day-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--rule2,rgba(255,255,255,.1));padding-bottom:12px;margin-bottom:20px;position:sticky;top:0;background:var(--bg);z-index:2;}
.sig .day-left{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;}
.sig .day-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:26px;color:var(--ink);margin:0;}
.sig .day-count{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--gold);}
.sig .day-angle{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;border:1px solid var(--rule2,rgba(255,255,255,.12));border-radius:4px;padding:3px 7px;}
.sig .day-right{display:flex;align-items:center;gap:12px;}
.sig .progress{width:120px;height:3px;background:var(--rule);border-radius:2px;overflow:hidden;}
.sig .progress-fill{height:100%;background:var(--gold);border-radius:2px;transition:width .3s ease;}

.sig .core{display:flex;align-items:baseline;gap:12px;background:var(--goldpaper,rgba(201,168,76,.06));border:1px solid var(--goldborder,rgba(201,168,76,.22));border-radius:8px;padding:14px 16px;margin-bottom:26px;}
.sig .core-tag{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:2px;color:var(--gold);white-space:nowrap;padding-top:2px;}
.sig .core-text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:var(--ink);margin:0;line-height:1.4;}

.sig .sec{margin-bottom:30px;}
.sig .sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:14px;}
.sig .sec-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:22px;color:var(--ink);margin:0;}
.sig .sec-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}

.sig .tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}
.sig .tab{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--ink2);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.12));border-radius:5px;padding:8px 14px;cursor:pointer;transition:all .15s;text-transform:uppercase;}
.sig .tab:hover{color:var(--ink);}
.sig .tab.on{color:#050509;background:var(--gold);border-color:var(--gold);}
.sig .tab.done:not(.on){color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.4));}

.sig .panel{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:12px;padding:20px;}
.sig .panel-body{font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.7;color:var(--ink);white-space:pre-wrap;}
.sig .panel-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--rule);}
.sig .meta{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;color:var(--ink3);text-transform:uppercase;}
.sig .actions{display:flex;gap:6px;}
.sig .row-actions{display:flex;justify-content:flex-end;margin-top:10px;}

.sig .slides{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;}
.sig .slide{border:1px solid var(--rule);border-radius:8px;padding:12px;background:var(--bg,rgba(0,0,0,.15));}
.sig .slide-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
.sig .slide-n{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--gold);}
.sig .slide-body{font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.55;color:var(--ink);white-space:pre-wrap;}

.sig .prompts{margin-top:14px;display:flex;flex-direction:column;gap:10px;}
.sig .aside{border:1px solid var(--goldborder,rgba(201,168,76,.22));background:var(--goldpaper,rgba(201,168,76,.06));border-radius:7px;padding:11px 12px;margin-top:12px;}
.sig .aside-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;}
.sig .aside-head span{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase;}
.sig .aside-body{font-family:'DM Mono',monospace;font-size:11px;line-height:1.6;color:var(--ink2);white-space:pre-wrap;}

.sig .hook{border:1px solid var(--goldborder,rgba(201,168,76,.3));border-radius:8px;padding:13px 14px;margin-bottom:16px;background:var(--goldpaper,rgba(201,168,76,.05));}
.sig .hook-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;}
.sig .hook-head span{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--gold);}
.sig .hook-body{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:var(--ink);line-height:1.4;}

.sig .list{margin-bottom:16px;}
.sig .list-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
.sig .list-title{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}
.sig .ol,.sig .ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:7px;}
.sig .ol li,.sig .ul li{font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.55;color:var(--ink2);}

.sig .caption{border-top:1px solid var(--rule);margin-top:14px;padding-top:14px;}
.sig .caption-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
.sig .caption-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}
.sig .caption-body{font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.65;color:var(--ink);white-space:pre-wrap;}

.sig .act{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--ink2);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.1));border-radius:4px;padding:6px 9px;cursor:pointer;transition:all .15s;text-transform:uppercase;white-space:nowrap;}
.sig .act:hover{color:var(--ink);border-color:var(--goldborder,rgba(201,168,76,.4));}
.sig .used-btn.on{color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.4));}
@media (max-width:640px){
  .sig{padding:24px 18px 60px;}
  .sig .sig-head{flex-direction:column;}
  .sig .head-right{align-items:flex-start;}
  .sig .slides{grid-template-columns:1fr;}
}
`
