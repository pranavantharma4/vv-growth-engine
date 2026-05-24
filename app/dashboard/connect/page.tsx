'use client'
export const dynamic = "force-dynamic"
import { useRouter } from 'next/navigation'

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"

export default function ConnectPage() {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
        Coming Soon
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 300, color: 'var(--ink)', marginBottom: 14 }}>
        Direct ad-account integrations
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.85, marginBottom: 28, fontWeight: 300 }}>
        One-click Meta, Google, and TikTok sync is on the V1.2 roadmap. In the meantime, enter your campaign numbers manually — it takes about a minute per campaign and feeds every dashboard view, VAI diagnosis, and weekly brief.
      </div>
      <button
        onClick={() => router.push('/dashboard/add-campaign')}
        style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '12px 26px', borderRadius: 4, cursor: 'pointer' }}
      >
        Add Campaign Data →
      </button>

      <div style={{ marginTop: 36, padding: '16px 18px', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 4, textAlign: 'left' }}>
        <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>
          Why manual entry for now
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', letterSpacing: '0.5px', lineHeight: 1.75 }}>
          We're finalising the Meta &amp; Google partner-app approvals so the integrations launch with the right access scopes and audit trails. Manual entry keeps the platform fully usable while we close that out.
        </div>
      </div>
    </div>
  )
}
