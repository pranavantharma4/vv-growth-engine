'use client'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"
const GOLD = '#c9a84c'
const INK = 'rgba(250,248,245,0.92)'
const INK2 = 'rgba(250,248,245,0.6)'
const INK3 = 'rgba(250,248,245,0.32)'
const RULE = 'rgba(250,248,245,0.08)'

// Fallback safety — if a user reaches this page directly (not via Calendly),
// fire the booked endpoint anyway so the teaser email + agency ping go out.
export default function BookedPage() {
  useEffect(() => {
    try {
      const leadRaw = sessionStorage.getItem('vd_lead')
      if (!leadRaw) return
      const email = (JSON.parse(leadRaw).email || '').toLowerCase()
      if (!email) return
      const fired = sessionStorage.getItem('vd_booked_fired')
      if (fired === email) return
      fetch('/api/vision-drop/booked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
      sessionStorage.setItem('vd_booked_fired', email)
    } catch {}
  }, [])

  return (
    <main style={{ fontFamily: SANS, color: INK, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fu { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .fu-1 { animation-delay: 0.05s; }
        .fu-2 { animation-delay: 0.2s; }
        .fu-3 { animation-delay: 0.34s; }
        .fu-4 { animation-delay: 0.48s; }
      `}</style>

      <header style={{ padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${RULE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: INK, letterSpacing: 2 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vision Drop</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 8, color: '#4ade80', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ✓ Booked
        </div>
      </header>

      <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div className="fu fu-1" style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '3.5px', textTransform: 'uppercase', marginBottom: 22 }}>
            ◧ Your call is on the calendar
          </div>

          <h1 className="fu fu-2" style={{ fontFamily: SERIF, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, lineHeight: 1.1, color: INK, margin: '0 0 22px', letterSpacing: '-0.5px' }}>
            <span style={{ fontStyle: 'italic', color: GOLD }}>Your call</span> is booked.
          </h1>

          <p className="fu fu-3" style={{ fontSize: 16, color: INK2, lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
            Check your email for the saved Vision Drop — your 3 findings plus a preview of the full VAI analysis. On the call we'll walk you through the rest of the blueprint and the exact reallocation plan for the next 30 days.
          </p>

          <div className="fu fu-4" style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, padding: '20px 28px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${RULE}`, borderRadius: 6, alignItems: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>What happens next</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {[
                'You\'ll get a calendar invite + Zoom link from us',
                'Your saved Vision Drop is in your inbox now',
                'Show up — we\'ll go straight to the blueprint',
              ].map((t) => (
                <div key={t} style={{ fontFamily: MONO, fontSize: 10, color: INK2, letterSpacing: '0.5px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#4ade80' }}>✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '24px 32px', borderTop: `1px solid ${RULE}`, textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(250,248,245,0.18)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Vanguard Visuals · VAI Intelligence · team@vngrdvisuals.com
        </div>
      </footer>
    </main>
  )
}
