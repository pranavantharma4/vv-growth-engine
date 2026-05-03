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

export default function AnalysisPage() {
  const supabase = createClientComponentClient()
  const { client, toast } = useApp()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => { if (client) load() }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('campaign_snapshots').select('*')
      .eq('client_id', client.id).eq('snapshot_date', today)
      .order('spend', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  async function analyze() {
    if (!selected || !client) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: selected, client_id: client.id, all_campaigns: campaigns }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      setAnalysis(data.analysis)
    } catch (e: any) { toast('Error', e.message) }
    finally { setAnalyzing(false) }
  }

  const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')
  const healthBg    = (h: string) => ({ strong: 'rgba(74,222,128,0.08)', weak: 'rgba(251,191,36,0.08)', bleeding: 'rgba(251,146,60,0.08)', dead: 'rgba(248,113,113,0.08)' }[h] || 'transparent')
  const platColor: Record<string, string> = { meta: '#1877f2', google: '#ea4335', tiktok: '#00f2ea' }
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`

  function renderAnalysis(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <div key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--ink)', marginTop: i === 0 ? 0 : 24, marginBottom: 10, paddingTop: i === 0 ? 0 : 18, borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}>{line.replace('## ', '')}</div>
      if (line.match(/^\d+\./)) return <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', flexShrink: 0, marginTop: 3 }}>{line.match(/^\d+/)?.[0]}.</span><span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8 }}>{line.replace(/^\d+\./, '').trim()}</span></div>
      if (line.startsWith('- ')) return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: 'var(--ink3)', flexShrink: 0, marginTop: 4, fontSize: 8 }}>—</span><span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8 }}>{line.replace('- ', '')}</span></div>
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />
      return <p key={i} style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 6 }}>{line}</p>
    })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading campaigns...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        body.minimal .analysis-desc { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        .analysis-desc { opacity: 1; max-height: 60px; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .analysis-campaign-meta { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.3s ease, max-height 0.4s ease; }
        .analysis-campaign-meta { opacity: 1; max-height: 40px; transition: opacity 0.3s ease, max-height 0.4s ease; }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Intelligence</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>AI Analysis</div>
        <div className="analysis-desc" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>
          Select a campaign — Claude diagnoses exactly what's happening, why, and what to do.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* Campaign list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Select Campaign</div>
          {campaigns.length === 0 ? (
            <div style={{ padding: '24px', background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>No campaigns today</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>Connect Meta Ads or add campaigns manually</div>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setAnalysis(null) }}
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
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[c.platform] || '#444', padding: '1px 5px', borderRadius: 2 }}>{c.platform.toUpperCase()}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(c.spend))}</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: healthColor(c.health) }}>{Number(c.roas).toFixed(1)}x</span>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis output */}
        <div>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>Select a campaign</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Choose any campaign to get a full AI diagnosis</div>
              </div>
            </div>
          ) : (
            <div>
              {/* Campaign header */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{selected.campaign_name}</div>
                    <div className="analysis-campaign-meta" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[selected.platform] || '#444', padding: '2px 6px', borderRadius: 2 }}>{selected.platform.toUpperCase()}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(selected.spend))}/mo</span>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: healthColor(selected.health) }}>{Number(selected.roas).toFixed(2)}x ROAS</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(selected.health), background: healthBg(selected.health), border: `1px solid ${healthColor(selected.health)}33`, padding: '2px 6px', borderRadius: 2 }}>{selected.health}</span>
                    </div>
                  </div>
                  <button onClick={analyze} disabled={analyzing}
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: analyzing ? 'rgba(201,168,76,0.5)' : 'var(--gold)', border: 'none', padding: '11px 22px', borderRadius: 4, cursor: analyzing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze →' : 'Analyze Campaign →'}
                  </button>
                </div>
              </div>

              {analyzing && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '52px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Claude is analyzing...</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--ink2)', marginBottom: 8 }}>Deep-reading your campaign data</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', lineHeight: 1.8 }}>Diagnosing funnel · Comparing to portfolio · Identifying root causes</div>
                </div>
              )}

              {analysis && !analyzing && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '26px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                    <div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>AI Campaign Analysis</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px' }}>
                        Powered by Claude · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Portfolio context included
                      </div>
                    </div>
                  </div>
                  <div>{renderAnalysis(analysis)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}