'use client'
import { useState, useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page.
   Goal: a stranger understands the product in 3s, it feels investor-grade,
   there is one obvious CTA, and the prospect feels the pain + the fix.

   Positioning learned from Northbeam / Triple Whale / Madgicx / Motion /
   Supermetrics: a clear benefit headline + concrete capability subhead, a
   short "Connect → Analyze → Act" explanation, honest credibility signals,
   and one CTA repeated everywhere. Fused with our language: dark #050509,
   Cormorant Garamond, DM Mono, gold, and the live waste counter.
   Every primary CTA → /audit. Credibility claims are true (Claude-powered,
   Meta Marketing API, read-only) — no fabricated logos or testimonials.
─────────────────────────────────────────────────────────────────────────── */

const G     = '#c9a84c'
const RED   = '#f87171'
const ORANGE= '#fb923c'
const GREEN = '#4ade80'
const INK   = 'rgba(250,248,245,0.95)'
const I2    = 'rgba(250,248,245,0.62)'
const I3    = 'rgba(250,248,245,0.40)'
const RULE  = 'rgba(255,255,255,0.07)'
const MONO  = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS  = "'DM Sans',sans-serif"
const BG    = '#050509'

const AUDIT = '/audit'
const CALL  = 'https://calendly.com/agency-vanguardia/30min'

const RATE = 0.05   // $0.05 / second, shared continuous counter

// ── live waste counter (shared, continuous) ─────────────────────────────────
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
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.18 })
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

// ── CTAs ────────────────────────────────────────────────────────────────────
function GoldCTA({ children, big = false }: { children: React.ReactNode; big?: boolean }) {
  return (
    <a href={AUDIT} className="cta-gold" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MONO, fontWeight: 700, fontSize: big ? 12 : 11, letterSpacing: '0.14em',
      textTransform: 'uppercase', textDecoration: 'none', color: '#0a0806', background: G,
      borderRadius: 3, padding: big ? '20px 38px' : '17px 32px', minHeight: 48,
      boxShadow: '0 16px 50px -16px rgba(201,168,76,0.5)',
    }}>{children}</a>
  )
}
function GhostCTA({ children, href = CALL }: { children: React.ReactNode; href?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="cta-ghost" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
      textDecoration: 'none', color: INK, padding: '17px 28px', minHeight: 48,
      border: `1px solid ${RULE}`, borderRadius: 3,
    }}>{children}</a>
  )
}

// ── NAVBAR — fades in at 3s / on scroll, blurs on scroll ──────────────────────
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
      background: solid ? 'rgba(5,5,9,0.72)' : 'transparent',
      backdropFilter: solid ? 'blur(16px)' : 'none', WebkitBackdropFilter: solid ? 'blur(16px)' : 'none',
      borderBottom: `1px solid ${solid ? RULE : 'transparent'}`,
    }}>
      <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: INK, lineHeight: 1 }}>VV</span>
        <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3 }}>Growth Ad Engine</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <a href="#how" className="nav-how" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: I2, textDecoration: 'none' }}>How It Works</a>
        <a href={AUDIT} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0806', background: G, textDecoration: 'none', padding: '10px 16px', borderRadius: 3, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Free Audit →</a>
      </div>
    </nav>
  )
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ spend }: { spend: number }) {
  return (
    <section style={{
      position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: 'clamp(96px,14vh,140px) clamp(20px,6vw,48px) clamp(56px,8vh,88px)',
    }}>
      <span style={{ position: 'absolute', top: 'clamp(20px,4vh,30px)', left: 'clamp(20px,5vw,40px)', fontFamily: SERIF, fontStyle: 'italic', fontSize: 28, color: INK, lineHeight: 1 }}>VV</span>

      <div style={{ maxWidth: 980, width: '100%' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: G }}>
          AI Ad Intelligence for Meta
        </div>

        <h1 style={{ margin: '32px 0 0', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(40px,7.5vw,88px)', color: INK, lineHeight: 1.06 }}>
          Your Meta ads are losing money.
          <br /><span style={{ color: G }}>VAI finds exactly which campaigns</span> — in 60 seconds.
        </h1>

        <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 'clamp(15px,2vw,19px)', color: I2, lineHeight: 1.6, margin: '28px auto 0', maxWidth: 640 }}>
          VAI is an AI ad analyst that reads your Meta account, finds the campaigns burning your
          budget, and tells you exactly what to do — delivered every Monday at 7AM.
        </p>

        {/* live waste meter — labeled so it reads clearly, not cryptically */}
        <div style={{ margin: '36px auto 0', display: 'inline-flex', alignItems: 'center', gap: 14, padding: '12px 20px', border: `1px solid ${RULE}`, borderRadius: 100, background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: I3 }}>
            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: RED }} />
            Wasted while you’ve read this
          </span>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 16, color: RED, fontVariantNumeric: 'tabular-nums' }}>{money(spend)}</span>
        </div>

        <div style={{ marginTop: 36 }}>
          <div className="cta-row" style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <GoldCTA big>Get My Free Audit →</GoldCTA>
            <GhostCTA>Book a Strategy Call →</GhostCTA>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', color: I3, marginTop: 20 }}>
            Powered by Claude · Meta Marketing API · Read-only access · No credit card
          </p>
        </div>
      </div>
    </section>
  )
}

// ── CREDIBILITY BAR ─────────────────────────────────────────────────────────────
const CRED = [
  ['Every campaign', 'analyzed, ranked by ROAS'],
  ['60 seconds', 'from connect to first finding'],
  ['Read-only', 'official Meta Marketing API'],
  ['Powered by Claude', 'enterprise-grade analysis'],
]
function Credibility() {
  return (
    <section style={{ padding: 'clamp(40px,7vh,72px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
      <div className="cred-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
        {CRED.map(([big, small]) => (
          <div key={big} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px,2.6vw,28px)', color: G }}>{big}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em', color: I3, marginTop: 6, lineHeight: 1.5 }}>{small}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── CARDS — what VAI sees ─────────────────────────────────────────────────────────
const CARDS = [
  { badge: 'DEAD', color: RED, name: 'Brand Awareness — Cold', big: '$2,100', meta: 'per month · 0.0x ROAS', foot: 'Gone. Every month.' },
  { badge: 'BLEEDING', color: ORANGE, name: 'Summer Sale — Retargeting', big: '$3,200', meta: 'per month · 1.8x ROAS', foot: 'Spending more than it returns.' },
  { badge: 'STRONG', color: GREEN, name: 'Lookalike — Past Purchasers', big: '6.2x', meta: 'per month · $9,200 spend', foot: 'This is what good looks like.' },
]
function Cards() {
  return (
    <section style={{ padding: 'clamp(96px,15vh,180px) clamp(20px,6vw,48px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: G }}>What VAI sees in your account</div>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(30px,4.6vw,56px)', color: INK, lineHeight: 1.1, margin: '20px 0 clamp(40px,6vh,64px)' }}>
            Every campaign, sorted into winners and leaks.
          </h2>
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
                <div style={{ fontFamily: MONO, fontSize: 8, color: I3 }}>{c.meta}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 'auto', paddingTop: 28 }}>{c.foot}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(18px,2.4vw,24px)', color: I2, margin: '48px auto 36px', maxWidth: 620 }}>
            VAI tells you which is which — and what to do about it. In 60 seconds.
          </p>
        </Reveal>
        <Reveal delay={0.05}><GoldCTA>See Mine — Free →</GoldCTA></Reveal>
      </div>
    </section>
  )
}

// ── HOW IT WORKS — Connect → Analyze → Act ─────────────────────────────────────────
const STEPS = [
  { n: '01', t: 'Connect', h: 'Link your Meta account.', b: 'Secure, read-only access through the official Meta Marketing API. Takes about a minute. No credit card.' },
  { n: '02', t: 'Analyze', h: 'VAI reads every campaign.', b: 'It ranks spend by ROAS, flags the campaigns losing money, and diagnoses the root cause of each leak.' },
  { n: '03', t: 'Act', h: 'Get a brief every Monday.', b: 'Exactly what to pause, what to scale, and where to move the budget — in plain language, at 7AM.' },
]
function HowItWorks() {
  return (
    <section id="how" style={{ padding: 'clamp(96px,15vh,180px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: G }}>How it works</div>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(30px,4.6vw,56px)', color: INK, textAlign: 'center', lineHeight: 1.1, margin: '20px 0 clamp(48px,7vh,80px)' }}>
            From connected to clear in 60 seconds.
          </h2>
        </Reveal>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(28px,4vw,48px)' }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: G, letterSpacing: '0.1em' }}>{s.n}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: I3 }}>{s.t}</span>
                </div>
                <h3 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,2.8vw,30px)', color: INK, lineHeight: 1.15, marginBottom: 12 }}>{s.h}</h3>
                <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 15, color: I2, lineHeight: 1.65 }}>{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── SAMPLE REPORT — the proof ─────────────────────────────────────────────────────
function Report() {
  return (
    <section style={{ padding: 'clamp(96px,15vh,180px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: G }}>The Monday brief</div>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(28px,4.2vw,50px)', color: INK, lineHeight: 1.1, margin: '20px 0 clamp(40px,6vh,56px)' }}>
            This is what VAI told a client last Monday.
          </h2>
        </Reveal>
        <Reveal delay={0.08} y={32}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `1px solid ${G}`, borderRadius: 4, padding: 'clamp(24px,4vw,36px)', textAlign: 'left', boxShadow: '0 40px 120px -50px rgba(0,0,0,0.85)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: I3, paddingBottom: 18, borderBottom: `1px solid ${RULE}`, marginBottom: 20 }}>
              <span style={{ color: G }}>Confidential · Client Report</span>
              <span>Monday · 7:04 AM</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em', color: I3 }}>
              Summer Sale — Retargeting · Meta · $3,200/mo · 1.8x ROAS · Bleeding
            </div>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(14px,1.8vw,16px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, margin: '18px 0 0' }}>
              This retargeting campaign is hemorrhaging budget against warm audiences that have
              clearly stopped responding. You are spending $177 to acquire a customer on a $320
              AOV — the math does not work.
            </p>
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: G, margin: '22px 0 8px' }}>Immediate action</div>
            <p style={{ fontFamily: MONO, fontSize: 12, color: INK, lineHeight: 1.6 }}>
              Pause this campaign. Move the $3,200 to Lookalike — Past Purchasers.
            </p>
            <div style={{ position: 'relative', height: 84, marginTop: 12 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, background: 'linear-gradient(to bottom, transparent, #0a0a0e 80%)' }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Root cause · 30-day projection · exact reallocation percentages →</span>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: MONO, fontSize: 9, color: I3, margin: '28px 0 36px', letterSpacing: '0.04em' }}>Every client receives this brief. Every Monday. 7AM. Automatically.</p>
        </Reveal>
        <Reveal delay={0.05}><GoldCTA>Start Getting Mine — Free →</GoldCTA></Reveal>
      </div>
    </section>
  )
}

// ── WHO IT'S FOR + ACCESS (business model legibility) ────────────────────────────────
function Access() {
  return (
    <section style={{ padding: 'clamp(96px,15vh,180px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: G }}>How access works</div>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(28px,4.2vw,50px)', color: INK, lineHeight: 1.1, margin: '20px 0 16px' }}>
            Built for brands that take ad spend seriously.
          </h2>
          <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: I2, lineHeight: 1.6, maxWidth: 560, margin: '0 auto clamp(48px,7vh,72px)' }}>
            VV Growth Ad Engine is a done-for-you intelligence system for DTC brands and agencies. The audit is free — the system is set up by our team.
          </p>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
          {[
            ['Get your free audit.', 'Connect your Meta account and see exactly what you’re losing. Free, in 60 seconds.'],
            ['Book a strategy call.', 'Review what VAI found with our team and what we’d do about it.'],
            ['We build your system.', 'If it’s a fit, we deploy VAI on your account. Monday briefs begin the following week.'],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.1}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
                <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: G, lineHeight: 1, minWidth: '1.1em' }}>{i + 1}</span>
                <div>
                  <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(22px,2.6vw,28px)', color: INK, marginBottom: 8 }}>{t}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: I3, lineHeight: 1.6 }}>{b}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.05}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: G, margin: 'clamp(48px,7vh,72px) 0 36px' }}>
            For brands spending $3,000+ per month on Meta ads
          </div>
          <div className="cta-row" style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <GoldCTA>Get My Free Audit →</GoldCTA>
            <GhostCTA>Book a Strategy Call →</GhostCTA>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── CLOSE ───────────────────────────────────────────────────────────────────────────
function Close({ spend }: { spend: number }) {
  return (
    <section style={{
      padding: 'clamp(110px,18vh,200px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}`,
      textAlign: 'center', background: 'radial-gradient(120% 100% at 50% 0%, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.04) 38%, #050509 74%)',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(36px,6.5vw,76px)', color: INK, lineHeight: 1.06 }}>
            The counter hasn’t stopped.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: I2, margin: '24px auto 0', maxWidth: 480 }}>
            Find out exactly which of your campaigns is doing this — in 60 seconds, for free.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(44px,10vw,108px)', color: RED, fontVariantNumeric: 'tabular-nums', lineHeight: 1, margin: '28px 0 40px', textShadow: '0 0 60px rgba(248,113,113,0.35)' }}>
            {money(spend)}
          </div>
        </Reveal>
        <Reveal delay={0.05}><div className="cta-row"><GoldCTA big>Make It Stop — Free →</GoldCTA></div></Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontFamily: MONO, fontSize: 9, color: I3, marginTop: 28, letterSpacing: '0.06em' }}>Read-only access · No credit card · Results in 60 seconds</p>
        </Reveal>
      </div>
    </section>
  )
}

// ── FOOTER ───────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: 'clamp(40px,6vh,56px) clamp(20px,6vw,48px)', borderTop: `1px solid ${RULE}`, textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: I2, marginBottom: 12 }}>
        VV <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'normal' }}>Growth Ad Engine</span>
      </div>
      <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em', color: I3, lineHeight: 2 }}>
        <a href="/privacy" style={{ color: I3, textDecoration: 'none' }}>Privacy</a>
        <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
        <a href="/terms" style={{ color: I3, textDecoration: 'none' }}>Terms</a>
      </p>
      <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(250,248,245,0.18)', marginTop: 12 }}>© 2026 Vanguard Visuals</p>
    </footer>
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
      <Credibility />
      <Cards />
      <HowItWorks />
      <Report />
      <Access />
      <Close spend={spend} />
      <Footer />
    </main>
  )
}

const CSS = `
@keyframes livepulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
.live-dot { animation: livepulse 1.6s ease-in-out infinite; }

.cta-gold { transition: transform .25s ease, box-shadow .25s ease, filter .25s ease; }
.cta-gold:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 22px 60px -16px rgba(201,168,76,0.6); }
.cta-ghost { transition: border-color .25s ease, color .25s ease; }
.cta-ghost:hover { border-color: rgba(201,168,76,0.45); color: #c9a84c; }
.nav-how:hover { color: rgba(250,248,245,0.95); }

@media (prefers-reduced-motion: reduce) { .live-dot { animation: none; } }

@media (max-width: 860px) {
  .cred-grid { grid-template-columns: repeat(2,1fr) !important; gap: 28px !important; }
  .steps-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 768px) {
  .card-grid { grid-template-columns: 1fr !important; }
  .nav-how { display: none !important; }
  .cta-row { flex-direction: column; align-items: stretch; width: 100%; }
  .cta-row .cta-gold, .cta-row .cta-ghost { width: 100%; }
}
`
