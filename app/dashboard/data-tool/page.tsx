'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { fmtMoney } from '@/lib/types'

export default function DataToolPage() {
  const { isAdmin, clients } = useApp()
  const supabase = createClientComponentClient()
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!selectedClient) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    supabase.from('campaign_snapshots').select('*')
      .eq('client_id', selectedClient.id).eq('snapshot_date', today)
      .order('spend', { ascending: false })
      .then(({ data }) => { setCampaigns(data?.map(c => ({...c, _editing: false})) || []); setLoading(false) })
  }, [selectedClient])

  function updateField(id: string, field: string, value: string) {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      const updated = { ...c, [field]: value }
      // Auto-calculate health from ROAS
      if (field === 'roas') {
        const r = Number(value)
        updated.health = r >= 3 ? 'strong' : r >= 2 ? 'weak' : r >= 0.8 ? 'bleeding' : 'dead'
      }
      return updated
    }))
  }

  async function saveAll() {
    setSaving(true)
    setSaved(false)
    const today = new Date().toISOString().split('T')[0]
    for (const c of campaigns) {
      const spend  = Number(c.spend)
      const roas   = Number(c.roas)
      const revenue = spend * roas
      await supabase.from('campaign_snapshots').update({
        spend, roas, revenue,
        health: c.health,
        conversions: Number(c.conversions) || 0,
        impressions: Number(c.impressions) || Math.floor(spend * 150),
        clicks: Number(c.clicks) || Math.floor(spend * 12),
        snapshot_date: today,
        synced_at: new Date().toISOString()
      }).eq('id', c.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function addCampaign() {
    if (!selectedClient) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('campaign_snapshots').insert({
      client_id: selectedClient.id,
      platform: 'meta',
      campaign_id: `manual_${Date.now()}`,
      campaign_name: 'New Campaign',
      spend: 0, roas: 0, revenue: 0, health: 'weak',
      impressions: 0, clicks: 0, conversions: 0,
      snapshot_date: today
    }).select().single()
    if (data) setCampaigns(prev => [...prev, {...data, _editing: true}])
  }

  async function deleteCampaign(id: string) {
    await supabase.from('campaign_snapshots').delete().eq('id', id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  if (!isAdmin) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', textAlign:'center' }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'var(--bg3)' }}>▲</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, marginTop:12 }}>Admin access required</div>
    </div>
  )

  const healthColor = (h: string) => h==='strong'?'var(--green)':h==='weak'?'var(--gold)':h==='bleeding'?'var(--amber)':'var(--red)'

  return (
    <div>
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)', marginBottom:20, lineHeight:1.7 }}>
        Update campaign data for any client. Changes take effect immediately on their dashboard.
      </p>

      {/* Client selector */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:10 }}>Select Client</div>
        <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
          {clients.map(c => (
            <button key={c.id} onClick={() => { setSelectedClient(c); setSaved(false) }}
              style={{ padding:'8px 16px', borderRadius:5, border:`1px solid ${selectedClient?.id===c.id?'var(--goldborder)':'var(--rule2)'}`, background:selectedClient?.id===c.id?'var(--goldpaper)':'var(--card2)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:9, color:selectedClient?.id===c.id?'var(--gold)':'var(--ink2)', letterSpacing:1 }}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedClient && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16 }}>{selectedClient.name} — Campaigns</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addCampaign}
                style={{ padding:'7px 14px', borderRadius:5, border:'1px solid var(--rule2)', background:'transparent', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', letterSpacing:1 }}>
                + Add Campaign
              </button>
              <button onClick={saveAll} disabled={saving}
                style={{ padding:'7px 16px', borderRadius:5, border:'none', background:saved?'var(--green)':'var(--gold)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'#faf8f5', letterSpacing:1 }}>
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save All Changes'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding:20, fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)' }}>Loading campaigns...</div>
          ) : (
            <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1.8fr 90px 100px 80px 80px 80px 30px', background:'var(--card2)', borderBottom:'2px solid var(--rule2)' }}>
                {['Campaign','Platform','Spend/mo','ROAS','Conversions','Health',''].map(h => (
                  <div key={h} style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:2, textTransform:'uppercase', padding:'8px 10px' }}>{h}</div>
                ))}
              </div>
              {campaigns.length === 0 && (
                <div style={{ padding:'20px', textAlign:'center', fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)' }}>No campaigns today — click + Add Campaign</div>
              )}
              {campaigns.map((c, i) => (
                <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1.8fr 90px 100px 80px 80px 80px 30px', borderBottom:i<campaigns.length-1?'1px solid var(--rule)':'none', alignItems:'center' }}>
                  <div style={{ padding:'8px 10px' }}>
                    <input
                      style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid transparent', color:'var(--ink)', fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:'2px 0', outline:'none' }}
                      value={c.campaign_name}
                      onChange={e => updateField(c.id, 'campaign_name', e.target.value)}
                      onFocus={e => (e.target.style.borderBottom='1px solid var(--rule2)')}
                      onBlur={e => (e.target.style.borderBottom='1px solid transparent')}
                    />
                  </div>
                  <div style={{ padding:'8px 10px' }}>
                    <select value={c.platform} onChange={e => updateField(c.id, 'platform', e.target.value)}
                      style={{ background:'transparent', border:'none', color:'var(--ink2)', fontFamily:"'DM Mono',monospace", fontSize:8, outline:'none', cursor:'pointer', width:'100%' }}>
                      <option value="meta">Meta</option>
                      <option value="google">Google</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
                  {['spend','roas','conversions'].map(field => (
                    <div key={field} style={{ padding:'8px 10px' }}>
                      <input type="number" step={field==='roas'?'0.1':'1'}
                        style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid transparent', color: field==='roas'?healthColor(c.health):'var(--ink2)', fontFamily:"'DM Mono',monospace", fontSize:11, padding:'2px 0', outline:'none' }}
                        value={c[field]}
                        onChange={e => updateField(c.id, field, e.target.value)}
                        onFocus={e => (e.target.style.borderBottom='1px solid var(--rule2)')}
                        onBlur={e => (e.target.style.borderBottom='1px solid transparent')}
                      />
                    </div>
                  ))}
                  <div style={{ padding:'8px 10px' }}>
                    <select value={c.health} onChange={e => updateField(c.id, 'health', e.target.value)}
                      style={{ background:'transparent', border:'none', color:healthColor(c.health), fontFamily:"'DM Mono',monospace", fontSize:8, outline:'none', cursor:'pointer', textTransform:'uppercase', width:'100%' }}>
                      <option value="strong">Strong</option>
                      <option value="weak">Weak</option>
                      <option value="bleeding">Bleeding</option>
                      <option value="dead">Dead</option>
                    </select>
                  </div>
                  <div style={{ padding:'8px 6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <button onClick={() => deleteCampaign(c.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink3)', fontSize:11, padding:2, lineHeight:1 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {campaigns.length > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)' }}>
              <span>Total spend: {fmtMoney(campaigns.reduce((s,c)=>s+Number(c.spend),0))}</span>
              <span>Blended ROAS: {(campaigns.reduce((s,c)=>s+Number(c.roas)*Number(c.spend),0)/Math.max(campaigns.reduce((s,c)=>s+Number(c.spend),0),1)).toFixed(1)}x</span>
              <span>{campaigns.length} campaigns</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
