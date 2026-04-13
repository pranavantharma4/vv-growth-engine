'use client'
import { useState, useEffect, useRef } from 'react'

const STATS = [
  { value: '$2.4M+', label: 'Ad spend analysed' },
  { value: '94%',    label: 'Leak detection rate' },
  { value: '48h',    label: 'Time to first insight' },
  { value: '3.8x',   label: 'Avg ROAS improvement' },
]

const SYMPTOMS = [
  'You increased budget and ROAS dropped.',
  'Your agency says performance is "normal".',
  'You don\'t know which campaign to cut.',
  'You\'re spending $10k/mo and guessing.',
  'Your best month was 6 months ago.',
]

const STEPS = [
  { n: '01', title: 'Connect', body: 'Link Meta and Google Ads in one click. Read-only. We never touch your campaigns.' },
  { n: '02', title: 'Classify', body: 'Every campaign scored STRONG, WEAK, BLEEDING, or DEAD. Updated daily from live data.' },
  { n: '03', title: 'Act', body: 'Every Monday — one brief, one action, the biggest leak. Plain English. No jargon.' },
]

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
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const iv = setInterval(() => setSymptomIdx(i => (i + 1) % SYMPTOMS.length), 2800)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleWaitlist() {
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) { setStatus('success'); setEmail('') }
      else setStatus('error')
    } catch { setStatus('error') }
  }

  async function handleBook() {
    if (!bookName || !bookEmail) return
    setBookStatus('loading')
    try {
      await fetch('/api/book-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: bookName, email: bookEmail, company: bookCompany, spend: bookSpend }),
      })
    } catch {}
    setBookStatus('success')
  }

  const parallaxOffset = scrollY * 0.3

  return (
    <div style={{ minHeight: '100vh', background: '#06060A', color: '#faf8f5', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes symptomIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(201,168,76,0.15); }
          50% { border-color: rgba(201,168,76,0.5); }
        }

        .hero-stat { animation: fadeUp 0.7s ease both; }
        .hero-stat:nth-child(1) { animation-delay: 0.6s; }
        .hero-stat:nth-child(2) { animation-delay: 0.75s; }
        .hero-stat:nth-child(3) { animation-delay: 0.9s; }
        .hero-stat:nth-child(4) { animation-delay: 1.05s; }

        .step-card { transition: transform 0.25s ease, border-color 0.25s ease; }
        .step-card:hover { transform: translateY(-4px); border-color: rgba(201,168,76,0.4) !important; }

        .cta-btn { transition: background 0.2s ease, transform 0.15s ease; }
        .cta-btn:hover { transform: translateY(-1px); }

        .nav-link { transition: color 0.2s ease; }
        .nav-link:hover { color: rgba(250,248,245,0.8) !important; }

        .symptom-text { animation: symptomIn 0.5s ease both; }

        .pill-badge { transition: background 0.2s ease; }
        .pill-badge:hover { background: rgba(201,168,76,0.1) !important; }

        .book-btn { transition: all 0.2s ease; }
        .book-btn:hover { background: rgba(201,168,76,0.08) !important; border-color: rgba(201,168,76,0.4) !important; }

        .modal-overlay { animation: fadeIn 0.2s ease; }
        .modal-box { animation: fadeUp 0.3s ease; }

        input::placeholder { color: rgba(250,248,245,0.25); }
        input:focus { border-color: rgba(201,168,76,0.5) !important; outline: none; }

        .health-pill { display: inline-block; padding: 3px 10px; border-radius: 3px; font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; letter-spacing: 2px; }
        .health-strong   { background: #1a3a1a; color: #4c8b4c; border: 1px solid #2a5a2a; }
        .health-weak     { background: #2a2210; color: #c9a84c; border: 1px solid #3a3218; }
        .health-bleeding { background: #2a1a0a; color: #c97a2c; border: 1px solid #3a2a1a; }
        .health-dead     { background: #2a1010; color: #c94c4c; border: 1px solid #3a1818; }

        .vision-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(250,248,245,0.08); border-radius: 8px; padding: 40px; position: relative; overflow: hidden; }
        .vision-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent); }

        .mock-dashboard { animation: borderPulse 4s ease infinite; }
      `}</style>

      {/* Scanline */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent)', animation: 'scanline 10s linear infinite', opacity: 0.6 }} />
      </div>

      {/* Grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(250,248,245,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(250,248,245,0.016) 1px, transparent 1px)', backgroundSize: '72px 72px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Orb */}
      <div style={{ position: 'fixed', top: `${-20 + parallaxOffset * 0.1}vh`, left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '70vh', background: 'radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* NAV */}
        <nav style={{ padding: '18px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(250,248,245,0.05)', position: 'sticky', top: 0, background: 'rgba(6,6,10,0.88)', backdropFilter: 'blur(14px)', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, fontStyle: 'italic', letterSpacing: 2 }}>VV</span>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.4)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vanguard Visuals</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(250,248,245,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>Growth Ad Engine</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#how" className="nav-link" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.35)', letterSpacing: '1.5px', textDecoration: 'none' }}>How it works</a>
            <a href="#vision" className="nav-link" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.35)', letterSpacing: '1.5px', textDecoration: 'none' }}>VV Ad Vision</a>
            <button onClick={() => setShowBook(true)} className="book-btn" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(201,168,76,0.8)', letterSpacing: '1.5px', padding: '7px 14px', border: '1px solid rgba(201,168,76,0.22)', borderRadius: 4, background: 'transparent', cursor: 'pointer' }}>Book a Call</button>
            <a href="/login" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.45)', letterSpacing: '1.5px', textDecoration: 'none', padding: '7px 14px', border: '1px solid rgba(250,248,245,0.1)', borderRadius: 4 }}>Sign In →</a>
          </div>
        </nav>

        {/* HERO */}
        <section ref={heroRef} style={{ maxWidth: 960, margin: '0 auto', padding: '110px 48px 80px', textAlign: 'center' }}>

          <div style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <span className="pill-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(201,168,76,0.75)', letterSpacing: '2.5px', textTransform: 'uppercase', padding: '6px 14px', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 20, marginBottom: 36, background: 'rgba(201,168,76,0.04)', cursor: 'default' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', animation: 'pulse 2s ease infinite', display: 'inline-block' }} />
              Embedded Intelligence on Retainer
            </span>
          </div>

          <div style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 300, lineHeight: 1.02, letterSpacing: -1.5, marginBottom: 28, color: '#faf8f5' }}>
              Your ad spend is<br />
              <em style={{ color: 'rgba(250,248,245,0.16)', fontStyle: 'italic' }}>bleeding.</em><br />
              We find the leak.
            </h1>
          </div>

          {/* Rotating symptom ticker */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.35s both', marginBottom: 24, minHeight: 34 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', background: 'rgba(201,76,76,0.06)', border: '1px solid rgba(201,76,76,0.14)', borderRadius: 4 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(201,76,76,0.55)', letterSpacing: 2 }}>YOU:</span>
              <span key={symptomIdx} className="symptom-text" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.5)', letterSpacing: 0.5 }}>{SYMPTOMS[symptomIdx]}</span>
            </div>
          </div>

          <div style={{ animation: 'fadeUp 0.6s ease 0.4s both', marginBottom: 48 }}>
            <p style={{ fontSize: 16, color: 'rgba(250,248,245,0.42)', lineHeight: 1.85, maxWidth: 560, margin: '0 auto', fontWeight: 300 }}>
              VV Growth Ad Engine connects to your Meta and Google campaigns, classifies every campaign as{' '}
              <strong style={{ color: 'rgba(250,248,245,0.7)', fontWeight: 500 }}>STRONG, WEAK, BLEEDING,</strong> or{' '}
              <strong style={{ color: 'rgba(250,248,245,0.7)', fontWeight: 500 }}>DEAD</strong>, and delivers your single biggest budget leak in plain English — every week.
            </p>
          </div>

          {/* Waitlist form */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.5s both', marginBottom: 16 }}>
            <div style={{ display: 'flex', maxWidth: 460, margin: '0 auto', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(250,248,245,0.09)', background: 'rgba(255,255,255,0.025)' }}>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWaitlist()} disabled={status === 'success'}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 18px', color: '#faf8f5', fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
              <button onClick={handleWaitlist} disabled={status === 'loading' || status === 'success'} className="cta-btn"
                style={{ background: '#c9a84c', border: 'none', padding: '14px 24px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#0a0908', letterSpacing: '1.5px', fontWeight: 600, whiteSpace: 'nowrap', opacity: status === 'loading' ? 0.7 : 1 }}>
                {status === 'loading' ? 'Joining...' : status === 'success' ? "You're in ✓" : 'Get Early Access →'}
              </button>
            </div>
            {status === 'success' && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(201,168,76,0.7)', marginTop: 10, letterSpacing: 1 }}>Intelligence brief incoming. We'll be in touch.</div>}
            {status === 'error' && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(220,80,80,0.7)', marginTop: 10, letterSpacing: 1 }}>Something went wrong. Try again.</div>}
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.17)', marginTop: 10, letterSpacing: 1 }}>No spam. One email when we open access.</div>
          </div>

          <div style={{ animation: 'fadeUp 0.6s ease 0.6s both' }}>
            <button onClick={() => setShowBook(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(201,168,76,0.5)', letterSpacing: 1, textDecoration: 'underline', textDecorationColor: 'rgba(201,168,76,0.2)' }}>
              Or book a 15-min call with Vanguard →
            </button>
          </div>
        </section>

        {/* LIVE DASHBOARD PREVIEW */}
        <section style={{ padding: '0 48px 80px', maxWidth: 900, margin: '0 auto' }}>
          <div className="mock-dashboard" style={{ border: '1px solid rgba(250,248,245,0.07)', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.012)', animation: 'fadeUp 0.7s ease 0.7s both' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(250,248,245,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />)}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', letterSpacing: 2 }}>vv-growth-engine · live dashboard</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4c8b4c', animation: 'pulse 2s ease infinite' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(250,248,245,0.2)', letterSpacing: 1 }}>LIVE</span>
              </div>
            </div>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(250,248,245,0.05)', background: 'rgba(201,76,76,0.05)', borderLeft: '3px solid rgba(201,76,76,0.45)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(201,76,76,0.55)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>Biggest Leak Identified</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: '#faf8f5', marginBottom: 4 }}>Summer Sale — Retargeting consuming $3.2k/mo at 1.8x ROAS</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(201,76,76,0.55)' }}>→ Reduce budget 50% and refresh creative within 48 hours.</div>
            </div>
            <div style={{ padding: '10px 22px' }}>
              {[
                { name: 'Lookalike — Past Purchasers',    spend: '$9.2k', roas: '6.2x', health: 'strong' },
                { name: 'Summer Sale — Retargeting',       spend: '$3.2k', roas: '1.8x', health: 'bleeding' },
                { name: 'Performance Max — All Products',  spend: '$2.8k', roas: '0.9x', health: 'dead' },
                { name: 'Brand Awareness — Cold',          spend: '$2.2k', roas: '0.6x', health: 'dead' },
                { name: 'UGC Creative — Ages 18–24',       spend: '$1.8k', roas: '3.4x', health: 'strong' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 4 ? '1px solid rgba(250,248,245,0.04)' : 'none' }}>
                  <div style={{ fontSize: 12, color: 'rgba(250,248,245,0.65)', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.3)' }}>{c.spend}</span>
                    <span className={`health-pill health-${c.health}`}>{c.health.toUpperCase()}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: c.health === 'strong' ? '#4c8b4c' : c.health === 'bleeding' ? '#c97a2c' : '#c94c4c' }}>{c.roas}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <div style={{ borderTop: '1px solid rgba(250,248,245,0.06)', borderBottom: '1px solid rgba(250,248,245,0.06)', padding: '32px 48px', display: 'flex', justifyContent: 'center', gap: '72px', flexWrap: 'wrap' }}>
          {STATS.map((s, i) => (
            <div key={i} className="hero-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: '#faf8f5', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.3)', letterSpacing: '1.5px', marginTop: 6, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section id="how" style={{ maxWidth: 960, margin: '0 auto', padding: '100px 48px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.28)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>How it works</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 300, textAlign: 'center', marginBottom: 64, color: '#faf8f5' }}>Intelligence, delivered weekly</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="step-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(250,248,245,0.07)', borderRadius: 8, padding: '32px 26px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(201,168,76,0.4)', letterSpacing: '2px', marginBottom: 18 }}>{s.n}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400, marginBottom: 12, color: '#faf8f5' }}>{s.title}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(250,248,245,0.42)', lineHeight: 1.75 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HEALTH CLASSIFICATION */}
        <section style={{ borderTop: '1px solid rgba(250,248,245,0.06)', padding: '80px 48px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.28)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 14 }}>Campaign intelligence</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 300, marginBottom: 48, color: '#faf8f5' }}>Every campaign. Classified.</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            {[['STRONG','strong'],['WEAK','weak'],['BLEEDING','bleeding'],['DEAD','dead']].map(([l, h]) => (
              <span key={l} className={`health-pill health-${h}`} style={{ fontSize: 11, padding: '8px 20px', letterSpacing: '3px' }}>{l}</span>
            ))}
          </div>
          <div style={{ maxWidth: 580, margin: '0 auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(250,248,245,0.07)', borderLeft: '3px solid rgba(201,76,76,0.45)', borderRadius: 8, padding: '22px 26px', textAlign: 'left' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(201,76,76,0.55)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Biggest Leak Identified</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: '#faf8f5', marginBottom: 6 }}>Summer Sale — Retargeting consuming $3.2k/mo at 1.8x ROAS</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(201,76,76,0.55)' }}>→ Reduce budget 50% and refresh creative within 48 hours.</div>
          </div>
        </section>

        {/* VV AD VISION DROP */}
        <section id="vision" style={{ padding: '80px 48px', borderTop: '1px solid rgba(250,248,245,0.06)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.28)', letterSpacing: '3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Coming Soon</div>
              <div style={{ height: 1, flex: 1, background: 'rgba(250,248,245,0.06)' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(201,168,76,0.6)', letterSpacing: 2, padding: '4px 10px', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 3, whiteSpace: 'nowrap' }}>FREE TOOL</span>
            </div>

            <div className="vision-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(201,168,76,0.6)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 14 }}>VV Ad Vision Drop</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: '#faf8f5', marginBottom: 18, lineHeight: 1.15 }}>See where your budget goes. Free.</h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(250,248,245,0.42)', lineHeight: 1.82, marginBottom: 24 }}>
                    VV Ad Vision is a free diagnostic tool — connect your ad account and get an instant snapshot of campaign health, wasted budget, and your single biggest leak. No commitment. No credit card.
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.28)', lineHeight: 1.7, marginBottom: 28 }}>
                    Built as an entry point to the full VV Growth Ad Engine — for brands who want to see the intelligence before they commit to the platform.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Free snapshot audit', 'No credit card', 'Instant results', 'Meta + Google'].map(t => (
                      <span key={t} style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.35)', padding: '4px 10px', border: '1px solid rgba(250,248,245,0.07)', borderRadius: 3 }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(250,248,245,0.08)', borderRadius: 8, padding: '24px', animation: 'borderPulse 3s ease infinite' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16 }}>Ad Vision Snapshot</div>
                    {[
                      { label: 'Total Spend Analysed', value: '$12.4k', color: '#faf8f5' },
                      { label: 'Wasted Spend',         value: '$4.1k',  color: '#c94c4c' },
                      { label: 'Recovery Potential',   value: '33%',    color: '#c9a84c' },
                      { label: 'Campaigns Flagged',    value: '3 of 7', color: '#c97a2c' },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 3 ? '1px solid rgba(250,248,245,0.05)' : 'none' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.32)' }}>{r.label}</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(201,76,76,0.06)', borderLeft: '2px solid rgba(201,76,76,0.35)', borderRadius: '0 4px 4px 0' }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(201,76,76,0.55)', letterSpacing: 2, marginBottom: 4 }}>TOP LEAK</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(250,248,245,0.55)' }}>Retargeting — $1.8k/mo at 1.2x ROAS. Reduce or pause.</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', textAlign: 'center', marginTop: 10, letterSpacing: 1 }}>Releasing soon — join waitlist for early access</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section style={{ padding: '80px 48px', borderTop: '1px solid rgba(250,248,245,0.06)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.28)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 14 }}>Work with us</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, marginBottom: 16, color: '#faf8f5', lineHeight: 1.15 }}>Ready to stop the bleed?</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(250,248,245,0.38)', marginBottom: 40, lineHeight: 1.75, maxWidth: 460, margin: '0 auto 40px' }}>
            Book a 15-minute call with the Vanguard team. We'll show you exactly where your budget is leaking and what we'd do about it.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowBook(true)} className="cta-btn"
              style={{ padding: '14px 32px', border: 'none', borderRadius: 5, background: '#c9a84c', color: '#0a0908', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '1.5px', fontWeight: 600 }}>
              Book a Call →
            </button>
            <div style={{ display: 'flex', maxWidth: 320, borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(250,248,245,0.09)' }}>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWaitlist()} disabled={status === 'success'}
                style={{ flex: 1, background: 'rgba(255,255,255,0.025)', border: 'none', padding: '14px 14px', color: '#faf8f5', fontFamily: "'DM Mono', monospace", fontSize: 10 }} />
              <button onClick={handleWaitlist} disabled={status === 'loading' || status === 'success'} className="cta-btn"
                style={{ background: 'rgba(201,168,76,0.12)', border: 'none', padding: '14px 14px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c9a84c', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                {status === 'success' ? '✓' : 'Join List'}
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(250,248,245,0.06)', padding: '22px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', letterSpacing: 1 }}>© 2026 Vanguard Visuals · Growth Ad Engine</div>
          <div style={{ display: 'flex', gap: 22 }}>
            <a href="/privacy" style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', textDecoration: 'none', letterSpacing: 1 }}>Privacy</a>
            <a href="/terms" style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', textDecoration: 'none', letterSpacing: 1 }}>Terms</a>
            <button onClick={() => setShowBook(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', letterSpacing: 1, padding: 0 }}>Book a Call</button>
          </div>
        </footer>

      </div>

      {/* BOOK A CALL MODAL */}
      {showBook && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBook(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
          <div className="modal-box" style={{ background: '#0f0e0d', border: '1px solid rgba(250,248,245,0.1)', borderRadius: 10, padding: '40px', maxWidth: 480, width: '100%', position: 'relative' }}>
            <button onClick={() => setShowBook(false)} style={{ position: 'absolute', top: 16, right: 18, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(250,248,245,0.28)', fontSize: 20, lineHeight: 1 }}>×</button>

            {bookStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: '#c9a84c', marginBottom: 18, lineHeight: 1 }}>✓</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: '#faf8f5', marginBottom: 12 }}>Request received.</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(250,248,245,0.38)', letterSpacing: 0.5, lineHeight: 1.8 }}>We'll reach out within 24 hours to confirm your call time. Check your inbox at {bookEmail}.</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(201,168,76,0.6)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Book a Call</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: '#faf8f5', marginBottom: 6 }}>Talk to Vanguard</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(250,248,245,0.38)', lineHeight: 1.75, marginBottom: 28 }}>15 minutes. We'll show you exactly where your ad budget is leaking and what we'd do about it.</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Full Name',        placeholder: 'Your name',            value: bookName,    onChange: setBookName },
                    { label: 'Email',            placeholder: 'your@company.com',     value: bookEmail,   onChange: setBookEmail },
                    { label: 'Company',          placeholder: 'Your brand or company', value: bookCompany, onChange: setBookCompany },
                    { label: 'Monthly Ad Spend', placeholder: 'e.g. $5,000/mo',       value: bookSpend,   onChange: setBookSpend },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(250,248,245,0.32)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>{f.label}</div>
                      <input type="text" placeholder={f.placeholder} value={f.value} onChange={e => f.onChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(250,248,245,0.09)', borderRadius: 5, color: '#faf8f5', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }} />
                    </div>
                  ))}

                  <button onClick={handleBook} disabled={bookStatus === 'loading' || !bookName || !bookEmail} className="cta-btn"
                    style={{ marginTop: 8, padding: '13px', border: 'none', borderRadius: 5, background: (!bookName || !bookEmail) ? 'rgba(201,168,76,0.25)' : '#c9a84c', color: '#0a0908', cursor: (!bookName || !bookEmail) ? 'not-allowed' : 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '1.5px', fontWeight: 600 }}>
                    {bookStatus === 'loading' ? 'Submitting...' : 'Request Call →'}
                  </button>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(250,248,245,0.18)', textAlign: 'center', letterSpacing: 1 }}>We'll follow up within 24 hours to confirm timing.</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}