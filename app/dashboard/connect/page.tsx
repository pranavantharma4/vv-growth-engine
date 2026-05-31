'use client'
export const dynamic = 'force-dynamic'
import ConnectionsSection from '../ConnectionsSection'

// Connections now live in Settings → Ad Account Connections. This route stays
// as a working deep link (used by the OAuth return flow) and renders the same
// shared component.
export default function ConnectPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Connections</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Ad Account Connections</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Also available under Settings → Ad Account Connections.</div>
      </div>
      <ConnectionsSection />
    </div>
  )
}
