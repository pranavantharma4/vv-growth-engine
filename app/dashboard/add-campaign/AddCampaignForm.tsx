'use client'
import { useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Props = {
  clientId: string
  onSuccess?: (campaignId: string) => void
  onCancel?: () => void
  embedded?: boolean
}

// Mirrors classifyHealth() in supabase/functions/sync-meta-campaigns/index.ts.
function classifyHealth(roas: number, spend: number, conversions: number): string {
  if (spend === 0) return 'weak'
  if (roas >= 3 && conversions > 0) return 'strong'
  if (roas >= 1.5) return 'weak'
  if (roas > 0 && roas < 1.5 && spend > 50) return 'bleeding'
  if (conversions === 0 && spend > 100) return 'dead'
  return 'weak'
}

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"

export default function AddCampaignForm({ clientId, onSuccess, onCancel, embedded }: Props) {
  const supabase = createClientComponentClient()

  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<'meta' | 'google' | 'tiktok' | 'other'>('meta')
  const [spend, setSpend] = useState('')
  const [revenue, setRevenue] = useState('')
  const [conversions, setConversions] = useState('')
  const [impressions, setImpressions] = useState('')
  const [clicks, setClicks] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const spendNum = Number(spend) || 0
  const revenueNum = Number(revenue) || 0
  const conversionsNum = Number(conversions) || 0
  const roas = useMemo(() => (spendNum > 0 ? revenueNum / spendNum : 0), [spendNum, revenueNum])
  const health = useMemo(() => classifyHealth(roas, spendNum, conversionsNum), [roas, spendNum, conversionsNum])

  const healthColor = (h: string) =>
    ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' } as Record<string, string>)[h] || 'var(--ink3)'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--rule2)',
    borderRadius: 4,
    fontFamily: SANS,
    fontSize: 13,
    color: 'var(--ink)',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: MONO,
    fontSize: 7,
    color: 'var(--ink3)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: 6,
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Campaign name is required.'); return }
    if (!spend || spendNum <= 0) { setError('Enter a monthly spend greater than 0.'); return }

    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const campaign_id = `manual_${Date.now()}`
    const impressionsNum = Number(impressions) || Math.floor(spendNum * 150)
    const clicksNum = Number(clicks) || Math.floor(spendNum * 12)

    const { error: insertErr } = await supabase.from('campaign_snapshots').insert({
      client_id: clientId,
      platform,
      campaign_id,
      campaign_name: name.trim(),
      spend: spendNum,
      revenue: revenueNum,
      roas: Math.round(roas * 100) / 100,
      conversions: conversionsNum,
      impressions: impressionsNum,
      clicks: clicksNum,
      health,
      snapshot_date: today,
      synced_at: new Date().toISOString(),
    })

    setSaving(false)
    if (insertErr) { setError(insertErr.message); return }

    setName(''); setSpend(''); setRevenue(''); setConversions(''); setImpressions(''); setClicks('')
    onSuccess?.(campaign_id)
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: embedded ? 'transparent' : 'var(--bg2)',
        border: embedded ? 'none' : '1px solid var(--rule)',
        borderRadius: 6,
        padding: embedded ? 0 : '22px 24px',
      }}
    >
      {!embedded && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>
            Add Campaign
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 300, color: 'var(--ink)' }}>
            Enter your campaign numbers
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Campaign Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Summer Sale — Lookalike 1%"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Platform</label>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value as any)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="meta">Meta (Facebook + Instagram)</option>
            <option value="google">Google Ads</option>
            <option value="tiktok">TikTok</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Monthly Spend ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            style={inputStyle}
            value={spend}
            onChange={e => setSpend(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Monthly Revenue ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            style={inputStyle}
            value={revenue}
            onChange={e => setRevenue(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label style={labelStyle}>Conversions / Purchases</label>
          <input
            type="number"
            step="1"
            min="0"
            style={inputStyle}
            value={conversions}
            onChange={e => setConversions(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <details style={{ marginBottom: 16 }}>
        <summary style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', padding: '4px 0' }}>
          Optional — Impressions &amp; Clicks
        </summary>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          <div>
            <label style={labelStyle}>Impressions</label>
            <input
              type="number"
              step="1"
              min="0"
              style={inputStyle}
              value={impressions}
              onChange={e => setImpressions(e.target.value)}
              placeholder="(auto-estimated if blank)"
            />
          </div>
          <div>
            <label style={labelStyle}>Clicks</label>
            <input
              type="number"
              step="1"
              min="0"
              style={inputStyle}
              value={clicks}
              onChange={e => setClicks(e.target.value)}
              placeholder="(auto-estimated if blank)"
            />
          </div>
        </div>
      </details>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--rule2)', borderRadius: 4 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>ROAS</div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: healthColor(health) }}>{roas.toFixed(2)}x</div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Health</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: healthColor(health), letterSpacing: '2px', textTransform: 'uppercase', paddingTop: 4 }}>
            {health}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, fontFamily: MONO, fontSize: 9, color: '#f87171', letterSpacing: '0.5px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '12px 26px', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Campaign →'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', background: 'transparent', border: '1px solid var(--rule2)', padding: '11px 20px', borderRadius: 4, cursor: 'pointer', letterSpacing: '1px' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
