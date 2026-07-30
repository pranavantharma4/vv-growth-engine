'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import FoundersModal from './FoundersModal'

/* ──────────────────────────────────────────────────────────────────────────
   vngrdvisuals.com — landing page.
   One product. One promise: VV connects to your Meta ad account (read-only)
   and tells you which campaigns are making money, which are wasting it, and
   what to fix — in plain English.
   Structure scans in 10 seconds: hero → what it does → an example report →
   how it works → FAQ. Every CTA → the free audit. No agency framing, no
   pricing page. The offer is the Founders Program.
─────────────────────────────────────────────────────────────────────────── */

const AUDIT = '/audit'
const START = '/signup'

export default function LandingClient({ seatsLeft = 4, seatsTotal = 4 }: { seatsLeft?: number; seatsTotal?: number }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [foundersOpen, setFoundersOpen] = useState(false)

  // Live seat counter — seeded from the server-rendered props, then kept current
  // via a Supabase realtime subscription so it ticks down the instant a seat is
  // claimed while a visitor is on the page (founders_program is in the
  // supabase_realtime publication).
  const [liveSeats, setLiveSeats] = useState({ left: seatsLeft, total: seatsTotal })
  useEffect(() => {
    const supabase = createClientComponentClient()
    const ch = supabase
      .channel('founders_program_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'founders_program' }, (payload) => {
        const row = payload.new as { seats_total?: number; seats_claimed?: number } | null
        if (!row) return
        const total = row.seats_total ?? seatsTotal
        setLiveSeats({ left: Math.max(0, total - (row.seats_claimed ?? 0)), total })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const curLeft = liveSeats.left
  const curTotal = liveSeats.total
  const seatsOpen = curLeft > 0

  // Open the Founders selection flow instead of following the anchor. The href
  // stays as a no-JS fallback (scrolls to the pricing section).
  const openFounders = (e: React.MouseEvent) => { e.preventDefault(); setFoundersOpen(true) }

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

  // Report card sequenced reveal — plays once the card enters view, like a live report
  useEffect(() => {
    const card = document.querySelector('.vai-card')
    if (!card) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('play')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.2 }
    )
    io.observe(card)
    return () => io.disconnect()
  }, [])

  // Count-up for stats — fast (<800ms), eased, fires when each number enters view
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('.count'))
    if (!els.length) return
    const fmt = (el: HTMLElement, val: number) => {
      const dec = Number(el.dataset.dec || 0)
      const pre = el.dataset.prefix || ''
      const suf = el.dataset.suffix || ''
      const n = dec === 0
        ? Math.round(val).toLocaleString('en-US')
        : val.toFixed(dec)
      return pre + n + suf
    }
    els.forEach((el) => { el.textContent = fmt(el, 0) }) // start at zero (hidden until revealed)
    const run = (el: HTMLElement) => {
      const to = parseFloat(el.dataset.to || '0')
      const dur = 750
      let t0: number | null = null
      const step = (t: number) => {
        if (t0 === null) t0 = t
        const p = Math.min((t - t0) / dur, 1)
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
          if (e.isIntersecting) { run(e.target as HTMLElement); io.unobserve(e.target) }
        })
      },
      { threshold: 0.4 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

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
          <a href="#pricing" className="nav-signin">PRICING</a>
          <a href="/methodology" className="nav-page">Method</a>
          <a href="/security" className="nav-page">Security</a>
          <a href="/login" className="nav-signin">SIGN IN</a>
          <a href={START} className="nav-signup">SIGN UP</a>
          <a href={AUDIT} className="nav-cta">SEE YOUR AUDIT →</a>
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
        <a href={START} onClick={() => setMenuOpen(false)}>SIGN UP</a>
        <a href={AUDIT} onClick={() => setMenuOpen(false)}>SEE YOUR AUDIT →</a>
      </div>

      {/* ───────────────────────── HERO — one promise, one CTA ───────────────────────── */}
      <header className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          {/* Founders Program — first thing a visitor sees, live seat counter */}
          <a href="#pricing" onClick={openFounders} className="founders-pill reveal" aria-label="Founders Program — limited free-for-life seats">
            <span className="fp-dot" />
            <span className="fp-label">FOUNDERS PROGRAM</span>
            <span className="fp-div" />
            {seatsOpen ? (
              <span className="fp-seats"><b>{curLeft}</b> of {curTotal} seats left · <span className="fp-free">free for life</span></span>
            ) : (
              <span className="fp-seats">All {curTotal} seats claimed · <span className="fp-free">join the waitlist</span></span>
            )}
            <span className="fp-arrow">→</span>
          </a>

          <p className="eyebrow reveal">META ADS INTELLIGENCE · POWERED BY VAI</p>

          <h1 className="hero-h1 reveal" style={{ transitionDelay: '90ms' }}>
            Know which campaigns<br />
            make money — and which<br />
            quietly waste&nbsp;it.
          </h1>

          <p className="hero-lede reveal" style={{ transitionDelay: '180ms' }}>
            VV connects to your Meta ad account (read-only) and tells you which campaigns
            are making money, which are wasting it, and what to fix — in plain English.
          </p>

          <div className="hero-ctas reveal" style={{ transitionDelay: '270ms' }}>
            <a href={AUDIT} className="btn-gold big">SEE YOUR AUDIT →</a>
          </div>

          <p className="hero-fine reveal" style={{ transitionDelay: '340ms' }}>Free · 60 seconds · Read-only. Nothing changes in your account.</p>
        </div>
      </header>

      {/* ───────────────────────── WHAT IT DOES — Strong / Weak / Bleeding / Dead ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">WHAT IT DOES</p>
        <h2 className="s-head reveal" style={{ transitionDelay: '80ms' }}>Every campaign,&nbsp;classified.</h2>
        <p className="s-sub reveal" style={{ transitionDelay: '160ms' }}>VV reads your whole Meta account and sorts every campaign into one of four states — so you see your biggest leak first.</p>

        <div className="class-grid">
          {CLASSES.map((c, i) => (
            <div className="class-card reveal" key={c.label} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="class-tag">
                <span className="dot" style={{ background: c.color }} />
                <span style={{ color: c.color }}>{c.label}</span>
              </div>
              {c.count ? (
                <div
                  className="class-stat count"
                  style={{ color: c.color }}
                  data-to={c.count.to}
                  data-dec={c.count.dec}
                  data-prefix={c.count.prefix || ''}
                  data-suffix={c.count.suffix || ''}
                >
                  {c.stat}
                </div>
              ) : (
                <div className="class-stat" style={{ color: c.color }}>{c.stat}</div>
              )}
              <div className="class-unit">{c.unit}</div>
              <p className="class-desc">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="s-cta reveal"><a href={AUDIT} className="btn-ghost">SEE YOUR AUDIT →</a></div>
      </section>

      {/* ───────────────────────── THE REPORT — one example ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">THE REPORT</p>
        <h2 className="s-head reveal" style={{ transitionDelay: '80ms' }}>What you actually&nbsp;get.</h2>
        <p className="s-sub reveal" style={{ transitionDelay: '160ms' }}>Plain English. Your biggest leak, your best performer, and the one thing to do next.</p>

        <div className="vai-card reveal">
          <div className="vai-top vstep" style={{ animationDelay: '150ms' }}>
            <div className="vai-top-l">
              <span className="vai-name">SUMMER SALE — RETARGETING</span>
              <span className="badge badge-meta">META</span>
              <span className="badge badge-bleed">BLEEDING</span>
            </div>
            <div className="vai-top-r">
              <span className="vai-spend">$3,200/mo</span>
              <span className="vai-roas">1.8× ROAS</span>
            </div>
          </div>

          <div className="divider" />

          <div className="vai-diag-row vstep" style={{ animationDelay: '450ms' }}>
            <span className="vai-diag-label">VAI DIAGNOSIS</span>
          </div>

          <p className="vai-diag-body vstep" style={{ animationDelay: '620ms' }}>
            This retargeting campaign is burning budget against warm audiences that have
            stopped responding. You&rsquo;re spending $178 to acquire a customer on a $320
            AOV — every conversion costs more than it returns. Frequency has crossed 3.4×
            and CTR has slid over the last two weeks: classic fatigue.
          </p>

          <p className="vai-action-label vstep" style={{ animationDelay: '900ms' }}>IMMEDIATE ACTION</p>
          <p className="vai-action vstep" style={{ animationDelay: '1000ms' }}>Pause this campaign and reallocate the $3,200 to Lookalike — Past Purchasers, your strongest performer at 4.8×.</p>

          <div className="vai-foot vstep" style={{ animationDelay: '1250ms' }}>
            <span>This is the free audit — on your own account, in 60 seconds.</span>
            <a href={AUDIT} className="gold-link">See yours →</a>
          </div>
        </div>
      </section>

      {/* ───────────────────────── HOW IT WORKS — 3 steps ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">HOW IT WORKS</p>
        <h2 className="s-head reveal" style={{ transitionDelay: '80ms' }}>Three steps. Sixty&nbsp;seconds.</h2>

        <div className="how">
          {/* Row 1 — Connect */}
          <div className="how-row reveal r-left">
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
              <p className="how-p">One-click, read-only connection through Meta&rsquo;s official API. Nothing in your account ever changes — VV can only read.</p>
            </div>
          </div>

          {/* Row 2 — Analyze (reversed) */}
          <div className="how-row reverse reveal r-right">
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
              <h3 className="how-h">VV reads every campaign</h3>
              <p className="how-p">It analyzes spend, ROAS, CTR, CPA and frequency across your account and ranks every campaign by health — making money, wasting it, or dead.</p>
            </div>
          </div>

          {/* Row 3 — Report */}
          <div className="how-row reveal r-left">
            <div className="how-visual">
              <div className="mini-card inbox-card">
                <div className="inbox-top">
                  <span className="inbox-dot" />
                  <span className="inbox-from">Your VV Report</span>
                  <span className="inbox-time">Ready</span>
                </div>
                <div className="inbox-subj">Your biggest budget leak this week</div>
                <div className="inbox-prev">Summer Sale — Retargeting is costing you $1,440 more than it returns every month…</div>
              </div>
            </div>
            <div className="how-text">
              <span className="how-num">03</span>
              <h3 className="how-h">Read your report</h3>
              <p className="how-p">A plain-English breakdown of which campaigns make money, which waste it, and exactly what to fix first. No dashboard to learn, no jargon.</p>
            </div>
          </div>
        </div>

        <div className="s-cta reveal"><a href={AUDIT} className="btn-gold">SEE YOUR AUDIT →</a></div>
      </section>

      {/* ───────────────────────── PRICING · FOUNDERS · TRIAL ───────────────────────── */}
      <section className="section pricing" id="pricing">
        <p className="s-eyebrow reveal">PRICING</p>
        <h2 className="s-head reveal" style={{ transitionDelay: '80ms' }}>Four seats, free for life — then&nbsp;$149/mo.</h2>
        <p className="s-sub reveal" style={{ transitionDelay: '160ms' }}>
          Grab one of the four founding seats while they last. Once they&rsquo;re gone, it&rsquo;s $149/mo with a 7-day free trial.
        </p>

        {/* Founders is the hero — the obvious best deal. The $149 plan below is
            the "what it costs otherwise" reference that makes the free seats
            urgent, not an equal competing option. */}
        <div className="pr-hero reveal" style={{ transitionDelay: '220ms' }}>
          <div className={`seat-live${seatsOpen ? '' : ' full'}`}>
            <span className="seat-dot" />
            {seatsOpen ? <><b>{curLeft}</b>&nbsp;of&nbsp;{curTotal} seats left</> : <>All {curTotal} seats claimed</>}
          </div>
          <div className="pr-hero-row">
            <div className="pr-hero-main">
              <div className="plan-flag">FOUNDING CLIENTS · LIMITED</div>
              <div className="plan-name">Founders Program</div>
              <div className="plan-anchor"><b>free — for life</b></div>
              <ul className="plan-list">
                <li>Everything in the $149/mo plan — free, for as long as you&rsquo;re a client</li>
                <li>Direct line to the founder; your feedback shapes the product</li>
                <li>Only {curTotal} seats — ever. When they&rsquo;re gone, they&rsquo;re gone.</li>
              </ul>
            </div>
            <div className="pr-hero-cta">
              <a href="#pricing" onClick={openFounders} className="btn-gold big plan-cta">{seatsOpen ? 'Claim a founding seat →' : 'Join the waitlist →'}</a>
              <span className="pr-hero-note">Free forever · read-only · no card</span>
            </div>
          </div>
        </div>

        {/* Consequence strip — the $149 reference, deliberately subordinate. */}
        <div className="pr-conseq-arrow reveal">↓ once the {curTotal} seats are gone, this is what it costs</div>
        <div className="pr-consequence reveal">
          <div className="pr-conseq-text">
            <span className="pr-conseq-price">$149<span>/mo</span></span>
            <span className="pr-conseq-label">The regular price after the founding seats close — 7-day free trial, no card to start, cancel anytime.</span>
          </div>
          <a href={START} className="btn-ghost plan-cta pr-conseq-btn">Start 7-day trial →</a>
        </div>

        <p className="pricing-fomo reveal">
          One bleeding campaign usually wastes more in a single month than a whole year of VV.
          The free trial shows you which one — before you pay a cent.
        </p>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section className="section">
        <p className="s-eyebrow reveal">QUESTIONS</p>
        <h2 className="s-head reveal" style={{ transitionDelay: '80ms' }}>Before you&nbsp;connect.</h2>

        <div className="faq-grid">
          {FAQS.map((f, i) => (
            <div className="faq-pair reveal" key={f.q} style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
              <h3 className="faq-q">{f.q}</h3>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── CLOSE — one CTA ───────────────────────── */}
      <section className="close">
        <div className="close-glow" />
        <h2 className="close-h reveal">
          Some of your campaigns<br />
          are making money.<br />
          Some are&nbsp;not.
        </h2>
        <p className="close-sub reveal">Find out which — in plain English, in 60 seconds.</p>
        <div className="s-cta reveal"><a href={AUDIT} className="btn-gold big">SEE YOUR AUDIT →</a></div>
        <p className="close-fine reveal">Free · 60 seconds · Read-only. Nothing changes in your account.</p>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="footer">
        <div className="foot-l">
          <div className="foot-brand"><span className="nav-vv">VV</span> <span className="foot-ge">Growth Ad Engine</span></div>
          <span className="foot-c">© 2026 Vanguard Visuals. All rights reserved.</span>
        </div>
        <div className="foot-r">
          <a href="/security">Security</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/login">Sign In</a>
        </div>
      </footer>

      {/* Founders Program selection flow (Fix 3) */}
      <FoundersModal
        open={foundersOpen}
        onClose={() => setFoundersOpen(false)}
        seatsLeft={curLeft}
        seatsTotal={curTotal}
      />
    </div>
  )
}

/* ───────────────────────── DATA ───────────────────────── */

const FAQS = [
  { q: 'Will this touch my ad account?', a: 'Never. VV has read-only access — it cannot create, edit, pause, or delete anything. Nothing in your account changes.' },
  { q: 'Is my data safe?', a: 'Connection is through Meta’s official Marketing API with read-only permissions. We never store your password, and you can disconnect in one click anytime.' },
  { q: 'How is this different from my Meta dashboard?', a: 'Meta shows you numbers. VV tells you what they mean and exactly what to do — which campaigns make money, which waste it, and the first fix, in plain English.' },
  { q: 'Do I need to be technical?', a: 'No. If you can read an email, you can read your report. It arrives in plain language with the single most important action highlighted.' },
  { q: 'What does it cost?', a: 'The audit is free. The product is $149/mo with a 7-day free trial (no card to start). We’re also taking on a limited number of founding clients free-for-life in exchange for feedback and a testimonial — the live seat count is on the pricing section above.' },
]

type ClassCard = {
  label: string; color: string; stat: string; unit: string; desc: string
  count?: { to: number; dec: number; prefix?: string; suffix?: string }
}

const CLASSES: ClassCard[] = [
  { label: 'STRONG',   color: '#4ade80', stat: '6.2×',   unit: 'ROAS',      desc: 'Making money. A scaling candidate — VV tells you how much more budget to put here.', count: { to: 6.2, dec: 1, suffix: '×' } },
  { label: 'WEAK',     color: '#fbbf24', stat: '1.8×',   unit: 'ROAS',      desc: 'Underdelivering. Needs a fix before it starts bleeding — VV names the root cause.',   count: { to: 1.8, dec: 1, suffix: '×' } },
  { label: 'BLEEDING', color: '#fb923c', stat: '$3,200', unit: 'WASTED/MO', desc: 'Actively losing money. VV flags it and tells you exactly what to change first.',        count: { to: 3200, dec: 0, prefix: '$' } },
  { label: 'DEAD',     color: '#f87171', stat: '0.0×',   unit: 'ROAS',      desc: 'Zero return. Pause it — VV tells you where to move the budget instead.' },
]

const ANALYZE_ROWS = [
  { tag: 'STRONG',   color: '#4ade80', name: 'Lookalike — Past Purchasers', spend: '$4,100' },
  { tag: 'WEAK',     color: '#fbbf24', name: 'Broad — Interest Stack',       spend: '$2,300' },
  { tag: 'BLEEDING', color: '#fb923c', name: 'Summer Sale — Retargeting',    spend: '$3,200' },
  { tag: 'DEAD',     color: '#f87171', name: 'Spring Promo — Cold',          spend: '$900'   },
]

/* ───────────────────────── STYLES ───────────────────────── */

const CSS = `
:root{
  --bg:#050509; --gold:#c9a84c;
  --ink:#faf8f5; --ink2:rgba(255,255,255,.5);
  --serif:'Cormorant Garamond',serif;
  --mono:'DM Mono',monospace;
  --sans:'DM Sans',sans-serif;
}
.lp{background:#050509;color:#fff;overflow-x:hidden;width:100%;}
.lp ::selection{background:rgba(201,168,76,.25);color:#faf8f5;}
.lp a{color:inherit;text-decoration:none;}

/* reveal — fade up + slight scale, premium ease-out */
.lp .reveal{opacity:0;transform:translateY(24px) scale(.985);
  transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1);will-change:opacity,transform;}
.lp .reveal.in{opacity:1;transform:none;}
/* slide variants for How-It-Works rows — alternating sides */
.lp .reveal.r-left{transform:translateX(-44px);}
.lp .reveal.r-right{transform:translateX(44px);}
.lp .reveal.r-left.in,.lp .reveal.r-right.in{transform:none;}

/* report card sequenced reveal — children generate in like a live report */
.lp .vstep{opacity:0;}
.lp .vai-card.play .vstep{animation:lpStep .55s cubic-bezier(.22,.61,.36,1) forwards;}
@keyframes lpStep{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}

@media (prefers-reduced-motion:reduce){
  .lp .reveal,.lp .reveal.r-left,.lp .reveal.r-right{opacity:1;transform:none;transition:none;}
  .lp .vstep{opacity:1;animation:none;}
}

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
.lp .nav-page{font-family:var(--sans);font-weight:400;font-size:13px;color:var(--ink2);transition:color .2s;}
.lp .nav-page:hover{color:var(--ink);}
.lp .nav-signup{font-family:var(--mono);font-size:9px;font-weight:500;letter-spacing:1px;color:rgba(255,255,255,.82);
  border:1px solid rgba(255,255,255,.22);padding:8px 15px;border-radius:4px;transition:border-color .2s,color .2s;}
.lp .nav-signup:hover{border-color:var(--gold);color:var(--gold);}
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
.lp .menu a:last-of-type{color:var(--gold);}
.lp .menu-close{position:absolute;top:20px;right:28px;background:none;border:none;color:rgba(255,255,255,.6);font-size:34px;line-height:1;cursor:pointer;}

/* ── buttons ── */
.lp .btn-gold{display:inline-block;font-family:var(--mono);font-size:10px;font-weight:500;letter-spacing:2px;
  color:#050509;background:var(--gold);padding:14px 32px;border-radius:4px;transition:transform .2s,box-shadow .2s,background .2s;}
.lp .btn-gold:hover{background:#d4b55c;transform:translateY(-2px);box-shadow:0 10px 30px rgba(201,168,76,.32);}
.lp .btn-gold.big{font-size:11px;padding:17px 40px;}
.lp .btn-ghost{display:inline-block;font-family:var(--mono);font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.6);
  border:1px solid rgba(255,255,255,.2);padding:14px 32px;border-radius:4px;transition:border-color .2s,color .2s;}
.lp .btn-ghost:hover{border-color:rgba(201,168,76,.5);color:#fff;}

/* ── HERO ── */
.lp .hero{position:relative;min-height:92vh;display:flex;align-items:center;justify-content:center;
  text-align:center;padding:140px 24px 100px;overflow:hidden;}
.lp .hero-bg{position:absolute;inset:0;z-index:0;
  background:linear-gradient(135deg,#050509 0%,#050509 55%,#0d0c10 100%);
  background-size:200% 200%;animation:lpDrift 26s ease-in-out infinite;}
@keyframes lpDrift{0%{background-position:0% 0%;}50%{background-position:100% 100%;}100%{background-position:0% 0%;}}
.lp .hero-inner{position:relative;z-index:1;max-width:760px;width:100%;display:flex;flex-direction:column;align-items:center;}
.lp .eyebrow{font-family:var(--mono);font-size:9px;letter-spacing:4px;color:var(--gold);text-transform:uppercase;margin:0 0 28px;}
.lp .hero-h1{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(40px,7.5vw,88px);line-height:1.05;letter-spacing:-.02em;color:#fff;margin:0 0 28px;}
.lp .hero-lede{font-family:var(--sans);font-weight:400;font-size:15px;line-height:1.75;color:rgba(255,255,255,.62);max-width:560px;margin:0 0 40px;}
.lp .hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
.lp .hero-fine{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.3);margin:0;}

/* ── generic section ── */
.lp .section{max-width:1100px;margin:0 auto;padding:110px 24px;text-align:center;}
.lp .s-eyebrow{font-family:var(--mono);font-size:8px;letter-spacing:3px;color:var(--gold);margin:0 0 16px;}
.lp .s-head{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(32px,5vw,44px);color:#fff;margin:0 0 12px;}
.lp .s-sub{font-family:var(--sans);font-size:14px;line-height:1.7;color:rgba(255,255,255,.5);max-width:520px;margin:0 auto;}
.lp .s-cta{margin-top:40px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap;}

/* ── classification grid (what it does) ── */
.lp .class-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px;text-align:left;}
.lp .class-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:8px;
  padding:28px 24px;transition:transform .2s,border-color .2s;}
.lp .class-card:hover{transform:scale(1.01);border-color:rgba(201,168,76,.2);}
.lp .class-tag{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:8px;letter-spacing:1px;margin-bottom:16px;}
.lp .dot{width:6px;height:6px;border-radius:50%;}
.lp .class-stat{font-family:var(--serif);font-style:italic;font-size:32px;line-height:1;font-variant-numeric:lining-nums;}
.lp .class-unit{font-family:var(--mono);font-size:9px;color:rgba(255,255,255,.4);margin-top:4px;margin-bottom:12px;}
.lp .class-desc{font-family:var(--sans);font-size:13px;line-height:1.6;color:rgba(255,255,255,.55);margin:0;}

/* ── report card (the example) ── */
.lp .vai-card{width:100%;max-width:720px;margin:48px auto 0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);
  border-radius:12px;padding:36px;text-align:left;transition:transform .2s,border-color .2s;}
.lp .vai-card:hover{transform:scale(1.01);border-color:rgba(201,168,76,.2);}
.lp .vai-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;}
.lp .vai-top-l{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.lp .vai-name{font-family:var(--mono);font-size:9px;letter-spacing:1px;color:rgba(255,255,255,.5);}
.lp .badge{font-family:var(--mono);font-size:7px;font-weight:500;letter-spacing:1px;padding:3px 7px;border-radius:3px;}
.lp .badge-meta{background:rgba(24,119,242,.16);color:#4d94ff;border:1px solid rgba(24,119,242,.4);}
.lp .badge-bleed{background:rgba(251,146,60,.14);color:#fb923c;border:1px solid rgba(251,146,60,.4);}
.lp .vai-top-r{display:flex;align-items:baseline;gap:12px;}
.lp .vai-spend{font-family:var(--mono);font-size:10px;color:#fff;font-variant-numeric:lining-nums;}
.lp .vai-roas{font-family:var(--serif);font-size:20px;color:#fb923c;font-variant-numeric:lining-nums;}
.lp .divider{height:1px;background:rgba(255,255,255,.08);margin:18px 0;}
.lp .vai-diag-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
.lp .vai-diag-label{font-family:var(--mono);font-size:7px;letter-spacing:3px;color:var(--gold);}
.lp .vai-diag-body{font-family:var(--serif);font-size:15px;line-height:1.85;color:rgba(255,255,255,.82);margin:16px 0 20px;}
.lp .vai-action-label{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--gold);margin:0 0 8px;}
.lp .vai-action{font-family:var(--mono);font-size:12px;line-height:1.6;color:#fff;margin:0 0 20px;}
.lp .vai-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.06);padding-top:16px;margin-top:20px;}
.lp .vai-foot span{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.3);}
.lp .gold-link{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:var(--gold);transition:opacity .2s;}
.lp .gold-link:hover{opacity:.7;}

/* ── how it works ── */
.lp .how{margin-top:64px;display:flex;flex-direction:column;gap:64px;}
.lp .how-row{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;text-align:left;}
.lp .how-row.reverse .how-visual{order:2;}
.lp .how-row.reverse .how-text{order:1;}
.lp .how-visual{display:flex;justify-content:center;}
.lp .how-text{display:flex;flex-direction:column;}
.lp .how-num{font-family:var(--serif);font-size:56px;letter-spacing:-.02em;color:var(--gold);line-height:1.05;margin-bottom:8px;font-variant-numeric:lining-nums;}
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

/* ── faq ── */
.lp .faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px 56px;margin-top:56px;text-align:left;}
.lp .faq-q{font-family:var(--serif);font-style:italic;font-weight:300;font-size:18px;line-height:1.35;color:#fff;margin:0 0 10px;}
.lp .faq-a{font-family:var(--sans);font-size:13px;line-height:1.7;color:rgba(255,255,255,.6);margin:0;}

/* ── close ── */
.lp .close{position:relative;padding:130px 24px;text-align:center;overflow:hidden;}
.lp .close-glow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:700px;
  background:radial-gradient(circle,rgba(201,168,76,.06),transparent 60%);pointer-events:none;}
.lp .close-h{position:relative;font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(34px,6vw,64px);line-height:1.05;letter-spacing:-.02em;color:#fff;margin:0 0 28px;}
.lp .close-sub{position:relative;font-family:var(--sans);font-size:15px;color:rgba(255,255,255,.5);margin:0 0 40px;}
.lp .close-fine{position:relative;font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);margin:24px 0 0;}

/* ── footer ── */
.lp .footer{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;
  max-width:1100px;margin:0 auto;padding:48px 32px 64px;border-top:1px solid rgba(255,255,255,.06);}
.lp .foot-brand{display:flex;align-items:baseline;gap:8px;margin-bottom:10px;}
.lp .foot-ge{font-family:var(--serif);font-style:italic;font-size:16px;color:rgba(255,255,255,.7);}
.lp .foot-c{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);}
.lp .foot-r{display:flex;gap:20px;flex-wrap:wrap;}
.lp .foot-r a{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.25);transition:color .2s;}
.lp .foot-r a:hover{color:rgba(255,255,255,.6);}

/* ── founders pill (hero, above the fold) ── */
.lp .founders-pill{display:inline-flex;align-items:center;gap:10px;margin:0 0 26px;padding:8px 14px;
  background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.32);border-radius:100px;
  transition:transform .2s,box-shadow .2s,border-color .2s;cursor:pointer;}
.lp .founders-pill:hover{transform:translateY(-1px);border-color:rgba(201,168,76,.55);box-shadow:0 8px 26px rgba(201,168,76,.16);}
.lp .fp-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.55);animation:fpPulse 2.4s ease-out infinite;}
@keyframes fpPulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.5);}70%{box-shadow:0 0 0 7px rgba(74,222,128,0);}100%{box-shadow:0 0 0 0 rgba(74,222,128,0);}}
.lp .fp-label{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--gold);}
.lp .fp-div{width:1px;height:11px;background:rgba(201,168,76,.35);}
.lp .fp-seats{font-family:var(--mono);font-size:8.5px;letter-spacing:.5px;color:rgba(255,255,255,.72);}
.lp .fp-seats b{color:#fff;font-weight:600;}
.lp .fp-free{color:var(--gold);}
.lp .fp-arrow{font-family:var(--mono);font-size:10px;color:var(--gold);}

/* ── pricing section ── */
.lp .pricing{scroll-margin-top:80px;}
.lp .trial-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin:48px auto 0;max-width:900px;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden;text-align:left;}
.lp .trial-col{background:#080810;padding:24px 22px;display:flex;flex-direction:column;gap:9px;}
.lp .trial-k{font-family:var(--mono);font-size:8px;letter-spacing:2px;color:var(--gold);}
.lp .trial-v{font-family:var(--sans);font-size:13px;line-height:1.6;color:rgba(255,255,255,.66);}

.lp .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;text-align:left;align-items:stretch;}
.lp .plan-card{position:relative;display:flex;flex-direction:column;background:rgba(255,255,255,.02);
  border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:32px 30px;transition:transform .2s,border-color .2s;}
.lp .plan-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.16);}
.lp .founders-card{border-color:rgba(201,168,76,.4);background:linear-gradient(180deg,rgba(201,168,76,.07),rgba(201,168,76,.015));box-shadow:0 20px 60px rgba(201,168,76,.08);}
.lp .founders-card:hover{border-color:rgba(201,168,76,.65);}
.lp .plan-flag{display:inline-block;align-self:flex-start;font-family:var(--mono);font-size:7px;letter-spacing:2px;color:#050509;
  background:var(--gold);padding:4px 9px;border-radius:3px;margin-bottom:16px;}
.lp .plan-name{font-family:var(--serif);font-style:italic;font-weight:300;font-size:24px;color:#fff;margin-bottom:10px;}
.lp .plan-price{display:flex;align-items:baseline;gap:8px;}
.lp .plan-amt{font-family:var(--serif);font-size:46px;line-height:1.05;letter-spacing:-.02em;color:#fff;font-variant-numeric:lining-nums;}
.lp .plan-per{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.5);letter-spacing:1px;}
.lp .plan-anchor{font-family:var(--mono);font-size:9px;letter-spacing:.5px;color:rgba(255,255,255,.4);margin-top:8px;}
.lp .plan-anchor s{color:rgba(255,255,255,.35);}
.lp .seat-live{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:7px 12px;border-radius:6px;
  font-family:var(--mono);font-size:10px;letter-spacing:.5px;color:#fff;
  background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.28);}
.lp .seat-live b{color:#4ade80;}
.lp .seat-live .seat-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:fpPulse 2.4s ease-out infinite;}
.lp .seat-live.full{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.6);}
.lp .seat-live.full .seat-dot{background:rgba(255,255,255,.4);animation:none;}
.lp .seat-live.plain{background:transparent;border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.5);}
.lp .seat-live.plain .seat-dot{background:rgba(255,255,255,.3);animation:none;}
.lp .plan-list{list-style:none;padding:0;margin:22px 0 26px;display:flex;flex-direction:column;gap:11px;flex:1;}
.lp .plan-list li{position:relative;padding-left:20px;font-family:var(--sans);font-size:13px;line-height:1.55;color:rgba(255,255,255,.66);}
.lp .plan-list li::before{content:'';position:absolute;left:2px;top:7px;width:6px;height:6px;border-radius:50%;background:var(--gold);}
.lp .plan-cta{width:100%;text-align:center;box-sizing:border-box;}

/* Pricing hierarchy (Fix 4): Founders hero + subordinate $149 consequence strip */
.lp .pr-hero{max-width:820px;margin:40px auto 0;text-align:left;background:linear-gradient(180deg,rgba(201,168,76,.11),rgba(201,168,76,.02));
  border:1px solid rgba(201,168,76,.42);border-radius:16px;padding:22px 30px 26px;box-shadow:0 26px 70px rgba(201,168,76,.08);}
.lp .pr-hero-row{display:flex;gap:32px;align-items:center;margin-top:14px;}
.lp .pr-hero-main{flex:1;min-width:0;}
.lp .pr-hero-cta{width:230px;flex-shrink:0;display:flex;flex-direction:column;align-items:stretch;gap:10px;}
.lp .pr-hero-note{font-family:var(--mono);font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.4);text-align:center;}
.lp .pr-hero .plan-anchor b{color:var(--gold);}
.lp .pr-hero .plan-list{margin:18px 0 0;}
.lp .pr-conseq-arrow{max-width:820px;margin:14px auto 8px;text-align:left;font-family:var(--mono);font-size:10px;letter-spacing:1px;color:rgba(255,255,255,.4);}
.lp .pr-consequence{max-width:820px;margin:0 auto;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:22px;
  background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px 22px;}
.lp .pr-conseq-text{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;min-width:0;}
.lp .pr-conseq-price{font-family:var(--serif);font-size:30px;color:rgba(255,255,255,.9);font-variant-numeric:lining-nums;}
.lp .pr-conseq-price span{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.5);margin-left:2px;}
.lp .pr-conseq-label{font-family:var(--sans);font-size:12px;line-height:1.5;color:rgba(255,255,255,.5);}
.lp .pr-conseq-btn{width:auto;white-space:nowrap;flex-shrink:0;padding:11px 20px;}

.lp .pricing-fomo{font-family:var(--serif);font-style:italic;font-size:clamp(17px,2.4vw,22px);line-height:1.6;
  color:rgba(255,255,255,.8);max-width:640px;margin:44px auto 0;}

/* ── responsive ── */
@media (max-width:860px){
  .lp .how-row{grid-template-columns:1fr;gap:28px;}
  .lp .how-row.reverse .how-visual{order:0;}
  .lp .how-row.reverse .how-text{order:0;}
  .lp .trial-strip{grid-template-columns:1fr;}
  .lp .plan-grid{grid-template-columns:1fr;}
}
@media (max-width:680px){
  .lp .nav{padding:14px 20px;}
  .lp .nav-links{display:none;}
  .lp .nav-burger{display:flex;}
  .lp .class-grid{grid-template-columns:1fr 1fr;}
  .lp .faq-grid{grid-template-columns:1fr;gap:32px;margin-top:44px;}
  .lp .section{padding:80px 20px;}
  .lp .founders-pill{gap:8px;padding:7px 12px;flex-wrap:wrap;justify-content:center;max-width:100%;}
  .lp .fp-div{display:none;}
  .lp .plan-card{padding:26px 22px;}
  .lp .pr-hero-row{flex-direction:column;align-items:stretch;gap:18px;}
  .lp .pr-hero-cta{width:100%;}
  .lp .pr-consequence{flex-direction:column;align-items:stretch;gap:14px;}
  .lp .pr-conseq-btn{width:100%;text-align:center;}
  .lp .vai-card{padding:24px;}
  .lp .hero-ctas{flex-direction:column;width:100%;}
  .lp .hero-ctas .btn-gold,.lp .hero-ctas .btn-ghost{width:100%;}
  .lp .s-cta .btn-gold,.lp .s-cta .btn-ghost{width:100%;}
  .lp .footer{flex-direction:column;}
}
@media (max-width:380px){
  .lp .class-grid{grid-template-columns:1fr;}
}
`
