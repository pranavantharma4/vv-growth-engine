'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { classifyCampaign } from '../../../lib/vai-rules'
import { useApp } from '../context'
import { businessContextFromRow, computeBreakEvenRoas, hasBusinessContext } from '../../../lib/business-context'

const HEALTH_COLOR: Record<string, string> = {
  strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171',
}
const HEALTH_LABEL: Record<string, string> = {
  strong: 'STRONG', weak: 'WEAK', bleeding: 'BLEEDING', dead: 'DEAD',
}

function num(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Estimated monthly recoverable waste for bleeding/dead campaigns.
function wastedEstimate(spend: number, roas: number, health: string): number {
  if (health === 'dead') return Math.round(spend)
  if (health === 'bleeding') {
    const mult = roas < 0.5 ? 0.9 : roas < 1 ? 0.6 : 0.35
    return Math.round(spend * mult)
  }
  return 0
}

function vaiInsight(health: string, roas: number, spend: number, wasted: number): string {
  const r = roas.toFixed(2)
  if (health === 'strong')
    return `This is a scaling candidate. At ${r}x ROAS, consider increasing budget ~20% while monitoring frequency — VAI would model the safe scaling ceiling so you grow without tipping into fatigue.`
  if (health === 'weak')
    return `Profitable but soft at ${r}x — under the 2.5x bar. Tighten the audience or refresh creative; VAI would pinpoint which lever moves it first.`
  if (health === 'bleeding')
    return `Losing money after margin at ${r}x. Restructure or cut within 48 hours — roughly $${wasted.toLocaleString()}/mo is recoverable here.`
  return `Near-zero return on $${spend.toLocaleString()}/mo. Pause now and reallocate to a STRONG campaign — VAI would tell you exactly where.`
}

function FragRow({ sc, current }: { sc: { m: number; spend: number; revenue: number; profit: number }; current: boolean }) {
  const cell: React.CSSProperties = {
    background: current ? 'var(--goldpaper,rgba(201,168,76,.08))' : 'var(--bg2)',
    padding: '9px 12px', fontFamily: "'DM Mono',monospace", fontSize: 11,
  }
  const pct = sc.m === 1 ? 'now' : `${sc.m > 1 ? '+' : '−'}${Math.round(Math.abs(sc.m - 1) * 100)}%`
  return (
    <>
      <div style={{ ...cell, color: 'var(--ink)' }}>${sc.spend.toLocaleString()} <span style={{ color: 'var(--ink3)', fontSize: 8 }}>{pct}</span></div>
      <div style={{ ...cell, color: 'var(--ink2)' }}>${sc.revenue.toLocaleString()}</div>
      <div style={{ ...cell, color: sc.profit >= 0 ? '#4ade80' : '#f87171' }}>{sc.profit < 0 ? '−' : ''}${Math.abs(sc.profit).toLocaleString()}</div>
    </>
  )
}

export default function CalculatorPage() {
  const { client } = useApp()
  const ctx = businessContextFromRow(client)
  const hasCtx = hasBusinessContext(ctx)
  // Real break-even ROAS from the brand's margin (or explicit override); falls
  // back to a generic 2.5x bar only when no economics are on file.
  const breakEven = computeBreakEvenRoas(ctx) ?? 2.5
  const marginFrac = ctx.grossMargin != null && ctx.grossMargin > 0 ? ctx.grossMargin / 100 : null

  const [spend, setSpend] = useState('3200')
  const [revenue, setRevenue] = useState('5760')
  const [conversions, setConversions] = useState('48')
  const [impressions, setImpressions] = useState('')
  const [clicks, setClicks] = useState('')
  const [frequency, setFrequency] = useState('')

  const s = num(spend), rev = num(revenue), conv = num(conversions)
  const impr = num(impressions), clk = num(clicks), freq = num(frequency)

  const roas = s > 0 ? rev / s : 0
  const cpa = conv > 0 ? s / conv : 0
  const ctr = impr > 0 ? (clk / impr) * 100 : 0

  const hasInput = s > 0 || rev > 0 || conv > 0

  const cls = classifyCampaign({
    spend: s, roas,
    // blank conversions = unknown (not a hard zero) so high-ROAS campaigns
    // aren't mislabelled DEAD/WEAK before a value is typed.
    conversions: conversions.trim() === '' ? undefined : conv,
    impressions: impr || undefined,
    clicks: clk || undefined,
    ctr: impr > 0 ? ctr : undefined,
    frequency: freq || undefined,
  })
  const health = cls.health
  const color = HEALTH_COLOR[health]
  const wasted = wastedEstimate(s, roas, health)
  const insight = vaiInsight(health, roas, s, wasted)

  // ── Business-aware economics ──
  // True profit uses the brand's real gross margin (gross profit = revenue ×
  // margin − spend). Without a margin on file we fall back to revenue − spend.
  const profitOf = (revenue: number, sp: number) => (marginFrac != null ? revenue * marginFrac : revenue) - sp
  const profit = profitOf(rev, s)
  const aboveBreakEven = roas >= breakEven
  // Revenue this spend would need to break even (cover cost of goods).
  const revAtBreakEven = s * breakEven
  const gapToBreakEven = Math.max(0, Math.round(revAtBreakEven - rev))

  // ── What-if (media-buyer view): break-even gap / scaling + spend scenarios ──
  const scenarios = [0.75, 1, 1.25, 1.5].map((m) => {
    const sp = s * m
    const revenue = sp * roas
    return { m, spend: Math.round(sp), revenue: Math.round(revenue), profit: Math.round(profitOf(revenue, sp)) }
  })

  const field = (label: string, val: string, set: (v: string) => void, ph: string, opt = false) => (
    <div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>
        {label}{opt && <span style={{ color: 'var(--ink4,rgba(255,255,255,.2))' }}> · optional</span>}
      </div>
      <input value={val} onChange={e => set(e.target.value)} placeholder={ph} inputMode="decimal"
        style={{ width: '100%', padding: '11px 13px', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }} />
    </div>
  )

  const stat = (label: string, value: string, accent?: string) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 400, lineHeight: 1, color: accent || 'var(--ink)' }}>{value}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Powered by VAI</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Performance Calculator</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>
          Enter any campaign&rsquo;s numbers — VAI classifies it live and judges profit against your {hasCtx ? `${breakEven.toFixed(2)}x break-even` : 'break-even'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,360px) 1fr', gap: 20, alignItems: 'start' }} className="calc-grid">
        {/* Inputs */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 10, padding: '22px 22px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--rule)' }}>Campaign Inputs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {field('Monthly Spend ($)', spend, setSpend, '3200')}
            {field('Monthly Revenue ($)', revenue, setRevenue, '5760')}
            {field('Conversions', conversions, setConversions, '48')}
            {field('Impressions', impressions, setImpressions, '210000', true)}
            {field('Clicks', clicks, setClicks, '1700', true)}
            {field('Frequency', frequency, setFrequency, '2.8', true)}
          </div>
        </div>

        {/* Live results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Derived stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {stat('ROAS', `${roas.toFixed(2)}x`, roas >= breakEven ? '#4ade80' : roas >= breakEven * 0.85 ? '#fbbf24' : '#f87171')}
            {stat('CPA', conv > 0 ? `$${cpa.toFixed(2)}` : '—')}
            {stat('CTR', impr > 0 ? `${ctr.toFixed(2)}%` : '—')}
          </div>

          {/* Classification */}
          <div style={{ background: 'var(--bg2)', border: `1px solid ${hasInput ? color + '55' : 'var(--rule)'}`, borderLeft: `3px solid ${hasInput ? color : 'var(--rule2)'}`, borderRadius: 8, padding: '20px 22px', transition: 'border-color .2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, letterSpacing: '2px', color }}>{HEALTH_LABEL[health]}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px', textTransform: 'uppercase' }}>VAI Classification</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 400, lineHeight: 1.5, color: 'var(--ink)' }}>
              {hasInput ? cls.primaryReason.charAt(0).toUpperCase() + cls.primaryReason.slice(1) + '.' : 'Enter your numbers to see the classification.'}
            </div>
            {cls.reasons.length > 1 && hasInput && (
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink2)', marginTop: 8, lineHeight: 1.6 }}>
                Also flagged: {cls.reasons.slice(1).join('; ')}.
              </div>
            )}
          </div>

          {/* Business-aware profitability verdict */}
          {hasInput && (
            <div style={{ background: 'var(--bg2)', border: `1px solid ${aboveBreakEven ? 'rgba(74,222,128,.3)' : 'rgba(248,113,113,.3)'}`, borderLeft: `3px solid ${aboveBreakEven ? '#4ade80' : '#f87171'}`, borderRadius: 8, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {hasCtx ? 'Profitability vs. Your Break-Even' : 'Profitability (generic break-even)'}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink2)', letterSpacing: '0.5px' }}>
                  Break-even {breakEven.toFixed(2)}x
                  {hasCtx && ctx.grossMargin != null && (ctx.breakEvenRoas == null || !(ctx.breakEvenRoas > 0)) ? ` · ${Math.round(ctx.grossMargin)}% margin` : ''}
                </div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 400, lineHeight: 1.5, color: 'var(--ink)' }}>
                {aboveBreakEven ? (
                  <>At {roas.toFixed(2)}x you&rsquo;re <span style={{ color: '#4ade80' }}>profitable</span> — above your {breakEven.toFixed(2)}x break-even.{' '}
                  {marginFrac != null
                    ? `Each $1 of revenue returns $${marginFrac.toFixed(2)} of gross profit, so this campaign nets about ${profit < 0 ? '−' : ''}$${Math.abs(Math.round(profit)).toLocaleString()}/mo after cost of goods.`
                    : ''}</>
                ) : (
                  <>At {roas.toFixed(2)}x you&rsquo;re <span style={{ color: '#f87171' }}>below break-even</span> ({breakEven.toFixed(2)}x) — losing money after cost of goods.{' '}
                  {marginFrac != null
                    ? `Because only $${marginFrac.toFixed(2)} of each revenue dollar is gross profit, you need ${breakEven.toFixed(2)}x just to cover COGS — this campaign nets about ${profit < 0 ? '−' : ''}$${Math.abs(Math.round(profit)).toLocaleString()}/mo.`
                    : `ROAS must clear ${breakEven.toFixed(2)}x to cover cost of goods.`}</>
                )}
              </div>
              {!hasCtx && (
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink3)', marginTop: 8, lineHeight: 1.6 }}>
                  Add your gross margin in Settings → Business Profile and this verdict becomes exact: a 50% margin sets break-even at 2.0x, a 70% margin at ~1.43x.
                </div>
              )}
            </div>
          )}

          {/* Wasted spend */}
          {hasInput && wasted > 0 && (
            <div style={{ background: 'var(--redpaper,rgba(248,113,113,.08))', border: '1px solid var(--redborder,rgba(248,113,113,.25))', borderRadius: 8, padding: '18px 22px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#f87171', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Estimated Recoverable / Month</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, color: '#f87171', lineHeight: 1 }}>${wasted.toLocaleString()}</div>
            </div>
          )}

          {/* VAI insight */}
          {hasInput && (
            <div style={{ background: 'var(--goldpaper,rgba(201,168,76,.08))', border: '1px solid var(--goldborder,rgba(201,168,76,.22))', borderRadius: 8, padding: '18px 22px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>VAI Insight</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, lineHeight: 1.6, color: 'var(--ink)' }}>{insight}</div>
            </div>
          )}

          {/* What-if — media buyer view */}
          {hasInput && s > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '18px 22px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>What-if · Media Buyer View</div>

              {/* Current profit + gap to STRONG / scaling */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Net Profit / Month</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 300, color: profit >= 0 ? '#4ade80' : '#f87171', lineHeight: 1 }}>
                    {profit < 0 ? '−' : ''}${Math.abs(profit).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>
                    {aboveBreakEven ? 'Scale +20% Profit' : `Gap to Break-Even (${breakEven.toFixed(2)}x)`}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 300, color: 'var(--gold)', lineHeight: 1 }}>
                    {aboveBreakEven
                      ? `+$${Math.abs(Math.round(profitOf(s * 1.2 * roas, s * 1.2) - profit)).toLocaleString()}`
                      : `+$${gapToBreakEven.toLocaleString()}`}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6, marginBottom: 16 }}>
                {aboveBreakEven
                  ? `You clear your ${breakEven.toFixed(2)}x break-even, so added budget compounds profit, not loss. Adding 20% ($${Math.round(s * 0.2).toLocaleString()}/mo) at ${roas.toFixed(2)}x adds about $${Math.round(s * 0.2 * roas).toLocaleString()} in revenue${marginFrac != null ? ` (~$${Math.round(s * 0.2 * roas * marginFrac).toLocaleString()} gross profit)` : ''} — provided frequency stays under 2.5.`
                  : `At $${Math.round(s).toLocaleString()}/mo spend, you need $${Math.round(revAtBreakEven).toLocaleString()} in revenue just to break even at ${breakEven.toFixed(2)}x — that's $${gapToBreakEven.toLocaleString()} more than today. Every dollar of spend below break-even loses ${marginFrac != null ? `$${(1 - roas * marginFrac).toFixed(2)}` : 'money'} after cost of goods.`}
              </div>

              {/* Spend scenarios (ROAS held constant) */}
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>If you scale spend (at today&rsquo;s {roas.toFixed(2)}x)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--rule)', border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
                {['Spend', 'Revenue', 'Profit'].map((h) => (
                  <div key={h} style={{ background: 'var(--bg2)', padding: '7px 12px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</div>
                ))}
                {scenarios.map((sc) => (
                  <FragRow key={sc.m} sc={sc} current={sc.m === 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width:760px){ .calc-grid{ grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  )
}
