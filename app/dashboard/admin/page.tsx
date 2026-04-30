'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

type ClientHealth = {
  client_id: string
  client_name: string
  plan: string
  status: string
  contact_email: string | null
  total_campaigns: number
  strong_count: number
  weak_count: number
  bleeding_count: number
  dead_count: number
  total_spend: number
  wasted_spend: number
  avg_roas: number
  last_synced: string | null
}

export default function ClientHealthPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { isAdmin, toast } = useApp()

  const [clients, setClients] = useState<ClientHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAdmin) { router.push('/dashboard'); return }
    load()
  }, [isAdmin])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_health_summary')
      .select('*')
      .order('wasted_spend', { ascending: false })
    if (error) toast('Error', error.message)
    setClients(data || [])
    setLoading(false)
  }

  const filtered = clients.filter(c =>
    (c.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const ink   = 'rgba(250,248,245,0.92)'
  const ink2  = 'rgba(250,248,245,0.58)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const rule  = 'rgba(250,248,245,0.07)'
  const gold  = '#c9a84c'
  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"

  const fmt     = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toLocaleString()}`
  const fmtRoas = (r: number) => `${Number(r).toFixed(1)}x`

  const totalSpend    = clients.reduce((s, c) => s + Number(c.total_spend), 0)
  const totalWasted   = clients.reduce((s, c) => s + Number(c.wasted_spend), 0)
  const totalCampaigns = clients.reduce((s, c) => s + Number(c.total_campaigns), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: '2px', textTransform: 'uppercase' }}>
        Loading client health...
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        input::placeholder { color: rgba(250,248,245,0.18); }
        input:focus { outline: none; border-color: rgba(201,168,76,0.4) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</div>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: ink, marginBottom: 4 }}>Client Health</div>
        <div style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: '1px' }}>
          All accounts at a glance — spend, ROAS, campaign health, wasted budget
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Clients',   value: clients.length.toString(),  accent: undefined },
          { label: 'Total Campaigns', value: totalCampaigns.toString(),  accent: undefined },
          { label: 'Total Spend',     value: fmt(totalSpend),            accent: undefined },
          { label: 'Total Wasted',    value: fmt(totalWasted),           accent: '#f87171' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '18px 20px' }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, color: s.accent || ink }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 320, padding: '9px 13px', background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 4, color: ink, fontFamily: sans, fontSize: 13 }}
        />
      </div>

      {/* Client table */}
      <div style={{ border: `1px solid ${rule}`, borderRadius: 6, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.025)', padding: '11px 18px', borderBottom: `1px solid ${rule}`, display: 'grid', gridTemplateColumns: '2fr 80px 90px 90px 80px 60px 60px 70px 70px', gap: 8 }}>
          {['Client', 'Plan', 'Spend', 'Wasted', 'ROAS', '✓', '~', '⚠', '✕'].map(h => (
            <div key={h} style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontFamily: serif, fontSize: 20, color: ink, marginBottom: 8 }}>
              {search ? 'No clients match your search' : 'No clients yet'}
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: '1px' }}>
              {!search && 'Add clients from the Invite Client page'}
            </div>
          </div>
        ) : filtered.map((c, i) => {
          const wastedPct = Number(c.total_spend) > 0
            ? (Number(c.wasted_spend) / Number(c.total_spend) * 100).toFixed(0)
            : '0'
          const avgRoas = Number(c.avg_roas)
          const roasColor = avgRoas >= 3 ? '#4ade80' : avgRoas >= 1.5 ? '#fbbf24' : '#f87171'

          return (
            <div
              key={c.client_id}
              style={{ padding: '13px 18px', borderBottom: i < filtered.length - 1 ? `1px solid rgba(250,248,245,0.04)` : 'none', display: 'grid', gridTemplateColumns: '2fr 80px 90px 90px 80px 60px 60px 70px 70px', gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <div>
                <div style={{ fontFamily: sans, fontSize: 13, color: ink, fontWeight: 500, marginBottom: 2 }}>
                  {c.client_name}
                </div>
                {c.contact_email && (
                  <div style={{ fontFamily: mono, fontSize: 8, color: ink3 }}>{c.contact_email}</div>
                )}
                {c.last_synced && (
                  <div style={{ fontFamily: mono, fontSize: 7, color: ink3, marginTop: 2 }}>
                    Synced {new Date(c.last_synced).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              <div>
                <span style={{ fontFamily: mono, fontSize: 8, color: gold, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', padding: '2px 6px', borderRadius: 2, letterSpacing: '1px', textTransform: 'capitalize' }}>
                  {c.plan}
                </span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 15, color: ink }}>{fmt(Number(c.total_spend))}</div>
              <div>
                <div style={{ fontFamily: serif, fontSize: 15, color: '#f87171' }}>{fmt(Number(c.wasted_spend))}</div>
                <div style={{ fontFamily: mono, fontSize: 7, color: ink3 }}>{wastedPct}% of spend</div>
              </div>
              <div style={{ fontFamily: serif, fontSize: 15, color: roasColor }}>{fmtRoas(avgRoas)}</div>
              <div style={{ fontFamily: serif, fontSize: 16, color: '#4ade80', textAlign: 'center' }}>{c.strong_count}</div>
              <div style={{ fontFamily: serif, fontSize: 16, color: '#fbbf24', textAlign: 'center' }}>{c.weak_count}</div>
              <div style={{ fontFamily: serif, fontSize: 16, color: '#fb923c', textAlign: 'center' }}>{c.bleeding_count}</div>
              <div style={{ fontFamily: serif, fontSize: 16, color: '#f87171', textAlign: 'center' }}>{c.dead_count}</div>
            </div>
          )
        })}
      </div>

      {/* Wasted spend alert */}
      {totalWasted > 0 && clients.length > 0 && (
        <div style={{ marginTop: 14, padding: '14px 18px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderLeft: '3px solid rgba(248,113,113,0.5)', borderRadius: '0 4px 4px 0' }}>
          <div style={{ fontFamily: mono, fontSize: 7, color: 'rgba(248,113,113,0.7)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            Portfolio Alert
          </div>
          <div style={{ fontFamily: serif, fontSize: 16, color: ink }}>
            {fmt(totalWasted)} wasted across {clients.filter(c => Number(c.wasted_spend) > 0).length} client{clients.filter(c => Number(c.wasted_spend) > 0).length !== 1 ? 's' : ''} — {totalSpend > 0 ? ((totalWasted / totalSpend) * 100).toFixed(0) : 0}% of total portfolio spend
          </div>
        </div>
      )}
    </div>
  )
}