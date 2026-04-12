'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { Pill, PlatPill } from '@/app/dashboard/components'
import { fmtMoney, roasColor } from '@/lib/types'
import type { CampaignSnapshot } from '@/lib/types'
import { exportAnalysisPDF } from '@/lib/exportPDF'

const FALLBACK: Record<string, string> = {
  dead: 'This campaign is spending at a loss on every dollar — ROAS below break-even indicates a fundamental mismatch between audience, creative, and objective. The longer this runs the more budget is destroyed. Pause immediately and redirect the full spend to your strongest performing campaign while you diagnose the root cause.',
  bleeding: 'Performance is deteriorating and approaching total loss territory. The most common cause at this stage is audience saturation — the same people are seeing this ad repeatedly with diminishing response. Reduce budget by 50% within 48 hours to stem the bleed, then either refresh the creative or expand the audience pool before reassessing in 14 days.',
  strong: 'This campaign is working — the creative-audience match is producing strong returns and the algorithm has found its rhythm. The primary risk now is complacency. Scale budget 20-30% incrementally, monitor CPM closely for signs of audience saturation, and begin testing new creative variants so you have a backup ready when performance eventually softens.',
  weak: 'Performance has settled at a level that is neither growing nor collapsing — a sign of creative fatigue rather than a structural problem. The audience has seen enough of this ad that marginal response has declined. Introduce 2-3 fresh creative variants, tighten the audience targeting, and reassess with 14 days of fresh data before drawing conclusions.',
}

const ACTIONS: Record<string, string> = {
  dead: 'Pause immediately. Redirect 100% of budget to your strongest campaign. This campaign needs a structural rebuild before reactivation.',
  bleeding: 'Reduce budget by 50% within 48 hours. Refresh creative assets or expand audience. Pause entirely if ROAS does not recover within 14 days.',
  strong: 'Scale budget 20-30% this week. Monitor CPM daily for the first 7 days. Prepare new creative variants to deploy when saturation signals appear.',
  weak: 'Introduce new creative variants within 7 days. Tighten audience targeting. Reassess with 14 days of fresh data before making structural changes.',
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div data-metric={label} style={{ background: 'var(--card2)', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: color || 'var(--ink)' }}>{value}</div>
    </div>
  )
}

function AnalysisContent() {
  const { client } = useApp()
  const supabase = createClientComponentClient()
  const params = useSearchParams()
  const preId = params.get('id')

  const [camps, setCamps] = useState<CampaignSnapshot[]>([])
  const [selected, setSelected] = useState<CampaignSnapshot | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [action, setAction] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [isCached, setIsCached] = useState(false)
  const [loading, setLoading] = useState(true)

  const pick = useCallback(async (c: CampaignSnapshot, force = false) => {
    setSelected(c)
    setAnalysis('')
    setAction('')
    setAnalyzing(true)
    setIsCached(false)

    if (!force) {
      const cutoff = new Date(Date.now() - 86400000).toISOString()
      const { data: hit } = await supabase
        .from('ai_analyses')
        .select('analysis, recommended_action')
        .eq('client_id', client!.id)
        .eq('campaign_id', c.campaign_id)
        .gte('analyzed_at', cutoff)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single()

      if (hit) {
        setAnalysis(hit.analysis)
        setAction(hit.recommended_action || ACTIONS[c.health])
        setIsCached(true)
        setAnalyzing(false)
        return
      }
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: c, clientId: client!.id }),
      })
      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      setAnalysis(data.analysis || FALLBACK[c.health])
      setAction(data.recommended_action || ACTIONS[c.health])
    } catch (err) {
      console.error('Analysis fetch error:', err)
      setAnalysis(FALLBACK[c.health])
      setAction(ACTIONS[c.health])
    }
    setAnalyzing(false)
  }, [client, supabase])

  useEffect(() => {
    if (!client) return
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('campaign_snapshots')
      .select('*')
      .eq('client_id', client.id)
      .eq('snapshot_date', today)
      .order('spend', { ascending: false })
      .then(({ data }) => {
        const list = data || []
        setCamps(list)
        setLoading(false)
        if (preId && list.length > 0) {
          const found = list.find((c: CampaignSnapshot) => c.campaign_id === preId)
          if (found) pick(found)
        }
      })
  }, [client])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

      {/* Campaign list */}
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 12 }}>Select Campaign</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          {loading ? (
            <div style={{ padding: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>Loading campaigns...</div>
          ) : camps.length === 0 ? (
            <div style={{ padding: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>No campaigns found. Sync your ad account first.</div>
          ) : camps.map((c, i) => (
            <div
              key={c.id}
              onClick={() => pick(c)}
              style={{
                padding: '11px 14px',
                borderBottom: i < camps.length - 1 ? '1px solid var(--rule)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: selected?.id === c.id ? 'var(--goldpaper)' : 'transparent',
                borderLeft: '2px solid ' + (selected?.id === c.id ? 'var(--gold)' : 'transparent'),
                transition: 'background .1s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3, lineHeight: 1.3 }}>{c.campaign_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <PlatPill platform={c.platform} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmtMoney(Number(c.spend))}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <Pill health={c.health} />
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: roasColor(Number(c.roas)) }}>{Number(c.roas).toFixed(1)}x</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 12px', background: 'var(--card2)', border: '1px solid var(--rule)', borderRadius: 6 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Health Classification</div>
          {[['strong','ROAS >= 3.0x'],['weak','ROAS >= 1.5x'],['bleeding','ROAS >= 0.8x'],['dead','ROAS < 0.8x']].map(([h, desc]) => (
            <div key={h} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <Pill health={h} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis panel */}
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 12 }}>Diagnosis</div>

        {!selected ? (
          <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: 32, minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 56, color: 'var(--bg3)', marginBottom: 12, lineHeight: 1 }}>◉</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: 'var(--ink2)', marginBottom: 6 }}>Select a campaign</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1.5px' }}>Click any campaign on the left to generate a Claude AI diagnosis</div>
          </div>
        ) : (
          <div id="analysis-export">
            {/* Metrics */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{selected.campaign_name}</div>
                  <PlatPill platform={selected.platform} />
                </div>
                <Pill health={selected.health} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                <MetricCard label="Spend"  value={fmtMoney(Number(selected.spend))} />
                <MetricCard label="Impr."  value={(Number(selected.impressions)/1000).toFixed(0)+'k'} />
                <MetricCard label="CTR"    value={Number(selected.ctr||0).toFixed(2)+'%'} />
                <MetricCard label="Conv."  value={String(selected.conversions)} />
                <MetricCard label="ROAS"   value={Number(selected.roas).toFixed(1)+'x'} color={roasColor(Number(selected.roas))} />
              </div>
            </div>

            {/* Claude output */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--goldlt)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Analysis — Claude AI</div>
                {isCached && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', padding: '2px 7px', background: 'var(--card2)', borderRadius: 3, letterSpacing: 1 }}>CACHED</span>}
              </div>
              {analyzing ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 10 }}>
                    {[96,88,80,68].map(w => (
                      <div key={w} style={{ height: 11, borderRadius: 3, background: 'var(--bg3)', width: w+'%', animation: 'sh 1.5s ease infinite' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>Claude is analyzing your campaign data...</div>
                  <style>{`@keyframes sh{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
                </div>
              ) : (
                <div data-analysis style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'var(--ink2)', lineHeight: 1.9 }}>{analysis}</div>
              )}
            </div>

            {/* Action */}
            {action && !analyzing && (
              <div style={{ background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderLeft: '3px solid var(--gold)', borderRadius: 8, padding: '14px 18px', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--goldlt)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Recommended Action</div>
                <div data-action style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'var(--ink2)', lineHeight: 1.75 }}>{action}</div>
              </div>
            )}

            {/* Buttons */}
            {!analyzing && analysis && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={async () => {
                    await supabase.from('ai_analyses').delete().eq('client_id', client!.id).eq('campaign_id', selected.campaign_id)
                    pick(selected, true)
                  }}
                  style={{ padding: '6px 14px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>
                  Re-analyze
                </button>
                <button
                  onClick={() => exportAnalysisPDF(selected.campaign_name, selected.platform)}
                  style={{ padding: '6px 14px', border: 'none', borderRadius: 5, background: 'var(--gold)', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#faf8f5', letterSpacing: 1 }}>
                  Export PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily:"'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>Loading...</div>}>
      <AnalysisContent />
    </Suspense>
  )
}