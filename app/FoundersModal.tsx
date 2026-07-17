'use client'
// Founders Program selection flow (Fix 3). Opens from the homepage Founders CTA
// as a clean three-path chooser: the Founders Program (hero, with a live seat
// counter and a deck-of-cards FOMO reveal of the $149/mo value they get free),
// the free Ad Vision Drop audit, and the always-open $149/mo standard plan.
// Calendly is embedded INLINE — booking never leaves the site.
import { useEffect, useState } from 'react'

const CALENDLY = 'https://calendly.com/agency-vanguardia/30min'
const AUDIT = '/audit'
const SIGNUP = '/signup'
const SIGNUP_FOUNDERS = '/signup?plan=founders' // route-only; entitlement wiring is a flagged follow-up
// DEFERRED FOLLOW-UP: when all seats are claimed, "Join the waitlist" currently
// routes to SIGNUP_FOUNDERS. Real waitlist capture via /api/waitlist (email →
// waitlist table) is intentionally deferred — seats are open at launch so the
// 0-seat state won't trigger yet. Wire /api/waitlist here when seats close.
const PRICE = 149

type Props = { open: boolean; onClose: () => void; seatsLeft: number; seatsTotal: number }

export default function FoundersModal({ open, onClose, seatsLeft, seatsTotal }: Props) {
  // When set, an inline Calendly panel is shown over the cards (no redirect).
  const [booking, setBooking] = useState(false)

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { booking ? setBooking(false) : onClose() } }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, booking, onClose])

  // Reset the booking sub-view whenever the modal is reopened.
  useEffect(() => { if (!open) setBooking(false) }, [open])

  if (!open) return null

  const seatsOpen = seatsLeft > 0
  // Branded, GDPR-suppressed inline Calendly embed. embed_domain uses the live
  // host so Calendly renders inline rather than bouncing to its own page.
  const host = typeof window !== 'undefined' ? window.location.hostname : 'vngrdvisuals.com'
  const calendlySrc =
    `${CALENDLY}?hide_gdpr_banner=1&background_color=050509&text_color=faf8f5&primary_color=c9a84c` +
    `&embed_domain=${encodeURIComponent(host)}&embed_type=Inline`

  return (
    <div className="fmodal" role="dialog" aria-modal="true" aria-label="Choose how to start with VV">
      <style>{CSS}</style>
      <div className="fm-backdrop" onClick={() => (booking ? setBooking(false) : onClose())} />

      <div className="fm-sheet">
        {/* Top bar: brand + persistent sign in / sign up + close */}
        <div className="fm-top">
          <div className="fm-brand"><span className="fm-vv">VV</span><span className="fm-sub">GROWTH AD ENGINE</span></div>
          <div className="fm-top-right">
            <a href="/login" className="fm-link">SIGN IN</a>
            <a href={SIGNUP} className="fm-link">SIGN UP</a>
            <button className="fm-close" aria-label="Close" onClick={onClose}>×</button>
          </div>
        </div>

        {booking ? (
          /* ── Inline Calendly (never leaves the site) ── */
          <div className="fm-booking">
            <button className="fm-back" onClick={() => setBooking(false)}>← Back to options</button>
            <div className="fm-cal-frame">
              <iframe title="Book a 30-minute call with VV" src={calendlySrc} width="100%" height="100%" frameBorder="0" />
            </div>
          </div>
        ) : (
          <>
            <div className="fm-head">
              <p className="fm-eyebrow">{seatsOpen ? 'FOUNDING SEATS · CLOSING' : 'FOUNDING SEATS · CLOSED'}</p>
              <h2 className="fm-h">
                {seatsOpen
                  ? <>Claim one of {seatsTotal} free-for-life seats.</>
                  : <>All {seatsTotal} founding seats are gone.</>}
              </h2>
            </div>

            {/* ── HERO — Founders Program: the obvious best deal, front & center ── */}
            <div className={`fm-hero${seatsOpen ? '' : ' full'}`}>
              <div className={`fm-seats${seatsOpen ? '' : ' full'}`}>
                <span className="fm-seat-dot" />
                {seatsOpen
                  ? <span><b>{seatsLeft}</b> of {seatsTotal} seats left · the door is closing</span>
                  : <span>All {seatsTotal} seats claimed</span>}
              </div>

              <div className="fm-hero-row">
                <div className="fm-hero-main">
                  <div className="fm-name">VV Founders Program</div>
                  <div className="fm-anchor"><s>${PRICE}/mo</s> · <b>free — for life</b></div>
                  <ul className="fm-list">
                    <li>The full ${PRICE}/mo engine — free, for as long as you&rsquo;re a client</li>
                    <li>Direct line to the founder; your feedback shapes the product</li>
                    <li>Only {seatsTotal} seats, ever. When they&rsquo;re gone, the door closes.</li>
                  </ul>
                </div>
                <div className="fm-hero-cta">
                  {seatsOpen ? (
                    <>
                      <a href={SIGNUP_FOUNDERS} className="fm-btn fm-btn-gold">Claim your seat →</a>
                      <button className="fm-btn fm-btn-ghost" onClick={() => setBooking(true)}>Book a call →</button>
                    </>
                  ) : (
                    <a href={SIGNUP_FOUNDERS} className="fm-btn fm-btn-gold">Join the waitlist →</a>
                  )}
                </div>
              </div>
            </div>

            {/* ── CONSEQUENCE STRIP — $149 as the price once the free seats close.
                 Deliberately de-emphasised: it exists to make the seats feel urgent,
                 not to compete with them. ── */}
            <div className="fm-conseq-arrow">↓ once the {seatsTotal} seats are gone, this is what it costs</div>
            <div className="fm-consequence">
              <div className="fm-conseq-text">
                <span><b className="fm-price">${PRICE}</b><span className="fm-conseq-per">/mo</span></span>
                <span className="fm-conseq-label">The regular price after the founding seats close — 7-day free trial, no card to start.</span>
              </div>
              <a href={SIGNUP} className="fm-btn fm-btn-ghost fm-conseq-btn">Start 7-day trial →</a>
            </div>

            {/* ── TERTIARY — free audit, the no-commitment try-first ── */}
            <div className="fm-tertiary">
              Not ready to commit? <a href={AUDIT}>Start the free 60-second Ad Vision Drop →</a> — your 3 biggest leaks, no login.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const CSS = `
  .fmodal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'DM Sans', sans-serif; }
  .fm-backdrop { position: absolute; inset: 0; background: rgba(2,2,3,0.82); backdrop-filter: blur(6px); animation: fmFade .25s ease; }
  @keyframes fmFade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fmRise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }

  .fm-sheet { position: relative; width: 100%; max-width: 1080px; max-height: 92vh; overflow-y: auto; background: #08080c;
    border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; box-shadow: 0 40px 120px rgba(0,0,0,0.7);
    padding: 22px 26px 30px; animation: fmRise .34s cubic-bezier(.16,1,.3,1); }
  .fm-sheet::-webkit-scrollbar { width: 4px } .fm-sheet::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px }

  .fm-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .fm-brand { display: flex; align-items: baseline; gap: 9px; }
  .fm-vv { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 600; font-size: 24px; color: #faf8f5; letter-spacing: 1px; }
  .fm-sub { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 2.5px; color: rgba(250,248,245,0.32); }
  .fm-top-right { display: flex; align-items: center; gap: 16px; }
  .fm-link { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; color: rgba(250,248,245,0.55); text-decoration: none; transition: color .15s; }
  .fm-link:hover { color: #c9a84c; }
  .fm-close { background: none; border: none; color: rgba(250,248,245,0.5); font-size: 26px; line-height: 1; cursor: pointer; padding: 0 2px; }
  .fm-close:hover { color: #faf8f5; }

  .fm-head { text-align: center; margin-bottom: 26px; }
  .fm-eyebrow { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 4px; color: #c9a84c; margin: 0 0 10px; }
  .fm-h { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic; font-size: clamp(26px, 4vw, 38px); color: #faf8f5; margin: 0; }

  /* HERO — Founders Program, one dominant full-width card (deck-of-cards dropped
     for a clean, legible hierarchy). It's the obvious best deal. */
  .fm-hero { background: linear-gradient(180deg, rgba(201,168,76,0.12), rgba(255,255,255,0.02)); border: 1px solid rgba(201,168,76,0.42);
    border-radius: 16px; padding: 20px 26px 24px; box-shadow: 0 0 0 1px rgba(201,168,76,0.10), 0 26px 70px rgba(201,168,76,0.07); }
  .fm-hero.full { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.02); box-shadow: none; }
  .fm-hero-row { display: flex; gap: 30px; align-items: center; }
  .fm-hero-main { flex: 1; min-width: 0; }
  .fm-hero-cta { display: flex; flex-direction: column; justify-content: center; gap: 10px; width: 200px; flex-shrink: 0; }

  .fm-name { font-family: 'Cormorant Garamond', serif; font-size: 27px; font-weight: 400; color: #faf8f5; line-height: 1.1; margin-bottom: 6px; }
  .fm-anchor { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(250,248,245,0.55); margin-bottom: 16px; }
  .fm-anchor s { color: rgba(250,248,245,0.4); }
  .fm-anchor b { color: #c9a84c; font-weight: 600; }
  .fm-price { font-family: 'Cormorant Garamond', serif; font-size: 26px; color: #faf8f5; font-weight: 400; }

  .fm-seats { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; font-family: 'DM Mono', monospace; font-size: 10px;
    color: #4ade80; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.24); border-radius: 100px; padding: 5px 12px; margin-bottom: 14px; }
  .fm-seats b { color: #faf8f5; }
  .fm-seats.full { color: rgba(250,248,245,0.55); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
  .fm-seat-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 0 rgba(74,222,128,0.5); animation: fmPulse 2s infinite; }
  .fm-seats.full .fm-seat-dot { background: rgba(250,248,245,0.4); animation: none; }
  @keyframes fmPulse { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.45) } 70% { box-shadow: 0 0 0 7px rgba(74,222,128,0) } 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0) } }

  .fm-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 9px; }
  .fm-list li { position: relative; padding-left: 16px; font-size: 12.5px; line-height: 1.5; color: rgba(250,248,245,0.66); }
  .fm-list li::before { content: '·'; position: absolute; left: 3px; color: #c9a84c; font-weight: 700; }

  /* CONSEQUENCE STRIP — $149 as the "what it costs otherwise" reference. Muted,
     subordinate; its job is FOMO, not to compete with the free seats. */
  .fm-conseq-arrow { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1px; color: rgba(250,248,245,0.4); margin: 18px 0 8px; padding-left: 2px; }
  .fm-consequence { display: flex; align-items: center; justify-content: space-between; gap: 20px;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; }
  .fm-conseq-text { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; min-width: 0; }
  .fm-conseq-per { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(250,248,245,0.5); margin-left: 2px; }
  .fm-conseq-label { font-family: 'DM Sans', sans-serif; font-size: 12px; line-height: 1.5; color: rgba(250,248,245,0.5); }
  .fm-conseq-btn { width: auto; white-space: nowrap; padding: 10px 16px; flex-shrink: 0; }

  /* TERTIARY — free audit try-first */
  .fm-tertiary { text-align: center; margin-top: 18px; font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(250,248,245,0.45); line-height: 1.6; }
  .fm-tertiary a { color: #c9a84c; text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.4); }
  .fm-tertiary a:hover { border-bottom-color: #c9a84c; }

  .fm-btn { display: block; text-align: center; text-decoration: none; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 600;
    letter-spacing: 1.4px; text-transform: uppercase; padding: 12px 16px; border-radius: 6px; cursor: pointer; transition: transform .12s, background .18s, border-color .18s; }
  .fm-btn:active { transform: scale(.98); }
  .fm-btn-gold { background: #c9a84c; color: #050509; border: 1px solid #c9a84c; }
  .fm-btn-gold:hover { background: #d8b95e; }
  .fm-btn-ghost { background: transparent; color: rgba(250,248,245,0.85); border: 1px solid rgba(255,255,255,0.16); }
  .fm-btn-ghost:hover { border-color: #c9a84c; color: #c9a84c; }

  /* Inline Calendly */
  .fm-booking { display: flex; flex-direction: column; gap: 14px; }
  .fm-back { align-self: flex-start; background: none; border: none; color: rgba(250,248,245,0.6); font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1px; cursor: pointer; padding: 4px 0; }
  .fm-back:hover { color: #c9a84c; }
  .fm-cal-frame { width: 100%; height: 68vh; min-height: 520px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: #050509; }
  .fm-cal-frame iframe { display: block; width: 100%; height: 100%; }

  @media (max-width: 720px) {
    .fm-hero-row { flex-direction: column; align-items: stretch; gap: 18px; }
    .fm-hero-cta { width: 100%; }
    .fm-consequence { flex-direction: column; align-items: stretch; gap: 12px; }
    .fm-conseq-btn { width: 100%; }
    .fm-sheet { padding: 18px 16px 24px; }
  }
`
