'use client'
import { useState } from 'react'
import { classifyCampaign, fatigueForecast } from '../../lib/vai-rules'

// Full Meta-Ads-Manager-replacement detail for a single campaign snapshot row,
// plus VAI's intelligence layer (classification + fatigue forecast). Everything
// a client would open Facebook for, presented in the VV design system.

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"

const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' } as any)[h] || 'var(--ink3)'

function arr(v: any): any[] {
  if (!v) return []
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
  return Array.isArray(v) ? v : []
}
const fmtMoney = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n).toLocaleString()}`)
const numOr = (v: any, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d }

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '12px 14px' }}>
      <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, lineHeight: 1, color: accent || 'var(--ink)' }}>{value}</div>
    </div>
  )
}

// Clean inline SVG line chart for the 14-day trend (ROAS or cost-per-result).
function TrendChart({ points, metric }: { points: { x: string; y: number }[]; metric: 'roas' | 'cpr' }) {
  const W = 640, H = 150, padL = 8, padR = 8, padT = 14, padB = 18
  const valid = points.filter((p) => Number.isFinite(p.y))
  if (valid.length < 2) return <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', padding: '24px 0' }}>Not enough trend data to chart.</div>
  const ys = valid.map((p) => p.y)
  const min = Math.min(...ys), max = Math.max(...ys)
  const span = max - min || 1
  const innerW = W - padL - padR, innerH = H - padT - padB
  const xAt = (i: number) => padL + (i / (valid.length - 1)) * innerW
  const yAt = (v: number) => padT + (1 - (v - min) / span) * innerH
  const line = valid.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(' ')
  const area = `${line} L${xAt(valid.length - 1).toFixed(1)},${(H - padB).toFixed(1)} L${xAt(0).toFixed(1)},${(H - padB).toFixed(1)} Z`
  const fmtY = (v: number) => (metric === 'roas' ? `${v.toFixed(1)}x` : `$${Math.round(v)}`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 150, display: 'block' }}>
      <defs>
        <linearGradient id="vvArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#vvArea)" />
      <path d={line} fill="none" stroke="#c9a84c" strokeWidth="1.5" />
      {valid.map((p, i) => <circle key={i} cx={xAt(i)} cy={yAt(p.y)} r="1.8" fill="#c9a84c" />)}
      <text x={padL} y={10} fill="rgba(245,243,239,0.4)" fontSize="8" fontFamily="DM Mono">{fmtY(max)}</text>
      <text x={padL} y={H - 4} fill="rgba(245,243,239,0.4)" fontSize="8" fontFamily="DM Mono">{fmtY(min)}</text>
      <text x={W - padR} y={H - 4} fill="rgba(245,243,239,0.4)" fontSize="8" fontFamily="DM Mono" textAnchor="end">{valid[valid.length - 1].x?.slice(5)}</text>
    </svg>
  )
}

function Breakdown({ title, rows }: { title: string; rows: any[] }) {
  const items = (rows || []).filter((r) => numOr(r.spend) > 0).slice(0, 8)
  if (!items.length) return null
  const maxRoas = Math.max(...items.map((r) => numOr(r.roas)), 0.01)
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((r, i) => {
          const roas = numOr(r.roas)
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 70px 1fr 54px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.segment}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--ink3)' }}>{fmtMoney(numOr(r.spend))}</span>
              <div style={{ height: 3, background: 'var(--rule)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (roas / maxRoas) * 100)}%`, background: roas >= 2.5 ? '#4ade80' : roas >= 1.5 ? '#fbbf24' : '#f87171', borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: SERIF, fontSize: 14, color: roas >= 2.5 ? '#4ade80' : roas >= 1.5 ? '#fbbf24' : '#f87171', textAlign: 'right' }}>{roas.toFixed(2)}x</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CampaignDetail({ c }: { c: any }) {
  const [metric, setMetric] = useState<'roas' | 'cpr'>('roas')
  const trend = arr(c.daily_trend)
  const demo = arr(c.demographic_breakdown)
  const place = arr(c.placement_breakdown)

  const cls = classifyCampaign({
    spend: numOr(c.spend), conversions: numOr(c.conversions), roas: numOr(c.roas),
    impressions: numOr(c.impressions), clicks: numOr(c.clicks),
    ctr: c.ctr != null ? numOr(c.ctr) : undefined, cpm: c.cpm != null ? numOr(c.cpm) : undefined,
    frequency: c.frequency != null ? numOr(c.frequency) : undefined,
    cost_per_result: c.cost_per_result ?? c.cpa, daily_trend: trend,
  })
  const fc = fatigueForecast(trend, { frequency: c.frequency != null ? numOr(c.frequency) : null, ctr: c.ctr != null ? numOr(c.ctr) : null })

  const ctr = c.ctr != null ? numOr(c.ctr) : (numOr(c.impressions) > 0 ? (numOr(c.clicks) / numOr(c.impressions)) * 100 : 0)
  const cpr = c.cost_per_result ?? c.cpa ?? (numOr(c.conversions) > 0 ? numOr(c.spend) / numOr(c.conversions) : null)

  const chartPoints = trend.map((p: any) => ({
    x: String(p.date || ''),
    y: metric === 'roas' ? numOr(p.roas) : (numOr(p.conversions) > 0 ? numOr(p.spend) / numOr(p.conversions) : NaN),
  }))

  return (
    <div style={{ padding: '20px 22px', background: 'var(--bg2)', borderTop: '1px solid var(--rule)' }}>
      {/* Core stats */}
      <div className="vv-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
        <Stat label="Spend" value={fmtMoney(numOr(c.spend))} />
        <Stat label="Revenue" value={fmtMoney(numOr(c.revenue))} />
        <Stat label="ROAS" value={`${numOr(c.roas).toFixed(2)}x`} accent={healthColor(c.health)} />
        <Stat label="Conversions" value={numOr(c.conversions).toLocaleString()} />
        <Stat label="Cost / Result" value={cpr != null ? `$${numOr(cpr).toFixed(2)}` : '—'} />
        <Stat label="Impressions" value={numOr(c.impressions).toLocaleString()} />
        <Stat label="Reach" value={c.reach != null ? numOr(c.reach).toLocaleString() : '—'} />
        <Stat label="Frequency" value={c.frequency != null ? `${numOr(c.frequency).toFixed(2)}x` : '—'} accent={numOr(c.frequency) > 3.5 ? '#fb923c' : undefined} />
        <Stat label="CPM" value={c.cpm != null ? `$${numOr(c.cpm).toFixed(2)}` : '—'} />
        <Stat label="CPC / CTR" value={`${c.cpc != null ? '$' + numOr(c.cpc).toFixed(2) : '—'} · ${ctr.toFixed(2)}%`} />
      </div>

      {/* Campaign config */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          ['Objective', c.objective || '—'],
          ['Bid Strategy', c.bid_strategy || '—'],
          ['Daily Budget', c.daily_budget != null ? `$${numOr(c.daily_budget).toFixed(0)}/day` : '—'],
        ].map(([l, v]) => (
          <div key={l as string} style={{ background: 'var(--rule)', border: '1px solid var(--rule2)', borderRadius: 4, padding: '7px 12px' }}>
            <span style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginRight: 8 }}>{l}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--ink2)' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* VAI intelligence layer */}
      <div style={{ background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 6, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>VAI Intelligence</div>
        <div style={{ fontFamily: SERIF, fontSize: 15, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 6 }}>
          {cls.primaryReason.charAt(0).toUpperCase() + cls.primaryReason.slice(1)}.
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.6 }}>{fc.text}</div>
      </div>

      {/* Trend chart */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>14-Day Trend</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['roas', 'cpr'] as const).map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 3, cursor: 'pointer',
                  border: `1px solid ${metric === m ? 'var(--goldborder)' : 'var(--rule)'}`, background: metric === m ? 'var(--goldpaper)' : 'transparent', color: metric === m ? 'var(--gold)' : 'var(--ink3)' }}>
                {m === 'roas' ? 'ROAS' : 'Cost / Result'}
              </button>
            ))}
          </div>
        </div>
        <TrendChart points={chartPoints} metric={metric} />
      </div>

      {/* Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="cd-breakdowns vv-grid-2">
        <Breakdown title="Demographics (age / gender · ROAS)" rows={demo} />
        <Breakdown title="Placements (platform / position · ROAS)" rows={place} />
      </div>
      <style>{`@media (max-width:760px){ .cd-breakdowns{ grid-template-columns:1fr !important; gap:18px !important; } }`}</style>
    </div>
  )
}

