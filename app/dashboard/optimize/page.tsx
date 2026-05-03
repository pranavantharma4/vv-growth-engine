'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

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
}

type Blueprint = {
  id: string
  campaign_name: string
  platform: string
  health: string
  spend: number
  roas: number
  blueprint: string
  created_at: string
}

export default function OptimizePage() {
  const supabase = createClientComponentClient()
  const { client, toast } = useApp()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [generating, setGenerating] = useState(false)
  const [blueprint, setBlueprint] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  useEffect(() => { if (client) load() }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [{ data: camps }, { data: bps }] = await Promise.all([
      supabase.from('campaign_snapshots').select('*')
        .eq('client_id', client.id).eq('snapshot_date', today)
        .order('spend', { ascending: false }),
      supabase.from('optimization_blueprints').select('*')
        .eq('client_id', client.id).order('created_at', { ascending: false }).limit(20),
    ])
    setCampaigns(camps || [])
    setBlueprints(bps || [])
    setLoading(false)
  }

  async function generate() {
    if (!selected || !client) return
    setGenerating(true)
    setBlueprint(null)
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: selected, client_id: client.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      setBlueprint(data.blueprint)
      await supabase.from('optimization_blueprints').insert({
        client_id: client.id,
        campaign_id: selected.id,
        campaign_name: selected.campaign_name,
        platform: selected.platform,
        health: selected.health,
        spend: selected.spend,
        roas: selected.roas,
        blueprint: data.blueprint,
      })
      load()
      toast('Blueprint ready', `Optimization plan generated for ${selected.campaign_name}`)
    } catch (e: any) { toast('Error', e.message) }
    finally { setGenerating(false) }
  }

  const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')
  const healthBg    = (h: string) => ({ strong: 'rgba(74,222,128,0.08)', weak: 'rgba(251,191,36,0.08)', bleeding: 'rgba(251,146,60,0.08)', dead: 'rgba(248,113,113,0.08)' }[h] || 'transparent')
  const platColor: Record<string, string> = { meta: '#1877f2', google: '#ea4335', tiktok: '#00f2ea' }
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`

  function renderBlueprint(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return (
        <div key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, color: 'var(--ink)', marginTop: i === 0 ? 0 : 22, marginBottom: 10, paddingTop: i === 0 ? 0 : 18, borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}>
          {line.replace('## ', '')}
        </div>
      )
      if (line.match(/^\d+\./)) return (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', flexShrink: 0, marginTop: 3 }}>{line.match(/^\d+/)?.[0]}.</span>
          <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8 }}>{line.replace(/^\d+\./, '').trim()}</span>
        </div>
      )
      if (line.startsWith('- ')) return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <span style={{ color: 'var(--ink3)', flexShrink: 0, marginTop: 4, fontSize: 8 }}>—</span>
          <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8 }}>{line.replace('- ', '')}</span>
        </div>
      )
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />
      return <p key={i} style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 6 }}>{line}</p>
    })
  }

  async function exportPDF(text: string, name: string) {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, margin = 20
      let y = 24
      doc.setFillColor(5, 5, 9)
      doc.rect(0, 0, W, 297, 'F')
      doc.setTextColor(245, 243, 239)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'italic')
      doc.text('VV', margin, y)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 160, 120)
      doc.text('OPTIMIZATION BLUEPRINT', margin + 12, y - 4)
      doc.text(name, margin + 12, y + 2)
      y += 16
      doc.setDrawColor(50, 48, 45)
      doc.line(margin, y, W - margin, y)
      y += 10
      doc.setTextColor(200, 195, 190)
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(text, W - margin * 2)
      doc.text(lines, margin, y)
      doc.save(`VV-Blueprint-${name.replace(/\s+/g, '-')}.pdf`)
      toast('Exported', 'Blueprint PDF downloaded.')
    } catch (e: any) { toast('Error', e.message) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading campaigns...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        body.minimal .optimize-desc { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        .optimize-desc { opacity: 1; max-height: 60px; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .optimize-history-tab { opacity: 0; max-width: 0; overflow: hidden; transition: opacity 0.3s ease, max-width 0.4s ease; }
        .optimize-history-tab { opacity: 1; max-width: 300px; transition: opacity 0.3s ease, max-width 0.4s ease; }
        body.minimal .optimize-campaign-meta { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.3s ease, max-height 0.4s ease; }
        .optimize-campaign-meta { opacity: 1; max-height: 40px; transition: opacity 0.3s ease, max-height 0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Intelligence</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Ads Optimization</div>
        <div className="optimize-desc" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>
          Select a campaign to generate a Claude AI optimization blueprint — exact actions, budget changes, and 30-day projections
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--rule)' }}>
        <button onClick={() => setActiveTab('generate')}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: activeTab === 'generate' ? 'var(--gold)' : 'var(--ink3)', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === 'generate' ? 'var(--gold)' : 'transparent'}`, padding: '10px 20px', cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s ease' }}>
          Generate Blueprint
        </button>
        <button onClick={() => setActiveTab('history')}
          className="optimize-history-tab"
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: activeTab === 'history' ? 'var(--gold)' : 'var(--ink3)', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === 'history' ? 'var(--gold)' : 'transparent'}`, padding: '10px 20px', cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s ease' }}>
          History ({blueprints.length})
        </button>
      </div>

      {/* Generate tab */}
      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>

          {/* Campaign list */}
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>Select Campaign</div>
            {campaigns.length === 0 ? (
              <div style={{ padding: '24px', background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>No campaigns today</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>Connect Meta Ads or add campaigns manually</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {campaigns.map(c => (
                  <div key={c.id} onClick={() => { setSelected(c); setBlueprint(null) }}
                    style={{ padding: '12px 14px', background: selected?.id === c.id ? 'var(--goldpaper)' : 'var(--bg2)', border: `1px solid ${selected?.id === c.id ? 'var(--goldborder)' : 'var(--rule)'}`, borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'var(--ink)', fontWeight: selected?.id === c.id ? 500 : 400, flex: 1, marginRight: 8, lineHeight: 1.35 }}>
                        {c.campaign_name}
                      </div>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(c.health), background: healthBg(c.health), border: `1px solid ${healthColor(c.health)}33`, padding: '2px 6px', borderRadius: 2, flexShrink: 0 }}>
                        {c.health}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[c.platform] || '#444', padding: '1px 5px', borderRadius: 2 }}>
                        {c.platform.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(c.spend))}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: healthColor(c.health) }}>{Number(c.roas).toFixed(1)}x</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blueprint output */}
          <div>
            {!selected ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>Select a campaign</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Choose any campaign to generate a blueprint</div>
                </div>
              </div>
            ) : (
              <div>
                {/* Selected campaign header */}
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '16px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{selected.campaign_name}</div>
                      <div className="optimize-campaign-meta" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[selected.platform] || '#444', padding: '2px 6px', borderRadius: 2 }}>{selected.platform.toUpperCase()}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(selected.spend))}/mo</span>
                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: healthColor(selected.health) }}>{Number(selected.roas).toFixed(2)}x ROAS</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(selected.health), background: healthBg(selected.health), border: `1px solid ${healthColor(selected.health)}33`, padding: '2px 6px', borderRadius: 2 }}>{selected.health}</span>
                      </div>
                    </div>
                    <button onClick={generate} disabled={generating}
                      style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: generating ? 'rgba(201,168,76,0.5)' : 'var(--gold)', border: 'none', padding: '11px 22px', borderRadius: 4, cursor: generating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                      {generating ? 'Generating...' : blueprint ? 'Regenerate →' : 'Generate Blueprint →'}
                    </button>
                  </div>
                </div>

                {/* Generating state */}
                {generating && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '52px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Claude is analyzing...</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--ink2)', marginBottom: 8 }}>Building your optimization blueprint</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', lineHeight: 1.8 }}>Reviewing spend · ROAS · CTR · CPA · competitive signals</div>
                  </div>
                )}

                {/* Blueprint */}
                {blueprint && !generating && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                      <div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Optimization Blueprint</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px' }}>
                          Generated by Claude · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <button onClick={() => exportPDF(blueprint, selected.campaign_name)}
                        style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '7px 14px', borderRadius: 3, cursor: 'pointer' }}>
                        ↓ Export PDF
                      </button>
                    </div>
                    <div>{renderBlueprint(blueprint)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div>
          {blueprints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: 'var(--ink)', marginBottom: 10 }}>No blueprints yet</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Generate your first blueprint from the Generate tab</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blueprints.map(bp => {
                const isOpen = selected?.id === bp.id
                return (
                  <div key={bp.id} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
                    <div onClick={() => setSelected(isOpen ? null : (bp as any))}
                      style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>{bp.campaign_name}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[bp.platform] || '#444', padding: '1px 5px', borderRadius: 2 }}>{bp.platform.toUpperCase()}</span>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(bp.spend))}</span>
                          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: healthColor(bp.health) }}>{Number(bp.roas).toFixed(1)}x</span>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(bp.health), background: healthBg(bp.health), border: `1px solid ${healthColor(bp.health)}33`, padding: '2px 5px', borderRadius: 2 }}>{bp.health}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>
                          {new Date(bp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <button onClick={e => { e.stopPropagation(); exportPDF(bp.blueprint, bp.campaign_name) }}
                          style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '5px 10px', borderRadius: 3, cursor: 'pointer' }}>
                          ↓ PDF
                        </button>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--ink3)', display: 'inline-block', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--rule)' }}>
                        <div style={{ marginTop: 16 }}>{renderBlueprint(bp.blueprint)}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}