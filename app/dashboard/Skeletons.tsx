'use client'
// On-brand loading skeletons. Unlike PageLoader (which waits 400ms then shows a
// pulsing VV mark), these render IMMEDIATELY on first load so a tab never shows
// a blank/frozen frame — the layout of the real content is telegraphed with
// charcoal shimmer blocks using the existing --bg2/--rule tokens. Revisited
// tabs read from the React Query cache and skip skeletons entirely.

const shimmerCss = `
  @keyframes vvShimmer { 0% { background-position: -420px 0 } 100% { background-position: 420px 0 } }
  .vv-sk {
    background: linear-gradient(90deg, var(--rule) 25%, var(--rule2) 37%, var(--rule) 63%);
    background-size: 840px 100%;
    animation: vvShimmer 1.4s ease-in-out infinite;
    border-radius: 4px;
  }
`

function Bar({ w = '100%', h = 14, style = {} }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return <div className="vv-sk" style={{ width: w, height: h, ...style }} />
}

function Card({ children, style = {} }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '20px 22px', ...style }}>
      {children}
    </div>
  )
}

// Dashboard home: stat-card row + two panels + intelligence strip.
export function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{shimmerCss}</style>
      <div className="vv-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[0, 1, 2, 3].map(i => (
          <Card key={i}>
            <Bar w={70} h={8} style={{ marginBottom: 14 }} />
            <Bar w={90} h={30} style={{ marginBottom: 10 }} />
            <Bar w={60} h={8} />
          </Card>
        ))}
      </div>
      <div className="vv-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[0, 1].map(i => (
          <Card key={i} style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)' }}><Bar w={120} h={8} /></div>
            {[0, 1, 2].map(j => (
              <div key={j} style={{ padding: '16px 18px', borderBottom: j < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <Bar w="60%" h={12} style={{ marginBottom: 10 }} />
                <Bar w="100%" h={4} />
              </div>
            ))}
          </Card>
        ))}
      </div>
      <div className="vv-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <Card key={i}>
            <Bar w={90} h={8} style={{ marginBottom: 16 }} />
            {[0, 1, 2, 3].map(j => <Bar key={j} w="100%" h={10} style={{ marginBottom: 10 }} />)}
          </Card>
        ))}
      </div>
    </div>
  )
}

// Generic table skeleton — campaigns / reports style rows.
export function TableSkeleton({ rows = 6, maxWidth = 1100 }: { rows?: number; maxWidth?: number }) {
  return (
    <div style={{ maxWidth, margin: '0 auto' }}>
      <style>{shimmerCss}</style>
      <div style={{ marginBottom: 20 }}>
        <Bar w={60} h={8} style={{ marginBottom: 8 }} />
        <Bar w={180} h={24} style={{ marginBottom: 6 }} />
        <Bar w={320} h={9} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[0, 1, 2, 3, 4].map(i => <Bar key={i} w={64} h={22} />)}
      </div>
      <div style={{ border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ background: 'var(--bg2)', padding: '14px 18px', borderBottom: '1px solid var(--rule)' }}>
          <Bar w={140} h={8} />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ padding: '14px 18px', borderBottom: i < rows - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Bar w="40%" h={12} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Bar w={50} h={12} /><Bar w={50} h={12} /><Bar w={44} h={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Single-column content skeleton — brief / settings style.
export function PanelSkeleton({ maxWidth = 820 }: { maxWidth?: number }) {
  return (
    <div style={{ maxWidth, margin: '0 auto' }}>
      <style>{shimmerCss}</style>
      <div style={{ marginBottom: 20 }}>
        <Bar w={60} h={8} style={{ marginBottom: 8 }} />
        <Bar w={220} h={26} />
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Bar w="30%" h={8} style={{ marginBottom: 14 }} />
        <Bar w="80%" h={16} style={{ marginBottom: 12 }} />
        <Bar w="100%" h={10} style={{ marginBottom: 8 }} />
        <Bar w="90%" h={10} style={{ marginBottom: 8 }} />
        <Bar w="60%" h={10} />
      </Card>
      <Card>
        <Bar w="30%" h={8} style={{ marginBottom: 14 }} />
        <Bar w="100%" h={10} style={{ marginBottom: 8 }} />
        <Bar w="70%" h={10} />
      </Card>
    </div>
  )
}
