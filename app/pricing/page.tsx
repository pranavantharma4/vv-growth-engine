/* Public pricing — one plan, one price. The Founders seats make the price mean
   something. CTAs route to signup (paid) and the free audit (top of funnel). */

const gold = '#c9a84c'
const ink  = 'rgba(250,248,245,0.92)'
const ink2 = 'rgba(250,248,245,0.55)'
const ink3 = 'rgba(250,248,245,0.28)'
const rule = 'rgba(250,248,245,0.08)'
const mono  = "'DM Mono',monospace"
const serif = "'Cormorant Garamond',serif"
const sans  = "'DM Sans',sans-serif"

const INCLUDED = [
  'Every campaign classified — Strong / Weak / Bleeding / Dead',
  'Plain-English diagnosis + the one fix to make first',
  'Recurring re-analysis on your schedule',
  'Change tracking — see what flipped since last run',
  'Emailed reports to you and anyone you choose',
  'Connect multiple Meta ad accounts, read-only',
]

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050509', color: ink, fontFamily: sans, padding: '96px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: gold, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 18 }}>Pricing</div>
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 46, lineHeight: 1.1, margin: '0 0 14px' }}>
          One plan. Everything.
        </h1>
        <p style={{ fontFamily: sans, fontSize: 15, color: ink2, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 48px' }}>
          Connect your Meta account and VV reads every campaign — what makes money, what wastes it, what to fix. Read-only. Cancel anytime.
        </p>

        {/* Plan card */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 12, padding: '40px 44px', textAlign: 'left', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontFamily: serif, fontSize: 26, color: ink }}>VV Growth Ad Engine</div>
          </div>
          <div style={{ marginBottom: 26 }}>
            <span style={{ fontFamily: serif, fontSize: 52, color: gold }}>$149</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: ink3 }}> / month</span>
          </div>

          <div style={{ height: 1, background: rule, marginBottom: 22 }} />

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px' }}>
            {INCLUDED.map((f) => (
              <li key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, fontFamily: sans, fontSize: 14, color: ink2, lineHeight: 1.5 }}>
                <span style={{ color: gold, fontFamily: mono, fontSize: 11, marginTop: 1 }}>—</span>
                {f}
              </li>
            ))}
          </ul>

          <a href="/signup" style={{ display: 'block', textAlign: 'center', fontFamily: mono, fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#050509', background: gold, padding: '15px', borderRadius: 5, textDecoration: 'none' }}>
            Get started — 7 days free →
          </a>
          <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginTop: 12 }}>
            No card required to start.
          </div>
        </div>

        {/* Founders note */}
        <div style={{ marginTop: 40, fontFamily: sans, fontSize: 13, color: ink2, lineHeight: 1.8 }}>
          <span style={{ fontFamily: mono, fontSize: 9, color: gold, letterSpacing: '2px' }}>FOUNDERS PROGRAM · </span>
          Four seats, free for life, for the first brands willing to use it properly.{' '}
          <a href="/audit" style={{ color: gold, textDecoration: 'underline' }}>See your audit</a> to claim one.
        </div>

        <div style={{ marginTop: 44, fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px' }}>
          <a href="/signup" style={{ color: gold, textDecoration: 'underline' }}>Sign up</a>
          {' · '}Already have an account? <a href="/login" style={{ color: ink2, textDecoration: 'underline' }}>Sign in</a>
        </div>
      </div>
    </div>
  )
}
