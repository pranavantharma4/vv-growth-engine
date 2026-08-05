'use client'
export const dynamic = "force-dynamic"
import { useRouter } from 'next/navigation'
import { useApp } from './context'
import { useDashboardData } from './queries'
import { DashboardSkeleton } from './Skeletons'

type Campaign = {
  id: string
  campaign_name: string
  platform: string
  health: string
  spend: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  snapshot_date: string
}

type WeeklyBrief = {
  id: string
  biggest_leak_campaign: string
  biggest_leak_amount: number
  biggest_leak_platform: string
  total_spend: number
  total_wasted: number
  blended_roas: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { client } = useApp()

  // Cached via React Query (see queries.ts) — revisiting the dashboard tab now
  // reads from cache instantly and revalidates in the background instead of
  // re-hitting Supabase and flashing a spinner every time.
  const { data, isPending } = useDashboardData(client?.id)
  const campaigns = (data?.campaigns || []) as Campaign[]
  const brief = (data?.brief || null) as WeeklyBrief | null

  const totalSpend       = campaigns.reduce((s, c) => s + Number(c.spend), 0)
  const totalRevenue     = campaigns.reduce((s, c) => s + Number(c.revenue), 0)
  const totalConversions = campaigns.reduce((s, c) => s + Number(c.conversions), 0)
  const blendedRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const wastedSpend      = campaigns
    .filter(c => c.health === 'dead' || c.health === 'bleeding')
    .reduce((s, c) => s + Number(c.spend), 0)

  const biggestLeak = [...campaigns]
    .filter(c => c.health === 'bleeding' || c.health === 'dead')
    .sort((a, b) => Number(b.spend) - Number(a.spend))[0] || null

  const platforms = ['meta', 'google', 'tiktok']
  const platStats = platforms.map(p => {
    const cs      = campaigns.filter(c => c.platform === p)
    const spend   = cs.reduce((s, c) => s + Number(c.spend), 0)
    const revenue = cs.reduce((s, c) => s + Number(c.revenue), 0)
    const roas    = spend > 0 ? revenue / spend : 0
    const hasProblems = cs.some(c => c.health === 'dead' || c.health === 'bleeding')
    return { platform: p, spend, roas, hasProblems, count: cs.length }
  }).filter(p => p.count > 0)

  const healthColor  = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')
  const healthBg     = (h: string) => ({ strong: 'rgba(74,222,128,0.08)', weak: 'rgba(251,191,36,0.08)', bleeding: 'rgba(251,146,60,0.08)', dead: 'rgba(248,113,113,0.08)' }[h] || 'transparent')
  const healthBorder = (h: string) => ({ strong: 'rgba(74,222,128,0.2)', weak: 'rgba(251,191,36,0.2)', bleeding: 'rgba(251,146,60,0.2)', dead: 'rgba(248,113,113,0.2)' }[h] || 'var(--rule)')

  const platColor: Record<string, string> = { meta: '#1877f2', google: '#ea4335', tiktok: '#00f2ea' }
  const platLabel: Record<string, string> = { meta: 'Meta', google: 'Google', tiktok: 'TikTok' }

  const fmt     = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`
  const fmtRoas = (r: number) => `${Number(r).toFixed(1)}x`

  // Skeleton renders immediately on first load (no 400ms blank gap); a cached
  // revisit skips it entirely because data is already present.
  if (isPending) return <DashboardSkeleton />

  if (campaigns.length === 0) return (
    <div style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, color: 'var(--ink)', marginBottom: 12 }}>
        No campaign data yet
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.85, marginBottom: 28 }}>
        Add your first campaign to start seeing health classification, AI diagnostics, and your Monday brief.
      </div>
      <button
        onClick={() => router.push('/dashboard/add-campaign')}
        style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '12px 26px', borderRadius: 4, cursor: 'pointer' }}
      >
        Add Your First Campaign →
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        body.minimal .dash-leak-banner { opacity:0;max-height:0;overflow:hidden;margin-bottom:0!important;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1),margin 0.4s ease; }
        .dash-leak-banner { opacity:1;max-height:120px;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1),margin 0.4s ease; }
        body.minimal .dash-plat-health { opacity:0;max-height:0;overflow:hidden;margin-bottom:0!important;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1),margin 0.4s ease; }
        .dash-plat-health { opacity:1;max-height:600px;margin-bottom:16px;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1),margin 0.4s ease; }
        body.minimal .dash-bottom { opacity:0;max-height:0;overflow:hidden;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
        .dash-bottom { opacity:1;max-height:400px;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .stat-sub { opacity:0;max-height:0;overflow:hidden;transition:opacity 0.3s ease,max-height 0.4s ease; }
        .stat-sub { opacity:1;max-height:30px;transition:opacity 0.3s ease,max-height 0.4s ease; }
        body.minimal .stat-val { font-size:28px!important;transition:font-size 0.35s ease!important; }
        .stat-val { transition:font-size 0.35s ease; }
      `}</style>

      {/* BIGGEST LEAK BANNER */}
      {biggestLeak && (
        <div className="dash-leak-banner" style={{ border: '1px solid rgba(251,146,60,0.22)', borderLeft: '3px solid rgba(251,146,60,0.7)', borderRadius: '0 6px 6px 0', background: 'rgba(251,146,60,0.05)', padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(251,146,60,0.7)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>
              ⚠ Biggest Leak Identified
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>
              {biggestLeak.campaign_name} — {fmt(Number(biggestLeak.spend))}/mo at {fmtRoas(Number(biggestLeak.roas))} ROAS
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(251,146,60,0.65)', letterSpacing: '0.5px' }}>
              → Reduce budget 50% and refresh creative within 48 hours. Est. {fmt(Number(biggestLeak.spend) * 0.5)} recovered this month.
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/analysis')}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'rgba(251,146,60,0.85)', border: 'none', padding: '8px 16px', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Get AI Diagnosis →
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="vv-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Spend',  value: fmt(totalSpend),                  sub: `${platStats.length} platform${platStats.length !== 1 ? 's' : ''} active`, accent: undefined },
          { label: 'Conversions', value: totalConversions.toLocaleString(), sub: 'Last 30 days', accent: undefined },
          { label: 'Blended ROAS', value: fmtRoas(blendedRoas),            sub: 'All campaigns', accent: blendedRoas >= 3 ? '#4ade80' : blendedRoas >= 1.5 ? '#fbbf24' : '#f87171' },
          { label: 'Wasted Spend', value: fmt(wastedSpend),                sub: 'Recoverable now', accent: wastedSpend > 0 ? '#f87171' : '#4ade80' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '20px 22px', transition: 'background 0.35s ease, border-color 0.35s ease' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>
              {card.label}
            </div>
            <div className="stat-val" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 300, color: card.accent || 'var(--ink)', lineHeight: 1, marginBottom: 6 }}>
              {card.value}
            </div>
            <div className="stat-sub" style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* PLATFORM + CAMPAIGN HEALTH */}
      <div className="dash-plat-health vv-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Platform performance */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Platform Performance</div>
          </div>
          {platStats.length === 0 ? (
            <div style={{ padding: '24px 18px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>No platform data available</div>
          ) : platStats.map((p, i) => {
            const pct = totalSpend > 0 ? (p.spend / totalSpend) * 100 : 0
            return (
              <div key={p.platform} style={{ padding: '14px 18px', borderBottom: i < platStats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 700, color: '#050509', background: platColor[p.platform], padding: '2px 7px', borderRadius: 2, letterSpacing: '1px' }}>
                    {platLabel[p.platform].toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '1.5px', color: p.hasProblems ? '#fbbf24' : '#4ade80', background: p.hasProblems ? 'rgba(251,191,36,0.08)' : 'rgba(74,222,128,0.08)', border: `1px solid ${p.hasProblems ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.2)'}`, padding: '2px 7px', borderRadius: 2 }}>
                      {p.hasProblems ? 'WATCH' : 'HEALTHY'}
                    </span>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: p.roas >= 3 ? '#4ade80' : p.roas >= 1.5 ? '#fbbf24' : '#f87171' }}>
                      {fmtRoas(p.roas)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)' }}>{fmt(p.spend)}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{pct.toFixed(0)}% of total</span>
                </div>
                <div style={{ height: 2, background: 'var(--rule)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: platColor[p.platform], borderRadius: 1, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Campaign health */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Campaign Health</div>
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}
            >
              View All →
            </button>
          </div>
          <div style={{ maxHeight: 310, overflowY: 'auto' }}>
            {campaigns.slice(0, 8).map((c, i) => (
              <div key={`${c.campaign_name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < Math.min(campaigns.length, 8) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'var(--ink)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.campaign_name}
                  </div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', background: platColor[c.platform] || '#444', padding: '1px 5px', borderRadius: 2, letterSpacing: '0.5px', marginTop: 3, display: 'inline-block' }}>
                    {platLabel[c.platform] || c.platform}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(c.spend))}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(c.health), background: healthBg(c.health), border: `1px solid ${healthBorder(c.health)}`, padding: '2px 6px', borderRadius: 2 }}>
                    {c.health}
                  </span>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: healthColor(c.health), minWidth: 32, textAlign: 'right' }}>
                    {fmtRoas(Number(c.roas))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INTELLIGENCE STRIP */}
      <div className="dash-bottom vv-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Health breakdown */}
        <div data-tour="states" style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Health Breakdown</div>
          {[
            { label: 'STRONG',   h: 'strong' },
            { label: 'WEAK',     h: 'weak' },
            { label: 'BLEEDING', h: 'bleeding' },
            { label: 'DEAD',     h: 'dead' },
          ].map(item => {
            const count = campaigns.filter(c => c.health === item.h).length
            const pct   = campaigns.length > 0 ? (count / campaigns.length) * 100 : 0
            return (
              <div key={item.h} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: healthColor(item.h), flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink2)', letterSpacing: '1px' }}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 2, background: 'var(--rule)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: healthColor(item.h), borderRadius: 1 }} />
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: healthColor(item.h), minWidth: 16, textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Latest brief */}
        <div data-tour="leak" style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Latest Brief</div>
          {brief ? (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(251,146,60,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Biggest Leak</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--ink)', marginBottom: 4, lineHeight: 1.4 }}>{brief.biggest_leak_campaign}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: '#f87171', marginBottom: 12 }}>
                {fmt(Number(brief.biggest_leak_amount))}
                <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: "'DM Mono',monospace" }}>/mo wasted</span>
              </div>
              <button
                onClick={() => router.push('/dashboard/brief')}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '7px 14px', borderRadius: 3, cursor: 'pointer' }}
              >
                Read Full Brief →
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.5 }}>No brief generated yet</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px', lineHeight: 1.7 }}>
                Your first Monday morning brief is scheduled. We'll surface your biggest budget leak in plain English.
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'AI Campaign Diagnosis', icon: '◉', path: '/dashboard/analysis',     accent: 'var(--gold)' },
              { label: 'Add Campaign Data',     icon: '+', path: '/dashboard/add-campaign', accent: 'var(--gold)' },
              { label: 'View All Campaigns',    icon: '◫', path: '/dashboard/campaigns',    accent: 'var(--ink3)' },
              { label: 'Ads Optimization',      icon: '◑', path: '/dashboard/optimize',     accent: 'var(--ink3)' },
              { label: 'Weekly Brief',          icon: '◧', path: '/dashboard/brief',        accent: 'var(--ink3)' },
            ].map(action => (
              <button
                key={action.path}
                onClick={() => router.push(action.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--rule)', border: '1px solid var(--rule)', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--rule2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--rule)' }}
              >
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: action.accent, flexShrink: 0 }}>{action.icon}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'var(--ink2)' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}