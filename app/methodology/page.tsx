import type { CSSProperties } from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Method — Vanguard Visuals',
  description:
    'How VV classifies Meta campaigns: thresholds with reasons, leading signals over lagging symptoms, and one action first.',
}

/* Stub page — mirrors the /security layout system (dark editorial tokens,
   inline styles, no Tailwind). Content sections are placeholders marked TODO;
   the copy is written out on the landing page METHOD section for now. */

const eyebrow: CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: 3,
  textTransform: 'uppercase',
  color: 'var(--ink3)',
}
const h2: CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 300,
  fontSize: 'clamp(28px, 3.5vw, 40px)',
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
  color: 'var(--ink)',
}
const body: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 300,
  fontSize: 17,
  lineHeight: 1.75,
  letterSpacing: '0.01em',
  color: 'var(--ink2)',
  maxWidth: '62ch',
}
const section: CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '0 24px' }

// TODO(content): each of these becomes a full section once the method write-up
// is finalized. Titles mirror the three columns on the landing METHOD section.
const SECTIONS = [
  {
    eyebrow: 'PRINCIPLE 01',
    title: 'Thresholds with reasons',
    todo: 'Full write-up of every classification boundary — STRONG, WEAK, BLEEDING, DEAD — with the ROAS ranges and the reasoning behind each.',
  },
  {
    eyebrow: 'PRINCIPLE 02',
    title: 'Signals, not symptoms',
    todo: 'The leading indicators VV reads — CTR decay, spend concentration, frequency — and why they precede the numbers a dashboard shows.',
  },
  {
    eyebrow: 'PRINCIPLE 03',
    title: 'One action first',
    todo: 'How VV ranks fixes by impact and surfaces the single highest-leverage action in every report.',
  },
]

export default function MethodologyPage() {
  return (
    <main
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* HERO */}
      <section
        style={{
          position: 'relative',
          minHeight: 'calc(70vh)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(90% 60% at 25% 35%, rgba(201,168,76,0.06), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ ...section, position: 'relative', width: '100%', paddingTop: 96, paddingBottom: 64 }}>
          <p style={eyebrow}>METHOD</p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 'clamp(44px, 6vw, 76px)',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              marginTop: 24,
              color: 'var(--ink)',
            }}
          >
            Judgment, written as{' '}
            <span style={{ color: 'var(--gold)' }}>software.</span>
          </h1>
          <p style={{ ...body, fontSize: 21, lineHeight: 1.6, color: 'var(--ink)', marginTop: 32 }}>
            VV classifies every Meta campaign against defined thresholds, reads
            the leading signals before they become losses, and ends each report
            with the single highest-impact fix. The full method is documented
            below.
          </p>
          <div style={{ width: 80, height: 2, background: 'var(--gold)', marginTop: 48 }} />
        </div>
      </section>

      {SECTIONS.map((s) => (
        <section
          key={s.eyebrow}
          style={{ borderTop: '1px solid var(--rule)', padding: '96px 0' }}
        >
          <div style={section}>
            <p style={eyebrow}>{s.eyebrow}</p>
            <h2 style={{ ...h2, marginTop: 20 }}>{s.title}</h2>
            <p style={{ ...body, marginTop: 24 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  letterSpacing: 1,
                  color: 'var(--ink3)',
                }}
              >
                TODO —{' '}
              </span>
              {s.todo}
            </p>
          </div>
        </section>
      ))}

      {/* BACK LINK */}
      <section style={{ borderTop: '1px solid var(--rule)', padding: '64px 0 96px' }}>
        <div style={section}>
          <Link
            href="/"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'var(--gold)',
              textDecoration: 'none',
            }}
          >
            ← Back to VV
          </Link>
        </div>
      </section>
    </main>
  )
}
