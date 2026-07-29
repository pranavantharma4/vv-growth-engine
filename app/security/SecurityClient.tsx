'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────────
   Scroll reveal — opacity 0→1, translateY(16px)→0.
   IntersectionObserver at 15% visibility. Respects reduced motion.
   `delay` staggers cards by 80ms.
   ───────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  as = 'div',
  style,
}: {
  children: ReactNode
  delay?: number
  as?: 'div' | 'section'
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReduced(true)
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const motion: CSSProperties = reduced
    ? {}
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 600ms cubic-bezier(.16,1,.3,1) ${delay}ms, transform 600ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }

  const Tag = as
  return (
    <Tag ref={ref as never} style={{ ...motion, ...style }}>
      {children}
    </Tag>
  )
}

/* ── shared type tokens ── */
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
  color: 'var(--ink)',
}
const body: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 300,
  fontSize: 17,
  lineHeight: 1.75,
  color: 'var(--ink2)',
}
const prose: CSSProperties = { ...body, maxWidth: '62ch' }

const AUDIT = '/audit'

export default function SecurityClient() {
  const section: CSSProperties = {
    maxWidth: 1080,
    margin: '0 auto',
    padding: '0 24px',
  }

  return (
    <main
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* Responsive rules that can't live in inline styles */}
      <style>{`
        .sec-pad { padding-top: 120px; padding-bottom: 120px; }
        .sec-scope-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sec-principles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sec-infra-row { display: flex; flex-wrap: wrap; gap: 48px; }
        .sec-cta-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .sec-link { transition: border-color .2s ease, color .2s ease; }
        .sec-link:hover { border-color: var(--goldborder) !important; }
        .sec-btn { transition: border-color .2s ease, opacity .2s ease; }
        .sec-btn-secondary:hover { border-color: var(--goldborder) !important; color: var(--ink) !important; }
        .sec-btn-primary:hover { opacity: .9; }
        @media (max-width: 820px) {
          .sec-pad { padding-top: 72px; padding-bottom: 72px; }
          .sec-scope-grid { grid-template-columns: 1fr; }
          .sec-principles-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ─────────────── [1] HERO ─────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* one subtle radial behind the hero */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(90% 60% at 20% 30%, rgba(201,168,76,0.05), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ ...section, position: 'relative', width: '100%' }}>
          <Reveal>
            <p style={eyebrow}>SECURITY</p>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: 'clamp(44px, 6vw, 76px)',
                lineHeight: 1.05,
                marginTop: 24,
                color: 'var(--ink)',
              }}
            >
              VV cannot touch your campaigns.
              <br />
              <span style={{ color: 'var(--gold)' }}>By design.</span>
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 21,
                lineHeight: 1.6,
                color: 'var(--ink)',
                maxWidth: '62ch',
                marginTop: 32,
              }}
            >
              Most ad tools ask for permission to change things. VV doesn&rsquo;t.
              We request read-only access to your Meta ad account and nothing
              more. We can see your data. We cannot spend, pause, edit, or launch
              anything — not because we choose not to, but because the access we
              hold makes it impossible.
            </p>
            <div
              style={{
                width: 80,
                height: 2,
                background: 'var(--gold)',
                marginTop: 48,
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* ─────────────── [2] THE SCOPE ─────────────── */}
      <section className="sec-pad" style={{ borderTop: '1px solid var(--rule)' }}>
        <div style={section}>
          <Reveal>
            <p style={eyebrow}>PERMISSION SCOPE</p>
            <h2 style={{ ...h2, marginTop: 20 }}>What we ask for. What we don&rsquo;t.</h2>
          </Reveal>

          <Reveal delay={80} style={{ marginTop: 48 }}>
            <div className="sec-scope-grid">
              {/* LEFT — REQUESTED */}
              <div
                style={{
                  border: '1px solid var(--goldborder)',
                  background: 'var(--goldpaper)',
                  borderRadius: 4,
                  padding: '32px 36px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                  }}
                >
                  REQUESTED
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 18,
                    color: 'var(--ink)',
                    marginTop: 24,
                  }}
                >
                  ads_read
                </p>
                <p style={{ ...body, fontSize: 15, marginTop: 16 }}>
                  Read campaign structure, spend, and performance metrics.
                </p>
              </div>

              {/* RIGHT — NEVER REQUESTED */}
              <div
                style={{
                  border: '1px solid var(--rule)',
                  background: 'transparent',
                  borderRadius: 4,
                  padding: '32px 36px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: 'var(--ink3)',
                  }}
                >
                  NEVER REQUESTED
                </p>
                <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
                  {['ads_management', 'business_management', 'pages_manage_ads'].map(
                    (scope) => (
                      <p
                        key={scope}
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 18,
                          color: 'var(--ink3)',
                          textDecoration: 'line-through',
                          textDecorationColor: 'var(--ink4)',
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            textDecoration: 'none',
                            display: 'inline-block',
                            marginRight: 12,
                            color: 'var(--ink3)',
                          }}
                        >
                          ✕
                        </span>
                        {scope}
                      </p>
                    )
                  )}
                </div>
                <p style={{ ...body, fontSize: 15, color: 'var(--ink3)', marginTop: 16 }}>
                  Write access. Campaign creation. Budget changes. Pausing. Spending.
                </p>
              </div>
            </div>

            <p
              style={{
                ...body,
                textAlign: 'center',
                maxWidth: '62ch',
                margin: '32px auto 0',
              }}
            >
              VV holds no write permission at any level. Neither does Vanguard
              Visuals.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────── [3] FOUR PRINCIPLES ─────────────── */}
      <section className="sec-pad" style={{ borderTop: '1px solid var(--rule)' }}>
        <div style={section}>
          <Reveal>
            <p style={eyebrow}>PRINCIPLES</p>
            <h2 style={{ ...h2, marginTop: 20 }}>How your data is handled.</h2>
          </Reveal>

          <div className="sec-principles-grid" style={{ marginTop: 48 }}>
            {[
              {
                n: '01',
                title: 'Read-only by architecture',
                text: 'VV requests only the ads_read scope from Meta. Write permissions are never requested and never held. No campaign can be created, paused, edited, or re-budgeted by VV — including by us.',
              },
              {
                n: '02',
                title: 'Your data stays yours',
                text: 'We store campaign metrics to generate diagnoses and track trends over time. We never sell your data, never share it, and never use it to train models. Delete your account and every record goes with it.',
              },
              {
                n: '03',
                title: 'Isolated at the database level',
                text: 'Every client’s data is protected by row-level security in Postgres. Access is scoped per account and per user. No client can query another client’s data — the database itself enforces it.',
              },
              {
                n: '04',
                title: 'Revoke in one click',
                text: 'You can disconnect VV from your Meta account at any moment, from Meta’s own settings. No email, no cancellation call, no waiting period. Access ends immediately.',
              },
            ].map((card, i) => (
              <Reveal key={card.n} delay={i * 80}>
                <div
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--rule)',
                    borderRadius: 4,
                    padding: '32px 36px',
                    height: '100%',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: 28,
                      color: 'var(--gold)',
                      opacity: 0.5,
                    }}
                  >
                    {card.n}
                  </span>
                  <h3
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 16,
                      color: 'var(--ink)',
                      marginTop: 16,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p style={{ ...body, fontSize: 15, lineHeight: 1.7, marginTop: 12 }}>
                    {card.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── [4] INFRASTRUCTURE ─────────────── */}
      <section className="sec-pad" style={{ borderTop: '1px solid var(--rule)' }}>
        <div style={section}>
          <Reveal>
            <p style={eyebrow}>INFRASTRUCTURE</p>
            <h2 style={{ ...h2, marginTop: 20 }}>
              Built on systems we don&rsquo;t have to vouch for.
            </h2>
          </Reveal>

          <Reveal delay={80} style={{ marginTop: 48 }}>
            <div className="sec-infra-row">
              {[
                { name: 'Vercel', detail: 'Application hosting and edge network' },
                { name: 'Supabase', detail: 'Postgres with row-level security' },
                {
                  name: 'Stripe',
                  detail: 'Payment processing. VV never handles card data.',
                },
                { name: 'Meta Graph API', detail: 'Official OAuth. Read-only scope.' },
              ].map((item) => (
                <div key={item.name} style={{ minWidth: 180 }}>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 15,
                      color: 'var(--ink)',
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      letterSpacing: 1,
                      color: 'var(--ink3)',
                      marginTop: 6,
                    }}
                  >
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────── [5] CLOSING STATEMENT ─────────────── */}
      <section
        className="sec-pad"
        style={{ borderTop: '1px solid var(--rule)', textAlign: 'center' }}
      >
        <div style={section}>
          <Reveal>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: 'clamp(30px, 4vw, 46px)',
                lineHeight: 1.3,
                maxWidth: '20ch',
                margin: '0 auto',
                color: 'var(--ink)',
              }}
            >
              Diagnosis, not execution.
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 18,
                lineHeight: 1.7,
                color: 'var(--ink2)',
                maxWidth: '52ch',
                margin: '24px auto 0',
              }}
            >
              That&rsquo;s the entire product, and the entire promise. VV reads
              your account and tells you the truth about it. Nothing else.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────── [6] CTA BAND ─────────────── */}
      <section
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--rule)',
          padding: '96px 0',
        }}
      >
        <div style={{ ...section, textAlign: 'center' }}>
          <Reveal>
            <h2 style={h2}>See what VV finds in your account.</h2>
            <div className="sec-cta-row" style={{ marginTop: 40 }}>
              <a
                href={AUDIT}
                className="sec-btn sec-btn-primary"
                style={{
                  background: 'var(--gold)',
                  color: '#050509',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  padding: '14px 28px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Run a free audit
              </a>
              <a
                href="/"
                className="sec-btn sec-btn-secondary"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink2)',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  padding: '14px 28px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Read the docs
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
