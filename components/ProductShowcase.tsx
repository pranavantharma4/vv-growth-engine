'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   ProductShowcase — a self-playing mock of the real VV dashboard, styled to
   the actual app tokens (bg #050509, sidebar #0c0a0e @214px, cards
   rgba(255,255,255,0.025) with --rule borders, DM Mono 8px labels, Cormorant
   300 metric values, gold VAI panel).

   The full layout is always present, so nothing reflows — the "animation" is
   staged opacity/border reveals driven by a `phase` counter that loops with a
   ~4s hold at the end (~14s total). The first frame (phase 0) shows the
   campaigns table immediately; the metric grid and VAI panel occupy reserved
   space at opacity 0. Pauses when off-viewport. Respects reduced motion by
   jumping to the final frame with no timers.
─────────────────────────────────────────────────────────────────────────── */

const MONO = "'DM Mono', monospace"
const SERIF = "'Cormorant Garamond', serif"
const SANS = "'DM Sans', sans-serif"

const STRONG = '#4ade80'
const WEAK = '#fbbf24'
const BLEEDING = '#fb923c'
const DEAD = '#f87171'

const EASE = 'cubic-bezier(.16,1,.3,1)'

const ROWS = [
  { name: 'Broad — Interest Stack', platform: 'META', spend: '$2,300', roas: '2.1×', state: 'WEAK', color: WEAK },
  { name: 'Spring Promo — Cold', platform: 'META', spend: '$900', roas: '0.0×', state: 'DEAD', color: DEAD },
  { name: 'Summer Sale — Retargeting', platform: 'META', spend: '$3,200', roas: '1.2×', state: 'BLEEDING', color: BLEEDING },
]

const METRICS = [
  { k: 'SPEND', v: '$2,300' },
  { k: 'ROAS', v: '2.10×' },
  { k: 'CTR', v: '0.9%' },
  { k: 'CPA', v: '$64' },
  { k: 'FREQUENCY', v: '4.2', highlight: true },
  { k: 'CPM', v: '$18' },
]

const NAV_ITEMS = [
  { icon: '◈', label: 'Dashboard' },
  { icon: '◫', label: 'Campaigns', active: true },
  { icon: '◉', label: 'AI Analysis' },
  { icon: '◑', label: 'Ads Optimization' },
  { icon: '▣', label: 'Reports' },
]

// Loop timeline: [milliseconds-from-cycle-start, phase]. Phase gates reveals:
// 1 row-active · 2 metric grid · 3 VAI + line 1 · 4 line 2 · 5 frequency border.
const TIMELINE: [number, number][] = [
  [0, 0],
  [1200, 1],
  [2800, 2],
  [4600, 3],
  [5800, 4],
  [7200, 5],
]
const CYCLE_MS = 11200 // 7200 reveal + ~4000 hold, then loop

export default function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase(5)
      return
    }

    const clear = () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }

    const runCycle = () => {
      clear()
      TIMELINE.forEach(([t, p]) => {
        timers.current.push(setTimeout(() => setPhase(p), t))
      })
      timers.current.push(setTimeout(runCycle, CYCLE_MS))
    }

    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) runCycle()
          else clear()
        })
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => {
      clear()
      io.disconnect()
    }
  }, [])

  const reveal = (active: boolean): CSSProperties => ({
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0)' : 'translateY(8px)',
    transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
  })

  return (
    <div
      ref={ref}
      className="pshow"
      aria-hidden
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        borderRadius: 8,
        border: '1px solid var(--rule)',
        background: '#050509',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      <style>{`
        .pshow .ps-sidebar { width: 214px; flex-shrink: 0; }
        @media (max-width: 720px) {
          .pshow { aspect-ratio: 4 / 5; }
          .pshow .ps-sidebar { display: none; }
          .pshow .ps-metrics { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* SIDEBAR — #0c0a0e / 214px */}
      <div
        className="ps-sidebar"
        style={{
          background: '#0c0a0e',
          borderRight: '1px solid var(--rule)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '2px 6px 14px' }}>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 22, color: '#faf8f5', letterSpacing: 1 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: 2, color: 'var(--ink3)' }}>GROWTH</span>
        </div>
        {NAV_ITEMS.map((n) => (
          <div
            key={n.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 8px',
              borderRadius: 4,
              borderLeft: `2px solid ${n.active ? 'var(--gold)' : 'transparent'}`,
              background: n.active ? 'rgba(255,255,255,0.05)' : 'transparent',
            }}
          >
            <span style={{ fontSize: 10, width: 14, textAlign: 'center', color: n.active ? 'var(--gold)' : 'var(--ink3)' }}>{n.icon}</span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: n.active ? 'var(--ink)' : 'var(--ink3)', fontWeight: n.active ? 500 : 400 }}>{n.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 6px' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: STRONG }} />
          <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: 1, color: 'var(--ink3)' }}>LIVE</span>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 19, letterSpacing: 0.5, color: 'var(--ink)' }}>Campaigns</div>
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink3)', marginTop: 2 }}>All active campaigns across platforms</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: 'var(--ink3)', border: '1px solid var(--rule)', borderRadius: 4, padding: '5px 10px' }}>JUL 2026</div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
          {/* TABLE */}
          <div style={{ border: '1px solid var(--rule)', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.025)' }}>
            {/* column labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 0.8fr 1fr 0.8fr 1fr', gap: 8, padding: '9px 14px', borderBottom: '1px solid var(--rule)' }}>
              {['CAMPAIGN', 'PLATFORM', 'SPEND', 'ROAS', 'STATE'].map((h) => (
                <span key={h} style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, color: 'var(--ink3)' }}>{h}</span>
              ))}
            </div>
            {ROWS.map((r, i) => {
              const isFirst = i === 0
              const active = isFirst && phase >= 1
              return (
                <div
                  key={r.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.4fr 0.8fr 1fr 0.8fr 1fr',
                    gap: 8,
                    alignItems: 'center',
                    padding: '11px 14px',
                    borderBottom: i < ROWS.length - 1 ? '1px solid var(--rule)' : 'none',
                    borderLeft: `2px solid ${active ? r.color : 'transparent'}`,
                    background: active ? 'rgba(255,255,255,0.025)' : 'transparent',
                    transition: `background 250ms ${EASE}, border-color 250ms ${EASE}`,
                  }}
                >
                  <span style={{ fontFamily: SANS, fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>{r.platform}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--ink2)' }}>{r.spend}</span>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 17, color: r.color, fontVariantNumeric: 'lining-nums' }}>{r.roas}</span>
                  <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: r.color }}>{r.state}</span>
                </div>
              )
            })}
          </div>

          {/* EXPANDED METRIC GRID — reserved space, fades in at phase ≥ 2 */}
          <div
            className="ps-metrics"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              ...reveal(phase >= 2),
            }}
          >
            {METRICS.map((m) => {
              const lit = m.highlight && phase >= 5
              return (
                <div
                  key={m.k}
                  style={{
                    border: `1px solid ${lit ? 'var(--goldborder)' : 'var(--rule)'}`,
                    background: lit ? 'var(--goldpaper)' : 'rgba(255,255,255,0.025)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    transition: `border-color 250ms ${EASE}, background 250ms ${EASE}`,
                  }}
                >
                  <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, color: lit ? 'var(--gold)' : 'var(--ink3)' }}>{m.k}</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, lineHeight: 1.1, marginTop: 4, color: m.highlight ? WEAK : 'var(--ink)', fontVariantNumeric: 'lining-nums' }}>{m.v}</div>
                </div>
              )
            })}
          </div>

          {/* VAI PANEL — reserved space, fades in at phase ≥ 3 */}
          <div
            style={{
              border: '1px solid var(--goldborder)',
              background: 'var(--goldpaper)',
              borderRadius: 8,
              padding: '16px 18px',
              ...reveal(phase >= 3),
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: 'var(--gold)', marginBottom: 10 }}>VAI DIAGNOSIS</div>
            <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: 0, ...reveal(phase >= 3), fontVariantNumeric: 'lining-nums' }}>
              Classified <span style={{ color: WEAK }}>WEAK</span> because ROAS is 2.10× (1.5×–2.5×: profitable but underperforming).
            </p>
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12, lineHeight: 1.6, color: 'var(--ink2)', margin: '10px 0 0', ...reveal(phase >= 4) }}>
              First fix — refresh the creative before frequency at 4.2 turns this into a leak.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
