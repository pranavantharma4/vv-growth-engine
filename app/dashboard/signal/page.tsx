'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ── payload shapes (new revamp format; legacy rows tolerated) ──
type Slide = { text?: string; image_prompt?: string }
type DailyPayload = {
  pillar?: string
  carousel?: { title?: string; slides?: (Slide | string)[]; cta?: string; ig_caption?: string; tiktok_caption?: string; image_prompts?: any[] }
  single_post?: { format?: string; x?: { body?: string; first_reply?: string }; linkedin?: string; image_prompt?: string }
  _posted?: Record<string, boolean>
  // legacy fields tolerated but no longer rendered as primary:
  core_idea?: string
}
type EpisodeSegment = { title?: string; script?: string; bridge?: string; ui_cues?: string[] }
type EpisodeReel = { hook?: string; source?: string; on_screen_caption?: string; post_caption?: string }
type EpisodePayload = {
  title?: string
  cold_open?: string
  segments?: EpisodeSegment[]
  close?: string
  next_tease?: string
  recording_notes?: { setup?: string; per_segment?: string[] }
  reels?: EpisodeReel[]
  _posted?: Record<string, boolean>
}
type Item = { id: string; content_date: string; angle: string | null; payload: any; posted: boolean; created_at: string }

// Engagement targets that define "the day's growth work".
const ENG_TARGETS = { x: 12, linkedin: 5, dm: 3 } as const

const STANDING_KEY = 'vv_signal_standing_list'
type StandingEntry = { handle: string; platform: 'x' | 'linkedin' | 'both'; note: string }
const DEFAULT_STANDING: StandingEntry[] = [
  { handle: '@example_mediabuyer', platform: 'x', note: 'posts scaling wins / CPM gripes — replace me' },
  { handle: '@example_dtc_founder', platform: 'both', note: 'DTC founder running paid — replace me' },
  { handle: '@example_growth_voice', platform: 'linkedin', note: 'growth commentary — replace me' },
]

function dayLabel(iso: string): string {
  const d = new Date((iso || '').slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function normSlides(slides?: (Slide | string)[]): Slide[] {
  return (slides || []).map((s) => (typeof s === 'string' ? { text: s, image_prompt: '' } : s))
}

export default function SignalPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authState, setAuthState] = useState<'checking' | 'denied' | 'ok'>('checking')
  const [items, setItems] = useState<Item[]>([])
  const [episodes, setEpisodes] = useState<Item[]>([])
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [loadingEp, setLoadingEp] = useState(false)
  const [error, setError] = useState('')
  const [standing, setStanding] = useState<StandingEntry[]>([])
  const [editTargets, setEditTargets] = useState(false)

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

  // Load standing list from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STANDING_KEY)
      setStanding(raw ? JSON.parse(raw) : DEFAULT_STANDING)
    } catch { setStanding(DEFAULT_STANDING) }
  }, [])
  const saveStanding = useCallback((next: StandingEntry[]) => {
    setStanding(next)
    try { localStorage.setItem(STANDING_KEY, JSON.stringify(next)) } catch { /* noop */ }
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/signal/list', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) { setItems(data.items || []); setEpisodes(data.episodes || []) }
    } catch { /* noop */ }
  }, [])
  useEffect(() => { if (authState === 'ok') load() }, [authState, load])

  const generateDaily = async () => {
    setLoadingDaily(true); setError('')
    try {
      const res = await fetch('/api/signal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'daily', force: true }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      await load()
    } catch (e: any) { setError(e?.message || 'Generation failed') }
    finally { setLoadingDaily(false) }
  }
  const generateEpisode = async () => {
    setLoadingEp(true); setError('')
    try {
      const res = await fetch('/api/signal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'episode', force: true }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Episode generation failed'); return }
      await load()
    } catch (e: any) { setError(e?.message || 'Episode generation failed') }
    finally { setLoadingEp(false) }
  }

  // Optimistic per-item posted toggle → persists into payload._posted.
  const togglePosted = useCallback(async (setter: React.Dispatch<React.SetStateAction<Item[]>>, item: Item, key: string) => {
    const cur = !!item.payload?._posted?.[key]
    const next = !cur
    setter((arr) => arr.map((x) => x.id === item.id
      ? { ...x, payload: { ...x.payload, _posted: { ...(x.payload._posted || {}), [key]: next } } }
      : x))
    try {
      await fetch('/api/signal/mark-used', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, key, posted: next }),
      })
    } catch {
      setter((arr) => arr.map((x) => x.id === item.id
        ? { ...x, payload: { ...x.payload, _posted: { ...(x.payload._posted || {}), [key]: cur } } }
        : x))
    }
  }, [])

  const days = useMemo(() => [...items].sort((a, b) => (a.content_date < b.content_date ? 1 : -1)), [items])
  const today = days[0] || null
  const archive = days.slice(1)
  const episode = episodes[0] || null
  const epArchive = episodes.slice(1)

  if (authState !== 'ok') {
    return (
      <div style={{ padding: 48, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, color: 'var(--ink3)' }}>
        {authState === 'denied' ? 'Admin only — redirecting…' : 'Checking access…'}
      </div>
    )
  }

  return (
    <div className="sig">
      <style>{CSS}</style>

      <header className="sig-head">
        <div>
          <p className="eyebrow">VV SIGNAL · INTERNAL · ARCHITECT</p>
          <h1 className="title">Content command center.</h1>
          <p className="sub">Hit generate, work the checklist, copy the day&rsquo;s content out. X and LinkedIn lead; IG and TikTok are fed by the week&rsquo;s reels.</p>
        </div>
        <div className="head-right">
          {today?.payload?.pillar && <div className="angle-chip">TODAY&rsquo;S PILLAR · <span>{today.payload.pillar}</span></div>}
          <button className="gen-btn" onClick={generateDaily} disabled={loadingDaily}>
            {loadingDaily ? 'GENERATING…' : 'GENERATE TODAY →'}
          </button>
        </div>
      </header>

      {error && <div className="err">{error}</div>}

      {/* [1] ENGAGEMENT CHECKLIST — sticky, grows the account.
          Pure checklist: WHO to engage (from the standing list) + checkboxes.
          No generated reply text — you read the real post and reply yourself. */}
      <EngagementBlock
        standing={standing}
        editTargets={editTargets}
        onEdit={() => setEditTargets((v) => !v)}
        onSaveStanding={saveStanding}
      />

      {!today && <p className="empty">No daily drop yet — hit <b>Generate Today</b> to create the carousel and single post. (The engagement checklist above works without generating.)</p>}

      {/* PRIMARY: X + LinkedIn content */}
      {today && (
        <>
          <CarouselBlock item={today} onToggle={(k) => togglePosted(setItems, today, k)} />
          <SinglePostBlock item={today} onToggle={(k) => togglePosted(setItems, today, k)} />
        </>
      )}

      {/* [3] READ YOUR ACCOUNT — weekly episode + reels (feeds IG/TikTok) */}
      <EpisodeBlock
        item={episode}
        loading={loadingEp}
        onGenerate={generateEpisode}
        onToggle={(k) => episode && togglePosted(setEpisodes, episode, k)}
      />

      {/* ARCHIVE */}
      <ArchiveBlock daily={archive} episodes={epArchive} />
    </div>
  )
}

/* ═══════════════ [1] ENGAGEMENT — pure checklist, NO generated text ═══════════════
   The only "content" here is WHO to engage with (handles from the editable
   standing list) plus checkboxes. You read each real post and reply yourself —
   a reply to a post you haven't read can't be pre-written. State persists per
   day in localStorage (single-admin internal tool). */
function localDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function EngagementBlock({ standing, editTargets, onEdit, onSaveStanding }: {
  standing: StandingEntry[]
  editTargets: boolean
  onEdit: () => void
  onSaveStanding: (s: StandingEntry[]) => void
}) {
  const storeKey = `vv_signal_eng_${localDateStr()}`
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [dmNotes, setDmNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey)
      const s = raw ? JSON.parse(raw) : {}
      setChecks(s.checks || {}); setDmNotes(s.dmNotes || {})
    } catch { setChecks({}); setDmNotes({}) }
  }, [storeKey])

  const persist = (c: Record<string, boolean>, n: Record<string, string>) => {
    try { localStorage.setItem(storeKey, JSON.stringify({ checks: c, dmNotes: n })) } catch { /* noop */ }
  }
  const toggle = (key: string) => { const next = { ...checks, [key]: !checks[key] }; setChecks(next); persist(next, dmNotes) }
  const setNote = (i: number, v: string) => { const next = { ...dmNotes, [i]: v }; setDmNotes(next); persist(checks, next) }

  const xHandles = standing.filter((s) => s.platform === 'x' || s.platform === 'both').map((s) => s.handle)
  const liHandles = standing.filter((s) => s.platform === 'linkedin' || s.platform === 'both').map((s) => s.handle)

  const xDone = xHandles.filter((h) => checks[`x:${h}`]).length
  const liDone = liHandles.filter((h) => checks[`li:${h}`]).length
  const dmDone = [0, 1, 2].filter((i) => checks[`dm:${i}`]).length

  const totalTarget = ENG_TARGETS.x + ENG_TARGETS.linkedin + ENG_TARGETS.dm
  const pct = Math.round(((xDone + liDone + dmDone) / totalTarget) * 100)
  const counters = [
    { label: 'X replies', done: xDone, target: ENG_TARGETS.x },
    { label: 'LinkedIn comments', done: liDone, target: ENG_TARGETS.linkedin },
    { label: 'Warm DMs', done: dmDone, target: ENG_TARGETS.dm },
  ]

  const Row = ({ k, label }: { k: string; label: string }) => (
    <div className={`eng-item${checks[k] ? ' done' : ''}`}>
      <button className={`checkbox${checks[k] ? ' on' : ''}`} onClick={() => toggle(k)} aria-label="mark done">{checks[k] ? '✓' : ''}</button>
      <span className="eng-handle-lg">{label}</span>
    </div>
  )

  return (
    <section className="eng">
      <div className="eng-sticky">
        <div className="eng-bar">
          <span className="eng-tag">DAILY ENGAGEMENT · GROWS THE ACCOUNT</span>
          <div className="eng-counters">
            {counters.map((c) => (
              <span key={c.label} className={`eng-count${c.done >= c.target ? ' full' : ''}`}>
                {c.label} <b>{c.done}/{c.target}</b>
              </span>
            ))}
          </div>
          <div className="eng-progress-wrap">
            <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <button className="act" onClick={onEdit}>{editTargets ? 'DONE' : 'EDIT TARGETS'}</button>
          </div>
        </div>
      </div>

      {/* how-to reminder — shown ONCE, not per item */}
      <div className="eng-howto">
        <span className="eng-howto-k">HOW TO ENGAGE</span>
        Read their actual post first. Reply in 1&ndash;2 sentences, specific to what they said, and add a real insight. No &ldquo;great post&rdquo;, no pitch.
      </div>

      {editTargets && <StandingEditor standing={standing} onSave={onSaveStanding} />}

      <div className="eng-groups">
        <div className="eng-group">
          <div className="eng-group-head">
            <span className="eng-group-title">X &mdash; reply today</span>
            <span className="eng-group-meta">{xDone} of {ENG_TARGETS.x}</span>
          </div>
          {xHandles.length === 0 && <p className="eng-none">No X targets &mdash; add some in Edit Targets.</p>}
          {xHandles.map((h, i) => <Row key={`${h}-${i}`} k={`x:${h}`} label={h} />)}
        </div>

        <div className="eng-group">
          <div className="eng-group-head">
            <span className="eng-group-title">LinkedIn &mdash; comment today</span>
            <span className="eng-group-meta">{liDone} of {ENG_TARGETS.linkedin}</span>
          </div>
          {liHandles.length === 0 && <p className="eng-none">No LinkedIn targets &mdash; add some in Edit Targets.</p>}
          {liHandles.map((h, i) => <Row key={`${h}-${i}`} k={`li:${h}`} label={h} />)}
        </div>

        <div className="eng-group">
          <div className="eng-group-head">
            <span className="eng-group-title">Warm DMs &mdash; yesterday&rsquo;s engagers</span>
            <span className="eng-group-meta">{dmDone} of {ENG_TARGETS.dm}</span>
          </div>
          {[0, 1, 2].map((i) => {
            const k = `dm:${i}`
            return (
              <div className={`eng-item${checks[k] ? ' done' : ''}`} key={i}>
                <button className={`checkbox${checks[k] ? ' on' : ''}`} onClick={() => toggle(k)} aria-label="mark done">{checks[k] ? '✓' : ''}</button>
                <input className="in dm-in" placeholder={`who engaged yesterday? #${i + 1}`} value={dmNotes[i] || ''} onChange={(e) => setNote(i, e.target.value)} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StandingEditor({ standing, onSave }: { standing: StandingEntry[]; onSave: (s: StandingEntry[]) => void }) {
  const [rows, setRows] = useState<StandingEntry[]>(standing)
  useEffect(() => { setRows(standing) }, [standing])
  const set = (i: number, patch: Partial<StandingEntry>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const add = () => setRows((r) => [...r, { handle: '', platform: 'x', note: '' }])
  const del = (i: number) => setRows((r) => r.filter((_, j) => j !== i))

  return (
    <div className="standing">
      <div className="standing-head">
        <span>STANDING TARGET LIST — accounts to reply to / warm up. Passed to the generator to write per-account angles.</span>
      </div>
      {rows.map((r, i) => (
        <div className="standing-row" key={i}>
          <input className="in" placeholder="@handle" value={r.handle} onChange={(e) => set(i, { handle: e.target.value })} />
          <select className="in sel" value={r.platform} onChange={(e) => set(i, { platform: e.target.value as StandingEntry['platform'] })}>
            <option value="x">X</option>
            <option value="linkedin">LinkedIn</option>
            <option value="both">Both</option>
          </select>
          <input className="in note" placeholder="what they post about" value={r.note} onChange={(e) => set(i, { note: e.target.value })} />
          <button className="act" onClick={() => del(i)}>✕</button>
        </div>
      ))}
      <div className="standing-foot">
        <button className="act" onClick={add}>+ ADD TARGET</button>
        <button className="act save" onClick={() => onSave(rows.filter((r) => r.handle.trim()))}>SAVE LIST</button>
      </div>
    </div>
  )
}

/* ═══════════════ [2] VALUE CAROUSEL ═══════════════ */
function CarouselBlock({ item, onToggle }: { item: Item; onToggle: (k: string) => void }) {
  const p: DailyPayload = item.payload || {}
  const c = p.carousel
  const posted = p._posted || {}
  if (!c) return null
  const slides = normSlides(c.slides)
  const allText = slides.map((s, i) => `Slide ${i + 1}: ${s.text || ''}`).join('\n\n')

  return (
    <section className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Value Carousel</h3>
        <span className="sec-note">{p.pillar || 'centerpiece'} · {c.title || 'the day’s big value'}</span>
        <div className="sec-actions"><Copy text={allText} label="COPY ALL SLIDES" /></div>
      </div>

      <div className="panel">
        <div className="cslides">
          {slides.map((s, i) => (
            <div className={`cslide${i === 0 ? ' hook' : ''}${i === slides.length - 1 ? ' cta' : ''}`} key={i}>
              <div className="cslide-head">
                <span className="cslide-n">{i === 0 ? 'HOOK · SLIDE 1' : i === slides.length - 1 ? `CTA · SLIDE ${i + 1}` : `SLIDE ${i + 1}`}</span>
                <Copy text={s.text || ''} />
              </div>
              <div className="cslide-body">{s.text}</div>
              {s.image_prompt ? (
                <div className="aside">
                  <div className="aside-head"><span>IMAGE PROMPT → Claude Design</span><Copy text={s.image_prompt} /></div>
                  <div className="aside-body">{s.image_prompt}</div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="secondary">
          <span className="secondary-tag">IG + TIKTOK (below X/LinkedIn priority)</span>
          <CaptionRow label="Instagram caption" text={c.ig_caption} pkey="carousel:ig" posted={posted} onToggle={onToggle} />
          <CaptionRow label="TikTok caption" text={c.tiktok_caption} pkey="carousel:tiktok" posted={posted} onToggle={onToggle} />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════ [4] SINGLE POST ═══════════════ */
function SinglePostBlock({ item, onToggle }: { item: Item; onToggle: (k: string) => void }) {
  const p: DailyPayload = item.payload || {}
  const sp = p.single_post
  const posted = p._posted || {}
  if (!sp) return null
  const xBody = sp.x?.body || ''
  const xReply = sp.x?.first_reply || ''

  return (
    <section className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Single Post</h3>
        <span className="sec-note">quick daily · {sp.format || 'best format for today'}</span>
      </div>

      <div className="panel">
        <div className="platform-grid">
          {/* X — primary */}
          <div className="pcol">
            <div className="pcol-head"><span className="pcol-label">X</span><span className="pcol-pri">PRIMARY</span></div>
            <div className="pcol-body">{xBody}</div>
            <div className="pcol-foot">
              <span className="meta">{xBody.length} ch / 280</span>
              <div className="actions">
                <Copy text={xBody} label="COPY POST" />
                <PostedBtn on={!!posted['single:x']} onClick={() => onToggle('single:x')} />
              </div>
            </div>
            {xReply && (
              <div className="aside">
                <div className="aside-head"><span>FIRST REPLY · link out of body</span><Copy text={xReply} /></div>
                <div className="aside-body">{xReply}</div>
              </div>
            )}
          </div>

          {/* LinkedIn — primary */}
          <div className="pcol">
            <div className="pcol-head"><span className="pcol-label">LinkedIn</span><span className="pcol-pri">PRIMARY</span></div>
            <div className="pcol-body">{sp.linkedin}</div>
            <div className="pcol-foot">
              <span className="meta">hook first line</span>
              <div className="actions">
                <Copy text={sp.linkedin || ''} label="COPY POST" />
                <PostedBtn on={!!posted['single:li']} onClick={() => onToggle('single:li')} />
              </div>
            </div>
          </div>
        </div>

        {sp.image_prompt ? (
          <div className="aside">
            <div className="aside-head"><span>IMAGE PROMPT → Claude Design</span><Copy text={sp.image_prompt} /></div>
            <div className="aside-body">{sp.image_prompt}</div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/* ═══════════════ [3] EPISODE ═══════════════ */
function EpisodeBlock({ item, loading, onGenerate, onToggle }: {
  item: Item | null; loading: boolean; onGenerate: () => void; onToggle: (k: string) => void
}) {
  const p: EpisodePayload = item?.payload || {}
  const posted = p._posted || {}
  const segs = p.segments || []
  const reels = p.reels || []

  const fullScript = [
    p.cold_open ? `COLD OPEN\n${p.cold_open}` : '',
    ...segs.map((s, i) => `SEGMENT ${i + 1} — ${s.title || ''}\n${s.bridge ? `[bridge] ${s.bridge}\n` : ''}${s.script || ''}`),
    p.close ? `CLOSE\n${p.close}` : '',
    p.next_tease ? `NEXT EP\n${p.next_tease}` : '',
  ].filter(Boolean).join('\n\n')

  const notes = p.recording_notes
  const notesText = notes ? [notes.setup ? `SETUP: ${notes.setup}` : '', ...(notes.per_segment || []).map((n, i) => `SEGMENT ${i + 1}: ${n}`)].filter(Boolean).join('\n') : ''

  return (
    <section className="sec ep">
      <div className="sec-head">
        <h3 className="sec-title">Read Your Account — this week&rsquo;s episode</h3>
        <span className="sec-note">{item ? (item.angle || '') : 'not generated'} {p.title ? `· ${p.title}` : ''}</span>
        <div className="sec-actions">
          <button className="gen-btn sm" onClick={onGenerate} disabled={loading}>
            {loading ? 'GENERATING…' : item ? 'REGENERATE EPISODE' : 'GENERATE EPISODE →'}
          </button>
        </div>
      </div>

      {!item ? (
        <p className="empty">No episode this week yet — generate the full script, recording notes, and the daily reel breakdown.</p>
      ) : (
        <div className="panel">
          {/* FULL SCRIPT */}
          <div className="ep-sub">
            <div className="ep-sub-head"><span className="ep-sub-title">FULL SCRIPT</span><Copy text={fullScript} label="COPY SCRIPT" /></div>
            {p.cold_open && <div className="ep-block"><span className="ep-k">COLD OPEN · first 10s</span><p>{p.cold_open}</p></div>}
            {segs.map((s, i) => (
              <div className="ep-block" key={i}>
                <span className="ep-k">SEGMENT {i + 1} — {s.title} <em>· ~45s</em></span>
                {s.bridge && <p className="ep-bridge">↳ bridge: {s.bridge}</p>}
                <p className="ep-script">{s.script}</p>
                {(s.ui_cues || []).length > 0 && (
                  <div className="cues">
                    {(s.ui_cues || []).map((c, j) => <span className="cue" key={j}>{c}</span>)}
                  </div>
                )}
              </div>
            ))}
            {p.close && <div className="ep-block"><span className="ep-k">CLOSE</span><p>{p.close}</p></div>}
            {p.next_tease && <div className="ep-block"><span className="ep-k">NEXT EP TEASE</span><p>{p.next_tease}</p></div>}
          </div>

          {/* RECORDING NOTES */}
          {notesText && (
            <div className="ep-sub">
              <div className="ep-sub-head"><span className="ep-sub-title">RECORDING NOTES</span><Copy text={notesText} label="COPY NOTES" /></div>
              {notes?.setup && <p className="ep-note"><b>Setup.</b> {notes.setup}</p>}
              {(notes?.per_segment || []).map((n, i) => <p className="ep-note" key={i}><b>Segment {i + 1}.</b> {n}</p>)}
            </div>
          )}

          {/* DAILY REEL BREAKDOWN — feeds IG/TikTok */}
          <div className="ep-sub">
            <div className="ep-sub-head"><span className="ep-sub-title">DAILY REEL BREAKDOWN · one per day → IG + TikTok</span></div>
            <div className="reels">
              {reels.map((r, i) => {
                const key = `reel:${i}`
                const copyText = [
                  `HOOK: ${r.hook || ''}`, `FROM: ${r.source || ''}`,
                  `ON-SCREEN: ${r.on_screen_caption || ''}`, `CAPTION: ${r.post_caption || ''}`,
                ].join('\n')
                return (
                  <div className={`reel${posted[key] ? ' done' : ''}`} key={i}>
                    <div className="reel-head">
                      <span className="reel-n">REEL {i + 1}</span>
                      <div className="actions">
                        <Copy text={copyText} label="COPY REEL" />
                        <PostedBtn on={!!posted[key]} onClick={() => onToggle(key)} />
                      </div>
                    </div>
                    <p className="reel-hook">{r.hook}</p>
                    {r.source && <p className="reel-meta">from: {r.source}</p>}
                    {r.on_screen_caption && <p className="reel-os"><span>ON-SCREEN</span> {r.on_screen_caption}</p>}
                    {r.post_caption && <p className="reel-cap"><span>CAPTION</span> {r.post_caption}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ═══════════════ ARCHIVE ═══════════════ */
function ArchiveBlock({ daily, episodes }: { daily: Item[]; episodes: Item[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (daily.length === 0 && episodes.length === 0) return null

  const postedCount = (it: Item) => Object.values(it.payload?._posted || {}).filter(Boolean).length

  const Row = ({ it, kind }: { it: Item; kind: 'daily' | 'episode' }) => {
    const id = `${kind}:${it.id}`
    const isOpen = open === id
    return (
      <div className="arc-item">
        <button className="arc-row" onClick={() => setOpen(isOpen ? null : id)}>
          <span className="arc-date">{kind === 'episode' ? (it.angle || dayLabel(it.content_date)) : dayLabel(it.content_date)}</span>
          <span className="arc-pillar">{kind === 'episode' ? 'episode' : (it.payload?.pillar || it.angle || '')}</span>
          <span className="arc-posted">{postedCount(it)} posted</span>
          <span className="arc-caret">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div className="arc-open">
            {kind === 'daily'
              ? <><CarouselBlock item={it} onToggle={() => {}} /><SinglePostBlock item={it} onToggle={() => {}} /></>
              : <EpisodeBlock item={it} loading={false} onGenerate={() => {}} onToggle={() => {}} />}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="arc">
      <div className="sec-head"><h3 className="sec-title">Archive</h3><span className="sec-note">past drops &amp; episodes — re-openable</span></div>
      <div className="arc-list">
        {daily.map((it) => <Row key={it.id} it={it} kind="daily" />)}
        {episodes.map((it) => <Row key={it.id} it={it} kind="episode" />)}
      </div>
    </section>
  )
}

/* ═══════════════ shared bits ═══════════════ */
function CaptionRow({ label, text, pkey, posted, onToggle }: { label: string; text?: string; pkey: string; posted: Record<string, boolean>; onToggle: (k: string) => void }) {
  if (!text) return null
  return (
    <div className="caption">
      <div className="caption-head">
        <span className="caption-label">{label}</span>
        <div className="actions"><Copy text={text} /><PostedBtn on={!!posted[pkey]} onClick={() => onToggle(pkey)} /></div>
      </div>
      <div className="caption-body">{text}</div>
    </div>
  )
}

function Copy({ text, label = 'COPY' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button className="act" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch { /* noop */ }
    }}>{copied ? 'COPIED ✓' : label}</button>
  )
}
function PostedBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button className={`act used-btn${on ? ' on' : ''}`} onClick={onClick}>{on ? 'POSTED ✓' : 'MARK POSTED'}</button>
}

const CSS = `
.sig{padding:36px 40px 100px;max-width:1000px;}
.sig *{box-sizing:border-box;}
.sig .eyebrow{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:3px;color:var(--gold);margin:0 0 10px;}
.sig .title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:40px;color:var(--ink);margin:0 0 8px;line-height:1;}
.sig .sub{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink2);margin:0;max-width:560px;line-height:1.6;}
.sig .sig-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:26px;}
.sig .head-right{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.sig .angle-chip{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--ink3);text-transform:uppercase;}
.sig .angle-chip span{color:var(--gold);}
.sig .gen-btn{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;color:#050509;background:var(--gold);border:none;padding:13px 22px;border-radius:5px;cursor:pointer;transition:transform .15s,opacity .15s;white-space:nowrap;}
.sig .gen-btn.sm{padding:9px 16px;font-size:9px;}
.sig .gen-btn:hover{transform:translateY(-1px);}
.sig .gen-btn:disabled{opacity:.5;cursor:default;transform:none;}
.sig .err{font-family:'DM Mono',monospace;font-size:11px;color:var(--red);background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:6px;padding:12px 14px;margin-bottom:24px;}
.sig .empty{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink3);margin:14px 0 30px;}

/* ── engagement ── */
.sig .eng{margin-bottom:40px;}
.sig .eng-sticky{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0 12px;border-bottom:1px solid var(--goldborder,rgba(201,168,76,.22));margin-bottom:16px;}
.sig .eng-bar{display:flex;flex-direction:column;gap:10px;}
.sig .eng-tag{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--gold);}
.sig .eng-counters{display:flex;gap:18px;flex-wrap:wrap;}
.sig .eng-count{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.5px;color:var(--ink2);}
.sig .eng-count b{color:var(--ink);}
.sig .eng-count.full b{color:var(--green);}
.sig .eng-progress-wrap{display:flex;align-items:center;gap:12px;}
.sig .progress{width:160px;height:3px;background:var(--rule);border-radius:2px;overflow:hidden;}
.sig .progress-fill{height:100%;background:var(--gold);border-radius:2px;transition:width .3s ease;}
.sig .eng-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}
.sig .eng-group{border:1px solid var(--rule);border-radius:10px;padding:14px;background:var(--bg2,rgba(255,255,255,.025));}
.sig .eng-group-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.sig .eng-group-title{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);}
.sig .eng-group-meta{font-family:'DM Mono',monospace;font-size:9px;color:var(--gold);}
.sig .eng-none,.sig .eng-empty{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);}
.sig .eng-howto{font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.55;color:var(--ink2);background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:8px;padding:11px 13px;margin-bottom:16px;}
.sig .eng-howto-k{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:1.5px;color:var(--gold);display:inline-block;margin-right:8px;}
.sig .eng-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--rule);}
.sig .eng-item.done{opacity:.55;}
.sig .checkbox{flex:none;width:18px;height:18px;border:1px solid var(--rule2,rgba(255,255,255,.2));border-radius:4px;background:transparent;color:var(--green);font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.sig .checkbox.on{border-color:var(--greenborder,rgba(74,222,128,.5));}
.sig .eng-handle-lg{font-family:'DM Sans',sans-serif;font-size:13.5px;color:var(--ink);flex:1;min-width:0;}
.sig .eng-item.done .eng-handle-lg{text-decoration:line-through;}
.sig .dm-in{flex:1;font-size:12px;padding:6px 9px;}

/* standing editor */
.sig .standing{border:1px solid var(--goldborder,rgba(201,168,76,.22));background:var(--goldpaper,rgba(201,168,76,.05));border-radius:10px;padding:14px;margin-bottom:16px;}
.sig .standing-head span{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--ink2);line-height:1.5;display:block;margin-bottom:10px;}
.sig .standing-row{display:flex;gap:8px;margin-bottom:8px;align-items:center;}
.sig .in{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink);background:var(--bg);border:1px solid var(--rule2,rgba(255,255,255,.14));border-radius:5px;padding:8px 10px;}
.sig .in.note{flex:1;}
.sig .in:first-child{width:150px;}
.sig .in.sel{width:100px;}
.sig .standing-foot{display:flex;gap:8px;margin-top:4px;}
.sig .act.save{color:var(--gold);border-color:var(--goldborder,rgba(201,168,76,.4));}

/* ── sections ── */
.sig .sec{margin-bottom:34px;}
.sig .sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
.sig .sec-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:24px;color:var(--ink);margin:0;}
.sig .sec-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}
.sig .sec-actions{margin-left:auto;display:flex;gap:6px;}
.sig .panel{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:12px;padding:20px;}
.sig .meta{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;color:var(--ink3);text-transform:uppercase;}
.sig .actions{display:flex;gap:6px;}

/* carousel */
.sig .cslides{display:flex;flex-direction:column;gap:12px;}
.sig .cslide{border:1px solid var(--rule);border-radius:9px;padding:14px;background:rgba(0,0,0,.15);}
.sig .cslide.hook{border-color:var(--goldborder,rgba(201,168,76,.4));background:var(--goldpaper,rgba(201,168,76,.06));}
.sig .cslide.cta{border-style:dashed;}
.sig .cslide-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
.sig .cslide-n{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--gold);}
.sig .cslide-body{font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.6;color:var(--ink);white-space:pre-wrap;}
.sig .cslide.hook .cslide-body{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;line-height:1.35;}

.sig .aside{border:1px solid var(--goldborder,rgba(201,168,76,.22));background:var(--goldpaper,rgba(201,168,76,.06));border-radius:7px;padding:10px 12px;margin-top:10px;}
.sig .aside-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;}
.sig .aside-head span{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase;}
.sig .aside-body{font-family:'DM Mono',monospace;font-size:11px;line-height:1.6;color:var(--ink2);white-space:pre-wrap;}

.sig .secondary{margin-top:18px;padding-top:14px;border-top:1px dashed var(--rule2,rgba(255,255,255,.1));}
.sig .secondary-tag{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}

/* single post */
.sig .platform-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.sig .pcol{border:1px solid var(--rule);border-radius:9px;padding:14px;background:rgba(0,0,0,.15);display:flex;flex-direction:column;}
.sig .pcol-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.sig .pcol-label{font-family:'DM Sans',sans-serif;font-size:14px;color:var(--ink);}
.sig .pcol-pri{font-family:'DM Mono',monospace;font-size:6.5px;letter-spacing:1.5px;color:#050509;background:var(--gold);padding:2px 5px;border-radius:3px;}
.sig .pcol-body{font-family:'DM Sans',sans-serif;font-size:13.5px;line-height:1.6;color:var(--ink);white-space:pre-wrap;flex:1;}
.sig .pcol-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--rule);}

/* episode */
.sig .ep-sub{margin-bottom:22px;padding-bottom:20px;border-bottom:1px solid var(--rule);}
.sig .ep-sub:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
.sig .ep-sub-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;}
.sig .ep-sub-title{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--gold);}
.sig .ep-block{margin-bottom:14px;}
.sig .ep-k{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;display:block;margin-bottom:5px;}
.sig .ep-k em{color:var(--gold);font-style:normal;}
.sig .ep-block p{font-family:'DM Sans',sans-serif;font-size:13.5px;line-height:1.7;color:var(--ink);margin:0;white-space:pre-wrap;}
.sig .ep-bridge{color:var(--ink3)!important;font-size:12px!important;font-style:italic;margin-bottom:6px!important;}
.sig .cues{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.sig .cue{font-family:'DM Mono',monospace;font-size:9px;color:var(--gold);border:1px solid var(--goldborder,rgba(201,168,76,.3));background:var(--goldpaper,rgba(201,168,76,.06));border-radius:4px;padding:4px 7px;}
.sig .ep-note{font-family:'DM Sans',sans-serif;font-size:12.5px;line-height:1.6;color:var(--ink2);margin:0 0 6px;}
.sig .ep-note b{color:var(--gold);font-weight:500;}
.sig .reels{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}
.sig .reel{border:1px solid var(--rule);border-radius:9px;padding:13px;background:rgba(0,0,0,.15);}
.sig .reel.done{opacity:.6;}
.sig .reel-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px;}
.sig .reel-n{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:1.5px;color:var(--gold);}
.sig .reel-hook{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:17px;line-height:1.35;color:var(--ink);margin:0 0 8px;}
.sig .reel-meta{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);margin:0 0 8px;}
.sig .reel-os,.sig .reel-cap{font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.5;color:var(--ink2);margin:0 0 6px;}
.sig .reel-os span,.sig .reel-cap span{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1px;color:var(--gold);display:inline-block;margin-right:6px;}

/* caption rows */
.sig .caption{margin-top:14px;padding-top:12px;border-top:1px solid var(--rule);}
.sig .caption-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;}
.sig .caption-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}
.sig .caption-body{font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.6;color:var(--ink);white-space:pre-wrap;}

/* archive */
.sig .arc{margin-top:20px;border-top:1px solid var(--rule2,rgba(255,255,255,.1));padding-top:24px;}
.sig .arc-list{display:flex;flex-direction:column;gap:6px;}
.sig .arc-item{border:1px solid var(--rule);border-radius:8px;overflow:hidden;}
.sig .arc-row{width:100%;display:flex;align-items:center;gap:14px;padding:11px 14px;background:transparent;border:none;cursor:pointer;text-align:left;}
.sig .arc-row:hover{background:var(--bg2,rgba(255,255,255,.025));}
.sig .arc-date{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);min-width:150px;}
.sig .arc-pillar{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--gold);text-transform:uppercase;flex:1;}
.sig .arc-posted{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);}
.sig .arc-caret{font-size:8px;color:var(--ink3);}
.sig .arc-open{padding:6px 14px 16px;border-top:1px solid var(--rule);}
.sig .arc-open .sec{margin-bottom:16px;}

/* actions */
.sig .act{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--ink2);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.1));border-radius:4px;padding:6px 9px;cursor:pointer;transition:all .15s;text-transform:uppercase;white-space:nowrap;}
.sig .act:hover{color:var(--ink);border-color:var(--goldborder,rgba(201,168,76,.4));}
.sig .used-btn.on{color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.4));}

@media (max-width:767px){
  .sig{padding:24px 16px 70px;}
  .sig .sig-head{flex-direction:column;}
  .sig .head-right{align-items:flex-start;}
  .sig .platform-grid{grid-template-columns:1fr;}
  .sig .eng-groups{grid-template-columns:1fr;}
  .sig .reels{grid-template-columns:1fr;}
  .sig .standing-row{flex-wrap:wrap;}
  .sig .in:first-child{width:100%;}
  .sig .arc-date{min-width:0;}
}
`
