'use client'
// First-run dashboard walkthrough (Fix 1c). A minimal, on-brand spotlight tour:
// it dims the screen, rings the relevant UI element (found by [data-tour="…"]),
// and shows one sentence per step. Skippable at any point. The parent (layout)
// decides when to mount it and persists completion — this component only runs
// the tour and calls onDone when finished or skipped.
import { useEffect, useLayoutEffect, useState, useCallback } from 'react'

type Step = { selector: string; title: string; body: string }

// Each step highlights an element rendered somewhere in the dashboard (page
// content or sidebar). Elements carry a matching data-tour attribute.
const STEPS: Step[] = [
  {
    selector: '[data-tour="states"]',
    title: 'The four campaign states',
    body: 'Every campaign is graded Strong, Weak, Bleeding, or Dead — so you see at a glance what is working and what is quietly burning budget.',
  },
  {
    selector: '[data-tour="leak"]',
    title: 'Your biggest leak — and the fix',
    body: 'This surfaces the single campaign wasting the most money and the first move to stop the bleed.',
  },
  {
    selector: '[data-tour="diagnosis"]',
    title: 'Read a full diagnosis',
    body: 'Open AI Analysis for any campaign to get the plain-English why behind its grade and what to change.',
  },
  {
    selector: '[data-tour="settings"]',
    title: 'Report cadence & recipients',
    body: 'Set who receives your reports and how often under Settings — you are in control of the schedule.',
  },
]

const mono = "'DM Mono',monospace"
const serif = "'Cormorant Garamond',serif"
const gold = '#c9a84c'

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = STEPS[i]

  const measure = useCallback(() => {
    const el = document.querySelector(step.selector) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setRect(el.getBoundingClientRect())
    } else {
      setRect(null) // element not on screen — fall back to a centered card
    }
  }, [step.selector])

  // Re-measure on step change, and keep the ring glued to the element while the
  // page scrolls/resizes (scrollIntoView animates, so measure a couple times).
  useLayoutEffect(() => {
    measure()
    const t1 = setTimeout(measure, 120)
    const t2 = setTimeout(measure, 360)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [measure])

  useEffect(() => {
    const on = () => measure()
    window.addEventListener('resize', on)
    window.addEventListener('scroll', on, true)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('scroll', on, true)
    }
  }, [measure])

  const last = i === STEPS.length - 1
  const next = () => (last ? onDone() : setI(i + 1))
  const back = () => setI(Math.max(0, i - 1))

  const pad = 8
  const ring = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null

  // Tooltip: below the ring if there's room, else above; centered when no ring.
  const tipW = 320
  let tipStyle: React.CSSProperties
  if (ring) {
    const below = ring.top + ring.height + 14
    const spaceBelow = window.innerHeight - (ring.top + ring.height)
    const placeBelow = spaceBelow > 200
    const left = Math.min(Math.max(12, ring.left), window.innerWidth - tipW - 12)
    tipStyle = placeBelow
      ? { top: below, left }
      : { top: Math.max(12, ring.top - 14 - 190), left }
  } else {
    tipStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      {/* Spotlight: the ring's huge box-shadow darkens everything outside it. */}
      {ring ? (
        <div
          style={{
            position: 'fixed', top: ring.top, left: ring.left, width: ring.width, height: ring.height,
            borderRadius: 8, border: `1px solid ${gold}`, boxShadow: '0 0 0 9999px rgba(2,2,3,0.74)',
            pointerEvents: 'none', transition: 'top 0.28s ease, left 0.28s ease, width 0.28s ease, height 0.28s ease',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,3,0.74)' }} />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: 'fixed', width: tipW, background: 'var(--sb, #12100e)', border: '1px solid var(--rule2, rgba(255,255,255,0.1))',
          borderRadius: 10, padding: '18px 20px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', ...tipStyle,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '2px', color: gold, textTransform: 'uppercase' }}>
            {i + 1} / {STEPS.length}
          </span>
          <button onClick={onDone} style={{ fontFamily: mono, fontSize: 8, letterSpacing: '1px', color: 'rgba(250,248,245,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
            Skip
          </button>
        </div>
        <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 300, color: 'rgba(250,248,245,0.95)', marginBottom: 8, lineHeight: 1.2 }}>
          {step.title}
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, color: 'rgba(250,248,245,0.6)', lineHeight: 1.65, marginBottom: 16 }}>
          {step.body}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {STEPS.map((_, idx) => (
              <span key={idx} style={{ width: 5, height: 5, borderRadius: '50%', background: idx === i ? gold : 'rgba(255,255,255,0.18)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {i > 0 && (
              <button onClick={back} style={{ fontFamily: mono, fontSize: 9, letterSpacing: '1px', color: 'rgba(250,248,245,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '7px 14px', cursor: 'pointer' }}>
                Back
              </button>
            )}
            <button onClick={next} style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', borderRadius: 4, padding: '7px 16px', cursor: 'pointer' }}>
              {last ? 'Done' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
