'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"
const GOLD = '#c9a84c'
const INK = 'rgba(250,248,245,0.92)'
const INK2 = 'rgba(250,248,245,0.6)'
const INK3 = 'rgba(250,248,245,0.32)'
const RULE = 'rgba(250,248,245,0.08)'

// External Calendly URL — drop your real link here when ready. Until then this
// still routes the prospect to /vision-drop/booked so we capture the conversion
// + send the teaser email + ping agency. Swap to a Calendly URL when live.
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_VISION_DROP_CALENDLY_URL || '/vision-drop/booked'

type Findings = {
  biggest_leak: { campaign_name: string; monthly_waste: number; why: string }
  best_performer: { campaign_name: string; roas: number; why: string }
  immediate_action: string
}

type Report = {
  findings: Findings
  total_spend?: number
  total_revenue?: number
  blended_roas?: number
  campaign_count?: number
}

export default function ResultsPage() {
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [email, setEmail] = useState<string>('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('vd_report')
    const leadRaw = sessionStorage.getItem('vd_lead')
    if (!raw || !leadRaw) {
      router.replace('/vision-drop/connect')
      return
    }
    try {
      setReport(JSON.parse(raw))
      setEmail((JSON.parse(leadRaw).email || '').toLowerCase())
    } catch {
      router.replace('/vision-drop/connect')
    }
  }, [router])

  async function handleBook() {
    // Mark the booking + fire emails before sending the user out to Calendly.
    // We don't await — if Calendly opens we'd rather not block the click.
    if (email) {
      fetch('/api/vision-drop/booked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
    }
    if (CALENDLY_URL.startsWith('http')) {
      window.open(CALENDLY_URL, '_blank', 'noopener')
      router.push('/vision-drop/booked')
    } else {
      router.push(CALENDLY_URL)
    }
  }

  async function handleEmailReport() {
    if (!email || emailSending || emailSent) return
    setEmailSending(true)
    try {
      await fetch('/api/vision-drop/booked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setEmailSent(true)
    } catch {
      // ignore — non-critical
    } finally {
      setEmailSending(false)
    }
  }

  if (!report) {
    return (
      <main style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '2px', textTransform: 'uppercase' }}>
        Loading your report…
      </main>
    )
  }

  const f = report.findings
  const fmt = (n: number) => '$' + Math.round(Number(n) || 0).toLocaleString()

  return (
    <main style={{ fontFamily: SANS, color: INK, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fu { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .fu-1 { animation-delay: 0.05s; }
        .fu-2 { animation-delay: 0.18s; }
        .fu-3 { animation-delay: 0.3s; }
        .fu-4 { animation-delay: 0.42s; }
        .fu-5 { animation-delay: 0.55s; }
        .blur-mask { filter: blur(7px); user-select: none; }
        .cta { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .cta:hover { transform: translateY(-1px); box-shadow: 0 8px 28px -6px rgba(201,168,76,0.5); }
        .cta-secondary { transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease; }
        .cta-secondary:hover { background: rgba(201,168,76,0.06); border-color: rgba(201,168,76,0.4); color: ${GOLD}; }
      `}</style>

      <header style={{ padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${RULE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: INK, letterSpacing: 2 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vision Drop</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 8, color: '#4ade80', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ✓ Analysis complete
        </div>
      </header>

      <section style={{ maxWidth: 880, margin: '0 auto', padding: '56px 32px 24px' }}>
        <div className="fu fu-1" style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '3.5px', textTransform: 'uppercase', marginBottom: 18, textAlign: 'center' }}>
          ◧ Your Ad Vision Drop
        </div>
        <h1 className="fu fu-2" style={{ fontFamily: SERIF, fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 300, lineHeight: 1.1, color: INK, margin: '0 0 18px', textAlign: 'center', letterSpacing: '-0.5px' }}>
          What VAI <span style={{ fontStyle: 'italic', color: GOLD }}>found</span> in your account.
        </h1>
        {report.total_spend !== undefined && (
          <div className="fu fu-3" style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK2, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Last 7 days: {fmt(report.total_spend)} spend · {Number(report.blended_roas || 0).toFixed(2)}x ROAS · {report.campaign_count || 0} campaigns
            </span>
          </div>
        )}

        {/* THREE FINDINGS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          {/* Biggest leak */}
          <div className="fu fu-3" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.22)', borderLeft: '3px solid rgba(248,113,113,0.7)', borderRadius: '0 6px 6px 0', padding: '22px 26px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: '#f87171', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              ⚠ Your Biggest Leak
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, marginBottom: 10, lineHeight: 1.3 }}>
              {f.biggest_leak.campaign_name}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 36, color: '#f87171', fontWeight: 300, marginBottom: 14 }}>
              {fmt(f.biggest_leak.monthly_waste)}
              <span style={{ fontSize: 12, color: INK3, fontFamily: MONO, marginLeft: 8, letterSpacing: '1px' }}>/MO WASTED</span>
            </div>
            <div style={{ fontSize: 14, color: INK2, lineHeight: 1.75 }}>{f.biggest_leak.why}</div>
          </div>

          {/* Best performer */}
          <div className="fu fu-4" style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.22)', borderLeft: '3px solid rgba(74,222,128,0.7)', borderRadius: '0 6px 6px 0', padding: '22px 26px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: '#4ade80', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              ★ Your Best Performer
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, marginBottom: 10, lineHeight: 1.3 }}>
              {f.best_performer.campaign_name}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 36, color: '#4ade80', fontWeight: 300, marginBottom: 14 }}>
              {Number(f.best_performer.roas).toFixed(2)}x
              <span style={{ fontSize: 12, color: INK3, fontFamily: MONO, marginLeft: 8, letterSpacing: '1px' }}>ROAS</span>
            </div>
            <div style={{ fontSize: 14, color: INK2, lineHeight: 1.75 }}>{f.best_performer.why}</div>
          </div>

          {/* Immediate action */}
          <div className="fu fu-5" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderLeft: `3px solid ${GOLD}`, borderRadius: '0 6px 6px 0', padding: '22px 26px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              → Your Immediate Action
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, lineHeight: 1.5, marginBottom: 6 }}>
              {f.immediate_action}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 14 }}>
              Do this in the next 48 hours
            </div>
          </div>
        </div>
      </section>

      {/* LOCKED FULL ANALYSIS */}
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '24px 32px 16px' }}>
        <div style={{ position: 'relative', background: '#0c0b0f', border: `1px solid ${RULE}`, borderRadius: 8, padding: '28px 30px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${RULE}` }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 4 }}>◉ Locked</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, fontWeight: 300, fontStyle: 'italic' }}>
                Full VAI Analysis & Optimization Blueprint
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '1.5px' }}>UNLOCK ON CALL</div>
          </div>

          <div className="blur-mask" style={{ fontSize: 13, color: INK2, lineHeight: 1.85 }}>
            Your account has three structural inefficiencies that compound over time. The first is creative — three of your top historical campaigns are now showing fatigue patterns: CTR declining 22-38% over the past 14 days while CPM climbs. The second is audience saturation in your prospecting lookalike layer, frequency is past 3.0 which is the point of diminishing returns for cold traffic. The third is your bid strategy mismatch on your retargeting campaigns — you're using lowest cost when cost cap would compound your already-strong ROAS. The full 30-day blueprint covers each of these with the exact reallocation percentages, creative directions, and a week-by-week sequencing plan.
          </div>

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', background: 'linear-gradient(to top, #0c0b0f 25%, transparent 100%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', textAlign: 'center', marginTop: 18, padding: 18 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
              ◧ Unlock the full blueprint on your strategy call
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '24px 32px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <button
            onClick={handleBook}
            className="cta"
            style={{
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#050509',
              background: GOLD,
              border: 'none',
              padding: '18px 36px',
              borderRadius: 4,
              cursor: 'pointer',
              minWidth: 360,
              boxShadow: '0 4px 20px -4px rgba(201,168,76,0.35)',
            }}
          >
            Get Your Full Report — Book a 20-Min Call →
          </button>

          <button
            onClick={handleEmailReport}
            disabled={emailSending || emailSent}
            className="cta-secondary"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: emailSent ? '#4ade80' : INK2,
              background: 'transparent',
              border: `1px solid ${emailSent ? 'rgba(74,222,128,0.35)' : RULE}`,
              padding: '12px 24px',
              borderRadius: 4,
              cursor: emailSending || emailSent ? 'default' : 'pointer',
              minWidth: 360,
            }}
          >
            {emailSent
              ? '✓ Sent — check your inbox'
              : emailSending
              ? 'Sending…'
              : 'Email me the full report'}
          </button>
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '1.5px' }}>
          Your data is read-only. We never run ads on your behalf. Disconnect anytime in your Meta settings.
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
