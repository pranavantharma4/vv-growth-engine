'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const SYMPTOMS = [
  "You increased budget. ROAS dropped. Nobody knows why.",
  "Your agency sends reports. They never say what to cut.",
  "You're spending $15k/mo and still guessing.",
  "Your best month was 8 months ago.",
  "You have data. You don't have answers.",
]

const RESULTS = [
  { metric: '$9,200', label: 'recovered in 30 days', client: 'DTC Skincare Brand' },
  { metric: '4.1x',   label: 'ROAS from 1.6x in 6 weeks', client: 'Fitness Equipment Co.' },
  { metric: '41%',    label: 'budget waste eliminated', client: 'Home Goods Brand' },
]

const STEPS = [
  { n: '01', title: 'Connect', body: 'Link Meta and Google Ads in one click. Read-only access — we never touch your campaigns.', detail: 'OAuth 2.0 · AES-256 encryption · No campaign modifications ever' },
  { n: '02', title: 'Classify', body: 'Every campaign scored STRONG, WEAK, BLEEDING, or DEAD. Updated daily from live data.', detail: 'Proprietary health scoring · Real-time sync · Cross-platform view' },
  { n: '03', title: 'Act', body: 'Every Monday — one brief, one action, your biggest leak. Plain English, zero jargon.', detail: 'Claude AI diagnosis · Weekly delivery · PDF export' },
]

const FAQS = [
  { q: 'How is this different from my agency reports?', a: 'Agency reports show you what happened. VV Growth Ad Engine tells you exactly what is wrong and what to do about it — in plain English, every Monday, without a call.' },
  { q: 'What ad platforms do you connect to?', a: 'Meta Ads (Facebook + Instagram) and Google Ads currently. TikTok Ads coming soon. You connect once via OAuth — we never store passwords or modify campaigns.' },
  { q: 'How do I get access?', a: "VV Growth Ad Engine is invitation-only. Book a 15-minute call with the Vanguard team. We review your ad spend, confirm fit, and onboard you within 24 hours if it's the right match." },
  { q: 'How long until I see results?', a: 'Your first intelligence brief arrives the Monday after you connect. Most clients identify their biggest budget leak within 48 hours of onboarding.' },
  { q: 'Do I need to change agencies or ad managers?', a: 'No. VV Growth Ad Engine sits on top of your existing setup. Think of us as the intelligence layer — we tell you and your team exactly what to change and why.' },
]

const MARQUEE = [
  { n: '$2.4M+', l: 'Ad spend analysed' },
  { n: '94%', l: 'Leak detection rate' },
  { n: '48h', l: 'First insight delivery' },
  { n: '3.8x', l: 'Avg ROAS improvement' },
  { n: '30–40%', l: 'Avg budget wasted' },
  { n: '<48h', l: 'Onboarding time' },
]

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.85s ease ${delay}s, transform 0.95s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  )
}

export default function LandingClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [symptomIdx, setSymptomIdx] = useState(0)
  const [resultIdx, setResultIdx] = useState(0)
  const [showBook, setShowBook] = useState(false)
  const [bookName, setBookName] = useState('')
  const [bookEmail, setBookEmail] = useState('')
  const [bookCompany, setBookCompany] = useState('')
  const [bookSpend, setBookSpend] = useState('')
  const [bookStatus, setBookStatus] = useState<'idle'|'loading'|'success'>('idle')
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const [navStuck, setNavStuck] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [countersRan, setCountersRan] = useState(false)
  const countersRef = useRef<HTMLDivElement>(null)
  const c1Ref = useRef<HTMLSpanElement>(null)
  const c2Ref = useRef<HTMLSpanElement>(null)
  const c3Ref = useRef<HTMLSpanElement>(null)
  const c4Ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setMounted(true)
    const iv1 = setInterval(() => setSymptomIdx(i => (i + 1) % SYMPTOMS.length), 3200)
    const iv2 = setInterval(() => setResultIdx(i => (i + 1) % RESULTS.length), 2800)
    const onScroll = () => setNavStuck(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearInterval(iv1); clearInterval(iv2); window.removeEventListener('scroll', onScroll) }
  }, [])

  function daysToMonday() {
    const d = new Date().getDay()
    return d === 1 ? 7 : (8 - d) % 7 || 7
  }

  function animCount(el: HTMLSpanElement | null, end: number, fmt: (v: number) => string, dur: number) {
    if (!el) return
    let start: number | null = null
    function step(t: number) {
      if (!start) start = t
      const p = Math.min((t - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      if (el) el.textContent = fmt(Math.round(ease * end))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  useEffect(() => {
    if (!countersRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !countersRan) {
        setCountersRan(true)
        animCount(c1Ref.current, 37, v => `${v}%`, 1800)
        animCount(c2Ref.current, 4100, v => `$${v.toLocaleString()}`, 2000)
        animCount(c3Ref.current, daysToMonday(), v => `${v}d`, 1200)
        animCount(c4Ref.current, 94, v => `${v}%`, 1800)
      }
    }, { threshold: 0.2 })
    obs.observe(countersRef.current)
    return () => obs.disconnect()
  }, [countersRan])

  async function handleWaitlist() {
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (res.ok) { setStatus('success'); setEmail('') } else setStatus('error')
    } catch { setStatus('error') }
  }

  async function handleBook() {
    if (!bookName || !bookEmail) return
    setBookStatus('loading')
    try { await fetch('/api/book-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: bookName, email: bookEmail, company: bookCompany, spend: bookSpend }) }) } catch {}
    setBookStatus('success')
  }

  if (!mounted) return null

  const G = '#c9a84c'
  const RULE = 'rgba(255,255,255,0.07)'
  const BG2 = 'rgba(255,255,255,0.025)'
  const INK = 'rgba(245,243,239,0.95)'
  const I2 = 'rgba(245,243,239,0.55)'
  const I3 = 'rgba(245,243,239,0.28)'
  const I4 = 'rgba(245,243,239,0.11)'
  const MONO = "'DM Mono',monospace"
  const SERIF = "'Cormorant Garamond',serif"
  const SANS = "'DM Sans',sans-serif"

  const pill = (h: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      s: { bg: '#1a3a1a', color: '#4ade80', border: '#2a5a2a' },
      w: { bg: '#2a2210', color: '#fbbf24', border: '#3a3218' },
      b: { bg: '#2a1a0a', color: '#fb923c', border: '#3a2a1a' },
      d: { bg: '#2a1010', color: '#f87171', border: '#3a1818' },
    }
    return map[h] || map.s
  }

  return (
    <div style={{ background: '#050509', color: INK, fontFamily: SANS, overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:2px;}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.25);}

        @keyframes wordIn{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes marqueeL{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes scanMove{0%{top:0}100%{top:100vh}}
        @keyframes noiseShift{0%{background-position:0 0}100%{background-position:200px 200px}}
        @keyframes symFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rNumFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

        .w1{display:inline-block;animation:wordIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s both;}
        .w2{display:inline-block;animation:wordIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.38s both;}
        .w3{display:inline-block;animation:wordIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.56s both;}
        .hero-badge{animation:fadeUp 0.8s ease 0.1s both;}
        .hero-bottom{animation:fadeUp 0.9s ease 0.75s both;}
        .scroll-ind{animation:fadeUp 0.8s ease 1.5s both;}

        .noise{position:fixed;inset:0;opacity:0.025;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23f)'/%3E%3C/svg%3E");
          background-size:200px;animation:noiseShift 8s steps(4) infinite;}
        .scanline{position:fixed;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.06),transparent);pointer-events:none;z-index:50;animation:scanMove 18s linear infinite;}
        .atm-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px);background-size:84px 84px;pointer-events:none;z-index:0;}

        .btn-gold{background:${G};color:#050509;border:none;cursor:pointer;font-family:${MONO};font-weight:600;letter-spacing:1.5px;transition:all 0.22s;}
        .btn-gold:hover{background:#b8972a;transform:translateY(-1px);box-shadow:0 8px 24px rgba(201,168,76,0.2);}
        .btn-ghost{background:transparent;color:rgba(201,168,76,0.5);border:1px solid rgba(201,168,76,0.2);cursor:pointer;font-family:${MONO};letter-spacing:1.5px;transition:all 0.22s;}
        .btn-ghost:hover{border-color:rgba(201,168,76,0.45);color:${G};background:rgba(201,168,76,0.06);}
        .nav-a{text-decoration:none;font-family:${MONO};font-size:9px;color:${I3};letter-spacing:1.5px;transition:color 0.2s;}
        .nav-a:hover{color:${INK};}
        .pc:hover{background:rgba(255,255,255,0.02)!important;}
        .step:hover{background:rgba(255,255,255,0.02)!important;}
        .tc:hover{background:rgba(255,255,255,0.02)!important;}
        input::placeholder{color:${I4};}
        input:focus{outline:none;border-color:rgba(201,168,76,0.4)!important;}
        .sym-txt{animation:symFade 0.4s ease both;}
        .r-num-anim{animation:rNumFade 0.35s ease both;}
        .modal-open{animation:fadeIn 0.2s ease;}
        .modal-box{animation:slideUp 0.35s cubic-bezier(0.16,1,0.3,1);}

        @media(max-width:768px){
          .hnav{display:none!important;}
          .hero-h1{font-size:clamp(44px,12vw,100px)!important;letter-spacing:-1.5px!important;}
          .hero-bottom-inner{flex-direction:column!important;gap:24px!important;}
          .hero-right{align-items:flex-start!important;}
          .g3{grid-template-columns:1fr!important;}
          .g2{grid-template-columns:1fr!important;}
          .counter-grid{grid-template-columns:1fr 1fr!important;}
          .panel{padding:72px 24px!important;}
          .vision-grid{grid-template-columns:1fr!important;}
          .marquee-item{padding:0 16px!important;}
        }
      `}</style>

      <div className="noise" />
      <div className="scanline" />
      <div className="atm-grid" />
      <div style={{ position: 'fixed', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '80vh', background: 'radial-gradient(ellipse,rgba(80,82,200,0.07) 0%,rgba(40,80,200,0.03) 50%,transparent 72%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* NAV */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: '20px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.5s,border-color 0.5s', borderBottom: `1px solid ${navStuck ? RULE : 'transparent'}`, background: navStuck ? 'rgba(5,5,9,0.95)' : 'transparent', backdropFilter: navStuck ? 'blur(20px)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, fontStyle: 'italic', letterSpacing: 2, color: INK }}>VV</span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vanguard Visuals</div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase' }}>Growth Ad Engine</div>
            </div>
          </div>
          <div className="hnav" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {['how', 'results', 'team', 'vision', 'faq'].map(id => (
              <a key={id} href={`#${id}`} className="nav-a">{id === 'how' ? 'How it works' : id === 'results' ? 'Results' : id === 'team' ? 'The Team' : id === 'vision' ? 'VV Ad Vision' : 'FAQ'}</a>
            ))}
            <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '8px 18px', borderRadius: 2, fontSize: 9 }}>Apply for Access</button>
            <a href="/login" className="nav-a" style={{ padding: '8px 14px', border: `1px solid ${RULE}`, borderRadius: 2 }}>Sign In →</a>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 52px 72px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 70% 30%,rgba(40,35,20,0.5) 0%,transparent 70%),radial-gradient(ellipse 60% 80% at 20% 80%,rgba(20,15,30,0.4) 0%,transparent 70%),linear-gradient(160deg,#0a0810 0%,#050509 50%,#080608 100%)', pointerEvents: 'none' }} />

          <div className="hero-badge" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G, display: 'inline-block', animation: 'pulse 2.5s ease infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.45)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Invitation Only · Ad Intelligence Platform · vngrdvisuals.com</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right,rgba(201,168,76,0.18),transparent)`, maxWidth: 100 }} />
          </div>

          <h1 className="hero-h1" style={{ fontFamily: SERIF, fontSize: 'clamp(64px,10vw,120px)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-3px', marginBottom: 0 }}>
            <span style={{ overflow: 'hidden', display: 'block' }}><span className="w1">Your ad spend</span></span>
            <span style={{ overflow: 'hidden', display: 'block' }}><span className="w2" style={{ color: 'rgba(245,243,239,0.1)', fontStyle: 'italic' }}>is bleeding.</span></span>
            <span style={{ overflow: 'hidden', display: 'block' }}><span className="w3">We find the leak.</span></span>
          </h1>

          <div className="hero-bottom" style={{ marginTop: 52 }}>
            <div className="hero-bottom-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 15, color: I2, lineHeight: 1.88, maxWidth: 420, fontWeight: 300 }}>
                VV Growth Ad Engine connects to your Meta and Google campaigns, classifies every campaign as <strong style={{ color: 'rgba(245,243,239,0.85)', fontWeight: 400 }}>STRONG, WEAK, BLEEDING,</strong> or <strong style={{ color: 'rgba(245,243,239,0.85)', fontWeight: 400 }}>DEAD</strong>, and delivers your single biggest budget leak — in plain English, every Monday morning.
              </p>
              <div className="hero-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', background: 'rgba(201,76,76,0.05)', border: '1px solid rgba(201,76,76,0.09)', borderRadius: 2 }}>
                  <span style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,76,76,0.45)', letterSpacing: '2px' }}>SOUND FAMILIAR?</span>
                  <span key={symptomIdx} className="sym-txt" style={{ fontFamily: MONO, fontSize: 9, color: I2 }}>{SYMPTOMS[symptomIdx]}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '13px 28px', borderRadius: 2, fontSize: 10 }}>Apply for Access →</button>
                  <div style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.09)` }}>
                    <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWaitlist()} disabled={status === 'success'}
                      style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: '13px 14px', color: INK, fontFamily: MONO, fontSize: 9, width: 180 }} />
                    <button onClick={handleWaitlist} disabled={status === 'loading' || status === 'success'} className="btn-gold" style={{ padding: '13px 14px', fontSize: 9, borderRadius: 0 }}>
                      {status === 'loading' ? '...' : status === 'success' ? "✓" : 'Join Waitlist'}
                    </button>
                  </div>
                </div>
                {status === 'success' && <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.6)', letterSpacing: 1 }}>Intelligence brief incoming.</div>}
                <div style={{ fontFamily: MONO, fontSize: 8, color: I4, letterSpacing: 1 }}>Invitation only · First brief within 48 hours · No card required</div>
              </div>
            </div>
          </div>

          <div className="scroll-ind" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 52 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(201,168,76,0.35)' }} />
            <span style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
          </div>
        </div>

        {/* INV STRIP */}
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.08)', padding: '9px 0', textAlign: 'center', background: 'rgba(201,168,76,0.02)' }}>
          <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.32)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>◆ &nbsp; Invitation Only &nbsp;·&nbsp; No Public Pricing &nbsp;·&nbsp; intelligence@vngrdvisuals.com &nbsp; ◆</span>
        </div>

        {/* MARQUEE */}
        <div style={{ borderBottom: `1px solid ${RULE}`, padding: '11px 0', overflow: 'hidden', background: 'rgba(201,168,76,0.015)' }}>
          <div style={{ display: 'flex', animation: 'marqueeL 24s linear infinite', whiteSpace: 'nowrap' }}>
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <div key={i} className="marquee-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '0 24px' }}>
                <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 300, color: G }}>{m.n}</span>
                <span style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2px', textTransform: 'uppercase' }}>{m.l}</span>
                <div style={{ width: 1, height: 12, background: RULE }} />
              </div>
            ))}
          </div>
        </div>

        {/* COUNTERS */}
        <div ref={countersRef} className="counter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${RULE}` }}>
          {[
            { ref: c1Ref, label: 'Avg budget wasted monthly' },
            { ref: c2Ref, label: 'Avg monthly leak per client' },
            { ref: c3Ref, label: 'Days to your next Monday brief' },
            { ref: c4Ref, label: 'Leak detection rate' },
          ].map((c, i) => (
            <div key={i} style={{ padding: '44px 40px', borderRight: i < 3 ? `1px solid ${RULE}` : 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: G, width: countersRan ? '100%' : '0', transition: `width 1.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s` }} />
              <span ref={c.ref} style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 300, color: INK, lineHeight: 1, display: 'block' }}>—</span>
              <span style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 10, display: 'block' }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* DASHBOARD PANEL */}
        <div className="panel" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <Reveal>
              <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Live Intelligence Dashboard</div>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 32 }}>Your campaigns.<br />Classified.<br /><em style={{ color: 'rgba(245,243,239,0.14)', fontStyle: 'italic' }}>Live.</em></h2>
              <p style={{ fontSize: 14, color: I2, lineHeight: 1.85, marginBottom: 22, fontWeight: 300 }}>Real data, real classifications, real actions — not a report you have to interpret.</p>
              <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '1.5px' }}>Updated daily · Meta + Google · Plain English diagnosis</div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.012)' }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', padding: '11px 18px', borderBottom: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 5 }}>{[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />)}</div>
                  <span style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px' }}>vngrdvisuals.com · dashboard</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease infinite' }} />
                    <span style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: 1 }}>LIVE</span>
                  </div>
                </div>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${RULE}`, background: 'rgba(201,76,76,0.05)', borderLeft: '3px solid rgba(201,76,76,0.4)' }}>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,76,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>⚠ Biggest Leak Identified</div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, color: INK, marginBottom: 3 }}>Summer Sale — Retargeting $3.2k/mo at 1.8x ROAS</div>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,76,76,0.5)' }}>→ Reduce budget 50%. Refresh creative within 48h. Est. +$1,600/mo.</div>
                </div>
                {[
                  { name: 'Lookalike — Past Purchasers', spend: '$9.2k', roas: '6.2x', h: 's' },
                  { name: 'Summer Sale — Retargeting', spend: '$3.2k', roas: '1.8x', h: 'b' },
                  { name: 'Performance Max — All Products', spend: '$2.8k', roas: '0.9x', h: 'd' },
                  { name: 'Search — Branded Keywords', spend: '$1.4k', roas: '9.0x', h: 's' },
                  { name: 'UGC Creative — Ages 18–24', spend: '$1.8k', roas: '3.4x', h: 's' },
                ].map((c, i, arr) => {
                  const p = pill(c.h)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 18px', borderBottom: i < arr.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                      <span style={{ fontSize: 11, color: 'rgba(245,243,239,0.52)' }}>{c.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: MONO, fontSize: 8, color: I4 }}>{c.spend}</span>
                        <span style={{ fontFamily: MONO, fontWeight: 500, letterSpacing: '2px', fontSize: 7, padding: '2px 7px', borderRadius: 2, background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>{c.h === 's' ? 'STRONG' : c.h === 'b' ? 'BLEEDING' : 'DEAD'}</span>
                        <span style={{ fontFamily: SERIF, fontSize: 15, color: p.color }}>{c.roas}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </div>

        {/* PROBLEM PANEL */}
        <div id="results" className="panel" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>The Problem</div></Reveal>
            <Reveal delay={0.08}><h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 52 }}>Most brands are bleeding<br />30–40% of their budget.<br /><em style={{ color: 'rgba(245,243,239,0.12)', fontStyle: 'italic' }}>Right now.</em></h2></Reveal>
            <Reveal delay={0.16}>
              <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', marginBottom: 44 }}>
                {[
                  { icon: '◈', title: 'No visibility', body: 'You see spend and ROAS but not which campaigns are actively destroying your returns day by day.' },
                  { icon: '◫', title: 'Agency opacity', body: "Agencies report what looked good. Nobody tells you what to kill. That's not an accident — it's a conflict of interest." },
                  { icon: '◉', title: 'Data without action', body: 'Dashboards show you what happened. Nobody tells you what it means or what to do Monday morning.' },
                ].map((c, i) => (
                  <div key={i} className="pc" style={{ background: '#050509', padding: '36px 30px', transition: 'background 0.3s' }}>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: G, marginBottom: 18 }}>{c.icon}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 24, color: INK, marginBottom: 12 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: I2, lineHeight: 1.8 }}>{c.body}</div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: '36px 40px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 40, alignItems: 'center', background: BG2 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Client Result</div>
                  <div key={resultIdx} className="r-num-anim" style={{ fontFamily: SERIF, fontSize: 72, fontWeight: 300, color: G, lineHeight: 1 }}>{RESULTS[resultIdx].metric}</div>
                  <div style={{ fontSize: 13, color: I2, marginTop: 6 }}>{RESULTS[resultIdx].label}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {RESULTS.map((_, i) => (
                      <div key={i} onClick={() => setResultIdx(i)} style={{ width: 6, height: 6, borderRadius: '50%', background: i === resultIdx ? G : 'rgba(201,168,76,0.18)', cursor: 'pointer', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: 1 }}>{RESULTS[resultIdx].client}</div>
                </div>
                <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '12px 22px', borderRadius: 2, fontSize: 9, whiteSpace: 'nowrap' }}>Apply for Access →</button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how" className="panel" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>How it works</div></Reveal>
            <Reveal delay={0.08}><h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 52 }}>From connection to intelligence<br />in under 48 hours.</h2></Reveal>
            <Reveal delay={0.16}>
              <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden' }}>
                {STEPS.map((s, i) => (
                  <div key={i} className="step" style={{ background: '#050509', padding: '40px 32px', transition: 'background 0.3s' }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(201,168,76,0.25)', letterSpacing: '2px', marginBottom: 24 }}>{s.n}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 28, color: INK, marginBottom: 14 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: I2, lineHeight: 1.8, marginBottom: 18 }}>{s.body}</div>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '.5px', paddingTop: 16, borderTop: `1px solid ${RULE}` }}>{s.detail}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* HEALTH SYSTEM */}
        <div className="panel" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>The Intelligence System</div></Reveal>
            <Reveal delay={0.08}><h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,68px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 40 }}>Every campaign.<br />Classified. Every day.</h2></Reveal>
            <Reveal delay={0.14}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
                {[['STRONG','s'],['WEAK','w'],['BLEEDING','b'],['DEAD','d']].map(([l, h]) => {
                  const p = pill(h)
                  return <span key={l} style={{ fontFamily: MONO, fontWeight: 500, letterSpacing: '3px', fontSize: 10, padding: '8px 18px', borderRadius: 2, background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>{l}</span>
                })}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div style={{ border: `1px solid ${RULE}`, borderLeft: '3px solid rgba(201,76,76,0.38)', borderRadius: '0 4px 4px 0', padding: '22px 26px', background: BG2, marginBottom: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,76,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Weekly Intelligence Brief — Monday 7AM</div>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: INK, marginBottom: 6 }}>Summer Sale — Retargeting consuming $3.2k/mo at 1.8x ROAS</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(201,76,76,0.5)' }}>→ Reduce budget 50% and refresh creative within 48 hours. Est. $1,600 recovered this month.</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: I4, letterSpacing: 1 }}>Sent from intelligence@vngrdvisuals.com · Every Monday · Your inbox, not your dashboard</div>
            </Reveal>
          </div>
        </div>

        {/* TEAM PANEL */}
        <div id="team" className="panel" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Who You're Dealing With</div></Reveal>
            <Reveal delay={0.08}><h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,68px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 48 }}>Built by people who've seen<br />the bleed firsthand.</h2></Reveal>
            <Reveal delay={0.16}>
              <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { name: 'Pranavan T.', role: 'Co-Founder · Product & Technology', bio: 'Built VV Growth Ad Engine from the ground up — the entire platform, AI integration, and intelligence system. Every feature was built to solve a real problem seen firsthand in ad accounts bleeding budget.', tag: 'BUILDER' },
                  { name: 'Bardy', role: 'Co-Founder · Sales & Strategy', bio: 'One of the strongest sales operators in his generation. Chamber of Commerce network, enterprise background. Closes high-ticket deals with precision. Your main point of contact — he speaks your language.', tag: 'CLOSER' },
                ].map((p, i) => (
                  <div key={i} className="tc" style={{ background: '#050509', padding: '36px 32px', transition: 'background 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: SERIF, fontSize: 26, color: INK, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: 1 }}>{p.role}</div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 7, color: G, background: 'rgba(201,168,76,0.06)', padding: '4px 9px', borderRadius: 2, border: '1px solid rgba(201,168,76,0.14)', letterSpacing: '2px' }}>{p.tag}</span>
                    </div>
                    <div style={{ fontSize: 13, color: I2, lineHeight: 1.8 }}>{p.bio}</div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: '24px 32px', background: BG2 }}>
                <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Vanguard Visuals</div>
                <div style={{ fontSize: 13, color: I2, lineHeight: 1.8 }}>Growth intelligence agency. We run ads for our own products using VV Growth Ad Engine — so every recommendation we make is one we'd stake our own budget on. We eat our own cooking.</div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="panel" style={{ padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>FAQ</div></Reveal>
            <Reveal delay={0.08}><h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,68px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 48 }}>Everything you<br />need to know.</h2></Reveal>
            <Reveal delay={0.16}>
              {FAQS.map((f, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${RULE}` }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left' }}>
                    <span style={{ fontFamily: SERIF, fontSize: 19, color: INK, fontWeight: 400, lineHeight: 1.3 }}>{f.q}</span>
                    <span style={{ fontFamily: MONO, fontSize: 18, color: G, flexShrink: 0, transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)', display: 'inline-block', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  <div style={{ maxHeight: openFaq === i ? '300px' : '0', opacity: openFaq === i ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1),opacity 0.35s ease', paddingBottom: openFaq === i ? 20 : 0 }}>
                    <div style={{ fontSize: 13, color: I2, lineHeight: 1.85 }}>{f.a}</div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        {/* VV AD VISION */}
        <div id="vision" className="panel" style={{ padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Coming Soon</div>
                <div style={{ height: 1, flex: 1, background: RULE, maxWidth: 60 }} />
                <span style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,168,76,0.5)', letterSpacing: '2px', padding: '4px 9px', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 2, whiteSpace: 'nowrap' }}>FREE</span>
              </div>
            </Reveal>
            <div className="vision-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
              <Reveal delay={0.08}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16 }}>VV Ad Vision Drop</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 'clamp(36px,5vw,58px)', fontWeight: 300, color: INK, lineHeight: 1.02, letterSpacing: '-1px', marginBottom: 20 }}>See where your<br />budget goes. Free.</h3>
                <p style={{ fontSize: 14, color: I2, lineHeight: 1.85, marginBottom: 24 }}>A free diagnostic snapshot — connect your ad account and instantly see campaign health, wasted budget, and your single biggest leak. No commitment. No card required.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Free snapshot', 'No credit card', 'Instant results', 'Meta + Google'].map(t => (
                    <span key={t} style={{ fontFamily: MONO, fontSize: 8, color: I3, padding: '4px 10px', border: `1px solid ${RULE}`, borderRadius: 2 }}>{t}</span>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.16}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 4, padding: '26px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(201,168,76,0.25),transparent)` }} />
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 18 }}>Ad Vision Snapshot</div>
                  {[
                    { label: 'Total Spend Analysed', value: '$12.4k', color: INK },
                    { label: 'Wasted Spend', value: '$4.1k', color: '#f87171' },
                    { label: 'Recovery Potential', value: '33%', color: G },
                    { label: 'Campaigns Flagged', value: '3 of 7', color: '#fb923c' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: I3 }}>{r.label}</span>
                      <span style={{ fontFamily: SERIF, fontSize: 20, color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '96px 52px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ position: 'absolute', bottom: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '50vh', background: 'radial-gradient(ellipse,rgba(201,168,76,0.055) 0%,transparent 72%)', pointerEvents: 'none' }} />
          <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Invitation Only</div></Reveal>
          <Reveal delay={0.1}><h2 style={{ fontFamily: SERIF, fontSize: 'clamp(56px,10vw,112px)', fontWeight: 300, color: INK, lineHeight: 0.92, letterSpacing: '-3px', marginBottom: 22 }}>Stop the bleed.<br />Start knowing.</h2></Reveal>
          <Reveal delay={0.18}><p style={{ fontSize: 15, color: I2, marginBottom: 48, lineHeight: 1.85, maxWidth: 500, fontWeight: 300 }}>Book a 15-minute call. We pull up your live ad data, show you your biggest leak using your own numbers, and tell you exactly what we'd do. No pitch deck. Real numbers only.</p></Reveal>
          <Reveal delay={0.26}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '15px 40px', borderRadius: 2, fontSize: 10 }}>Apply for Access →</button>
              <div style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.09)` }}>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWaitlist()} disabled={status === 'success'}
                  style={{ background: 'rgba(255,255,255,0.03)', border: 'none', padding: '15px 14px', color: INK, fontFamily: MONO, fontSize: 10, width: 200 }} />
                <button onClick={handleWaitlist} disabled={status === 'loading' || status === 'success'} className="btn-gold" style={{ padding: '15px 16px', fontSize: 9, borderRadius: 0 }}>
                  {status === 'success' ? '✓' : 'Join List'}
                </button>
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: I4, letterSpacing: 1 }}>No obligation · Onboarding in under 1 hour · Cancel anytime</div>
          </Reveal>
        </div>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${RULE}`, padding: '22px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: 1 }}>© 2026 Vanguard Visuals · Growth Ad Engine · intelligence@vngrdvisuals.com</div>
          <div style={{ display: 'flex', gap: 22 }}>
            <a href="/privacy" style={{ fontFamily: MONO, fontSize: 8, color: I3, textDecoration: 'none', letterSpacing: 1 }}>Privacy</a>
            <a href="/terms" style={{ fontFamily: MONO, fontSize: 8, color: I3, textDecoration: 'none', letterSpacing: 1 }}>Terms</a>
            <button onClick={() => setShowBook(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: 1, padding: 0 }}>Book a Call</button>
          </div>
        </footer>

      </div>

      {/* MODAL */}
      {showBook && (
        <div className="modal-open" onClick={e => { if (e.target === e.currentTarget) setShowBook(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(14px)' }}>
          <div className="modal-box" style={{ background: '#0c0b0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '44px', maxWidth: 480, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowBook(false)} style={{ position: 'absolute', top: 16, right: 18, background: 'transparent', border: 'none', cursor: 'pointer', color: I3, fontSize: 20, lineHeight: 1 }}>×</button>
            {bookStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ fontFamily: SERIF, fontSize: 56, color: G, lineHeight: 1, marginBottom: 18 }}>✓</div>
                <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: INK, marginBottom: 12 }}>Request received.</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: I3, letterSpacing: '.5px', lineHeight: 1.8 }}>We'll reach out within 24 hours to confirm your call.<br />Check your inbox at {bookEmail}.</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Apply for Access</div>
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 300, color: INK, marginBottom: 6 }}>Talk to Vanguard</div>
                <div style={{ fontSize: 13, color: I2, lineHeight: 1.75, marginBottom: 30 }}>15 minutes. We pull up your live ad data, show you your biggest leak, and tell you exactly what we'd do. No pitch deck. Real numbers only.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Full Name *', ph: 'Your name', val: bookName, set: setBookName },
                    { label: 'Email *', ph: 'your@company.com', val: bookEmail, set: setBookEmail },
                    { label: 'Company / Brand', ph: 'Your brand or company', val: bookCompany, set: setBookCompany },
                    { label: 'Monthly Ad Spend', ph: 'e.g. $10,000/mo', val: bookSpend, set: setBookSpend },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>{f.label}</div>
                      <input type="text" placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: INK, fontFamily: SANS, fontSize: 13 }} />
                    </div>
                  ))}
                  <button onClick={handleBook} disabled={bookStatus === 'loading' || !bookName || !bookEmail} className="btn-gold"
                    style={{ marginTop: 8, padding: '13px', borderRadius: 3, fontSize: 10, opacity: (!bookName || !bookEmail) ? 0.35 : 1, cursor: (!bookName || !bookEmail) ? 'not-allowed' : 'pointer' }}>
                    {bookStatus === 'loading' ? 'Submitting...' : 'Request Call →'}
                  </button>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: I4, textAlign: 'center', letterSpacing: 1 }}>We follow up within 24 hours to confirm your time.</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}