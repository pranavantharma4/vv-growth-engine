'use client'
import { useState, useEffect } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page.
   "Apple.com meets a private intelligence firm." Editorial Cormorant Garamond
   italic, gold accent, and the actual VAI diagnosis output styled as the hero
   visual. Clean, cinematic, confident. No counters, no heartbeat, no gimmicks.
   Trust earned through quality. Every primary CTA → /audit.
─────────────────────────────────────────────────────────────────────────── */

const AUDIT    = '/audit'
const CALENDLY = 'https://calendly.com/agency-vanguardia/30min'

export default function LandingClient() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Navbar blur transition on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll reveals — fade up, CSS-only transition toggled via IntersectionObserver
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (!('IntersectionObserver' in window)) {
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
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
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

      {/* ───────────────────────── NAVBAR ───────────────────────── */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="nav-brand" aria-label="VV Growth Ad Engine">
          <span className="nav-vv">VV</span>
          <span className="nav-sub">GROWTH AD ENGINE</span>
        </a>

        <div className="nav-links">
          <a href="/login" className="nav-signin">SIGN IN</a>
          <a href={AUDIT} className="nav-cta">GET FREE AUDIT →</a>
        </div>

        <button
          className="nav-burger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <div className={`menu${menuOpen ? ' open' : ''}`}>
        <button className="menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button>
        <a href="/login" onClick={() => setMenuOpen(false)}>SIGN IN</a>
        <a href={AUDIT} onClick={() => setMenuOpen(false)}>GET FREE AUDIT →</a>
        <a href={CALENDLY} onClick={() => setMenuOpen(false)}>REQUEST ACCESS</a>
      </div>

      {/* ───────────────────────── SECTION 1 · HERO ───────────────────────── */}
      <header className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <p className="eyebrow reveal">META ADS INTELLIGENCE · POWERED BY VAI</p>

          <h1 className="hero-h1 reveal">
            The intelligence layer<br />
            your Meta campaigns<br />
            have been missing.
          </h1>

          <p className="hero-lede reveal">
            VAI connects to your Meta Ads account, reads every campaign, and tells you in
            plain English what&rsquo;s working, what&rsquo;s bleeding money, and exactly what
            to do next — every Monday morning at 7AM.
          </p>

          <div className="hero-ctas reveal">
            <a href={AUDIT} className="btn-gold">GET FREE AUDIT →</a>
            <a href={CALENDLY} className="btn-ghost">REQUEST ACCESS</a>
          </div>

          <p className="hero-fine reveal">Read-only access · No credit card required · Results in 60 seconds</p>

          {/* THE VAI CARD — hero visual */}
          <div className="vai-card reveal">
            <div className="vai-top">
              <div className="vai-top-l">
                <span className="vai-name">SUMMER SALE — RETARGETING</span>
                <span className="badge badge-meta">META</span>
                <span className="badge badge-bleed">BLEEDING</span>
              </div>
              <div className="vai-top-r">
                <span className="vai-spend">$3,200/mo</span>
                <span className="vai-roas">1.8x ROAS</span>
              </div>
            </div>

            <div className="divider" />

            <div className="vai-diag-row">
              <span className="vai-diag-label">VAI DIAGNOSIS</span>
              <span className="vai-diag-date">Monday, May 26, 2026 · 7:04 AM</span>
            </div>

            <p className="vai-diag-body">
              This retargeting campaign is hemorrhaging budget against warm audiences that have
              clearly stopped responding. You are spending $178 to acquire a customer on a $320
              AOV — every single conversion costs more than it returns.
            </p>

            <p className="vai-action-label">IMMEDIATE ACTION</p>
            <p className="vai-action">Pause this campaign. Reallocate the $3,200 to Lookalike — Past Purchasers immediately.</p>

            <div className="vai-locked">
              <span>Full root cause · 30-day blueprint · exact reallocation percentages</span>
            </div>

            <div className="vai-foot">
              <span>Every client receives this report. Every Monday. 7AM.</span>
              <a href={AUDIT} className="gold-link">Get this on your account →</a>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────────────── SECTION 2 · CAMPAIGN INTELLIGENCE ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">CAMPAIGN INTELLIGENCE</p>
        <h2 className="s-head reveal">Every campaign, classified.</h2>
        <p className="s-sub reveal">VAI reads your entire Meta account and sorts every campaign into one of four states — automatically, every week.</p>

        <div className="class-grid reveal">
          {CLASSES.map((c) => (
            <div className="class-card" key={c.label}>
              <div className="class-tag">
                <span className="dot" style={{ background: c.color }} />
                <span style={{ color: c.color }}>{c.label}</span>
              </div>
              <div className="class-stat" style={{ color: c.color }}>{c.stat}</div>
              <div className="class-unit">{c.unit}</div>
              <p className="class-desc">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="s-cta reveal"><a href={AUDIT} className="btn-ghost">SEE YOURS →</a></div>
      </section>

      {/* ───────────────────────── SECTION 3 · HOW IT WORKS ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">HOW IT WORKS</p>
        <h2 className="s-head reveal">Three steps. One Monday morning.</h2>

        <div className="how">
          {/* Row 1 — Connect */}
          <div className="how-row reveal">
            <div className="how-visual">
              <div className="mini-card connect-card">
                <span className="meta-mark">f</span>
                <button className="connect-btn">Connect Meta Ads</button>
                <span className="connect-fine">Read-only access</span>
              </div>
            </div>
            <div className="how-text">
              <span className="how-num">01</span>
              <h3 className="how-h">Connect your Meta account</h3>
              <p className="how-p">One-click OAuth connection. Read-only access — we never create, edit, or delete any of your campaigns. Your account stays fully under your control.</p>
            </div>
          </div>

          {/* Row 2 — Analyze (reversed) */}
          <div className="how-row reverse reveal">
            <div className="how-visual">
              <div className="mini-card stack-card">
                {ANALYZE_ROWS.map((r) => (
                  <div className="stack-row" key={r.name}>
                    <span className="stack-badge" style={{ color: r.color, borderColor: r.color }}>{r.tag}</span>
                    <span className="stack-name">{r.name}</span>
                    <span className="stack-spend">{r.spend}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-text">
              <span className="how-num">02</span>
              <h3 className="how-h">VAI reads every campaign</h3>
              <p className="how-p">VAI analyzes every campaign in your account — spend, ROAS, CTR, CPA, impressions, conversions — and compares each one against your portfolio average to identify what&rsquo;s working and what&rsquo;s bleeding.</p>
            </div>
          </div>

          {/* Row 3 — Deliver */}
          <div className="how-row reveal">
            <div className="how-visual">
              <div className="mini-card inbox-card">
                <div className="inbox-top">
                  <span className="inbox-dot" />
                  <span className="inbox-from">VAI Intelligence Brief</span>
                  <span className="inbox-time">Mon 7:04 AM</span>
                </div>
                <div className="inbox-subj">Your biggest budget leak this week</div>
                <div className="inbox-prev">Summer Sale — Retargeting is costing you $1,440 more than it returns every month…</div>
              </div>
            </div>
            <div className="how-text">
              <span className="how-num">03</span>
              <h3 className="how-h">Monday brief delivered to your inbox</h3>
              <p className="how-p">Every Monday at 7AM, VAI delivers a plain-English intelligence brief — your biggest budget leak identified, root cause diagnosed, exact action required. No dashboard required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── SECTION 4 · WHO IT IS FOR ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">BUILT FOR</p>
        <h2 className="s-head reveal">Serious ad spenders.</h2>

        <div className="who-grid reveal">
          {WHO.map((w) => (
            <div className="who-col" key={w.name}>
              <h3 className="who-name">{w.name}</h3>
              <p className="who-desc">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── SECTION 5 · THE MONDAY BRIEF ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">THE MONDAY BRIEF</p>
        <h2 className="s-head reveal">What your inbox looks like.</h2>
        <p className="s-sub reveal">Every Monday at 7AM. Plain English. Exact actions.</p>

        <div className="brief reveal">
          <div className="brief-top">
            <span className="brief-conf">CONFIDENTIAL · CLIENT INTELLIGENCE BRIEF</span>
            <span className="brief-date">Monday, May 26, 2026 · 7:04 AM</span>
          </div>

          <p className="brief-leak-label">BIGGEST LEAK IDENTIFIED</p>
          <h3 className="brief-leak">Summer Sale — Retargeting is costing you $1,440 more than it returns every month.</h3>

          <div className="brief-cols">
            <div className="brief-stats">
              <div><span className="bs-k">SPEND</span><span className="bs-v">$3,200</span></div>
              <div><span className="bs-k">ROAS</span><span className="bs-v">1.8x</span></div>
              <div><span className="bs-k">STATUS</span><span className="bs-v" style={{ color: '#fb923c' }}>BLEEDING</span></div>
            </div>
            <div className="brief-oneline">
              <span className="bs-k">VAI DIAGNOSIS</span>
              <p>Audience frequency has exceeded 3.4x. Creative fatigue is confirmed.</p>
            </div>
          </div>

          <p className="brief-action-label">IMMEDIATE ACTION</p>
          <p className="brief-action">Pause Summer Sale — Retargeting today. Duplicate Lookalike — Past Purchasers with a $1,500 budget increase. Expected ROAS improvement: 2.1x → 3.8x within 14 days.</p>

          <div className="brief-locked">
            <span>Root cause analysis · 30-day projection · full portfolio reallocation plan →</span>
          </div>
        </div>

        <p className="brief-caption reveal">This is what every client receives. Every Monday.</p>
        <div className="s-cta reveal"><a href={AUDIT} className="btn-gold">START GETTING MINE →</a></div>
      </section>

      {/* ───────────────────────── SECTION 6 · ACCESS ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">ACCESS</p>
        <h2 className="s-head reveal">By application only.</h2>
        <p className="s-sub reveal">VV Growth Ad Engine is not a self-serve tool. Every account is set up by our team to ensure VAI is configured correctly for your specific account structure.</p>

        <div className="access reveal">
          {ACCESS.map((a) => (
            <div className="access-step" key={a.n}>
              <span className="access-num">{a.n}</span>
              <div>
                <h3 className="access-h">{a.title}</h3>
                <p className="access-p">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="access-fine reveal">For brands spending $3,000+ per month on Meta Ads.</p>
        <div className="s-cta two reveal">
          <a href={AUDIT} className="btn-gold">GET FREE AUDIT →</a>
          <a href={CALENDLY} className="btn-ghost">BOOK A CALL →</a>
        </div>
      </section>

      {/* ───────────────────────── SECTION 7 · CLOSE ───────────────────────── */}
      <section className="close">
        <div className="close-glow" />
        <h2 className="close-h reveal">
          Your campaigns are<br />
          running right now.<br />
          Some are making you money.<br />
          Some are not.
        </h2>
        <p className="close-sub reveal">VAI tells you which is which. Every Monday. Starting this week.</p>
        <div className="s-cta reveal"><a href={AUDIT} className="btn-gold big">GET FREE AUDIT — FREE →</a></div>
        <div className="s-cta reveal" style={{ marginTop: 12 }}><a href={CALENDLY} className="btn-ghost">BOOK A STRATEGY CALL →</a></div>
        <p className="close-fine reveal">Read-only access · No credit card · 60 seconds · Disconnect anytime</p>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="footer">
        <div className="foot-l">
          <div className="foot-brand"><span className="nav-vv">VV</span> <span className="foot-ge">Growth Ad Engine</span></div>
          <span className="foot-c">© 2026 Vanguard Visuals. All rights reserved.</span>
        </div>
        <div className="foot-r">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/login">Sign In</a>
        </div>
      </footer>
    </div>
  )
}

/* ───────────────────────── DATA ───────────────────────── */

const CLASSES = [
  { label: 'STRONG',   color: '#4ade80', stat: '6.2x',   unit: 'ROAS',      desc: 'Scaling candidate. VAI tells you exactly how much more budget to put here.' },
  { label: 'WEAK',     color: '#fbbf24', stat: '1.8x',   unit: 'ROAS',      desc: 'Needs diagnosis before it bleeds. VAI identifies the root cause.' },
  { label: 'BLEEDING', color: '#fb923c', stat: '$3,200', unit: 'WASTED/MO', desc: 'Actively losing money. Fix required within 48 hours.' },
  { label: 'DEAD',     color: '#f87171', stat: '0.0x',   unit: 'ROAS',      desc: 'Zero return. Pause immediately. VAI tells you where to move the budget.' },
]

const ANALYZE_ROWS = [
  { tag: 'STRONG',   color: '#4ade80', name: 'Lookalike — Past Purchasers', spend: '$4,100' },
  { tag: 'WEAK',     color: '#fbbf24', name: 'Broad — Interest Stack',       spend: '$2,300' },
  { tag: 'BLEEDING', color: '#fb923c', name: 'Summer Sale — Retargeting',    spend: '$3,200' },
  { tag: 'DEAD',     color: '#f87171', name: 'Spring Promo — Cold',          spend: '$900'   },
]

const WHO = [
  { name: 'DTC Brands',         desc: 'Spending $3,000–$50,000/month on Meta. You know your numbers are off but not exactly where. VAI finds the leak and tells you exactly what to do.' },
  { name: 'Marketing Agencies', desc: 'Managing Meta accounts for multiple clients. VAI generates white-labelled Monday briefs under your agency name — delivered automatically to each client.' },
  { name: 'Media Buyers',       desc: 'Running campaigns at scale. VAI gives you portfolio-level intelligence — which accounts are bleeding, which are ready to scale, and where to move budget first.' },
]

const ACCESS = [
  { n: '1', title: 'Get your free audit',   desc: 'Connect your Meta account at /audit. VAI analyzes every campaign in 60 seconds and shows you your three biggest findings. Free.' },
  { n: '2', title: 'Book a strategy call',  desc: 'Review what VAI found with our team. We walk through your full diagnosis and show you the 30-day blueprint.' },
  { n: '3', title: 'We deploy your system', desc: 'If it is a fit, we configure VAI on your account. Monday briefs begin the following week.' },
]

/* ───────────────────────── STYLES ───────────────────────── */

const CSS = `
:root{
  --bg:#050509; --gold:#c9a84c;
  --serif:'Cormorant Garamond',serif;
  --mono:'DM Mono',monospace;
  --sans:'DM Sans',sans-serif;
}
.lp{background:#050509;color:#fff;overflow-x:hidden;width:100%;}
.lp ::selection{background:rgba(201,168,76,.28);}
.lp a{color:inherit;text-decoration:none;}

/* reveal */
.lp .reveal{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease;}
.lp .reveal.in{opacity:1;transform:none;}
@media (prefers-reduced-motion:reduce){.lp .reveal{opacity:1;transform:none;transition:none;}}

/* ── NAVBAR ── */
.lp .nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;
  padding:18px 32px;background:transparent;transition:background .4s ease,backdrop-filter .4s ease,border-color .4s ease;
  border-bottom:1px solid transparent;}
.lp .nav.scrolled{background:rgba(5,5,9,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.06);}
.lp .nav-brand{display:flex;align-items:baseline;gap:10px;}
.lp .nav-vv{font-family:var(--serif);font-style:italic;font-weight:300;font-size:28px;line-height:1;color:#fff;}
.lp .nav-sub{font-family:var(--mono);font-size:7px;letter-spacing:3px;color:rgba(255,255,255,.45);}
.lp .nav-links{display:flex;align-items:center;gap:24px;}
.lp .nav-signin{font-family:var(--mono);font-size:9px;letter-spacing:1px;color:rgba(255,255,255,.5);transition:color .2s;}
.lp .nav-signin:hover{color:#fff;}
.lp .nav-cta{font-family:var(--mono);font-size:9px;font-weight:500;letter-spacing:1px;color:#050509;background:var(--gold);
  padding:9px 16px;border-radius:4px;transition:transform .2s,box-shadow .2s;}
.lp .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(201,168,76,.3);}
.lp .nav-burger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:11px;}
.lp .nav-burger span{display:block;width:22px;height:1.5px;background:#fff;}

/* mobile menu */
.lp .menu{position:fixed;inset:0;z-index:60;background:rgba(5,5,9,.98);backdrop-filter:blur(8px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;
  opacity:0;pointer-events:none;transition:opacity .3s ease;}
.lp .menu.open{opacity:1;pointer-events:auto;}
.lp .menu a{font-family:var(--mono);font-size:14px;letter-spacing:2px;color:rgba(255,255,255,.85);padding:6px 12px;}
.lp .menu a:nth-of-type(3){color:var(--gold);}
.lp .menu-close{position:absolute;top:20px;right:28px;background:none;border:none;color:rgba(255,255,255,.6);font-size:34px;line-height:1;cursor:pointer;}

/* ── buttons ── */
.lp .btn-gold{display:inline-block;font-family:var(--mono);font-size:10px;font-weight:500;letter-spacing:2px;
  color:#050509;background:var(--gold);padding:14px 32px;border-radius:4px;transition:transform .2s,box-shadow .2s;}
.lp .btn-gold:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(201,168,76,.32);}
.lp .btn-gold.big{font-size:11px;padding:17px 40px;}
.lp .btn-ghost{display:inline-block;font-family:var(--mono);font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.6);
  border:1px solid rgba(255,255,255,.2);padding:14px 32px;border-radius:4px;transition:border-color .2s,color .2s;}
.lp .btn-ghost:hover{border-color:rgba(201,168,76,.5);color:#fff;}

/* ── HERO ── */
.lp .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;
  text-align:center;padding:140px 24px 100px;overflow:hidden;}
.lp .hero-bg{position:absolute;inset:0;z-index:0;
  background:linear-gradient(135deg,#050509 0%,#050509 55%,#0d0c10 100%);
  background-size:200% 200%;animation:lpDrift 26s ease-in-out infinite;}
@keyframes lpDrift{0%{background-position:0% 0%;}50%{background-position:100% 100%;}100%{background-position:0% 0%;}}
.lp .hero-inner{position:relative;z-index:1;max-width:760px;width:100%;display:flex;flex-direction:column;align-items:center;}
.lp .eyebrow{font-family:var(--mono);font-size:9px;letter-spacing:4px;color:var(--gold);text-transform:uppercase;margin:0 0 28px;}
.lp .hero-h1{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(42px,8vw,96px);line-height:1.05;color:#fff;margin:0 0 28px;}
.lp .hero-lede{font-family:var(--sans);font-weight:400;font-size:15px;line-height:1.75;color:rgba(255,255,255,.6);max-width:520px;margin:0 0 40px;}
.lp .hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
.lp .hero-fine{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);margin:0 0 80px;}

/* VAI CARD */
.lp .vai-card{width:100%;max-width:720px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);
  border-radius:12px;padding:36px;text-align:left;transition:transform .2s,border-color .2s;}
.lp .vai-card:hover{transform:scale(1.01);border-color:rgba(201,168,76,.2);}
.lp .vai-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;}
.lp .vai-top-l{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.lp .vai-name{font-family:var(--mono);font-size:9px;letter-spacing:1px;color:rgba(255,255,255,.5);}
.lp .badge{font-family:var(--mono);font-size:7px;font-weight:500;letter-spacing:1px;padding:3px 7px;border-radius:3px;}
.lp .badge-meta{background:rgba(24,119,242,.16);color:#4d94ff;border:1px solid rgba(24,119,242,.4);}
.lp .badge-bleed{background:rgba(251,146,60,.14);color:#fb923c;border:1px solid rgba(251,146,60,.4);}
.lp .vai-top-r{display:flex;align-items:baseline;gap:12px;}
.lp .vai-spend{font-family:var(--mono);font-size:10px;color:#fff;}
.lp .vai-roas{font-family:var(--serif);font-size:20px;color:#fb923c;}
.lp .divider{height:1px;background:rgba(255,255,255,.08);margin:18px 0;}
.lp .vai-diag-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
.lp .vai-diag-label{font-family:var(--mono);font-size:7px;letter-spacing:3px;color:var(--gold);}
.lp .vai-diag-date{font-family:var(--mono);font-size:7px;color:rgba(255,255,255,.3);}
.lp .vai-diag-body{font-family:var(--serif);font-size:15px;line-height:1.85;color:rgba(255,255,255,.82);margin:16px 0 20px;}
.lp .vai-action-label{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--gold);margin:0 0 8px;}
.lp .vai-action{font-family:var(--mono);font-size:12px;line-height:1.6;color:#fff;margin:0 0 20px;}
.lp .vai-locked{height:70px;display:flex;align-items:flex-end;justify-content:center;text-align:center;
  background:linear-gradient(to bottom,rgba(255,255,255,.02),#050509);border-radius:6px;
  padding:0 12px 10px;filter:blur(.4px);}
.lp .vai-locked span{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.2);}
.lp .vai-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.06);padding-top:16px;margin-top:20px;}
.lp .vai-foot span{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.3);}
.lp .gold-link{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:var(--gold);transition:opacity .2s;}
.lp .gold-link:hover{opacity:.7;}

/* ── generic section ── */
.lp .section{max-width:1100px;margin:0 auto;padding:120px 24px;text-align:center;}
.lp .s-eyebrow{font-family:var(--mono);font-size:8px;letter-spacing:3px;color:var(--gold);margin:0 0 16px;}
.lp .s-head{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(32px,5vw,44px);color:#fff;margin:0 0 12px;}
.lp .s-sub{font-family:var(--sans);font-size:14px;line-height:1.7;color:rgba(255,255,255,.5);max-width:480px;margin:0 auto;}
.lp .s-cta{margin-top:40px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap;}
.lp .s-cta.two{margin-top:32px;}

/* ── classification grid ── */
.lp .class-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px;text-align:left;}
.lp .class-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:8px;
  padding:28px 24px;transition:transform .2s,border-color .2s;}
.lp .class-card:hover{transform:scale(1.01);border-color:rgba(201,168,76,.2);}
.lp .class-tag{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:8px;letter-spacing:1px;margin-bottom:16px;}
.lp .dot{width:6px;height:6px;border-radius:50%;}
.lp .class-stat{font-family:var(--serif);font-style:italic;font-size:32px;line-height:1;}
.lp .class-unit{font-family:var(--mono);font-size:9px;color:rgba(255,255,255,.4);margin-top:4px;margin-bottom:12px;}
.lp .class-desc{font-family:var(--sans);font-size:13px;line-height:1.6;color:rgba(255,255,255,.55);margin:0;}

/* ── how it works ── */
.lp .how{margin-top:64px;display:flex;flex-direction:column;gap:64px;}
.lp .how-row{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;text-align:left;}
.lp .how-row.reverse .how-visual{order:2;}
.lp .how-row.reverse .how-text{order:1;}
.lp .how-visual{display:flex;justify-content:center;}
.lp .how-text{display:flex;flex-direction:column;}
.lp .how-num{font-family:var(--serif);font-size:56px;color:var(--gold);line-height:1;margin-bottom:8px;}
.lp .how-h{font-family:var(--serif);font-style:italic;font-weight:300;font-size:28px;color:#fff;margin:0 0 14px;}
.lp .how-p{font-family:var(--sans);font-size:14px;line-height:1.75;color:rgba(255,255,255,.55);margin:0;}
.lp .mini-card{width:100%;max-width:380px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:28px;}
.lp .connect-card{display:flex;flex-direction:column;align-items:center;gap:14px;}
.lp .meta-mark{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;
  background:#1877f2;color:#fff;font-family:var(--serif);font-weight:600;font-size:22px;font-style:italic;}
.lp .connect-btn{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:1px;color:#050509;background:var(--gold);
  border:none;border-radius:6px;padding:13px 26px;cursor:default;}
.lp .connect-fine{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.35);}
.lp .stack-card{display:flex;flex-direction:column;gap:12px;}
.lp .stack-row{display:flex;align-items:center;gap:10px;}
.lp .stack-badge{font-family:var(--mono);font-size:7px;letter-spacing:1px;border:1px solid;border-radius:3px;padding:3px 6px;flex:0 0 auto;}
.lp .stack-name{font-family:var(--mono);font-size:10px;color:rgba(255,255,255,.7);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lp .stack-spend{font-family:var(--mono);font-size:10px;color:rgba(255,255,255,.5);flex:0 0 auto;}
.lp .inbox-card{display:flex;flex-direction:column;gap:10px;}
.lp .inbox-top{display:flex;align-items:center;gap:8px;}
.lp .inbox-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);}
.lp .inbox-from{font-family:var(--mono);font-size:10px;color:#fff;flex:1;}
.lp .inbox-time{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.35);}
.lp .inbox-subj{font-family:var(--serif);font-style:italic;font-size:16px;color:rgba(255,255,255,.9);}
.lp .inbox-prev{font-family:var(--sans);font-size:12px;line-height:1.6;color:rgba(255,255,255,.45);}

/* ── who ── */
.lp .who-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:48px;text-align:left;}
.lp .who-name{font-family:var(--serif);font-style:italic;font-weight:300;font-size:30px;color:var(--gold);margin:0 0 14px;}
.lp .who-desc{font-family:var(--sans);font-size:14px;line-height:1.75;color:rgba(255,255,255,.55);margin:0;}

/* ── brief ── */
.lp .brief{max-width:760px;margin:48px auto 0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);
  border-top:2px solid var(--gold);border-radius:12px;padding:48px;text-align:left;}
.lp .brief-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px;}
.lp .brief-conf{font-family:var(--mono);font-size:7px;letter-spacing:3px;color:var(--gold);}
.lp .brief-date{font-family:var(--mono);font-size:7px;color:rgba(255,255,255,.3);}
.lp .brief-leak-label{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:#f87171;margin:0 0 8px;}
.lp .brief-leak{font-family:var(--serif);font-style:italic;font-weight:300;font-size:28px;line-height:1.25;color:#fff;margin:0 0 24px;}
.lp .brief-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}
.lp .brief-stats{display:flex;flex-direction:column;gap:10px;}
.lp .brief-stats > div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px;}
.lp .bs-k{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.4);}
.lp .bs-v{font-family:var(--mono);font-size:13px;color:#fff;}
.lp .brief-oneline p{font-family:var(--serif);font-size:16px;line-height:1.6;color:rgba(255,255,255,.8);margin:8px 0 0;}
.lp .brief-action-label{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--gold);margin:0 0 8px;}
.lp .brief-action{font-family:var(--serif);font-size:16px;line-height:1.8;color:rgba(255,255,255,.85);margin:0 0 24px;}
.lp .brief-locked{height:100px;display:flex;align-items:flex-end;justify-content:center;text-align:center;
  background:linear-gradient(to bottom,rgba(255,255,255,.02),#0a0a10);border-radius:6px;padding:0 16px 14px;filter:blur(.4px);}
.lp .brief-locked span{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.2);}
.lp .brief-caption{font-family:var(--sans);font-size:13px;color:rgba(255,255,255,.4);text-align:center;margin:24px 0 0;}

/* ── access ── */
.lp .access{max-width:600px;margin:64px auto 0;display:flex;flex-direction:column;gap:40px;text-align:left;}
.lp .access-step{display:flex;align-items:flex-start;gap:24px;}
.lp .access-num{font-family:var(--serif);font-size:48px;color:var(--gold);line-height:1;flex:0 0 auto;}
.lp .access-h{font-family:var(--serif);font-style:italic;font-weight:300;font-size:24px;color:#fff;margin:0 0 8px;}
.lp .access-p{font-family:var(--sans);font-size:13px;line-height:1.7;color:rgba(255,255,255,.5);margin:0;}
.lp .access-fine{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);text-align:center;margin:40px 0 0;}

/* ── close ── */
.lp .close{position:relative;padding:140px 24px;text-align:center;overflow:hidden;}
.lp .close-glow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:700px;
  background:radial-gradient(circle,rgba(201,168,76,.06),transparent 60%);pointer-events:none;}
.lp .close-h{position:relative;font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(34px,6vw,72px);line-height:1.1;color:#fff;margin:0 0 32px;}
.lp .close-sub{position:relative;font-family:var(--sans);font-size:15px;color:rgba(255,255,255,.5);margin:0 0 40px;}
.lp .close-fine{position:relative;font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.2);margin:24px 0 0;}

/* ── footer ── */
.lp .footer{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;
  max-width:1100px;margin:0 auto;padding:48px 32px 64px;border-top:1px solid rgba(255,255,255,.06);}
.lp .foot-brand{display:flex;align-items:baseline;gap:8px;margin-bottom:10px;}
.lp .foot-ge{font-family:var(--serif);font-style:italic;font-size:16px;color:rgba(255,255,255,.7);}
.lp .foot-c{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);}
.lp .foot-r{display:flex;gap:20px;flex-wrap:wrap;}
.lp .foot-r a{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);transition:color .2s;}
.lp .foot-r a:hover{color:rgba(255,255,255,.6);}

/* ── responsive ── */
@media (max-width:860px){
  .lp .how-row{grid-template-columns:1fr;gap:28px;}
  .lp .how-row.reverse .how-visual{order:0;}
  .lp .how-row.reverse .how-text{order:0;}
  .lp .who-grid{grid-template-columns:1fr;gap:36px;}
}
@media (max-width:680px){
  .lp .nav{padding:14px 20px;}
  .lp .nav-links{display:none;}
  .lp .nav-burger{display:flex;}
  .lp .class-grid{grid-template-columns:1fr 1fr;}
  .lp .brief-cols{grid-template-columns:1fr;}
  .lp .section{padding:90px 20px;}
  .lp .vai-card{padding:24px;}
  .lp .brief{padding:32px 22px;}
  .lp .hero-ctas{flex-direction:column;width:100%;}
  .lp .hero-ctas .btn-gold,.lp .hero-ctas .btn-ghost{width:100%;}
  .lp .s-cta .btn-gold,.lp .s-cta .btn-ghost{width:100%;}
  .lp .s-cta.two{flex-direction:column;}
  .lp .footer{flex-direction:column;}
}
@media (max-width:380px){
  .lp .class-grid{grid-template-columns:1fr;}
}
`
