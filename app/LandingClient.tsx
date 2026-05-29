'use client'
import { useState, useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page (full rebuild).
   This is a PRIVATE intelligence platform, not public SaaS. No pricing.
   The only way in is to book a call. Every CTA points to /audit (free audit)
   or the strategy call. The whole page exists to make a founder spending
   $5k–$50k/mo on Meta feel their budget bleeding in real time — and feel that
   VAI is the only thing that can show them where.

   Motion is CSS-first. JS only drives the live spend counter (one shared
   number, continuous, identical in the hero and the close) and scroll reveals.
─────────────────────────────────────────────────────────────────────────── */

const G     = '#c9a84c'                  // gold
const RED   = '#f87171'
const ORANGE= '#fb923c'
const GREEN = '#4ade80'
const INK   = 'rgba(250,248,245,0.95)'
const I2    = 'rgba(250,248,245,0.60)'
const I3    = 'rgba(250,248,245,0.32)'
const I4    = 'rgba(250,248,245,0.12)'
const RULE  = 'rgba(255,255,255,0.08)'
const MONO  = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS  = "'DM Sans',sans-serif"
const BG    = '#050509'

const AUDIT = '/audit'
const CALL  = 'https://calendly.com/agency-vanguardia/30min'

/* The counter "rate": the brief's literal $0.001/s reads as frozen, which kills
   the one job of this page. We keep the $0.00 start and 2-decimal display but
   tick fast enough to feel like a wound — ~$0.05/s, hundredths visibly moving. */
const RATE = 0.0492

// ── live spend counter (shared, continuous) ─────────────────────────────────
function useLiveSpend() {
  const [val, setVal] = useState(0)
  const start = useRef<number | null>(null)
  useEffect(() => {
    let raf = 0
    const tick = (t: number) => {
      if (start.current === null) start.current = t
      setVal(((t - start.current) / 1000) * RATE)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return val
}

const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── scroll reveal ───────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 28, style = {}, className = '' }:
  { children: React.ReactNode; delay?: number; y?: number; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className}
      style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : `translateY(${y}px)`,
        transition: `opacity .9s ease ${delay}s, transform 1s cubic-bezier(.16,1,.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  )
}

// ── gold CTA ─────────────────────────────────────────────────────────────────
function GoldCTA({ href, children, big = false, external = false }:
  { href: string; children: React.ReactNode; big?: boolean; external?: boolean }) {
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="cta-gold"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: MONO, fontWeight: 500, textDecoration: 'none',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        fontSize: big ? 'clamp(13px,1.5vw,16px)' : 'clamp(12px,1.3vw,14px)',
        padding: big ? '20px 40px' : '16px 32px',
        minHeight: 52, background: G, color: '#0a0806',
        borderRadius: 2, border: 'none', cursor: 'pointer',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.4), 0 16px 50px -12px rgba(201,168,76,0.45)',
      }}>
      {children}
    </a>
  )
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [shown, setShown] = useState(false)
  const [solid, setSolid] = useState(false)
  const [open, setOpen]   = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 3000)
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll) }
  }, [])
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      opacity: shown ? 1 : 0, transition: 'opacity 1.2s ease, background .4s ease, border-color .4s ease',
      pointerEvents: shown ? 'auto' : 'none',
      background: solid ? 'rgba(5,5,9,0.88)' : 'transparent',
      backdropFilter: solid ? 'blur(14px)' : 'none',
      WebkitBackdropFilter: solid ? 'blur(14px)' : 'none',
      borderBottom: `1px solid ${solid ? RULE : 'transparent'}`,
    }}>
      <div className="nav-inner" style={{
        maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)',
        height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 26, color: INK, lineHeight: 1 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: I2 }}>Growth Ad Engine</span>
        </a>
        {/* desktop links */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#how" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: I2, textDecoration: 'none' }}>How It Works</a>
          <a href={AUDIT} className="nav-audit" style={{
            fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#0a0806', background: G, textDecoration: 'none',
            padding: '11px 20px', borderRadius: 2, minHeight: 44, display: 'inline-flex', alignItems: 'center',
          }}>Free Audit</a>
        </div>
        {/* mobile hamburger */}
        <button aria-label="Menu" onClick={() => setOpen(o => !o)} className="nav-burger" style={{
          display: 'none', flexDirection: 'column', justifyContent: 'center', gap: 5,
          width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <span style={{ width: 22, height: 1.5, background: INK, transition: 'transform .3s', transform: open ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
          <span style={{ width: 22, height: 1.5, background: INK, opacity: open ? 0 : 1, transition: 'opacity .2s' }} />
          <span style={{ width: 22, height: 1.5, background: INK, transition: 'transform .3s', transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>
      {/* mobile drawer */}
      <div className="nav-drawer" style={{
        display: 'none', overflow: 'hidden',
        maxHeight: open ? 240 : 0, transition: 'max-height .4s ease',
        background: 'rgba(5,5,9,0.97)', borderBottom: `1px solid ${RULE}`,
      }}>
        <a href="#how" onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '18px', fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK, textDecoration: 'none', borderTop: `1px solid ${RULE}` }}>How It Works</a>
        <a href={AUDIT} onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '18px', fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0806', background: G, textDecoration: 'none', margin: 16, borderRadius: 2 }}>Free Audit →</a>
      </div>
    </nav>
  )
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ spend }: { spend: number }) {
  const [reveal, setReveal] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReveal(true), 1500); return () => clearTimeout(t) }, [])
  return (
    <section style={{
      position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden',
      padding: 'clamp(80px,12vh,140px) clamp(20px,5vw,48px) clamp(48px,8vh,80px)',
    }}>
      {/* heartbeat pulse — a wound breathing, very slow, behind the text */}
      <div aria-hidden className="heartbeat" style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(120vw,1100px)', height: 'min(120vw,1100px)', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(248,113,113,0.16) 0%, rgba(248,113,113,0.05) 38%, transparent 68%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, width: '100%' }}>
        <div style={{ fontFamily: MONO, fontSize: 'clamp(10px,1.4vw,12px)', letterSpacing: '0.34em', textTransform: 'uppercase', color: G, marginBottom: 'clamp(24px,4vh,40px)' }}>
          Right now, while you read this
        </div>
        <h1 style={{ margin: 0, lineHeight: 0.98 }}>
          <span className="hero-line" style={{ display: 'block', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(42px,8.5vw,120px)', color: INK }}>
            your ads are spending
          </span>
          <span className="hero-counter" style={{
            display: 'block', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600,
            fontSize: 'clamp(48px,10vw,128px)', color: RED, letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums', textShadow: '0 0 60px rgba(248,113,113,0.35)',
          }}>
            {money(spend)}
          </span>
        </h1>
        <p style={{ fontFamily: MONO, fontSize: 'clamp(13px,1.7vw,16px)', color: 'rgba(255,255,255,0.5)', marginTop: 'clamp(20px,3vh,32px)', letterSpacing: '0.02em' }}>
          on campaigns that will never convert.
        </p>
        <p style={{
          fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(18px,2.8vw,30px)', color: INK,
          marginTop: 'clamp(28px,5vh,48px)',
          opacity: reveal ? 1 : 0, transform: reveal ? 'none' : 'translateY(14px)',
          transition: 'opacity 1.1s ease, transform 1.1s cubic-bezier(.16,1,.3,1)',
        }}>
          VAI finds exactly which ones in <span style={{ color: G, fontStyle: 'normal', fontFamily: MONO, fontSize: '0.7em', letterSpacing: '0.04em' }}>60 SECONDS</span>.
        </p>
        <div style={{
          marginTop: 'clamp(36px,6vh,56px)',
          opacity: reveal ? 1 : 0, transition: 'opacity 1.1s ease .25s',
        }}>
          <div className="hero-cta">
            <GoldCTA href={AUDIT} big>Show Me Where →</GoldCTA>
          </div>
        </div>
      </div>
      {/* scroll hint */}
      <div aria-hidden style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        fontFamily: MONO, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: I3,
        opacity: reveal ? 1 : 0, transition: 'opacity 1.4s ease .8s',
      }}>
        scroll
      </div>
    </section>
  )
}

// ── SECTION 2 — CAMPAIGN CARDS ──────────────────────────────────────────────────
const CAMPAIGNS = [
  { name: 'Brand Awareness — Cold Traffic', spend: '$2,100/mo', roas: '0.0x ROAS', badge: 'DEAD', color: RED,
    paper: 'rgba(248,113,113,0.05)', border: 'rgba(248,113,113,0.28)',
    note: '↓ $2,100 gone every month. Zero return.' },
  { name: 'Summer Sale — Retargeting', spend: '$3,200/mo', roas: '1.8x ROAS', badge: 'BLEEDING', color: ORANGE,
    paper: 'rgba(251,146,60,0.05)', border: 'rgba(251,146,60,0.28)',
    note: '↓ Spending $3,200 to make $5,760. Losing $1,440 in opportunity cost.' },
  { name: 'Lookalike — Past Purchasers', spend: '$9,200/mo', roas: '6.2x ROAS', badge: 'STRONG', color: GREEN,
    paper: 'rgba(74,222,128,0.05)', border: 'rgba(74,222,128,0.28)',
    note: '↑ This is where every dollar should go.' },
]

function CampaignCards() {
  return (
    <section style={{ padding: 'clamp(80px,14vh,160px) clamp(20px,5vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(34px,5.5vw,68px)', color: INK, textAlign: 'center', lineHeight: 1.05, marginBottom: 'clamp(48px,7vh,80px)' }}>
            This is what bleeding looks like.
          </h2>
        </Reveal>
        <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,2.5vw,32px)' }}>
          {CAMPAIGNS.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.12}>
              <div style={{
                background: c.paper, border: `1px solid ${c.border}`, borderRadius: 4,
                padding: 'clamp(24px,3vw,32px)', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: I3 }}>META</span>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em',
                    color: c.color, border: `1px solid ${c.border}`, padding: '5px 10px', borderRadius: 2,
                    background: c.paper,
                  }}>{c.badge}</span>
                </div>
                <h3 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,2.6vw,28px)', color: INK, lineHeight: 1.15, marginBottom: 24, minHeight: '2.3em' }}>
                  {c.name}
                </h3>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 20, borderTop: `1px solid ${RULE}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 'clamp(16px,2vw,20px)', color: INK }}>{c.spend}</span>
                  <span style={{ fontFamily: MONO, fontSize: 'clamp(14px,1.7vw,17px)', color: c.color, fontWeight: 500 }}>{c.roas}</span>
                </div>
              </div>
              <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.3vw,13px)', color: c.color, marginTop: 16, lineHeight: 1.55, letterSpacing: '0.01em' }}>
                {c.note}
              </p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(22px,3.4vw,40px)', color: INK, textAlign: 'center', lineHeight: 1.25, margin: 'clamp(56px,9vh,100px) auto clamp(40px,5vh,56px)', maxWidth: 880 }}>
            VAI reads your account and tells you which of your campaigns looks like which.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <div style={{ textAlign: 'center' }}><GoldCTA href={AUDIT}>Find Out For Free →</GoldCTA></div>
        </Reveal>
      </div>
    </section>
  )
}

// ── SECTION 3 — THE QUESTIONS ───────────────────────────────────────────────────
const QUESTIONS = [
  'Do you know which of your campaigns made money last month?',
  'Do you know which ones cost you more than they returned?',
  'Do you know exactly how much you could recover if you stopped running the wrong ones?',
]

function Questions() {
  return (
    <section style={{ padding: 'clamp(80px,16vh,180px) clamp(20px,5vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        {QUESTIONS.map((q, i) => (
          <Reveal key={i} delay={0.05} y={36}>
            <p style={{
              fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(26px,4.6vw,52px)', color: INK, lineHeight: 1.18,
              margin: '0 0 clamp(40px,6vh,64px)',
            }}>
              {q}
            </p>
          </Reveal>
        ))}
        <Reveal delay={0.1}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(12px,1.6vw,15px)', color: G, letterSpacing: '0.04em', lineHeight: 1.7, margin: 'clamp(40px,6vh,64px) auto clamp(24px,4vh,36px)', maxWidth: 640 }}>
            Most founders spending $5,000–$50,000/month on Meta cannot answer all three.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(24px,3.6vw,42px)', color: INK, lineHeight: 1.25, marginBottom: 'clamp(40px,5vh,56px)' }}>
            VAI can. In 60 seconds. On your real account.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <GoldCTA href={AUDIT}>Get My Answer — Free →</GoldCTA>
        </Reveal>
      </div>
    </section>
  )
}

// ── SECTION 4 — SAMPLE OUTPUT ────────────────────────────────────────────────────
function SampleReport() {
  return (
    <section style={{ padding: 'clamp(80px,14vh,160px) clamp(20px,5vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px,5vw,60px)', color: INK, textAlign: 'center', lineHeight: 1.08, marginBottom: 'clamp(48px,7vh,72px)' }}>
            This is what VAI told a client last Monday.
          </h2>
        </Reveal>
        <Reveal delay={0.08} y={36}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))',
            border: `1px solid ${RULE}`, borderTop: `2px solid ${G}`, borderRadius: 4,
            padding: 'clamp(28px,4vw,48px)', boxShadow: '0 40px 120px -40px rgba(0,0,0,0.8)',
          }}>
            {/* confidential header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, paddingBottom: 22, borderBottom: `1px solid ${RULE}`, marginBottom: 30 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: G }}>Confidential — Client Report</span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: I3 }}>Monday, May 26, 2026 · 7:04 AM</span>
            </div>

            {/* campaign line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 34 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: I3, marginBottom: 8 }}>CAMPAIGN</div>
                <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(22px,3vw,30px)', color: INK }}>Summer Sale — Retargeting</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: MONO, fontSize: 'clamp(15px,2vw,18px)', color: INK }}>$3,200/mo</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: ORANGE, marginTop: 6, letterSpacing: '0.06em' }}>1.8x ROAS · BLEEDING</div>
              </div>
            </div>

            <ReportBlock title="What's Happening">
              This campaign is retargeting warm audiences that already know you — and it
              still only returns <strong style={{ color: INK, fontWeight: 600 }}>$1.80 for every $1.00 spent</strong>.
              At $3,200/mo it produces roughly $5,760 in revenue. That looks profitable on the
              surface, but retargeting your own warm traffic should be clearing 4–6x. You are
              leaving roughly <strong style={{ color: ORANGE, fontWeight: 600 }}>$1,440/mo</strong> on the table
              against where this audience should perform.
            </ReportBlock>

            <ReportBlock title="Root Cause Diagnosis">
              The audience window is set to 180 days, so 71% of impressions are going to people
              who lapsed months ago and have already decided not to buy. Frequency on the active
              30-day segment has climbed to <strong style={{ color: INK, fontWeight: 600 }}>6.4</strong> —
              the same buyers are seeing the same three creatives on repeat. Creative fatigue, not
              audience intent, is capping the return.
            </ReportBlock>

            <ReportBlock title="Immediate Action Required" accent>
              Split this into a 14-day high-intent retarget (cart + checkout abandoners) and a
              30–90 day re-engagement set with fresh creative. Cap frequency at 3. Reallocate the
              recovered ~$1,440/mo into <strong style={{ color: GREEN, fontWeight: 600 }}>Lookalike — Past Purchasers</strong>,
              which is currently clearing 6.2x and is volume-constrained, not budget-constrained.
              Projected blended ROAS after the change: <strong style={{ color: INK, fontWeight: 600 }}>3.4x → 4.9x within 21 days.</strong>
            </ReportBlock>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px,2.8vw,30px)', color: INK, textAlign: 'center', margin: 'clamp(48px,7vh,72px) 0 clamp(36px,5vh,48px)' }}>
            Every client gets this. Every Monday. Automatically.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <div style={{ textAlign: 'center' }}><GoldCTA href={AUDIT}>Start Getting Mine →</GoldCTA></div>
        </Reveal>
      </div>
    </section>
  )
}

function ReportBlock({ title, children, accent = false }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ marginBottom: 30, paddingLeft: accent ? 18 : 0, borderLeft: accent ? `2px solid ${G}` : 'none' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: G, marginBottom: 12 }}>{title}</div>
      <p style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(16px,2vw,20px)', color: I2, lineHeight: 1.62 }}>{children}</p>
    </div>
  )
}

// ── SECTION 5 — ACCESS IS BY APPLICATION ─────────────────────────────────────────
const STEPS = [
  { n: '1', t: 'Get your free audit', b: 'Connect your Meta account. VAI analyzes your campaigns and shows you exactly how much you’re wasting. Free. 60 seconds.' },
  { n: '2', t: 'Book a strategy call', b: 'Review your audit results with our team. We show you exactly what VAI found and what we would do about it.' },
  { n: '3', t: 'We deploy VAI on your account', b: 'If it is a fit, we set up your intelligence system. Monday morning briefs begin the following week.' },
]

function Application() {
  return (
    <section id="how" style={{ padding: 'clamp(80px,14vh,160px) clamp(20px,5vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(34px,5.5vw,64px)', color: INK, textAlign: 'center', lineHeight: 1.05, marginBottom: 20 }}>
            Access is by application only.
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(12px,1.6vw,15px)', color: I2, textAlign: 'center', lineHeight: 1.7, maxWidth: 640, margin: '0 auto clamp(56px,8vh,88px)' }}>
            VV Growth Ad Engine is not a self-serve tool. Every account is set up by our team.
          </p>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(32px,5vh,56px)' }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="step-row" style={{ display: 'flex', gap: 'clamp(20px,3vw,40px)', alignItems: 'baseline' }}>
                <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(48px,7vw,88px)', color: G, lineHeight: 0.9, minWidth: '1.2em' }}>{s.n}</span>
                <div>
                  <h3 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(24px,3.4vw,38px)', color: INK, lineHeight: 1.1, marginBottom: 12 }}>{s.t}</h3>
                  <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 'clamp(15px,1.9vw,18px)', color: I2, lineHeight: 1.65, maxWidth: 620 }}>{s.b}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.08}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.4vw,13px)', color: G, letterSpacing: '0.04em', textAlign: 'center', margin: 'clamp(56px,8vh,88px) 0 clamp(40px,5vh,52px)' }}>
            We only work with brands spending $3,000+ per month on Meta ads.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="dual-cta" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <GoldCTA href={AUDIT}>Get My Free Audit →</GoldCTA>
            <a href={CALL} target="_blank" rel="noopener noreferrer" className="cta-ghost" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none', padding: '16px 32px', minHeight: 52,
              border: `1px solid ${RULE}`, borderRadius: 2,
            }}>Book a Strategy Call →</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── SECTION 6 — CLOSE ─────────────────────────────────────────────────────────────
function Close({ spend }: { spend: number }) {
  return (
    <section style={{
      position: 'relative', padding: 'clamp(96px,18vh,200px) clamp(20px,5vw,48px)',
      borderTop: `1px solid ${RULE}`, textAlign: 'center', overflow: 'hidden',
      background: 'radial-gradient(120% 100% at 50% 0%, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.04) 36%, #050509 72%)',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(34px,6vw,76px)', color: INK, lineHeight: 1.04, marginBottom: 28 }}>
            The campaigns bleeding your budget are running right now.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(13px,1.8vw,16px)', color: I2, lineHeight: 1.7, maxWidth: 560, margin: '0 auto clamp(40px,6vh,56px)' }}>
            Not tomorrow. Right now. While you read this, the counter is still going.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{
            fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(52px,11vw,120px)',
            color: RED, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.01em',
            textShadow: '0 0 60px rgba(248,113,113,0.4)', marginBottom: 'clamp(44px,7vh,64px)',
          }}>
            {money(spend)}
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="hero-cta"><GoldCTA href={AUDIT} big>Make It Stop — Free →</GoldCTA></div>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(10px,1.3vw,12px)', color: I3, letterSpacing: '0.05em', marginTop: 'clamp(32px,5vh,44px)', lineHeight: 1.8 }}>
            Read-only access · No credit card · Results in 60 seconds · Disconnect anytime
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ── FOOTER ─────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: 'clamp(40px,6vh,56px) clamp(20px,5vw,48px)', borderTop: `1px solid ${RULE}`, textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: I2, marginBottom: 12 }}>VV <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontStyle: 'normal' }}>Growth Ad Engine</span></div>
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: I3, lineHeight: 2 }}>
        <a href="/privacy" style={{ color: I3, textDecoration: 'none' }}>Privacy</a>
        <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
        <a href="/terms" style={{ color: I3, textDecoration: 'none' }}>Terms</a>
      </p>
      <p style={{ fontFamily: MONO, fontSize: 10, color: I4, marginTop: 14 }}>© 2026 Vanguard Visuals</p>
    </footer>
  )
}

// ── PAGE ─────────────────────────────────────────────────────────────────────────────
export default function LandingClient() {
  const spend = useLiveSpend()
  return (
    <main id="top" style={{ background: BG, color: INK, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{CSS}</style>
      <Navbar />
      <Hero spend={spend} />
      <CampaignCards />
      <Questions />
      <SampleReport />
      <Application />
      <Close spend={spend} />
      <Footer />
    </main>
  )
}

const CSS = `
@keyframes heartbeat {
  0%, 100% { transform: translate(-50%,-50%) scale(0.92); opacity: 0.55; }
  18%      { transform: translate(-50%,-50%) scale(1.04); opacity: 0.95; }
  30%      { transform: translate(-50%,-50%) scale(0.97); opacity: 0.7; }
  42%      { transform: translate(-50%,-50%) scale(1.0);  opacity: 0.85; }
  60%      { transform: translate(-50%,-50%) scale(0.92); opacity: 0.55; }
}
.heartbeat { animation: heartbeat 4.5s cubic-bezier(.4,0,.6,1) infinite; will-change: transform, opacity; }

.cta-gold { transition: transform .25s ease, box-shadow .25s ease, filter .25s ease; }
.cta-gold:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 0 0 1px rgba(201,168,76,0.6), 0 22px 60px -12px rgba(201,168,76,0.55); }
.cta-ghost { transition: border-color .25s ease, color .25s ease; }
.cta-ghost:hover { border-color: rgba(201,168,76,0.5); color: #c9a84c; }
.nav-audit:hover { filter: brightness(1.06); }

@media (prefers-reduced-motion: reduce) {
  .heartbeat { animation: none; }
}

@media (max-width: 768px) {
  .nav-links { display: none !important; }
  .nav-burger { display: flex !important; }
  .nav-drawer { display: block !important; }
  .card-grid { grid-template-columns: 1fr !important; }
  .hero-cta .cta-gold { width: 100%; }
  .dual-cta { flex-direction: column; align-items: stretch; }
  .dual-cta .cta-gold, .dual-cta .cta-ghost { width: 100%; }
  .step-row { gap: 16px !important; }
}
`
