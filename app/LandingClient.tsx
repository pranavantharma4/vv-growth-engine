'use client'
import { useState, useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page.
   One job: make the visitor feel they're hemorrhaging ad spend right now,
   and that the free VV Ad Vision Drop (/audit) is the thing that stops it.
   Pure-CSS animation, lazy reveals below the fold, fully responsive.
─────────────────────────────────────────────────────────────────────────── */

const G = '#c9a84c'
const RED = '#f87171'
const GREEN = '#4ade80'
const INK = 'rgba(245,243,239,0.95)'
const I2 = 'rgba(245,243,239,0.6)'
const I3 = 'rgba(245,243,239,0.3)'
const I4 = 'rgba(245,243,239,0.12)'
const RULE = 'rgba(255,255,255,0.08)'
const CARD = 'rgba(255,255,255,0.025)'
const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"

// ── lazy reveal on scroll ──────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity .8s ease ${delay}s, transform .9s cubic-bezier(.16,1,.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  )
}

// ── count-up stat ──────────────────────────────────────────────────────────
function CountUp({ target, decimals = 0, prefix = '', suffix = '', duration = 1700 }: { target: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const ran = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true
        const start = performance.now()
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(target * eased)
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

const ANALYSIS_TEXT =
  'Root cause: audience frequency has exceeded 3.4x. Creative fatigue confirmed. This campaign has generated $0 in net profit over the last 14 days.'

export default function LandingClient() {
  const [mounted, setMounted] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [navStuck, setNavStuck] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // leak visualizer state machine: 0 bleeding card → 1 diagnosis → 2 recoverable
  const [viz, setViz] = useState(0)
  const [spend, setSpend] = useState(3186)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    setMounted(true)
    const navTimer = setTimeout(() => setNavVisible(true), 2000)
    const onScroll = () => {
      setNavStuck(window.scrollY > 30)
      if (window.scrollY > 8) setNavVisible(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const vizTimer = setInterval(() => setViz((s) => (s + 1) % 3), 2800)
    return () => { clearTimeout(navTimer); clearInterval(vizTimer); window.removeEventListener('scroll', onScroll) }
  }, [])

  // bleeding spend ticks up only while the bleeding card is showing
  useEffect(() => {
    if (viz === 0) setSpend(3186)
    if (viz !== 0) return
    const id = setInterval(() => setSpend((s) => s + Math.round(Math.random() * 6 + 2)), 620)
    return () => clearInterval(id)
  }, [viz])

  // diagnosis types out like a terminal while state 1 is showing
  useEffect(() => {
    if (viz !== 1) { setTyped(''); return }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setTyped(ANALYSIS_TEXT.slice(0, i))
      if (i >= ANALYSIS_TEXT.length) clearInterval(id)
    }, 22)
    return () => clearInterval(id)
  }, [viz])

  if (!mounted) return null

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString()
  const scrollTo = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }

  return (
    <div style={{ background: '#050509', color: INK, fontFamily: SANS, overflowX: 'hidden', minHeight: '100vh', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#050509;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);}

        @keyframes breathe{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:.85;transform:translate(-50%,-50%) scale(1.2)}}
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes heroIn{0%{opacity:0;transform:translateY(26px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes redToGold{0%{color:${RED};text-shadow:0 0 30px rgba(248,113,113,.35)}45%{color:${RED};text-shadow:0 0 30px rgba(248,113,113,.35)}100%{color:${G};text-shadow:0 0 30px rgba(201,168,76,.4)}}
        @keyframes bleedPulse{0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,.0)}50%{box-shadow:0 0 0 1px rgba(248,113,113,.25)}}

        .gold-glow{position:absolute;top:38%;left:50%;width:90vw;max-width:1100px;height:90vw;max-height:1100px;border-radius:50%;
          background:radial-gradient(circle,rgba(201,168,76,.16) 0%,rgba(201,168,76,.05) 38%,transparent 68%);
          filter:blur(14px);pointer-events:none;z-index:0;animation:breathe 9s ease-in-out infinite;}

        .btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:${G};color:#050509;border:none;cursor:pointer;
          font-family:${MONO};font-weight:600;letter-spacing:1.2px;font-size:13px;text-transform:uppercase;text-decoration:none;
          padding:17px 32px;border-radius:3px;min-height:44px;transition:transform .2s,box-shadow .2s,background .2s;}
        .btn-primary:hover{background:#d8b659;transform:translateY(-2px);box-shadow:0 14px 36px -8px rgba(201,168,76,.55);}
        .btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:${INK};cursor:pointer;
          font-family:${MONO};font-weight:500;letter-spacing:1.2px;font-size:13px;text-transform:uppercase;text-decoration:none;
          padding:17px 30px;border-radius:3px;min-height:44px;border:1px solid ${RULE};transition:border-color .2s,color .2s,background .2s;}
        .btn-ghost:hover{border-color:rgba(201,168,76,.45);color:${G};background:rgba(201,168,76,.04);}

        .nav-link{font-family:${MONO};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${I3};text-decoration:none;transition:color .2s;cursor:pointer;}
        .nav-link:hover{color:${INK};}

        .outcome-card,.price-card{transition:border-color .25s,box-shadow .25s,transform .25s,background .25s;}
        .outcome-card:hover{border-color:rgba(201,168,76,.4)!important;box-shadow:0 0 40px -12px rgba(201,168,76,.4);transform:translateY(-3px);}
        .price-card:hover{border-color:rgba(201,168,76,.32)!important;transform:translateY(-3px);}

        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
        .pricing-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
        .sec{padding:120px 52px;}
        .hero-title{font-size:clamp(56px,9.5vw,110px);}
        .hamburger{display:none;}

        @media(max-width:980px){
          .pricing-row{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;gap:14px;padding:4px 0 16px;margin:0 -8px;}
          .pricing-row > *{flex:0 0 78%;scroll-snap-align:center;}
        }
        @media(max-width:860px){
          .grid-3{grid-template-columns:1fr;}
          .nav-links{display:none!important;}
          .hamburger{display:flex!important;}
          .sec{padding:84px 22px!important;}
          .hero-pad{padding:0 22px 90px!important;}
          .hero-title{font-size:clamp(42px,11vw,72px)!important;}
          .cta-row{flex-direction:column!important;align-items:stretch!important;}
          .cta-row a{width:100%;}
          .stats-row{gap:22px!important;}
          .demo-grid{grid-template-columns:1fr!important;}
          .close-title{font-size:clamp(38px,9vw,64px)!important;}
        }
        @media(max-width:420px){
          .stats-row{flex-direction:column;align-items:flex-start!important;}
        }
      `}</style>

      {/* ░░ NAVBAR ░░ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        opacity: navVisible ? 1 : 0, pointerEvents: navVisible ? 'all' : 'none',
        transform: navVisible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity .6s ease, transform .6s ease, background .4s, border-color .4s',
        borderBottom: `1px solid ${navStuck ? RULE : 'transparent'}`, background: navStuck ? 'rgba(5,5,9,0.92)' : 'transparent', backdropFilter: navStuck ? 'blur(18px)' : 'none' }}>
        <a href="#top" onClick={scrollTo('top')} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, fontStyle: 'italic', letterSpacing: 1.5, color: INK }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2px', textTransform: 'uppercase' }}>Growth Ad Engine</span>
        </a>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          <a className="nav-link" onClick={scrollTo('how')}>How It Works</a>
          <a className="nav-link" onClick={scrollTo('pricing')}>Pricing</a>
          <a className="nav-link" href="/login">Sign In</a>
          <a className="btn-primary" href="/audit" style={{ padding: '10px 20px', fontSize: 10 }}>Free Audit →</a>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen((m) => !m)} aria-label="Menu" style={{ background: 'transparent', border: `1px solid ${RULE}`, borderRadius: 4, width: 44, height: 44, cursor: 'pointer', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 18, height: 1.5, background: INK, transition: 'transform .25s', transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
          <span style={{ width: 18, height: 1.5, background: INK, opacity: menuOpen ? 0 : 1, transition: 'opacity .2s' }} />
          <span style={{ width: 18, height: 1.5, background: INK, transition: 'transform .25s', transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </nav>

      {/* ░░ MOBILE MENU ░░ */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 290, background: 'rgba(5,5,9,0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 30, padding: 32 }}>
          <a className="nav-link" style={{ fontSize: 15 }} onClick={scrollTo('how')}>How It Works</a>
          <a className="nav-link" style={{ fontSize: 15 }} onClick={scrollTo('pricing')}>Pricing</a>
          <a className="nav-link" style={{ fontSize: 15 }} href="/login">Sign In</a>
          <a className="btn-primary" href="/audit" style={{ marginTop: 8 }}>Free Audit →</a>
        </div>
      )}

      {/* ════════ SECTION 1 — HERO ════════ */}
      <section id="top" className="hero-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 52px 90px', position: 'relative', overflow: 'hidden' }}>
        <div className="gold-glow" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 40%,rgba(30,26,14,0.5) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 30, animation: 'heroIn .8s ease both' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: RED, display: 'inline-block', animation: 'pulseDot 1.8s ease infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(201,168,76,0.55)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Live Meta Ads Intelligence · vngrdvisuals.com</span>
          </div>

          <h1 className="hero-title" style={{ fontFamily: SERIF, fontWeight: 300, lineHeight: 0.94, letterSpacing: '-2.5px', margin: 0, animation: 'heroIn .9s ease .08s both' }}>
            <span style={{ display: 'block', fontStyle: 'italic' }}>Your ads are</span>
            <span style={{ display: 'block', fontStyle: 'italic', color: G }}>bleeding money.</span>
            <span style={{ display: 'block', fontWeight: 300, color: 'rgba(245,243,239,0.5)' }}>Right now.</span>
          </h1>

          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.5vw,13px)', color: I2, letterSpacing: '0.5px', lineHeight: 1.8, maxWidth: 620, marginTop: 34, textTransform: 'uppercase', animation: 'heroIn .9s ease .2s both' }}>
            Most Meta accounts waste 23–41% of monthly ad spend on campaigns that will never convert. VAI finds yours in 60 seconds.
          </p>

          <div className="cta-row" style={{ display: 'flex', gap: 14, marginTop: 40, flexWrap: 'wrap', animation: 'heroIn .9s ease .32s both' }}>
            <a className="btn-primary" href="/audit">Find My Leak — Free →</a>
            <a className="btn-ghost" href="#demo" onClick={scrollTo('demo')}>See How It Works ↓</a>
          </div>

          <div className="stats-row" style={{ display: 'flex', gap: 52, marginTop: 64, flexWrap: 'wrap', alignItems: 'flex-end', animation: 'heroIn 1s ease .44s both' }}>
            {[
              { node: <CountUp prefix="$" target={2.3} decimals={1} suffix="M+" />, label: 'Wasted spend identified' },
              { node: <CountUp target={847} />, label: 'Campaigns analyzed' },
              { node: <CountUp target={60} suffix=" sec" />, label: 'Average audit time' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,52px)', fontWeight: 300, color: G, lineHeight: 1 }}>{s.node}</div>
                <div style={{ fontFamily: MONO, fontSize: 8.5, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SECTION 2 — THE LEAK VISUALIZER ════════ */}
      <section id="demo" className="sec" style={{ borderTop: `1px solid ${RULE}`, position: 'relative' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>◧ The Leak</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 44 }}>
              What's happening in your<br />account <em style={{ color: G, fontStyle: 'italic' }}>right now</em>.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ position: 'relative', background: '#0b0a0f', border: `1px solid ${RULE}`, borderRadius: 10, padding: 'clamp(20px,4vw,40px)', overflow: 'hidden', minHeight: 320 }}>
              {/* window chrome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 26 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(248,113,113,0.5)' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(251,191,36,0.5)' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(74,222,128,0.5)' }} />
                <span style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2px', marginLeft: 10, textTransform: 'uppercase' }}>VAI · live account scan</span>
              </div>

              {/* STATE 0 — bleeding campaign card */}
              {viz === 0 && (
                <div style={{ animation: 'heroIn .5s ease both' }}>
                  <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.22)', borderLeft: `3px solid ${RED}`, borderRadius: '0 8px 8px 0', padding: '22px 26px', animation: 'bleedPulse 1.6s ease-in-out infinite' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ fontFamily: MONO, fontSize: 8, color: RED, letterSpacing: '2px', padding: '3px 9px', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 3 }}>● BLEEDING</span>
                        <div style={{ fontFamily: SERIF, fontSize: 24, color: INK, marginTop: 14 }}>Summer Sale — Retargeting</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '1px', marginTop: 6 }}>META · PURCHASE · ACTIVE 14 DAYS</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: SERIF, fontSize: 'clamp(30px,6vw,44px)', fontWeight: 300, color: RED, lineHeight: 1 }}>{fmt(spend)}<span style={{ fontFamily: MONO, fontSize: 11, color: I3, letterSpacing: 1 }}>/mo</span></div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: I2, letterSpacing: '1px', marginTop: 8 }}>1.8x ROAS · ▲ spend rising</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '1px', marginTop: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: RED }}>▮</span> Spend climbing in real time — return is not.
                  </div>
                </div>
              )}

              {/* STATE 1 — VAI diagnosis types out */}
              {viz === 1 && (
                <div style={{ animation: 'heroIn .5s ease both' }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: G, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16 }}>▸ VAI diagnosis</div>
                  <div style={{ fontFamily: MONO, fontSize: 'clamp(13px,2.1vw,16px)', color: INK, lineHeight: 1.9, minHeight: 150 }}>
                    <span style={{ color: GREEN }}>$ </span>{typed}
                    <span style={{ display: 'inline-block', width: 8, height: 16, background: G, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
                  </div>
                </div>
              )}

              {/* STATE 2 — recoverable banner red→gold */}
              {viz === 2 && (
                <div style={{ animation: 'heroIn .5s ease both', textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Recoverable this month</div>
                  <div style={{ fontFamily: SERIF, fontSize: 'clamp(46px,11vw,92px)', fontWeight: 300, lineHeight: 1, animation: 'redToGold 2.4s ease forwards' }}>$13,200</div>
                  <div style={{ fontFamily: MONO, fontSize: 'clamp(10px,1.6vw,12px)', color: I2, letterSpacing: '1px', marginTop: 22, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.8 }}>
                    Redirect this into your <span style={{ color: G }}>profitable</span> campaigns and that's an extra ~7,300 reach-qualified prospects every month.
                  </div>
                </div>
              )}

              {/* progress dots */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 28 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: viz === i ? 22 : 6, height: 4, borderRadius: 2, background: viz === i ? G : RULE, transition: 'all .4s ease' }} />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 32 }}>
              <p style={{ fontSize: 14, color: I2, lineHeight: 1.7, maxWidth: 520, fontWeight: 300 }}>
                This is what VAI found on a real <strong style={{ color: INK, fontWeight: 400 }}>$28,900/month</strong> account. Connect yours and see your number.
              </p>
              <a className="btn-primary" href="/audit">Get My Free Audit →</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ SECTION 3 — THREE OUTCOMES ════════ */}
      <section className="sec" style={{ borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>◧ Who it's for</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 48 }}>
              Built for the people<br />spending the money.
            </h2>
          </Reveal>
          <div className="grid-3">
            {[
              { tag: 'DTC Brand Owner', body: 'Stop paying for campaigns that are killing your ROAS. VAI finds the exact campaigns destroying your blended return — and tells you exactly what to do in the next 48 hours.' },
              { tag: 'Marketing Agency', body: 'Deliver intelligence your clients have never seen before. White-labelled briefs. Automated. Under your agency name. Every Monday morning.' },
              { tag: 'Media Buyer', body: 'Stop guessing which campaigns to scale. VAI reads the data, finds the pattern, and tells you exactly where to move budget before you lose another week.' },
            ].map((c, i) => (
              <Reveal key={i} delay={0.08 * i}>
                <div className="outcome-card" style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '34px 30px', height: '100%' }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: G, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>{`0${i + 1}`}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 26, color: INK, marginBottom: 16, lineHeight: 1.15 }}>{c.tag}</div>
                  <div style={{ fontSize: 14, color: I2, lineHeight: 1.85 }}>{c.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SECTION 4 — HOW IT WORKS ════════ */}
      <section id="how" className="sec" style={{ borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>◧ How it works</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 52 }}>
              Sixty seconds from<br />connect to clarity.
            </h2>
          </Reveal>
          <div className="grid-3">
            {[
              { n: '1', title: 'Connect your Meta Ads account', body: 'One-click OAuth. Read-only access — VAI never touches or runs your campaigns.' },
              { n: '2', title: 'VAI analyzes every campaign', body: '60 seconds. Full portfolio context. Root-cause diagnosis on every active campaign.' },
              { n: '3', title: 'See exactly what to fix', body: 'Wasted spend identified, the exact actions to take, and a 30-day optimization blueprint.' },
            ].map((s, i) => (
              <Reveal key={i} delay={0.08 * i}>
                <div style={{ padding: '8px 4px', height: '100%' }}>
                  <div style={{ fontFamily: SERIF, fontSize: 'clamp(56px,8vw,88px)', fontWeight: 300, color: G, lineHeight: 0.9, marginBottom: 18 }}>{s.n}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 23, color: INK, marginBottom: 12, lineHeight: 1.25 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: I2, lineHeight: 1.85 }}>{s.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SECTION 5 — SAMPLE OUTPUT ════════ */}
      <section className="sec" style={{ borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>◧ The deliverable</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 44 }}>
              This is what <em style={{ color: G, fontStyle: 'italic' }}>VAI</em> produces.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ position: 'relative', background: '#0b0a0f', border: `1px solid ${RULE}`, borderRadius: 10, padding: 'clamp(24px,4vw,42px)', overflow: 'hidden' }}>
              {/* watermark */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-24deg)', fontFamily: MONO, fontSize: 'clamp(34px,8vw,72px)', fontWeight: 500, color: 'rgba(255,255,255,0.03)', letterSpacing: '6px', whiteSpace: 'nowrap', pointerEvents: 'none', textTransform: 'uppercase' }}>Sample Output</div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, paddingBottom: 18, borderBottom: `1px solid ${RULE}`, marginBottom: 26 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: G, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>VV Demo Client · Meridian Fitness</div>
                    <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, fontStyle: 'italic', fontWeight: 300 }}>Ad Vision Drop — Account Audit</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '1px', textAlign: 'right', lineHeight: 1.7 }}>LAST 30 DAYS<br />$28,900 SPEND · 2.1x ROAS</div>
                </div>

                {/* What's happening */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>What's happening</div>
                  <div style={{ fontSize: 14, color: I2, lineHeight: 1.85 }}>Your retargeting budget is concentrated in a single fatigued campaign. Spend is steady but conversions have flatlined over the past two weeks — the account is quietly leaking margin.</div>
                </div>

                {/* bleeding campaign */}
                <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.22)', borderLeft: `3px solid ${RED}`, borderRadius: '0 6px 6px 0', padding: '18px 22px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: RED, letterSpacing: '2px', padding: '2px 8px', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 3 }}>BLEEDING</span>
                    <div style={{ fontFamily: SERIF, fontSize: 20, color: INK, marginTop: 10 }}>Summer Sale — Retargeting</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 300, color: RED, lineHeight: 1 }}>$3,200<span style={{ fontFamily: MONO, fontSize: 10, color: I3 }}>/mo</span></div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: I2, marginTop: 6 }}>1.8x ROAS</div>
                  </div>
                </div>

                {/* root cause */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Root cause diagnosis</div>
                  <div style={{ fontSize: 14, color: I2, lineHeight: 1.85 }}>Audience frequency has climbed to <strong style={{ color: INK, fontWeight: 400 }}>3.4x</strong> — well past saturation for warm retargeting. Creative hasn't been refreshed in 38 days. This campaign has generated <strong style={{ color: RED, fontWeight: 400 }}>$0 in net new profit</strong> over the last 14 days.</div>
                </div>

                {/* immediate action */}
                <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderLeft: `3px solid ${G}`, borderRadius: '0 6px 6px 0', padding: '18px 22px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: G, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>→ Immediate action required</div>
                  <div style={{ fontSize: 14, color: INK, lineHeight: 1.85 }}>Pause Summer Sale — Retargeting today. Reallocate its $3,200/mo into your top prospecting campaign and launch two fresh creative variants within 72 hours.</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <a className="btn-primary" href="/audit">Get this on your account — Free →</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ SECTION 6 — PRICING ════════ */}
      <section id="pricing" className="sec" style={{ borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 18 }}>◧ Pricing</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 48 }}>
              Priced against<br />what you'll recover.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="pricing-row">
              {[
                { name: 'Starter', price: '497', who: 'Brands spending $2k–$10k/mo', popular: false, points: ['Weekly VAI intelligence brief', 'Every campaign health-scored', 'Your biggest leak + 1 action / week', 'Email support'] },
                { name: 'Managed', price: '997', who: 'Brands spending $10k–$30k/mo', popular: true, points: ['Everything in Starter', 'Full 30-day optimization blueprint', 'Budget reallocation map', 'Priority support + monthly strategy call'] },
                { name: 'Embedded', price: '2,497', who: 'Brands spending $30k+/mo', popular: false, points: ['Everything in Managed', 'Dedicated growth strategist', 'Creative direction + testing roadmap', 'Slack access + weekly syncs'] },
                { name: 'Agency', price: '1,997', who: 'Agencies managing multiple brands', popular: false, points: ['White-labelled briefs under your brand', 'Unlimited client accounts', 'Automated Monday delivery', 'Agency dashboard + API access'] },
              ].map((t) => (
                <div key={t.name} className="price-card" style={{ background: t.popular ? 'rgba(201,168,76,0.05)' : CARD, border: `1px solid ${t.popular ? 'rgba(201,168,76,0.4)' : RULE}`, borderRadius: 8, padding: '30px 26px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {t.popular && <div style={{ position: 'absolute', top: -10, left: 26, fontFamily: MONO, fontSize: 8, color: '#050509', background: G, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 3 }}>Most Popular</div>}
                  <div style={{ fontFamily: MONO, fontSize: 9, color: G, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>{t.name}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 300, color: INK, lineHeight: 1 }}>${t.price}<span style={{ fontFamily: MONO, fontSize: 11, color: I3, letterSpacing: 1 }}>/mo</span></div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '0.5px', marginTop: 10, marginBottom: 22, lineHeight: 1.5 }}>{t.who}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 26 }}>
                    {t.points.map((p) => (
                      <div key={p} style={{ display: 'flex', gap: 9, fontSize: 12.5, color: I2, lineHeight: 1.5 }}>
                        <span style={{ color: G, flexShrink: 0 }}>✓</span><span>{p}</span>
                      </div>
                    ))}
                  </div>
                  <a className={t.popular ? 'btn-primary' : 'btn-ghost'} href="/audit" style={{ marginTop: 'auto', width: '100%', padding: '13px', fontSize: 11 }}>Start Free →</a>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div style={{ textAlign: 'center', marginTop: 36, fontFamily: MONO, fontSize: 10, color: I2, letterSpacing: '1px' }}>
              Every plan starts with a free audit. No credit card required.
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ SECTION 7 — THE CLOSE ════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '140px 32px', textAlign: 'center', borderTop: `1px solid ${RULE}` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 90% at 50% 100%,rgba(201,168,76,0.16) 0%,rgba(201,168,76,0.04) 40%,transparent 72%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <h2 className="close-title" style={{ fontFamily: SERIF, fontSize: 'clamp(40px,7vw,84px)', fontWeight: 300, lineHeight: 1.02, letterSpacing: '-2px', marginBottom: 26 }}>
              Every day you wait is another day the <em style={{ color: G, fontStyle: 'italic' }}>wrong campaigns</em> run.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontSize: 16, color: I2, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 42px', fontWeight: 300 }}>
              Your Meta account is either making you money or losing it. VAI tells you which campaigns are doing which — in 60 seconds, for free.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <a className="btn-primary" href="/audit" style={{ padding: '20px 44px', fontSize: 14 }}>Find Out Now — It's Free →</a>
            <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '1px', marginTop: 24, textTransform: 'uppercase' }}>
              Read-only access · No credit card · Results in 60 seconds · Disconnect anytime
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${RULE}`, padding: '26px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: 1 }}>© 2026 Vanguard Visuals · Growth Ad Engine · team@vngrdvisuals.com</div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <a href="/audit" style={{ fontFamily: MONO, fontSize: 8, color: I3, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>Free Audit</a>
          <a href="/login" style={{ fontFamily: MONO, fontSize: 8, color: I3, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>Sign In</a>
        </div>
      </footer>
    </div>
  )
}
