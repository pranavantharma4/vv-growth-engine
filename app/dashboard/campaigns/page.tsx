'use client'
export const dynamic = "force-dynamic"
import { useState } from 'react'
import { useApp } from '../context'
import { useCampaigns } from '../queries'
import { TableSkeleton } from '../Skeletons'
import CampaignDetail from '../CampaignDetail'

type Campaign = {
  id: string
  campaign_name: string
  platform: string
  health: string
  spend: number
  roas: number
  revenue: number
  impressions: number
  clicks: number
  conversions: number
  snapshot_date: string
}

export default function CampaignsPage() {
  const { client } = useApp()
  // Cached via React Query — instant on revisit, shared with the dashboard-home
  // prefetch warmed in the layout.
  const { data, isPending } = useCampaigns(client?.id)
  const campaigns = (data || []) as Campaign[]
  const [filter, setFilter] = useState<string>('all')
  const [platform, setPlatform] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = campaigns.filter(c => {
    const healthMatch = filter === 'all' || c.health === filter
    const platMatch = platform === 'all' || c.platform === platform
    return healthMatch && platMatch
  })

  const totalSpend   = filtered.reduce((s, c) => s + Number(c.spend), 0)
  const totalRevenue = filtered.reduce((s, c) => s + Number(c.revenue), 0)
  const blendedRoas  = totalSpend > 0 ? totalRevenue / totalSpend : 0

  const healthColor  = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')
  const healthBg     = (h: string) => ({ strong: 'rgba(74,222,128,0.08)', weak: 'rgba(251,191,36,0.08)', bleeding: 'rgba(251,146,60,0.08)', dead: 'rgba(248,113,113,0.08)' }[h] || 'transparent')
  const healthBorder = (h: string) => ({ strong: 'rgba(74,222,128,0.2)', weak: 'rgba(251,191,36,0.2)', bleeding: 'rgba(251,146,60,0.2)', dead: 'rgba(248,113,113,0.2)' }[h] || 'var(--rule)')
  const platColor: Record<string, string> = { meta: '#1877f2', google: '#ea4335', tiktok: '#00f2ea' }
  const platLabel: Record<string, string> = { meta: 'Meta', google: 'Google', tiktok: 'TikTok' }
  const fmt     = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toLocaleString()}`
  const fmtRoas = (r: number) => `${Number(r).toFixed(1)}x`

  if (isPending) return <TableSkeleton rows={6} maxWidth={1100} />

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 4px' }}>
      <style>{`
        /* Minimal mode for campaigns page */
        body.minimal .camp-filters { opacity: 0; max-height: 0; overflow: hidden; margin-bottom: 0 !important; transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; }
        .camp-filters { opacity: 1; max-height: 80px; transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; margin-bottom: 16px; }
        body.minimal .camp-extra-cols { opacity: 0; max-width: 0; overflow: hidden; transition: opacity 0.3s ease, max-width 0.4s ease; }
        .camp-extra-cols { opacity: 1; max-width: 200px; transition: opacity 0.3s ease, max-width 0.4s ease; }
        body.minimal .camp-summary { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.3s ease, max-height 0.4s ease; }
        .camp-summary { opacity: 1; max-height: 80px; transition: opacity 0.3s ease, max-height 0.4s ease; }

        /* Mobile: the 7-column table reflows into a stacked card per row.
           The column header row is hidden and each metric cell prints its
           own label via ::before so the numbers stay self-explanatory. */
        @media (max-width: 767px) {
          .camp-head { display: none !important; }
          .camp-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
            align-items: start !important;
            padding: 16px !important;
            min-height: 44px;
          }
          .camp-row > .camp-name {
            grid-column: 1 / -1 !important;
            white-space: normal !important;
            font-size: 14px !important;
          }
          .camp-row > .camp-cell::before {
            content: attr(data-label);
            display: block;
            font-family: 'DM Mono', monospace;
            font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase;
            color: var(--ink3); margin-bottom: 4px;
          }
          /* filter chips: bigger tap targets, keep them on one scroll-free row set */
          .camp-filters button {
            min-height: 44px !important;
            padding: 8px 14px !important;
            font-size: 8px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Overview</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Campaigns</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>All active campaigns · click any row for full Meta-level detail + VAI</div>
      </div>

      {/* Filters */}
      <div className="camp-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Health filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'strong', 'weak', 'bleeding', 'dead'].map(h => (
            <button key={h} onClick={() => setFilter(h)}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 3, border: `1px solid ${filter === h ? (h === 'all' ? 'var(--goldborder)' : healthBorder(h)) : 'var(--rule)'}`, background: filter === h ? (h === 'all' ? 'var(--goldpaper)' : healthBg(h)) : 'transparent', color: filter === h ? (h === 'all' ? 'var(--gold)' : healthColor(h)) : 'var(--ink3)', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              {h}
            </button>
          ))}
        </div>
        {/* Platform filter — Meta only for now. Google/TikTok ad-account
            ingestion is deferred to a later version, so their filter chips are
            omitted to avoid offering a filter that can never return rows. */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {['all', 'meta'].map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 3, border: `1px solid ${platform === p ? 'var(--goldborder)' : 'var(--rule)'}`, background: platform === p ? 'var(--goldpaper)' : 'transparent', color: platform === p ? 'var(--gold)' : 'var(--ink3)', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
        {/* Header */}
        <div className="camp-head" style={{ background: 'var(--bg2)', padding: '11px 18px', borderBottom: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '2.5fr 80px 90px 90px 80px 80px 80px', gap: 8 }}>
          {['Campaign', 'Platform', 'Spend', 'Revenue', 'ROAS', 'Conv.', 'Health'].map(h => (
            <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>No campaigns match</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Try changing the filter above</div>
          </div>
        ) : filtered.map((c, i) => {
          const rid = c.id || String(i)
          const open = expandedId === rid
          return (
          <div key={rid}>
          <div className="camp-row" onClick={() => setExpandedId(open ? null : rid)} style={{ padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'grid', gridTemplateColumns: '2.5fr 80px 90px 90px 80px 80px 80px', gap: 8, alignItems: 'center', transition: 'background 0.1s ease', cursor: 'pointer', background: open ? 'var(--bg2)' : 'transparent' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = open ? 'var(--bg2)' : 'transparent'}
          >
            <div className="camp-name" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.campaign_name}
            </div>
            <div className="camp-cell" data-label="Platform">
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[c.platform] || '#444', padding: '2px 6px', borderRadius: 2 }}>
                {(platLabel[c.platform] || c.platform).toUpperCase()}
              </span>
            </div>
            <div className="camp-cell" data-label="Spend" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--ink)' }}>{fmt(Number(c.spend))}</div>
            <div className="camp-extra-cols camp-cell" data-label="Revenue" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--ink2)' }}>{fmt(Number(c.revenue))}</div>
            <div className="camp-cell" data-label="ROAS" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: Number(c.roas) >= 3 ? '#4ade80' : Number(c.roas) >= 1.5 ? '#fbbf24' : '#f87171' }}>{fmtRoas(Number(c.roas))}</div>
            <div className="camp-extra-cols camp-cell" data-label="Conv." style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--ink2)' }}>{Number(c.conversions).toLocaleString()}</div>
            <div className="camp-cell" data-label="Health">
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(c.health), background: healthBg(c.health), border: `1px solid ${healthBorder(c.health)}`, padding: '2px 6px', borderRadius: 2 }}>
                {c.health}
              </span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', marginLeft: 6 }}>{open ? '▾' : '▸'}</span>
            </div>
          </div>
          {open && <CampaignDetail c={c} />}
          </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="camp-summary" style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Showing', value: `${filtered.length} campaigns` },
          { label: 'Total Spend', value: fmt(totalSpend) },
          { label: 'Total Revenue', value: fmt(totalRevenue) },
          { label: 'Blended ROAS', value: fmtRoas(blendedRoas) },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 4, padding: '9px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: 'var(--ink)' }}>{s.value}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}