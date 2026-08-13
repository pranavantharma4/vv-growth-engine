'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"
const GOLD = '#c9a84c'
const INK = 'rgba(250,248,245,0.92)'
const INK2 = 'rgba(250,248,245,0.6)'
const INK3 = 'rgba(250,248,245,0.32)'
const INK4 = 'rgba(250,248,245,0.14)'
const RULE = 'rgba(250,248,245,0.08)'

const SAMPLE_FINDINGS = [
  {
    tag: '⚠ Biggest Leak',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.05)',
    border: 'rgba(248,113,113,0.22)',
    title: 'Prospecting — Broad — Lookalike 1%',
    big: '$4,820/mo wasted',
    body: 'Spending $9,640/mo at 0.61x ROAS — every dollar in returns about sixty cents.',
  },
  {
    tag: '★ Best Performer',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.04)',
    border: 'rgba(74,222,128,0.22)',
    title: 'Retargeting — 30d View Content',
    big: '4.8x ROAS',
    body: 'Highest-ROAS campaign in the account on $1,240/mo spend — feed it more.',
  },
  {
    tag: '→ Next 48 Hours',
    color: GOLD,
    bg: 'rgba(201,168,76,0.06)',
    border: 'rgba(201,168,76,0.22)',
    title: 'Cut "Prospecting — Broad" by 50% today',
    big: '',
    body: 'Reallocate the freed $4,820/mo to your retargeting campaign and watch ROAS climb over 7 days.',
  },
]

export default function VisionDropLanding() {
  return (
    <main style={{ fontFamily: SANS, color: INK }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fu { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .fu-1 { animation-delay: 0.05s; }
        .fu-2 { animation-delay: 0.18s; }
        .fu-3 { animation-delay: 0.3s; }
        .fu-4 { animation-delay: 0.42s; }
        .fu-5 { animation-delay: 0.55s; }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.18); } 50% { box-shadow: 0 0 30px 4px rgba(201,168,76,0.22); } }
        .cta { animation: glowPulse 3.6s ease-in-out infinite; transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .cta:hover { transform: translateY(-1px); box-shadow: 0 8px 28px -6px rgba(201,168,76,0.5); }
        .cta:active { transform: translateY(0); }
        .blur-mask { filter: blur(7px); user-select: none; pointer-events: none; }
        .scanline { position: absolute; left: 0; right: 0; top: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.45), transparent); animation: scan 4.2s ease-in-out infinite; }
        @keyframes scan { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(380px); opacity: 0; } }
        @media (max-width: 560px) {
          .vd-header { padding: 16px 18px !important; flex-wrap: wrap; gap: 12px; }
          .vd-hero { padding: 56px 20px 44px !important; }
          .vd-sample-sec { padding: 16px 20px 72px !important; }
          .vd-sample-card { padding: 26px 20px !important; }
        }
      `}</style>

      {/* Top bar */}
      <header className="vd-header" style={{ padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${RULE}` }}>
        <a href="https://www.vngrdvisuals.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: INK, letterSpacing: 2 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vanguard Visuals</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2px', textTransform: 'uppercase' }}>Ad Vision Drop</div>
          <a href="/login" style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none' }}>Sign in</a>
          <a href="/signup" style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: '#050509', background: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', padding: '7px 13px', borderRadius: 4 }}>Sign up</a>
        </div>
      </header>

      {/* HERO */}
      <section className="vd-hero" style={{ maxWidth: 880, margin: '0 auto', padding: '88px 32px 64px', textAlign: 'center' }}>
        <div className="fu fu-1" style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 28 }}>
          ◎ Free · No credit card · Read-only access
        </div>

        <h1 className="fu fu-2" style={{ fontFamily: SERIF, fontSize: 'clamp(38px, 6.8vw, 72px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-1px', color: INK, margin: '0 0 24px' }}>
          Find out exactly how much your <span style={{ fontStyle: 'italic', color: GOLD }}>Meta ads</span> are wasting.
          <br />
          <span style={{ fontFamily: MONO, fontSize: 'clamp(14px, 1.8vw, 18px)', fontStyle: 'normal', color: INK2, letterSpacing: '4px', textTransform: 'uppercase', display: 'inline-block', marginTop: 18 }}>
            Free. 60 seconds.
          </span>
        </h1>

        <p className="fu fu-3" style={{ fontSize: 17, color: INK2, lineHeight: 1.75, maxWidth: 640, margin: '0 auto 44px', fontWeight: 300 }}>
          Connect your Meta Ads account. VAI analyzes every campaign. You see exactly where your budget is bleeding — and exactly what to do about it.
        </p>

        <div className="fu fu-4">
          <Link
            href="/audit/connect"
            className="cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#050509',
              background: GOLD,
              padding: '18px 38px',
              borderRadius: 4,
              textDecoration: 'none',
            }}
          >
            Analyze My Ad Account
            <span style={{ fontSize: 14 }}>→</span>
          </Link>
        </div>

        {/* Trust row */}
        <div className="fu fu-5" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 32, marginTop: 48, paddingTop: 28, borderTop: `1px solid ${RULE}` }}>
          {[
            { icon: '◉', text: 'Read-only access' },
            { icon: '◎', text: 'No credit card' },
            { icon: '◧', text: 'Results in 60 seconds' },
          ].map((t) => (
            <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: GOLD, fontFamily: MONO, fontSize: 12 }}>{t.icon}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: INK2, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SAMPLE OUTPUT */}
      <section className="vd-sample-sec" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 32px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>
            ▼ This is what you'll get in 60 seconds
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 300, color: INK, fontStyle: 'italic' }}>
            A sample Vision Drop
          </div>
        </div>

        <div className="vd-sample-card" style={{ position: 'relative', background: '#0c0b0f', border: `1px solid ${RULE}`, borderRadius: 8, padding: '36px 32px', overflow: 'hidden' }}>
          <div className="scanline" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 26, paddingBottom: 18, borderBottom: `1px solid ${RULE}` }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 5 }}>VAI · Ad Vision Drop</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: INK }}>Your Account Snapshot</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 7, color: INK3, letterSpacing: '1.5px', padding: '5px 10px', border: `1px solid ${RULE}`, borderRadius: 3 }}>
              SAMPLE
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {SAMPLE_FINDINGS.map((f) => (
              <div key={f.tag} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 6, padding: '18px 22px' }}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: f.color, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>{f.tag}</div>
                <div style={{ fontFamily: SERIF, fontSize: 18, color: INK, marginBottom: 6 }}>{f.title}</div>
                {f.big && <div style={{ fontFamily: SERIF, fontSize: 26, color: f.color, marginBottom: 8 }}>{f.big}</div>}
                <div style={{ fontSize: 13, color: INK2, lineHeight: 1.7 }}>{f.body}</div>
              </div>
            ))}
          </div>

          {/* Full analysis preview — no gate. You get the complete write-up on connect. */}
          <div style={{ marginTop: 20, padding: '20px 22px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${RULE}`, borderRadius: 6 }}>
            <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              Full VAI Analysis — in plain English
            </div>
            <div style={{ fontSize: 13, color: INK2, lineHeight: 1.85 }}>
              Your account is leaking in three structural places. The first is your prospecting top-of-funnel where the broad lookalike audience has saturated — frequency is at 3.4 and CTR has dropped 38% over the last 14 days. Reallocate that budget into your retargeting view-content audience which is showing 4.8x ROAS but is currently capped at $1,240/mo, leaving meaningful headroom. The second issue is creative — your top-performing static carousel from 60 days ago is now your bottom performer on CPM, classic creative fatigue. Test 3 new variants based on the customer-quote angle this week.
            </div>
            <div style={{ marginTop: 18, textAlign: 'center', fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase' }}>
              This is a sample. You get your real one in full — free, in 60 seconds.
            </div>
          </div>
        </div>

        {/* Second CTA */}
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <Link
            href="/audit/connect"
            className="cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#050509',
              background: GOLD,
              padding: '18px 38px',
              borderRadius: 4,
              textDecoration: 'none',
            }}
          >
            Get My Own Vision Drop
            <span style={{ fontSize: 14 }}>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 32px', borderTop: `1px solid ${RULE}`, textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Vanguard Visuals · VAI Intelligence · vngrdvisuals.com
        </div>
      </footer>
    </main>
  )
}
