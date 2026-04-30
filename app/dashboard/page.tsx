'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from './context'

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
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { client } = useApp()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [brief, setBrief] = useState<WeeklyBrief | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return
    if (client.onboarding_complete === false) {
      router.push('/dashboard/onboarding')
      return
    }
    load()
  }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [{ data: camps }, { data: briefData }] = await Promise.all([
      supabase
        .from('campaign_snapshots')
        .select('*')
        .eq('client_id', client.id)
        .eq('snapshot_date', today)
        .order('spend', { ascending: false }),

      supabase
        .from('weekly_briefs')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    setCampaigns(camps || [])
    setBrief(briefData || null)
    setLoading(false)
  }

  const totalSpend       = campaigns.reduce((s, c) => s + Number(c.spend), 0)
  const totalRevenue     = campaigns.reduce((s, c) => s + Number(c.revenue), 0)
  const totalConversions = campaigns.reduce((s, c) => s + Number(c.conversions), 0)
  const blendedRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0

  const wastedSpend = campaigns
    .filter(c => c.health === 'dead' || c.health === 'bleeding')
    .reduce((s, c) => s + Number(c.spend), 0)

  const biggestLeak = [...campaigns]
    .filter(c => c.health === 'bleeding' || c.health === 'dead')
    .sort((a, b) => Number(b.spend) - Number(a.spend))[0] || null

  const ink   = 'rgba(250,248,245,0.92)'
  const ink2  = 'rgba(250,248,245,0.58)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const rule  = 'rgba(250,248,245,0.07)'
  const gold  = '#c9a84c'
  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"

  const healthColor = (h: string) =>
    ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || ink3)

  const fmt     = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`
  const fmtRoas = (r: number) => `${Number(r).toFixed(1)}x`

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* BIGGEST LEAK BANNER */}
      {biggestLeak && (
        <div className="min-hide" style={{
          border: '1px solid rgba(251,146,60,0.22)',
          borderLeft: '3px solid rgba(251,146,60,0.7)',
          borderRadius: '0 6px 6px 0',
          background: 'rgba(251,146,60,0.05)',
          padding: '16px 20px',
          marginBottom: 24
        }}>
          <div style={{ fontFamily: serif, fontSize: 18, color: ink }}>
            {biggestLeak.campaign_name} — {fmt(biggestLeak.spend)}
          </div>
        </div>
      )}

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Spend', value: fmt(totalSpend), sub: 'Active spend' },
          { label: 'Conversions', value: totalConversions, sub: 'Last 30 days' },
          { label: 'Blended ROAS', value: fmtRoas(blendedRoas), sub: 'All campaigns' },
          { label: 'Wasted Spend', value: fmt(wastedSpend), sub: 'Recoverable now' },
        ].map(card => (
          <div key={card.label} className="stat-card" style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '20px 22px' }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>
              {card.label}
            </div>

            <div className="stat-val" style={{ fontFamily: serif, fontSize: 38, color: ink }}>
              {card.value}
            </div>

            <div className="min-hide" style={{ fontFamily: mono, fontSize: 8, color: ink3 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* INTELLIGENCE STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Health Breakdown */}
        <div className="min-hide" style={{ background: 'var(--bg2)', padding: 20 }}>
          Health Breakdown
        </div>

        {/* Latest Brief */}
        <div style={{ background: 'var(--bg2)', padding: 20 }}>
          Latest Brief
        </div>

        {/* Quick Actions */}
        <div className="min-hide" style={{ background: 'var(--bg2)', padding: 20 }}>
          Quick Actions
        </div>

      </div>

    </div>
  )
}