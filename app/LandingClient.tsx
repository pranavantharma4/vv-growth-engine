'use client'
import { useState, useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page.
   Minimal by design. Stripe / Linear / Superhuman / Vercel restraint:
   one idea per section, massive breathing room, type + space + the counter.
   No lists, no social proof, one CTA per section. Every CTA → /audit.
   The only motion is the live spend counter (one shared, continuous number)
   and quiet scroll reveals.
─────────────────────────────────────────────────────────────────────────── */

const G     = '#c9a84c'                  // gold
const RED   = '#f87171'
const ORANGE= '#fb923c'
const GREEN = '#4ade80'
const INK   = 'rgba(250,248,245,0.95)'
const RULE  = 'rgba(255,255,255,0.06)'
const MONO  = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const BG    = '#050509'

const AUDIT = '/audit'

const RATE = 0.05   // $0.05 per second, per brief

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
function Reveal({ children, delay = 0, y = 24, style = {} }:
  { children: React.ReactNode; delay?: number; y?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref}
      style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : `translateY(${y}px)`,
        transition: `opacity 1s ease ${delay}s, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  )
}

// ── buttons ──────────────────────────────────────────────────────────────────
function GoldButton({ children, big = false }: { children: React.ReactNode; big?: boolean }) {
  return (
    <a href={AUDIT} className="cta-gold" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MONO, fontWeight: 700, fontSize: big ? 11 : 10, letterSpacing: '2px',
      textTransform: 'uppercase', textDecoration: 'none',
      color: '#0a0806', background: G, borderRadius: 2,
      padding: big ? '20px 36px' : '17px 30px', minHeight: 48,
      boxShadow: '0 16px 50px -16px rgba(201,168,76,0.5)',
    }}>{children}</a>
  )
}

// ── NAVBAR — fades in at 3s, blurs on scroll ──────────────────────────────────
function Navbar() {
  const [shown, setShown] = useState(false)
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 40) { setSolid(true); setShown(true) } else setSolid(false) }
    const t = setTimeout(() => setShown(true), 3000)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll) }
  }, [])
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(20px,5vw,48px)',
      opacity: shown ? 1 : 0, pointerEvents: shown ? 'auto' : 'none',
      transition: 'opacity 1.2s ease, background .4s ease, border-color .4s ease',
      background: solid ? 'rgba(5,5,9,0.7)' : 'transparent',
      backdropFilter: solid ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: solid ? 'blur(16px)' : 'none',
      borderBottom: `1px solid ${solid ? RULE : 'transparent'}`,
    }}>
      <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: INK, lineHeight: 1 }}>VV</span>
        <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Growth Ad Engine</span>
      </a>
      <a href={AUDIT} style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: G, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 4px' }}>Free Audit →</a>
    </nav>
  )
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ spend }: { spend: number }) {
  return (
    <section style={{
      position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: 'clamp(80px,12vh,120px) clamp(20px,6vw,48px)',
    }}>
      {/* corner mark — the entire navbar, for now */}
      <span style={{ position: 'absolute', top: 'clamp(20px,4vh,32px)', left: 'clamp(20px,5vw,40px)', fontFamily: SERIF, fontStyle: 'italic', fontSize: 28, color: INK, lineHeight: 1 }}>VV</span>

      <div style={{ maxWidth: 1000, width: '100%' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '4px', textTransform: 'uppercase', color: G }}>
          Vanguard Visuals · Growth Ad Engine
        </div>
        <h1 style={{ margin: '40px 0 0', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(44px,10vw,108px)', color: INK, lineHeight: 1.05 }}>
          <span style={{ display: 'block' }}>Your ads are losing</span>
          <span style={{ display: 'block', color: RED, fontWeight: 600, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 60px rgba(248,113,113,0.3)' }}>{money(spend)}</span>
          <span style={{ display: 'block' }}>right now.</span>
        </h1>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.45)', margin: '48px 0 0' }}>
          We find it. You keep it.
        </p>
        <div style={{ marginTop: 40 }}>
          <div className="cta-wrap"><GoldButton>Find My Leak — Free</GoldButton></div>
        </div>
      </div>
    </section>
  )
}

// ── SECTION 2 — one question ────────────────────────────────────────────────────
function Question() {
  return (
    <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(120px,18vh,200px) clamp(20px,6vw,48px)' }}>
      <Reveal>
        <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(36px,6vw,72px)', color: INK, lineHeight: 1.12, maxWidth: 900 }}>
          Do you know which of your<br />campaigns lost money<br />last month?
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: G, marginTop: 48 }}>Most don’t.</p>
      </Reveal>
    </section>
  )
}

// ── SECTION 3 — three cards ──────────────────────────────────────────────────────
const CARDS = [
  { badge: 'DEAD', color: RED, name: 'Brand Awareness — Cold', big: '$2,100', meta: 'per month · 0.0x ROAS', foot: 'Gone. Every month.' },
  { badge: 'BLEEDING', color: ORANGE, name: 'Summer Sale — Retargeting', big: '$3,200', meta: 'per month · 1.8x ROAS', foot: 'Spending more than it returns.' },
  { badge: 'STRONG', color: GREEN, name: 'Lookalike — Past Purchasers', big: '6.2x', meta: 'per month · $9,200 spend', foot: 'This is what good looks like.' },
]

function Cards() {
  return (
    <section style={{ padding: 'clamp(120px,18vh,200px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '3px', textTransform: 'uppercase', color: G, marginBottom: 32 }}>What VAI sees in your account</div>
        </Reveal>
        <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, textAlign: 'left' }}>
          {CARDS.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.1}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 28, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                  <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.16em', color: c.color }}>{c.badge}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: INK }}>{c.name}</div>
                <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 42, color: c.color, lineHeight: 1, margin: '20px 0 6px' }}>{c.big}</div>
                <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{c.meta}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 'auto', paddingTop: 28 }}>{c.foot}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: 'rgba(255,255,255,0.6)', margin: '48px auto 40px', maxWidth: 600 }}>
            VAI tells you which is which. In 60 seconds.
          </p>
        </Reveal>
        <Reveal delay={0.05}><GoldButton>See Mine →</GoldButton></Reveal>
      </div>
    </section>
  )
}

// ── SECTION 4 — sample report ─────────────────────────────────────────────────────
function Report() {
  return (
    <section style={{ padding: 'clamp(120px,18vh,200px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '3px', textTransform: 'uppercase', color: G, marginBottom: 24 }}>Monday · 7:04 AM · Client Report</div>
        </Reveal>
        <Reveal delay={0.08} y={32}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `1px solid ${G}`, borderRadius: 4, padding: 36, textAlign: 'left' }}>
            <div style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '2px', color: 'rgba(255,255,255,0.35)' }}>
              Summer Sale — Retargeting · Meta · $3,200/mo · 1.8x ROAS · Bleeding
            </div>
            <p style={{ fontFamily: SERIF, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.85, margin: '20px 0 0' }}>
              This retargeting campaign is hemorrhaging budget against warm audiences that have clearly stopped responding. You are spending $177 to acquire a customer on a $320 AOV — the math does not work.
            </p>
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', color: G, margin: '20px 0 0' }}>Immediate Action</div>
            <p style={{ fontFamily: MONO, fontSize: 11, color: INK, lineHeight: 1.6, margin: '8px 0 0' }}>
              Pause this campaign. Move the $3,200 to Lookalike — Past Purchasers.
            </p>
            {/* locked continuation */}
            <div style={{ position: 'relative', height: 80, marginTop: 12 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, background: 'linear-gradient(to bottom, transparent, #050509 78%)' }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Root cause · 30-day projection · exact reallocation percentages →</span>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '32px 0 40px' }}>Every client receives this. Every Monday. 7AM.</p>
        </Reveal>
        <Reveal delay={0.05}><GoldButton>Start Getting Mine →</GoldButton></Reveal>
      </div>
    </section>
  )
}

// ── SECTION 5 — access ─────────────────────────────────────────────────────────────
const STEPS = [
  { t: 'Get your free audit.', b: 'Connect your Meta account. See your number. Free.' },
  { t: 'Book a strategy call.', b: 'Review what VAI found with our team.' },
  { t: 'We build your system.', b: 'Monday briefs begin the following week.' },
]

function Access() {
  return (
    <section id="how" style={{ padding: 'clamp(120px,18vh,200px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {STEPS.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.1}>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 28, color: INK }}>{s.t}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 12, letterSpacing: '0.02em' }}>{s.b}</div>
          </Reveal>
        ))}
        <Reveal delay={0.05}>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: G, marginTop: 8 }}>For brands spending $3,000+ per month on Meta ads</div>
        </Reveal>
      </div>
    </section>
  )
}

// ── SECTION 6 — close ───────────────────────────────────────────────────────────────
function Close({ spend }: { spend: number }) {
  return (
    <section style={{
      padding: 'clamp(120px,20vh,220px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}`,
      textAlign: 'center', background: 'radial-gradient(120% 100% at 50% 0%, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.04) 38%, #050509 74%)',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(40px,7vw,80px)', color: INK, lineHeight: 1.06 }}>
            The counter hasn’t stopped.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(44px,10vw,108px)', color: RED, fontVariantNumeric: 'tabular-nums', lineHeight: 1, margin: '32px 0 40px', textShadow: '0 0 60px rgba(248,113,113,0.35)' }}>
            {money(spend)}
          </div>
        </Reveal>
        <Reveal delay={0.05}><div className="cta-wrap"><GoldButton big>Make It Stop — Free →</GoldButton></div></Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 32, letterSpacing: '0.04em' }}>Read-only access · No credit card · 60 seconds</p>
        </Reveal>
      </div>
    </section>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────────────
export default function LandingClient() {
  const spend = useLiveSpend()
  return (
    <main id="top" style={{ background: BG, color: INK, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{CSS}</style>
      <Navbar />
      <Hero spend={spend} />
      <Question />
      <Cards />
      <Report />
      <Access />
      <Close spend={spend} />
    </main>
  )
}

const CSS = `
.cta-gold { transition: transform .25s ease, box-shadow .25s ease, filter .25s ease; }
.cta-gold:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 22px 60px -16px rgba(201,168,76,0.6); }

@media (max-width: 768px) {
  .card-grid { grid-template-columns: 1fr !important; }
  .cta-wrap .cta-gold { width: 100%; }
}
`
