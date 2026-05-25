'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'
import { carryForwardManualCampaigns } from '@/lib/manual-campaigns'
import AddCampaignForm from './AddCampaignForm'
import { fmtMoney } from '@/lib/types'

type Row = {
  id: string
  campaign_id: string
  campaign_name: string
  platform: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  health: string
  snapshot_date: string
}

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"

const healthColor = (h: string) =>
  ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' } as Record<string, string>)[h] || 'var(--ink3)'
const healthBg = (h: string) =>
  ({ strong: 'rgba(74,222,128,0.08)', weak: 'rgba(251,191,36,0.08)', bleeding: 'rgba(251,146,60,0.08)', dead: 'rgba(248,113,113,0.08)' } as Record<string, string>)[h] || 'transparent'
const platColor: Record<string, string> = { meta: '#1877f2', google: '#ea4335', tiktok: '#00f2ea', other: '#888' }
const platLabel: Record<string, string> = { meta: 'Meta', google: 'Google', tiktok: 'TikTok', other: 'Other' }

export default function AddCampaignPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { client, toast } = useApp()

  const [campaigns, setCampaigns] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { if (client) load() }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    await carryForwardManualCampaigns(supabase, client.id)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('campaign_snapshots')
      .select('id, campaign_id, campaign_name, platform, spend, revenue, roas, conversions, impressions, clicks, health, snapshot_date')
      .eq('client_id', client.id)
      .eq('snapshot_date', today)
      .like('campaign_id', 'manual_%')
      .order('spend', { ascending: false })
    setCampaigns((data as Row[]) || [])
    setLoading(false)
    setShowForm((data?.length || 0) === 0)
  }

  async function deleteCampaign(row: Row) {
    if (!client) return
    if (!confirm(`Delete "${row.campaign_name}"? This removes all historical snapshots for this campaign.`)) return
    await supabase
      .from('campaign_snapshots')
      .delete()
      .eq('client_id', client.id)
      .eq('campaign_id', row.campaign_id)
    toast('Campaign removed', `${row.campaign_name} deleted.`)
    load()
  }

  function onAdded() {
    toast('Campaign added', 'It will appear on your dashboard right away.')
    setShowForm(false)
    load()
  }

  const fmt = (n: number) => (Number(n) >= 1000 ? `$${(Number(n) / 1000).toFixed(1)}k` : `$${Number(n).toLocaleString()}`)

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Campaign Data
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 6 }}>
          Add &amp; manage your campaigns
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px', lineHeight: 1.7 }}>
          Enter your campaign numbers here. Updates appear on your dashboard immediately and feed every VAI analysis &amp; weekly brief.
        </div>
      </div>

      {showForm && client && (
        <div style={{ marginBottom: 24 }}>
          <AddCampaignForm
            clientId={client.id}
            onSuccess={onAdded}
            onCancel={campaigns.length > 0 ? () => setShowForm(false) : undefined}
          />
        </div>
      )}

      {!showForm && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Your Campaigns ({campaigns.length})
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '9px 18px', borderRadius: 4, cursor: 'pointer' }}
          >
            + Add Campaign
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Loading...</div>
      ) : campaigns.length === 0 && !showForm ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6 }}>
          <div style={{ fontFamily: SERIF, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>No campaigns yet</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)' }}>Click + Add Campaign above to enter your first one.</div>
        </div>
      ) : campaigns.length > 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 100px 80px 90px 90px 40px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid var(--rule2)' }}>
            {['Campaign', 'Platform', 'Spend/mo', 'ROAS', 'Conversions', 'Health', ''].map(h => (
              <div key={h} style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 12px' }}>
                {h}
              </div>
            ))}
          </div>
          {campaigns.map((c, i) => (
            <div
              key={c.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 90px 100px 80px 90px 90px 40px', alignItems: 'center', borderBottom: i < campaigns.length - 1 ? '1px solid var(--rule)' : 'none' }}
            >
              <div style={{ padding: '12px 12px', fontFamily: SANS, fontSize: 12, color: 'var(--ink)' }}>{c.campaign_name}</div>
              <div style={{ padding: '12px 12px' }}>
                <span style={{ fontFamily: MONO, fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[c.platform] || '#444', padding: '2px 6px', borderRadius: 2, letterSpacing: '1px' }}>
                  {(platLabel[c.platform] || c.platform).toUpperCase()}
                </span>
              </div>
              <div style={{ padding: '12px 12px', fontFamily: MONO, fontSize: 10, color: 'var(--ink2)' }}>{fmt(c.spend)}</div>
              <div style={{ padding: '12px 12px', fontFamily: SERIF, fontSize: 15, color: healthColor(c.health) }}>{Number(c.roas).toFixed(2)}x</div>
              <div style={{ padding: '12px 12px', fontFamily: MONO, fontSize: 10, color: 'var(--ink2)' }}>{c.conversions}</div>
              <div style={{ padding: '12px 12px' }}>
                <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(c.health), background: healthBg(c.health), border: `1px solid ${healthColor(c.health)}33`, padding: '2px 6px', borderRadius: 2 }}>
                  {c.health}
                </span>
              </div>
              <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                <button
                  onClick={() => deleteCampaign(c)}
                  title="Delete campaign"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 12, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px' }}>
            <span>Total spend: {fmtMoney(campaigns.reduce((s, c) => s + Number(c.spend), 0))}</span>
            <span>{campaigns.length} campaign{campaigns.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 22, padding: '18px 20px', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>
            Skip the manual entry
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: 'var(--ink)', marginBottom: 4, fontWeight: 500 }}>
            Connect your Meta Ads account directly
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', letterSpacing: '0.5px', lineHeight: 1.7 }}>
            One-click read-only OAuth pulls every Facebook &amp; Instagram campaign automatically and keeps numbers fresh.
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/connect')}
          style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#fff', background: '#1877f2', border: 'none', padding: '11px 22px', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Connect Meta Ads →
        </button>
      </div>
    </div>
  )
}
