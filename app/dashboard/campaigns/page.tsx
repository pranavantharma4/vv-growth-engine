'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { Pill, PlatPill, StatCard } from '@/app/dashboard/components'
import { fmtMoney, roasColor } from '@/lib/types'
import type { CampaignSnapshot } from '@/lib/types'

export default function CampaignsPage() {
  const { client } = useApp()
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [camps, setCamps] = useState<CampaignSnapshot[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return
    const today = new Date().toISOString().split('T')[0];
    (async () => {
      const { data } = await supabase
        .from('campaign_snapshots')
        .select('*')
        .eq('client_id', client.id)
        .eq('snapshot_date', today)
        .order('spend', { ascending: false })
      setCamps(data || [])
      setLoading(false)
    })()
  }, [client])

  const platforms = Array.from(new Set(camps.map(c => c.platform)))
  const filtered = filter === 'all' ? camps
    : filter === 'issues' ? camps.filter(c => c.health === 'dead' || c.health === 'bleeding')
    : camps.filter(c => c.platform === filter)

  const strong = camps.filter(c => c.health === 'strong' || c.health === 'weak').length
  const issues = camps.filter(c => c.health === 'dead' || c.health === 'bleeding').length
  const best   = camps.length ? Math.max(...camps.map(c => Number(c.roas))) : 0
  const worst  = camps.length ? Math.min(...camps.map(c => Number(c.roas))) : 0

  const FILTERS = ['all', ...platforms, 'issues']
  const FLBL: Record<string, string> = { all: 'All', meta: 'Meta', google: 'Google', tiktok: 'TikTok', linkedin: 'LinkedIn', issues: 'Issues' }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 20 }}>
        <StatCard label="Healthy"    value={String(strong)} hint="Performing or stable" type="good" />
        <StatCard label="Issues"     value={String(issues)} hint="Require attention"    type="warn" />
        <StatCard label="Best ROAS"  value={best.toFixed(1) + 'x'} hint="Top campaign" type="gold" />
        <StatCard label="Worst ROAS" value={worst.toFixed(1) + 'x'} hint="Needs review" type="warn" />
      </div>

      <div style={{ display: 'flex', gap: 2, border: '1px solid var(--rule2)', borderRadius: 6, padding: 3, background: 'var(--card2)', marginBottom: 14, width: 'fit-content' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '5px 12px', borderRadius: 4, border: 'none', background: filter === f ? 'var(--card)' : 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1, color: filter === f ? 'var(--ink)' : 'var(--ink3)', textTransform: 'uppercase' }}>
            {FLBL[f] || f}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', textAlign: 'center' }}>
            Loading campaigns...
          </div>
        ) : camps.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, color: 'var(--bg3)', marginBottom: 12, lineHeight: 1 }}>◫</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: 'var(--ink2)', marginBottom: 8 }}>No campaigns yet</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1, marginBottom: 16 }}>Connect a Meta Ads account and sync to see your campaigns here</div>
            <button onClick={() => router.push('/dashboard/connect')}
              style={{ padding: '7px 16px', border: 'none', borderRadius: 5, background: 'var(--gold)', color: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1 }}>
              Connect Ad Account →
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>
            No campaigns match this filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Campaign', 'Platform', 'Spend', 'CTR', 'Conv.', 'ROAS', 'Health', 'Analyze', 'Optimize'].map(h => (
                  <th key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: 2, textTransform: 'uppercase', padding: '9px 12px', borderBottom: '1px solid var(--rule2)', textAlign: ['Spend', 'CTR', 'Conv.', 'ROAS'].includes(h) ? 'right' : ['Health', 'Analyze', 'Optimize'].includes(h) ? 'center' : 'left', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--rule)' : 'none' }}>
                  <td style={{ padding: '11px 12px', fontSize: 12, fontWeight: 500 }}>{c.campaign_name}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'center' }}><PlatPill platform={c.platform} /></td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink2)' }}>{fmtMoney(Number(c.spend))}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink2)' }}>{Number(c.ctr || 0).toFixed(2)}%</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink2)' }}>{c.conversions}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: roasColor(Number(c.roas)) }}>{Number(c.roas).toFixed(1)}x</td>
                  <td style={{ padding: '11px 12px', textAlign: 'center' }}><Pill health={c.health} /></td>
                  <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                    <button onClick={() => router.push('/dashboard/analysis?id=' + c.campaign_id)}
                      style={{ padding: '3px 9px', borderRadius: 3, fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', border: '1px solid var(--goldborder)', background: 'var(--goldpaper)', cursor: 'pointer' }}>Analyze</button>
                  </td>
                  <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                    <button onClick={() => router.push('/dashboard/optimize?id=' + c.campaign_id)}
                      style={{ padding: '3px 9px', borderRadius: 3, fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink2)', border: '1px solid var(--rule2)', background: 'var(--card2)', cursor: 'pointer' }}>Optimize</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}