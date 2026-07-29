'use client'
import { useState, useEffect } from 'react'
import ProductShowcase from '@/components/ProductShowcase'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page.

   One statement per viewport, editorial dark register. VV connects to your
   Meta ad account (read-only) and tells you which campaigns make money, which
   quietly waste it, and what to fix first — in plain English.

   Structure: hero → product showcase → the four states → a sample diagnosis →
   method → security → pricing → FAQ → founder line → closing band.

   The audit CTA ("See your audit →" → /audit) appears in the header, the hero,
   and the closing band; the pricing section carries the founding-clients CTA.
   Motion is concentrated: a living hero gradient, the product showcase loop,
   and a one-time count-up on the four states — nothing else moves.
─────────────────────────────────────────────────────────────────────────── */

const AUDIT = '/audit'
const START = '/signup'
// Series — the VV video channel. TODO(verify): confirm this is the live handle.
const SERIES = 'https://www.youtube.com/@vngrdvisuals'

const STRONG = '#4ade80'
const WEAK = '#fbbf24'
const BLEEDING = '#fb923c'
const DEAD = '#f87171'

export default function LandingClient() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Scroll reveals — fade + rise, toggled via IntersectionObserver at 15%.
  // prefers-reduced-motion visitors get everything visible immediately.
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Four-states count-up — figures ease from 0 to their value over 900ms when
  // the band scrolls into view, staggered 100ms, once. Reduced-motion skips
  // straight to the final value (server-rendered text stays put).
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('.count'))
    if (!els.length) return
    const fmt = (el: HTMLElement, val: number) => {
      const dec = Number(el.dataset.dec || 0)
      const pre = el.dataset.prefix || ''
      const suf = el.dataset.suffix || ''
      const n = dec === 0 ? Math.round(val).toLocaleString('en-US') : val.toFixed(dec)
      return pre + n + suf
    }
    els.forEach((el) => { el.textContent = fmt(el, 0) }) // reset to zero before reveal
    const run = (el: HTMLElement, delay: number) => {
      const to = parseFloat(el.dataset.to || '0')
      const dur = 900
      let t0: number | null = null
      const step = (t: number) => {
        if (t0 === null) t0 = t
        const p = Math.min((t - t0 - delay) / dur, 1)
        if (p < 0) { requestAnimationFrame(step); return }
        const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
        el.textContent = fmt(el, to * e)
        if (p < 1) requestAnimationFrame(step)
        else el.textContent = fmt(el, to)
      }
      requestAnimationFrame(step)
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement
            run(el, Number(el.dataset.stagger || 0))
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.4 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* barely-visible grain, fixed behind everything */}
      <div className="grain" aria-hidden />

      {/* ───────────────────────── NAVBAR ───────────────────────── */}
      <nav className="nav">
        <a href="/" className="nav-brand" aria-label="Vanguard Visuals">
          <span className="nav-vv">VV</span>
          <span className="nav-sub">VANGUARD VISUALS</span>
        </a>

        <div className="nav-links">
          <a href="/methodology" className="nav-link">Method</a>
          <a href="/security" className="nav-link">Security</a>
          <a href="/#pricing" className="nav-link">Pricing</a>
          <a href={SERIES} className="nav-link" target="_blank" rel="noopener noreferrer">Series</a>
        </div>

        <div className="nav-right">
          <a href="/login" className="nav-link nav-signin">Sign in</a>
          <a href={AUDIT} className="btn-gold btn-compact">See your audit →</a>
        </div>

        <button
          className="nav-menu-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          Menu
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <div className={`menu${menuOpen ? ' open' : ''}`}>
        <button className="menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>Close</button>
        <a href="/methodology" onClick={() => setMenuOpen(false)}>Method</a>
        <a href="/security" onClick={() => setMenuOpen(false)}>Security</a>
        <a href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <a href={SERIES} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Series</a>
        <a href="/login" onClick={() => setMenuOpen(false)}>Sign in</a>
        <a href={AUDIT} className="menu-cta" onClick={() => setMenuOpen(false)}>See your audit →</a>
      </div>

      {/* ───────────────────────── [1] HERO ───────────────────────── */}
      <header className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="wrap hero-inner">
          <p className="eyebrow reveal">META ADS INTELLIGENCE</p>
          <h1 className="h1">
            <span className="h1-l1">Know what your money</span>
            <span className="h1-l2">is <span className="gold">doing.</span></span>
          </h1>
          <p className="lead reveal" style={{ transitionDelay: '140ms', maxWidth: '52ch' }}>
            VV connects to your Meta ad account — read-only — and tells you which
            campaigns make money, which quietly waste it, and what to fix first.
            In plain English.
          </p>
          <div className="reveal" style={{ transitionDelay: '220ms', marginTop: 48 }}>
            <a href={AUDIT} className="btn-gold">See your audit →</a>
          </div>
          <p className="hero-fine reveal" style={{ transitionDelay: '300ms' }}>FREE · 60 SECONDS · READ-ONLY</p>
        </div>
      </header>

      {/* ───────────────────────── [2] PRODUCT SHOWCASE ───────────────────────── */}
      <section className="sec alt">
        <div className="wrap">
          <p className="eyebrow reveal">INSIDE THE PRODUCT</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms', maxWidth: '20ch' }}>
            Your account, read in plain&nbsp;English.
          </h2>
          <div className="reveal" style={{ transitionDelay: '120ms', marginTop: 48 }}>
            <ProductShowcase />
          </div>
          <p className="showcase-cap reveal" style={{ transitionDelay: '160ms' }}>
            A live view of the VV dashboard. Illustrative — not a real account.
          </p>
        </div>
      </section>

      {/* ───────────────────────── [3] THE FOUR STATES ───────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <p className="eyebrow reveal">THE CLASSIFICATION</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms' }}>Every campaign, classified.</h2>

          <div className="states">
            {STATES.map((s, i) => (
              <div className="state reveal" key={s.label} style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="state-label" style={{ color: s.color }}>{s.label}</span>
                <span
                  className="state-fig count"
                  data-to={s.to}
                  data-dec={s.dec}
                  data-prefix={s.prefix || ''}
                  data-suffix={s.suffix || ''}
                  data-stagger={i * 100}
                >
                  {s.fig}
                </span>
                <span className="state-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── [4] THE DIAGNOSIS ───────────────────────── */}
      <section className="sec alt">
        <div className="wrap">
          <p className="eyebrow reveal">THE REPORT</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms' }}>Plain English. One&nbsp;action.</h2>

          <div className="doc reveal" style={{ transitionDelay: '120ms' }}>
            <p className="doc-meta">SUMMER SALE — RETARGETING · <span style={{ color: BLEEDING }}>BLEEDING</span> · $3,200/MO · 1.8× ROAS</p>
            <p className="doc-diag">
              This retargeting campaign is burning budget against warm audiences
              that have stopped responding. You&rsquo;re spending $178 to acquire a
              customer on a $320 AOV — every conversion costs more than it returns.
              Frequency has crossed 3.4× and CTR has slid over the last two weeks:
              classic fatigue.
            </p>
            <p className="doc-action-label">IMMEDIATE ACTION</p>
            <p className="doc-action">
              Pause this campaign and reallocate the $3,200 to Lookalike — Past
              Purchasers, your strongest performer at 4.8×.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── [5] METHOD ───────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <p className="eyebrow reveal">METHOD</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms' }}>Judgment, written as&nbsp;software.</h2>

          <div className="cols">
            {METHOD.map((m, i) => (
              <div className="col reveal" key={m.title} style={{ transitionDelay: `${i * 80}ms` }}>
                <h3 className="col-title">{m.title}</h3>
                <p className="col-body">{m.body}</p>
              </div>
            ))}
          </div>

          <p className="reveal" style={{ marginTop: 48 }}>
            <a href="/methodology" className="ln-gold">READ THE FULL METHOD →</a>
          </p>
        </div>
      </section>

      {/* ───────────────────────── [6] TRUST ───────────────────────── */}
      <section className="sec alt">
        <div className="wrap">
          <p className="eyebrow reveal">SECURITY</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms' }}>
            VV cannot touch your campaigns. By&nbsp;design.
          </h2>
          <p className="body reveal" style={{ transitionDelay: '120ms', marginTop: 24 }}>
            We request read-only access to your Meta ad account and nothing more.
            We can see your data. We cannot spend, pause, edit, or launch anything
            — because the access we hold makes it impossible.
          </p>

          <div className="scope reveal" style={{ transitionDelay: '160ms' }}>
            <div className="scope-panel scope-req">
              <p className="scope-cap">REQUESTED</p>
              <p className="scope-mono">ads_read</p>
              <p className="scope-note">Read campaign structure, spend, and performance metrics.</p>
            </div>
            <div className="scope-panel scope-never">
              <p className="scope-cap scope-cap-off">NEVER REQUESTED</p>
              {['ads_management', 'business_management', 'pages_manage_ads'].map((s) => (
                <p className="scope-mono scope-mono-off" key={s}>
                  <span aria-hidden style={{ textDecoration: 'none', marginRight: 10 }}>×</span>{s}
                </p>
              ))}
              <p className="scope-note scope-note-off">Write access. Campaign creation. Budget changes.</p>
            </div>
          </div>

          <p className="reveal" style={{ marginTop: 32 }}>
            <a href="/security" className="ln-gold">READ THE SECURITY ARCHITECTURE →</a>
          </p>
        </div>
      </section>

      {/* ───────────────────────── [7] PRICING ───────────────────────── */}
      <section className="sec" id="pricing">
        <div className="wrap">
          <p className="eyebrow reveal">FOUNDING CLIENTS</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms' }}>Free, for the founders who shape&nbsp;it.</h2>
          <p className="body reveal" style={{ transitionDelay: '120ms', marginTop: 24 }}>
            We&rsquo;re taking a small number of founding clients — free, for as long
            as they stay. In exchange: honest feedback and a testimonial when VV
            earns one. Direct line to the founder. Your account shapes what VV
            becomes.
          </p>

          <div className="founders-panel reveal" style={{ transitionDelay: '160ms' }}>
            <a href={START} className="btn-gold">Apply for a founding seat →</a>
          </div>

          <p className="pricing-after reveal" style={{ transitionDelay: '200ms' }}>
            After the founding cohort: $149/mo. Seven-day free trial, no card to
            start, cancel anytime.
          </p>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section className="sec alt">
        <div className="wrap">
          <p className="eyebrow reveal">QUESTIONS</p>
          <h2 className="h2 reveal" style={{ transitionDelay: '60ms' }}>Before you connect.</h2>

          <div className="faq reveal" style={{ transitionDelay: '120ms' }}>
            {FAQS.map((f) => (
              <div className="faq-row" key={f.q}>
                <h3 className="faq-q">{f.q}</h3>
                <p className="faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── [8] FOUNDER LINE ───────────────────────── */}
      <section className="sec founder">
        <div className="wrap">
          <p className="founder-line reveal">
            VV is built by Vanguard Visuals. We read ad accounts for a living — VV
            is that judgment, written as software.
          </p>
        </div>
      </section>

      {/* ───────────────────────── [9] CLOSING BAND ───────────────────────── */}
      <section className="close">
        <div className="wrap close-inner">
          <h2 className="h2 reveal">Some campaigns are making money. Some are&nbsp;not.</h2>
          <p className="lead reveal" style={{ transitionDelay: '80ms', marginTop: 16 }}>Find out which — in 60 seconds.</p>
          <div className="reveal" style={{ transitionDelay: '160ms', marginTop: 48 }}>
            <a href={AUDIT} className="btn-gold">See your audit →</a>
          </div>
        </div>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="footer">
        <div className="wrap foot-inner">
          <div className="foot-l">
            <div className="foot-brand"><span className="nav-vv">VV</span> <span className="foot-ge">Growth Ad Engine</span></div>
            <span className="foot-c">© 2026 Vanguard Visuals. All rights reserved.</span>
          </div>
          <div className="foot-r">
            <a href="/methodology" className="ln">Method</a>
            <a href="/security" className="ln">Security</a>
            <a href="/privacy" className="ln">Privacy</a>
            <a href="/terms" className="ln">Terms</a>
            <a href="/login" className="ln">Sign In</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ───────────────────────── DATA ───────────────────────── */

const STATES = [
  { label: 'STRONG', color: STRONG, fig: '6.2×', to: 6.2, dec: 1, prefix: '', suffix: '×', desc: 'Making money. A candidate to scale.' },
  { label: 'WEAK', color: WEAK, fig: '1.8×', to: 1.8, dec: 1, prefix: '', suffix: '×', desc: 'Profitable but underperforming. Fix before it slips.' },
  { label: 'BLEEDING', color: BLEEDING, fig: '$3,200', to: 3200, dec: 0, prefix: '$', suffix: '', desc: 'Actively losing money every month.' },
  { label: 'DEAD', color: DEAD, fig: '0.0×', to: 0, dec: 1, prefix: '', suffix: '', desc: 'Zero return. Move the budget.' },
]

const METHOD = [
  {
    title: 'Thresholds with reasons',
    body: 'WEAK means 1.5×–2.5× ROAS: profitable but underperforming. Every classification has a defined boundary and a reason you can read.',
  },
  {
    title: 'Signals, not symptoms',
    body: 'Frequency is a receipt, not a warning. VV reads the leading indicators — CTR decay, spend concentration — before the dashboard admits there’s a problem.',
  },
  {
    title: 'One action first',
    body: 'Every report ends with the single highest-impact fix. Not twelve charts. The one thing.',
  },
]

const FAQS = [
  { q: 'Will this touch my ad account?', a: 'Never. VV has read-only access — it cannot create, edit, pause, or delete anything. Nothing in your account changes.' },
  { q: 'Is my data safe?', a: 'Connection is through Meta’s official Marketing API with read-only permissions. We never store your password, and you can disconnect in one click anytime.' },
  { q: 'How is this different from my Meta dashboard?', a: 'Meta shows you numbers. VV tells you what they mean and exactly what to do — which campaigns make money, which waste it, and the first fix, in plain English.' },
  { q: 'Do I need to be technical?', a: 'No. If you can read an email, you can read your report. It arrives in plain language with the single most important action highlighted.' },
  { q: 'What does it cost?', a: 'The audit is free. The product is $149/mo with a 7-day free trial — no card to start, cancel anytime.' },
]

/* ───────────────────────── STYLES ───────────────────────── */

const CSS = `
.lp{
  --serif:'Cormorant Garamond',serif;
  --mono:'DM Mono',monospace;
  --sans:'DM Sans',sans-serif;
  background:var(--bg);color:var(--ink);overflow-x:hidden;width:100%;position:relative;
}
.lp ::selection{background:rgba(201,168,76,.25);color:#faf8f5;}
.lp a{color:inherit;text-decoration:none;}

/* grain — inline SVG turbulence, 2% opacity, fixed behind content */
.lp .grain{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.02;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:128px 128px;}
.lp > *:not(.grain){position:relative;z-index:1;}

/* reveal — fade + rise, 600ms */
.lp .reveal{opacity:0;transform:translateY(16px);
  transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1);will-change:opacity,transform;}
.lp .reveal.in{opacity:1;transform:none;}
@media (prefers-reduced-motion:reduce){
  .lp .reveal{opacity:1;transform:none;transition:none;}
}

/* ── layout ── */
.lp .wrap{max-width:1120px;margin:0 auto;padding:0 24px;}
.lp .sec{padding:140px 0;border-top:1px solid var(--rule);}
.lp .sec.alt{background:var(--bg2);}

/* ── type scale ── */
.lp .eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink3);margin:0;}
.lp .h1{font-family:var(--serif);font-weight:300;font-size:clamp(52px,7vw,96px);line-height:1.02;letter-spacing:-.03em;
  color:var(--ink);margin:24px 0 0;font-feature-settings:"liga" 1;display:flex;flex-direction:column;}
.lp .h1-l2{margin-left:.5ch;}
.lp .gold{color:var(--gold);}
.lp .h2{font-family:var(--serif);font-weight:300;font-size:clamp(32px,4vw,48px);line-height:1.12;letter-spacing:-.02em;
  color:var(--ink);margin:0;font-feature-settings:"liga" 1;}
.lp .lead{font-family:var(--sans);font-weight:300;font-size:21px;line-height:1.6;color:var(--ink);margin:0;}
.lp .body{font-family:var(--sans);font-weight:300;font-size:17px;line-height:1.75;letter-spacing:.01em;color:var(--ink2);max-width:62ch;margin:0;}

/* ── buttons ── */
.lp .btn-gold{display:inline-flex;align-items:center;font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:1.2px;
  text-transform:uppercase;color:#050509;background:var(--gold);padding:16px 32px;border-radius:4px;
  transition:background .2s ease-out,transform .2s ease-out;}
.lp .btn-gold:hover{background:#d4b55c;transform:translateY(-1px);}
.lp .btn-gold:active{transform:translateY(0);}
.lp .btn-gold:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}

/* ── text links — animated underline ── */
.lp .ln,.lp .ln-gold{background-image:linear-gradient(var(--gold),var(--gold));background-repeat:no-repeat;
  background-position:0 100%;background-size:0% 1px;transition:background-size .2s ease-out,color .2s ease-out;}
.lp .ln:hover,.lp .ln-gold:hover{background-size:100% 1px;}
.lp .ln-gold{font-family:var(--mono);font-size:11px;letter-spacing:1.2px;color:var(--gold);}
.lp .ln{color:inherit;}

/* ── NAVBAR — sticky, always-on translucent bar ── */
.lp .nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:24px;
  padding:16px 32px;background:rgba(5,5,9,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid var(--rule);}
.lp .nav-brand{display:flex;align-items:baseline;gap:12px;}
.lp .nav-vv{font-family:var(--serif);font-style:italic;font-weight:600;font-size:26px;line-height:1;color:var(--ink);letter-spacing:1px;}
.lp .nav-sub{font-family:var(--mono);font-size:9px;letter-spacing:2px;color:var(--ink3);}
.lp .nav-links{display:flex;align-items:center;gap:32px;}
.lp .nav-link{font-family:var(--sans);font-weight:400;font-size:13px;color:var(--ink2);transition:color .2s ease;}
.lp .nav-link:hover{color:var(--ink);}
.lp .nav-right{display:flex;align-items:center;gap:24px;}
.lp .btn-compact{padding:12px 24px;font-size:10px;}
.lp .nav-menu-btn{display:none;background:none;border:none;cursor:pointer;font-family:var(--mono);font-size:11px;
  letter-spacing:1.5px;text-transform:uppercase;color:var(--ink2);padding:8px;transition:color .2s ease;}
.lp .nav-menu-btn:hover{color:var(--ink);}

/* mobile menu — minimal full-screen overlay */
.lp .menu{position:fixed;inset:0;z-index:60;background:rgba(5,5,9,.98);backdrop-filter:blur(8px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;
  opacity:0;pointer-events:none;transition:opacity .3s ease;}
.lp .menu.open{opacity:1;pointer-events:auto;}
.lp .menu a{font-family:var(--sans);font-weight:400;font-size:18px;color:var(--ink2);}
.lp .menu a.menu-cta{color:var(--gold);}
.lp .menu-close{position:absolute;top:24px;right:24px;background:none;border:none;color:var(--ink3);
  font-family:var(--mono);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;padding:8px;}

/* ── [1] HERO ── */
.lp .hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden;}
/* living gradient — the bright spot drifts 25%→~32% x / 35%→~42% y and scales
   1→1.08 over 18s, alternating, ease-in-out. Barely perceptible. */
.lp .hero-bg{position:absolute;inset:-10%;z-index:0;pointer-events:none;transform-origin:25% 35%;
  background:radial-gradient(90% 60% at 25% 35%,rgba(201,168,76,.06),transparent 60%);
  animation:heroDrift 18s ease-in-out infinite alternate;}
@keyframes heroDrift{from{transform:translate(0,0) scale(1);}to{transform:translate(4%,4%) scale(1.08);}}
.lp .hero-inner{position:relative;z-index:1;padding-top:96px;padding-bottom:96px;}
.lp .hero-fine{font-family:var(--mono);font-size:11px;letter-spacing:1.2px;color:var(--ink3);margin:24px 0 0;}

/* hero H1 lines stagger in once, on load (not scroll) */
.lp .h1-l1,.lp .h1-l2{opacity:0;animation:heroRise .8s cubic-bezier(.16,1,.3,1) both;}
.lp .h1-l1{animation-delay:.06s;}
.lp .h1-l2{animation-delay:.18s;}
@keyframes heroRise{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){
  .lp .hero-bg{animation:none;}
  .lp .h1-l1,.lp .h1-l2{opacity:1;animation:none;}
}

/* ── [2] SHOWCASE ── */
.lp .showcase-cap{font-family:var(--mono);font-size:11px;letter-spacing:1px;color:var(--ink3);margin:24px 0 0;text-align:center;}

/* ── [3] FOUR STATES ── */
.lp .states{display:grid;grid-template-columns:repeat(4,1fr);margin-top:64px;}
.lp .state{display:flex;flex-direction:column;padding:0 32px;border-left:1px solid var(--rule);}
.lp .state:first-child{padding-left:0;border-left:none;}
.lp .state-label{font-family:var(--mono);font-size:10px;letter-spacing:2px;height:16px;line-height:16px;}
.lp .state-fig{font-family:var(--serif);font-weight:300;font-size:clamp(40px,5vw,62px);line-height:1;letter-spacing:-.02em;
  color:var(--ink);margin:24px 0 16px;font-variant-numeric:lining-nums;}
.lp .state-desc{font-family:var(--sans);font-weight:300;font-size:15px;line-height:1.6;letter-spacing:.01em;color:var(--ink2);}

/* ── [4] DIAGNOSIS ── */
.lp .doc{margin-top:48px;border:1px solid var(--rule);border-radius:8px;padding:48px;max-width:760px;}
.lp .doc-meta{font-family:var(--mono);font-size:10px;letter-spacing:1.5px;color:var(--ink3);margin:0 0 24px;}
.lp .doc-diag{font-family:var(--serif);font-weight:300;font-size:19px;line-height:1.7;letter-spacing:-.01em;color:var(--ink);
  margin:0;max-width:62ch;font-variant-numeric:lining-nums;}
.lp .doc-action-label{font-family:var(--mono);font-size:10px;letter-spacing:2px;color:var(--gold);margin:32px 0 8px;}
.lp .doc-action{font-family:var(--sans);font-weight:500;font-size:16px;line-height:1.6;color:var(--ink);margin:0;max-width:62ch;font-variant-numeric:lining-nums;}

/* ── [5] METHOD ── */
.lp .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:64px;}
.lp .col{padding-top:24px;border-top:1px solid var(--rule);}
.lp .col-title{font-family:var(--sans);font-weight:500;font-size:16px;color:var(--ink);margin:0 0 12px;}
.lp .col-body{font-family:var(--sans);font-weight:300;font-size:15px;line-height:1.7;letter-spacing:.01em;color:var(--ink2);margin:0;font-variant-numeric:lining-nums;}

/* ── [6] TRUST — scope pair ── */
.lp .scope{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:48px;max-width:760px;}
.lp .scope-panel{border-radius:8px;padding:24px 32px;}
.lp .scope-req{border:1px solid var(--goldborder);background:var(--goldpaper);}
.lp .scope-never{border:1px solid var(--rule);background:transparent;}
.lp .scope-cap{font-family:var(--mono);font-size:10px;letter-spacing:2px;color:var(--ink2);margin:0 0 16px;}
.lp .scope-cap-off{color:var(--ink3);}
.lp .scope-mono{font-family:var(--mono);font-size:16px;color:var(--ink);margin:0;font-variant-numeric:lining-nums;}
.lp .scope-mono-off{color:var(--ink3);text-decoration:line-through;text-decoration-color:var(--ink4);margin-bottom:8px;}
.lp .scope-note{font-family:var(--sans);font-weight:300;font-size:14px;line-height:1.6;color:var(--ink2);margin:16px 0 0;}
.lp .scope-note-off{color:var(--ink3);}

/* ── [7] PRICING — founding clients panel + quiet after-line ── */
.lp .founders-panel{margin-top:48px;border:1px solid var(--goldborder);background:var(--goldpaper);border-radius:8px;
  padding:40px;max-width:760px;display:flex;}
.lp .pricing-after{font-family:var(--sans);font-weight:300;font-size:15px;line-height:1.7;letter-spacing:.01em;
  color:var(--ink3);max-width:62ch;margin:24px 0 0;}

/* ── FAQ ── */
.lp .faq{margin-top:48px;max-width:820px;}
.lp .faq-row{display:grid;grid-template-columns:1fr 1.4fr;gap:32px;padding:24px 0;border-top:1px solid var(--rule);}
.lp .faq-row:last-child{border-bottom:1px solid var(--rule);}
.lp .faq-q{font-family:var(--sans);font-weight:500;font-size:16px;line-height:1.4;color:var(--ink);margin:0;}
.lp .faq-a{font-family:var(--sans);font-weight:300;font-size:15px;line-height:1.7;letter-spacing:.01em;color:var(--ink2);margin:0;}

/* ── [8] FOUNDER LINE — quiet coda, no top rule ── */
.lp .founder{border-top:none;padding:96px 0;text-align:center;}
.lp .founder-line{font-family:var(--sans);font-weight:300;font-size:18px;line-height:1.7;color:var(--ink2);max-width:52ch;margin:0 auto;}

/* ── [9] CLOSING BAND ── */
.lp .close{background:var(--bg2);border-top:1px solid var(--rule);padding:120px 0;}
.lp .close-inner{text-align:center;display:flex;flex-direction:column;align-items:center;}
.lp .close .h2{max-width:22ch;}

/* ── footer ── */
.lp .footer{border-top:1px solid var(--rule);padding:48px 0 64px;}
.lp .foot-inner{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;}
.lp .foot-brand{display:flex;align-items:baseline;gap:8px;margin-bottom:12px;}
.lp .foot-ge{font-family:var(--serif);font-style:italic;font-size:16px;color:var(--ink2);}
.lp .foot-c{font-family:var(--mono);font-size:10px;letter-spacing:1px;color:var(--ink3);}
.lp .foot-r{display:flex;gap:24px;flex-wrap:wrap;}
.lp .foot-r a{font-family:var(--mono);font-size:10px;letter-spacing:1px;color:var(--ink3);}

/* ── responsive ── */
@media (max-width:860px){
  .lp .cols{grid-template-columns:1fr;gap:0;}
  .lp .col{margin-top:24px;}
  .lp .states{grid-template-columns:1fr 1fr;gap:48px 0;}
  .lp .state{padding:0 24px;}
  .lp .state:nth-child(odd){padding-left:0;border-left:none;}
  .lp .state:nth-child(2){border-left:1px solid var(--rule);}
}
@media (max-width:680px){
  .lp .nav{padding:16px 24px;}
  .lp .nav-links{display:none;}
  .lp .nav-right{display:none;}
  .lp .nav-menu-btn{display:flex;}
  .lp .sec{padding:80px 0;}
  .lp .close{padding:80px 0;}
  .lp .founder{padding:64px 0;}
  .lp .scope{grid-template-columns:1fr;}
  .lp .faq-row{grid-template-columns:1fr;gap:12px;}
  .lp .doc{padding:32px 24px;}
  .lp .foot-inner{flex-direction:column;}
  .lp .btn-gold{width:100%;justify-content:center;}
}
@media (max-width:420px){
  .lp .states{grid-template-columns:1fr;gap:48px 0;}
  .lp .state,.lp .state:nth-child(2){padding:0;border-left:none;}
}
`
