'use client'
export const dynamic = "force-dynamic"
import { useApp } from '../context'
import { useLatestBrief } from '../queries'
import { PanelSkeleton } from '../Skeletons'

type Brief = {
  id: string
  week_start: string
  biggest_leak_campaign: string
  biggest_leak_amount: number
  biggest_leak_platform: string
  total_spend: number
  total_wasted: number
  blended_roas: number
  strong_count: number
  weak_count: number
  bleeding_count: number
  dead_count: number
  summary: string
  created_at: string
}

export default function BriefPage() {
  const { client } = useApp()
  const { data: brief, isPending } = useLatestBrief(client?.id) as { data: Brief | null | undefined; isPending: boolean }

  const fmt     = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toLocaleString()}`
  const fmtRoas = (r: number) => `${Number(r).toFixed(1)}x`
  const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')

  if (isPending) return <PanelSkeleton />

  if (!brief) return (
    <div style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, color: 'var(--ink)', marginBottom: 12 }}>No brief yet</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.85 }}>
        Your first Monday morning brief will be delivered automatically. We'll surface your biggest budget leak and tell you exactly what to do.
      </div>
    </div>
  )

  const date = brief.week_start
    ? new Date(brief.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date(brief.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <style>{`
        body.minimal .brief-meta { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        .brief-meta { opacity: 1; max-height: 120px; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .brief-summary { opacity: 0; max-height: 0; overflow: hidden; margin-top: 0 !important; transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; }
        .brief-summary { opacity: 1; max-height: 800px; transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; }
        body.minimal .brief-health { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.35s ease, max-height 0.45s ease; }
        .brief-health { opacity: 1; max-height: 80px; transition: opacity 0.35s ease, max-height 0.45s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Intelligence</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Weekly Brief</div>
        <div className="brief-meta" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Week of {date}</div>
      </div>

      {/* Biggest leak — always visible, most important */}
      <div style={{ border: '1px solid rgba(251,146,60,0.22)', borderLeft: '3px solid rgba(251,146,60,0.6)', borderRadius: '0 6px 6px 0', background: 'rgba(251,146,60,0.04)', padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(251,146,60,0.7)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>⚠ Biggest Leak This Week</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>{brief.biggest_leak_campaign}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, color: '#f87171', marginBottom: 4 }}>
          {fmt(Number(brief.biggest_leak_amount))}
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--ink3)', marginLeft: 8 }}>wasted this month</span>
        </div>
      </div>

      {/* Stats */}
      <div className="vv-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Spend',  value: fmt(Number(brief.total_spend)),   accent: undefined },
          { label: 'Wasted Spend', value: fmt(Number(brief.total_wasted)),  accent: '#f87171' },
          { label: 'Blended ROAS', value: fmtRoas(Number(brief.blended_roas)), accent: Number(brief.blended_roas) >= 3 ? '#4ade80' : Number(brief.blended_roas) >= 1.5 ? '#fbbf24' : '#f87171' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '16px 18px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 300, color: s.accent || 'var(--ink)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Health breakdown */}
      <div className="brief-health" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'STRONG',   count: brief.strong_count   || 0, h: 'strong' },
          { label: 'WEAK',     count: brief.weak_count     || 0, h: 'weak' },
          { label: 'BLEEDING', count: brief.bleeding_count || 0, h: 'bleeding' },
          { label: 'DEAD',     count: brief.dead_count     || 0, h: 'dead' },
        ].map(item => (
          <div key={item.h} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: healthColor(item.h) }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px' }}>{item.label}</span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: healthColor(item.h) }}>{item.count}</span>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {brief.summary && (
        <div className="brief-summary" style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '22px 24px', marginTop: 4 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>AI Intelligence Summary</div>
          <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{brief.summary}</div>
        </div>
      )}
    </div>
  )
}