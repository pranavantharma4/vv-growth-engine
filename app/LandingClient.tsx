'use client'
import { useState, useEffect, useRef } from 'react'

const SYMPTOMS = [
  "You increased budget. ROAS dropped. Nobody knows why.",
  "Your agency sends reports. They never say what to cut.",
  "You're spending $15k/mo and still guessing.",
  "Your best month was 8 months ago.",
  "You have data. You don't have answers.",
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
  { n: 'Meta Ads', l: 'Connected' },
  { n: 'Google Ads', l: 'Connected' },
  { n: 'STRONG', l: 'Campaigns performing' },
  { n: 'BLEEDING', l: 'Campaigns flagged' },
  { n: 'Monday 7AM', l: 'Weekly brief delivered' },
  { n: 'Claude AI', l: 'Diagnosis engine' },
]

function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.9s ease ${delay}s, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  )
}

export default function LandingClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [symptomIdx, setSymptomIdx] = useState(0)
  const [showBook, setShowBook] = useState(false)
  const [bookName, setBookName] = useState('')
  const [bookEmail, setBookEmail] = useState('')
  const [bookCompany, setBookCompany] = useState('')
  const [bookSpend, setBookSpend] = useState('')
  const [bookStatus, setBookStatus] = useState<'idle'|'loading'|'success'>('idle')
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const [navStuck, setNavStuck] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [introPhase, setIntroPhase] = useState(0)
  const [introDone, setIntroDone] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timers: ReturnType<typeof setTimeout>[] = []

    const seen = sessionStorage.getItem('vv_intro_seen')
    if (seen) {
      setIntroPhase(7)
      setIntroDone(true)
    } else {
      sessionStorage.setItem('vv_intro_seen', '1')
      timers.push(setTimeout(() => setIntroPhase(1), 300))
      timers.push(setTimeout(() => setIntroPhase(2), 1100))
      timers.push(setTimeout(() => setIntroPhase(3), 2100))
      timers.push(setTimeout(() => setIntroPhase(4), 3000))
      timers.push(setTimeout(() => setIntroPhase(5), 4400))
      timers.push(setTimeout(() => setIntroPhase(6), 5200))
      timers.push(setTimeout(() => { setIntroPhase(7); setIntroDone(true) }, 6400))
    }

    const iv1 = setInterval(() => setSymptomIdx(i => (i + 1) % SYMPTOMS.length), 3200)
    const onScroll = () => setNavStuck(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(iv1)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

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

  const pillStyle = (h: string) => {
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

        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes marqueeL{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes scanMove{0%{top:0}100%{top:100vh}}
        @keyframes noiseShift{0%{background-position:0 0}100%{background-position:200px 200px}}
        @keyframes heroLineIn{0%{transform:translateY(110%);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes heroFadeUp{0%{opacity:0;transform:translateY(18px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes symFade{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glitch{
          0%,92%,100%{transform:none;clip-path:none;opacity:1;}
          93%{transform:translateX(-4px);clip-path:inset(15% 0 65% 0);opacity:0.85;}
          94%{transform:translateX(4px);clip-path:inset(60% 0 10% 0);opacity:0.9;}
          95%{transform:none;clip-path:none;opacity:1;}
          96%{transform:translateX(-2px);clip-path:inset(35% 0 40% 0);opacity:0.75;}
          97%{transform:translateX(2px);clip-path:inset(75% 0 5% 0);opacity:0.9;}
          98%{transform:none;clip-path:none;opacity:1;}
        }

        .h-line-1{overflow:hidden;display:block;}
        .h-line-2{overflow:hidden;display:block;}
        .h-line-3{overflow:hidden;display:block;}
        .h-word-1{display:inline-block;animation:heroLineIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s both;}
        .h-word-2{display:inline-block;animation:heroLineIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.28s both;}
        .h-word-3{display:inline-block;animation:heroLineIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.46s both;}
        .hero-sub{animation:heroFadeUp 0.9s ease 0.7s both;}
        .hero-ctas{animation:heroFadeUp 0.9s ease 0.9s both;}
        .hero-scroll{animation:heroFadeUp 0.9s ease 1.2s both;}
        .hero-badge{animation:heroFadeUp 0.8s ease 0.05s both;}
        .sym-in{animation:symFade 0.4s ease both;}

        .noise{position:fixed;inset:0;opacity:0.025;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23f)'/%3E%3C/svg%3E");
          background-size:200px;animation:noiseShift 8s steps(4) infinite;}
        .scanline{position:fixed;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.06),transparent);pointer-events:none;z-index:50;animation:scanMove 18s linear infinite;}
        .atm-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px);background-size:84px 84px;pointer-events:none;z-index:0;}

        .btn-gold{background:${G};color:#050509;border:none;cursor:pointer;font-family:${MONO};font-weight:600;letter-spacing:1.5px;transition:all 0.22s;}
        .btn-gold:hover{background:#b8972a;transform:translateY(-1px);box-shadow:0 8px 24px rgba(201,168,76,0.2);}
        .nav-a{text-decoration:none;font-family:${MONO};font-size:9px;color:${I3};letter-spacing:1.5px;transition:color 0.2s;}
        .nav-a:hover{color:${INK};}
        .pc:hover{background:rgba(255,255,255,0.025)!important;}
        .step:hover{background:rgba(255,255,255,0.025)!important;}
        .tc:hover{background:rgba(255,255,255,0.025)!important;}
        input::placeholder{color:${I4};}
        input:focus{outline:none;border-color:rgba(201,168,76,0.4)!important;}
        .modal-open{animation:fadeIn 0.2s ease;}
        .modal-box{animation:slideUp 0.35s cubic-bezier(0.16,1,0.3,1);}

        @media(max-width:768px){
          .hnav{display:none!important;}
          .hero-h1{font-size:clamp(44px,12vw,120px)!important;letter-spacing:-1.5px!important;}
          .hero-bottom-grid{flex-direction:column!important;gap:28px!important;}
          .hero-right{align-items:flex-start!important;}
          .g3{grid-template-columns:1fr!important;}
          .g2{grid-template-columns:1fr!important;}
          .panel{padding:64px 24px!important;}
          .vision-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* ─── CINEMATIC INTRO ─── */}
      {!introDone && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#020203',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: introPhase >= 6 ? 'none' : 'all',
          opacity: introPhase >= 6 ? 0 : 1,
          transition: introPhase >= 6 ? 'opacity 1.2s cubic-bezier(0.87,0,0.13,1)' : 'none',
          overflow: 'hidden',
        }}>
          {/* Grain */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23f)'/%3E%3C/svg%3E\")", backgroundSize: '200px', pointerEvents: 'none' }} />

          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '60vw', height: '40vh',
            background: 'radial-gradient(ellipse,rgba(201,168,76,0.04) 0%,transparent 72%)',
            opacity: introPhase >= 2 ? 1 : 0,
            transition: 'opacity 2.5s ease',
            pointerEvents: 'none',
          }} />

          {/* Top rule */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%) translateY(-80px)',
            height: '1px',
            width: introPhase >= 1 ? '280px' : '0',
            background: `linear-gradient(to right,transparent,${G},transparent)`,
            transition: 'width 1.6s cubic-bezier(0.16,1,0.3,1)',
            opacity: 0.3,
          }} />

          {/* Bottom rule */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%) translateY(84px)',
            height: '1px',
            width: introPhase >= 1 ? '280px' : '0',
            background: `linear-gradient(to right,transparent,${G},transparent)`,
            transition: 'width 1.6s cubic-bezier(0.16,1,0.3,1) 0.2s',
            opacity: 0.3,
          }} />

          {/* VV lettermark */}
          {introPhase >= 2 && (
            <div style={{
              fontFamily: SERIF,
              fontSize: 'clamp(100px,22vw,220px)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: INK,
              lineHeight: 1,
              textAlign: 'center',
              letterSpacing: introPhase >= 2 ? '2px' : '30px',
              opacity: introPhase >= 2 ? 1 : 0,
              filter: introPhase >= 2 ? 'blur(0px)' : 'blur(20px)',
              transition: 'letter-spacing 1.8s cubic-bezier(0.16,1,0.3,1), opacity 1.4s ease, filter 1.6s ease',
              animation: introPhase >= 5 ? 'glitch 4s ease infinite' : 'none',
              userSelect: 'none',
              position: 'relative', zIndex: 1,
            }}>VV</div>
          )}

          {/* Company name */}
          {introPhase >= 3 && (
            <div style={{
              fontFamily: MONO,
              fontSize: 11,
              color: I3,
              letterSpacing: introPhase >= 3 ? '5px' : '12px',
              textTransform: 'uppercase',
              marginTop: 24,
              textAlign: 'center',
              opacity: introPhase >= 3 ? 1 : 0,
              transition: 'opacity 1.2s ease, letter-spacing 1.6s cubic-bezier(0.16,1,0.3,1)',
              position: 'relative', zIndex: 1,
            }}>Vanguard Visuals</div>
          )}

          {/* Platform name */}
          {introPhase >= 3 && (
            <div style={{
              fontFamily: MONO,
              fontSize: 8,
              color: I4,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginTop: 8,
              textAlign: 'center',
              opacity: introPhase >= 3 ? 0.65 : 0,
              transition: 'opacity 1.2s ease 0.4s',
              position: 'relative', zIndex: 1,
            }}>Growth Ad Engine</div>
          )}

          {/* Tagline */}
          {introPhase >= 4 && (
            <div style={{
              position: 'absolute',
              bottom: '14%', left: 0, right: 0,
              textAlign: 'center',
              fontFamily: SERIF,
              fontSize: 'clamp(16px,2.5vw,26px)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: INK,
              letterSpacing: introPhase >= 5 ? '0.5px' : '8px',
              opacity: introPhase >= 4 ? (introPhase >= 5 ? 0.5 : 0.2) : 0,
              transition: 'opacity 2s ease, letter-spacing 2s cubic-bezier(0.16,1,0.3,1)',
            }}>
              Your ad spend is bleeding. We find the leak.
            </div>
          )}

          {/* HUD corners */}
          <div style={{ position: 'absolute', top: 28, left: 36, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase', opacity: introPhase >= 3 ? 0.6 : 0, transition: 'opacity 1s ease 0.4s' }}>vngrdvisuals.com</div>
          <div style={{ position: 'absolute', top: 28, right: 36, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase', opacity: introPhase >= 3 ? 0.6 : 0, transition: 'opacity 1s ease 0.6s' }}>Est. 2026</div>
          <div style={{ position: 'absolute', bottom: 28, left: 36, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px', opacity: introPhase >= 4 ? 0.5 : 0, transition: 'opacity 1s ease 0.3s' }}>intelligence@vngrdvisuals.com</div>
          <div style={{ position: 'absolute', bottom: 28, right: 36, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px', opacity: introPhase >= 4 ? 0.5 : 0, transition: 'opacity 1s ease 0.5s' }}>Ad Intelligence Platform</div>

          {/* Skip */}
          {introPhase >= 2 && (
            <button onClick={() => { setIntroPhase(7); setIntroDone(true) }} style={{
              position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase',
              opacity: introPhase >= 3 ? 0.45 : 0, transition: 'opacity 0.8s ease',
              padding: '8px 16px',
            }}>Skip →</button>
          )}
        </div>
      )}

      <div className="noise" />
      <div className="scanline" />
      <div className="atm-grid" />
      <div style={{ position: 'fixed', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '80vh', background: 'radial-gradient(ellipse,rgba(80,82,200,0.065) 0%,rgba(40,80,200,0.025) 50%,transparent 72%)', pointerEvents: 'none', zIndex: 0 }} />

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
            {[['how','How it works'],['results','Results'],['team','The Team'],['vision','VV Ad Vision'],['faq','FAQ']].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="nav-a">{label}</a>
            ))}
            <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '8px 18px', borderRadius: 2, fontSize: 9 }}>Apply for Access</button>
            <a href="/login" className="nav-a" style={{ padding: '8px 14px', border: `1px solid ${RULE}`, borderRadius: 2 }}>Sign In →</a>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <div className="panel" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 52px 72px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 70% 30%,rgba(40,35,20,0.45) 0%,transparent 70%),radial-gradient(ellipse 60% 80% at 20% 80%,rgba(20,15,30,0.35) 0%,transparent 70%),linear-gradient(160deg,#0a0810 0%,#050509 50%,#080608 100%)', pointerEvents: 'none' }} />

          <div className="hero-badge" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G, display: 'inline-block', animation: 'pulse 2.5s ease infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.45)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Invitation Only · Ad Intelligence Platform · vngrdvisuals.com</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right,rgba(201,168,76,0.18),transparent)`, maxWidth: 100 }} />
          </div>

          <h1 className="hero-h1" style={{ fontFamily: SERIF, fontSize: 'clamp(64px,10vw,120px)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-3px', marginBottom: 0 }}>
            <span className="h-line-1"><span className="h-word-1">Your ad spend</span></span>
            <span className="h-line-2"><span className="h-word-2" style={{ color: 'rgba(245,243,239,0.1)', fontStyle: 'italic' }}>is bleeding.</span></span>
            <span className="h-line-3"><span className="h-word-3">We find the leak.</span></span>
          </h1>

          <div className="hero-sub" style={{ marginTop: 52 }}>
            <div className="hero-bottom-grid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 15, color: I2, lineHeight: 1.88, maxWidth: 420, fontWeight: 300 }}>
                VV Growth Ad Engine connects to your Meta and Google campaigns, classifies every campaign as{' '}
                <strong style={{ color: 'rgba(245,243,239,0.85)', fontWeight: 400 }}>STRONG, WEAK, BLEEDING,</strong> or{' '}
                <strong style={{ color: 'rgba(245,243,239,0.85)', fontWeight: 400 }}>DEAD</strong>, and delivers your single biggest budget leak — in plain English, every Monday morning.
              </p>
              <div className="hero-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', background: 'rgba(201,76,76,0.05)', border: '1px solid rgba(201,76,76,0.09)', borderRadius: 2 }}>
                  <span style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,76,76,0.45)', letterSpacing: '2px' }}>SOUND FAMILIAR?</span>
                  <span key={symptomIdx} className="sym-in" style={{ fontFamily: MONO, fontSize: 9, color: I2 }}>{SYMPTOMS[symptomIdx]}</span>
                </div>
                <div className="hero-ctas" style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '13px 28px', borderRadius: 2, fontSize: 10 }}>Apply for Access →</button>
                  <div style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.09)` }}>
                    <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWaitlist()} disabled={status === 'success'}
                      style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: '13px 14px', color: INK, fontFamily: MONO, fontSize: 9, width: 180 }} />
                    <button onClick={handleWaitlist} disabled={status === 'loading' || status === 'success'} className="btn-gold" style={{ padding: '13px 14px', fontSize: 9, borderRadius: 0 }}>
                      {status === 'loading' ? '...' : status === 'success' ? '✓' : 'Join Waitlist'}
                    </button>
                  </div>
                </div>
                {status === 'success' && <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(201,168,76,0.6)', letterSpacing: 1 }}>You're on the list. We'll be in touch.</div>}
                <div style={{ fontFamily: MONO, fontSize: 8, color: I4, letterSpacing: 1 }}>Invitation only · No card required</div>
              </div>
            </div>
          </div>

          <div className="hero-scroll" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 52 }}>
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
          <div style={{ display: 'flex', animation: 'marqueeL 22s linear infinite', whiteSpace: 'nowrap' }}>
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '0 24px' }}>
                <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: G }}>{m.n}</span>
                <span style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2px', textTransform: 'uppercase' }}>{m.l}</span>
                <div style={{ width: 1, height: 12, background: RULE }} />
              </div>
            ))}
          </div>
        </div>

        {/* ─── THE PROBLEM ─── */}
        <div id="results" className="panel" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>The Problem</div></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 52 }}>
                Most brands are bleeding<br />30–40% of their budget.<br /><em style={{ color: 'rgba(245,243,239,0.12)', fontStyle: 'italic' }}>Right now.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', marginBottom: 48 }}>
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
            <Reveal delay={0.22}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '32px 0', borderTop: `1px solid ${RULE}`, flexWrap: 'wrap', gap: 20 }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2px', marginBottom: 8 }}>THE SOLUTION</div>
                  <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, lineHeight: 1.3 }}>Weekly AI intelligence that tells you exactly which campaign to cut, and why — before you waste another dollar.</div>
                </div>
                <button onClick={() => setShowBook(true)} className="btn-gold" style={{ padding: '13px 26px', borderRadius: 2, fontSize: 9, flexShrink: 0 }}>See How It Works →</button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <div id="how" className="panel" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>How it works</div></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 52 }}>
                From connection to intelligence<br />in under 48 hours.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', marginBottom: 48 }}>
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
            <Reveal delay={0.22}>
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: '32px 36px', background: BG2 }}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 20 }}>Campaign Classification System</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: RULE, borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
                  {[
                    { label: 'STRONG', desc: 'Performing — leave it running', h: 's' },
                    { label: 'WEAK', desc: 'Under-performing — needs attention', h: 'w' },
                    { label: 'BLEEDING', desc: 'Wasting budget — act within 48h', h: 'b' },
                    { label: 'DEAD', desc: 'No return — pause immediately', h: 'd' },
                  ].map((p) => {
                    const ps = pillStyle(p.h)
                    return (
                      <div key={p.label} style={{ background: '#050509', padding: '20px 18px' }}>
                        <span style={{ fontFamily: MONO, fontWeight: 500, letterSpacing: '2px', fontSize: 9, padding: '3px 9px', borderRadius: 2, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, display: 'inline-block', marginBottom: 10 }}>{p.label}</span>
                        <div style={{ fontSize: 12, color: I3, lineHeight: 1.6 }}>{p.desc}</div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ border: `1px solid ${RULE}`, borderLeft: '3px solid rgba(201,76,76,0.38)', borderRadius: '0 4px 4px 0', padding: '18px 22px', background: 'rgba(255,255,255,0.018)' }}>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,76,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 7 }}>Weekly Intelligence Brief — Every Monday 7AM</div>
                  <div style={{ fontFamily: SERIF, fontSize: 18, color: INK, marginBottom: 5 }}>Your biggest budget leak identified. One action to take. Plain English.</div>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: 1 }}>Delivered to your inbox from intelligence@vngrdvisuals.com</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ─── TEAM ─── */}
        <div id="team" className="panel" style={{ padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Who You're Dealing With</div></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,68px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 48 }}>
                Built by people who've seen<br />the bleed firsthand.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { name: 'Pranavan T.', role: 'Co-Founder · Product & Technology', bio: 'Built VV Growth Ad Engine from the ground up — the entire platform, AI integration, and intelligence system. Every feature was built to solve a real problem seen firsthand in ad accounts bleeding budget.', tag: 'BUILDER' },
                  { name: 'Bardy', role: 'Co-Founder · Sales & Strategy', bio: 'One of the strongest sales operators in his generation. Chamber of Commerce network, enterprise background. Closes high-ticket deals with precision. Your main point of contact — he speaks your language and knows your problems before you do.', tag: 'CLOSER' },
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
            <Reveal delay={0.22}>
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: '24px 32px', background: BG2 }}>
                <div style={{ fontFamily: MONO, fontSize: 7, color: I3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Vanguard Visuals</div>
                <div style={{ fontSize: 13, color: I2, lineHeight: 1.8 }}>Growth intelligence agency and the company behind VV Growth Ad Engine. We use this system ourselves — every recommendation we make is one we'd stake our own budget on.</div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ─── FAQ ─── */}
        <div id="faq" className="panel" style={{ padding: '96px 52px', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
            <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>FAQ</div></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(40px,6vw,68px)', fontWeight: 300, color: INK, lineHeight: 0.96, letterSpacing: '-1.5px', marginBottom: 48 }}>
                Everything you<br />need to know.
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <div>
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
              </div>
            </Reveal>
          </div>
        </div>

        {/* ─── VV AD VISION ─── */}
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
                <p style={{ fontSize: 14, color: I2, lineHeight: 1.85, marginBottom: 24 }}>A free diagnostic snapshot — connect your ad account and instantly see your campaign health, wasted budget, and your single biggest leak. No commitment. No card required.</p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: I3, lineHeight: 1.7, marginBottom: 24 }}>The free entry point to the full VV Growth Ad Engine. See the intelligence before you commit.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Free snapshot', 'No credit card', 'Instant results', 'Meta + Google'].map(t => (
                    <span key={t} style={{ fontFamily: MONO, fontSize: 8, color: I3, padding: '4px 10px', border: `1px solid ${RULE}`, borderRadius: 2 }}>{t}</span>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.16}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 4, padding: '32px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(201,168,76,0.25),transparent)` }} />
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 24 }}>What you'll see</div>
                  {[
                    { label: 'Campaign Health Overview', desc: 'Every campaign classified STRONG, WEAK, BLEEDING, or DEAD' },
                    { label: 'Wasted Spend Identified', desc: 'Exact dollar amount being lost to underperforming campaigns' },
                    { label: 'Biggest Leak', desc: 'The one campaign you should act on first' },
                    { label: 'Recovery Estimate', desc: 'How much you could recover by taking action' },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: '14px 0', borderBottom: i < 3 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                      <div style={{ fontFamily: MONO, fontSize: 8, color: G, letterSpacing: '1px', marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: I2 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* ─── FINAL CTA ─── */}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '96px 52px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${RULE}` }}>
          <div style={{ position: 'absolute', bottom: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '50vh', background: 'radial-gradient(ellipse,rgba(201,168,76,0.05) 0%,transparent 72%)', pointerEvents: 'none' }} />
          <Reveal><div style={{ fontFamily: MONO, fontSize: 8, color: I3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Invitation Only</div></Reveal>
          <Reveal delay={0.1}>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(56px,10vw,112px)', fontWeight: 300, color: INK, lineHeight: 0.92, letterSpacing: '-3px', marginBottom: 22 }}>
              Stop the bleed.<br />Start knowing.
            </h2>
          </Reveal>
          <Reveal delay={0.18}>
            <p style={{ fontSize: 15, color: I2, marginBottom: 48, lineHeight: 1.85, maxWidth: 500, fontWeight: 300 }}>
              Book a 15-minute call. We pull up your live ad data, show you your biggest leak using your own numbers, and tell you exactly what we'd do. No pitch deck. Real numbers only.
            </p>
          </Reveal>
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

      {/* ─── MODAL ─── */}
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