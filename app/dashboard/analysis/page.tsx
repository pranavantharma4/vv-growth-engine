'use client'
export const dynamic = "force-dynamic"
// NOTE: Intentionally NOT migrated to the React Query cache layer (queries.ts).
// AI Analysis is an on-demand Claude call with its own per-day cache in the
// ai_analyses table; caching here was deliberately deferred to avoid changing
// its behavior before launch. Revisit only if that risk is acceptable.
import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'
import PageLoader from '../PageLoader'

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

type CachedAnalysis = {
  analysis: string
  simple_analysis: string
}

export default function AnalysisPage() {
  const supabase = createClientComponentClient()
  const { client, toast } = useApp()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [simpleAnalysis, setSimpleAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [wasCached, setWasCached] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)

  // VAI loading animation state
  const [loadDots, setLoadDots] = useState(0)
  const [loadPhase, setLoadPhase] = useState(0)
  const loadTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadingPhrases = [
    'Diagnosing funnel performance',
    'Comparing to portfolio benchmarks',
    'Identifying root causes',
    'Calculating recovery potential',
    'Building your intelligence report',
  ]

  useEffect(() => { if (client) load() }, [client])

  useEffect(() => {
    if (analyzing) {
      setLoadDots(0)
      setLoadPhase(0)
      loadTimer.current = setInterval(() => {
        setLoadDots(d => (d + 1) % 4)
        setLoadPhase(p => Math.min(p + 1, loadingPhrases.length - 1))
      }, 1200)
    } else {
      if (loadTimer.current) clearInterval(loadTimer.current)
    }
    return () => { if (loadTimer.current) clearInterval(loadTimer.current) }
  }, [analyzing])

  async function load() {
    if (!client) return
    setLoading(true)
    // Latest available snapshot date (not strictly today).
    const { data: latestRow } = await supabase
      .from('campaign_snapshots')
      .select('snapshot_date')
      .eq('client_id', client.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    const day = latestRow?.snapshot_date || new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('campaign_snapshots').select('*')
      .eq('client_id', client.id).eq('snapshot_date', day)
      .order('spend', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  async function selectCampaign(c: Campaign) {
    setSelected(c)
    setAnalysis(null)
    setSimpleAnalysis(null)
    setWasCached(false)
    setShowEmailForm(false)

    // Check if we have a cached analysis for today
    if (!client) return
    const today = new Date().toISOString().split('T')[0]
    const { data: cached } = await supabase
      .from('ai_analyses')
      .select('analysis, simple_analysis')
      .eq('client_id', client.id)
      .eq('campaign_id', c.id || `${c.platform}_${c.campaign_name}`)
      .eq('snapshot_date', today)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached?.analysis) {
      setAnalysis(cached.analysis)
      setSimpleAnalysis(cached.simple_analysis || '')
      setWasCached(true)
    }
  }

  async function analyze() {
    if (!selected || !client) return
    setAnalyzing(true)
    setAnalysis(null)
    setSimpleAnalysis(null)
    setWasCached(false)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: selected, client_id: client.id, all_campaigns: campaigns }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      setAnalysis(data.analysis)
      setSimpleAnalysis(data.simple_analysis || '')
      setWasCached(data.cached || false)
    } catch (e: any) { toast('Error', e.message) }
    finally { setAnalyzing(false) }
  }

  async function exportPDF() {
    if (!analysis || !selected) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, margin = 20
      let y = 24

      // Dark background
      doc.setFillColor(5, 5, 9)
      doc.rect(0, 0, W, 297, 'F')

      // Header
      doc.setTextColor(245, 243, 239)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'italic')
      doc.text('VV', margin, y)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 160, 120)
      doc.text('VAI · CAMPAIGN ANALYSIS REPORT', margin + 12, y - 4)
      doc.text(`${client?.name || ''} · ${selected.campaign_name}`, margin + 12, y + 2)
      y += 16

      doc.setDrawColor(50, 48, 45)
      doc.line(margin, y, W - margin, y)
      y += 10

      // Campaign stats strip
      const stats = [
        { l: 'PLATFORM', v: selected.platform.toUpperCase() },
        { l: 'HEALTH', v: selected.health.toUpperCase() },
        { l: 'SPEND', v: `$${Number(selected.spend).toLocaleString()}/mo` },
        { l: 'ROAS', v: `${Number(selected.roas).toFixed(2)}x` },
      ]
      const colW = (W - margin * 2) / 4
      stats.forEach((s, i) => {
        const x = margin + i * colW
        doc.setFillColor(18, 16, 14)
        doc.roundedRect(x, y, colW - 3, 16, 1, 1, 'F')
        doc.setFontSize(6)
        doc.setTextColor(120, 115, 110)
        doc.text(s.l, x + 4, y + 5)
        doc.setFontSize(10)
        doc.setTextColor(245, 243, 239)
        doc.text(s.v, x + 4, y + 13)
      })
      y += 24

      doc.setDrawColor(40, 38, 35)
      doc.line(margin, y, W - margin, y)
      y += 10

      // Clean text — strip markdown
      const cleanText = analysis
        .replace(/\*\*/g, '')
        .replace(/## /g, '\n')
        .replace(/^- /gm, '• ')

      doc.setTextColor(200, 195, 190)
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(cleanText, W - margin * 2)

      // Paginate
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); doc.setFillColor(5, 5, 9); doc.rect(0, 0, W, 297, 'F'); y = 24 }
        if (line.trim() === '' || line.match(/^[A-Z][A-Z\s]+$/)) {
          if (line.match(/^[A-Z][A-Z\s]+$/) && line.length > 3) {
            doc.setFontSize(10)
            doc.setTextColor(201, 168, 76)
            doc.text(line, margin, y)
            doc.setFontSize(9)
            doc.setTextColor(200, 195, 190)
          } else {
            // spacer
          }
        } else {
          doc.text(line, margin, y)
        }
        y += 5
      })

      // Footer
      doc.setDrawColor(40, 38, 35)
      doc.line(margin, 270, W - margin, 270)
      doc.setFontSize(6)
      doc.setTextColor(80, 78, 75)
      doc.text('Vanguard Visuals · VAI Intelligence · intelligence@vngrdvisuals.com', margin, 277)
      doc.text(`Generated ${new Date().toLocaleDateString()}`, W - margin, 277, { align: 'right' })

      doc.save(`VAI-Analysis-${selected.campaign_name.replace(/\s+/g, '-')}.pdf`)
      toast('PDF exported', 'Analysis downloaded successfully.')
    } catch (e: any) { toast('Export failed', e.message) }
  }

  async function sendEmail() {
    if (!analysis || !selected || !emailInput) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/send-analysis-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailInput,
          campaign_name: selected.campaign_name,
          client_name: client?.name || '',
          analysis: analysis.replace(/\*\*/g, ''),
          simple_analysis: simpleAnalysis || '',
          platform: selected.platform,
          health: selected.health,
          spend: selected.spend,
          roas: selected.roas,
        }),
      })
      if (res.ok) { toast('Email sent', `Analysis sent to ${emailInput}`); setShowEmailForm(false); setEmailInput('') }
      else { const d = await res.json(); toast('Error', d.error || 'Failed to send') }
    } catch (e: any) { toast('Error', e.message) }
    finally { setSendingEmail(false) }
  }

  const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')
  const healthBg    = (h: string) => ({ strong: 'rgba(74,222,128,0.08)', weak: 'rgba(251,191,36,0.08)', bleeding: 'rgba(251,146,60,0.08)', dead: 'rgba(248,113,113,0.08)' }[h] || 'transparent')
  const platColor: Record<string, string> = { meta: '#1877f2', google: '#ea4335', tiktok: '#00f2ea' }
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`

  // Render full analysis — strips ** and renders sections cleanly
  function renderAnalysis(text: string) {
    const cleaned = text.replace(/\*\*/g, '')
    return cleaned.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return (
        <div key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--ink)', marginTop: i === 0 ? 0 : 26, marginBottom: 10, paddingTop: i === 0 ? 0 : 20, borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}>
          {line.replace('## ', '')}
        </div>
      )
      if (line.match(/^\d+\./)) return (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--gold)', flexShrink: 0, marginTop: 4, minWidth: 16 }}>{line.match(/^\d+/)?.[0]}.</span>
          <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.82 }}>{line.replace(/^\d+\./, '').trim()}</span>
        </div>
      )
      if (line.startsWith('- ') || line.startsWith('• ')) return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <span style={{ color: 'var(--ink3)', flexShrink: 0, marginTop: 5, fontSize: 8 }}>—</span>
          <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.82 }}>{line.replace(/^[-•]\s/, '')}</span>
        </div>
      )
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />
      return <p key={i} style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.82, marginBottom: 6 }}>{line}</p>
    })
  }

  if (loading) return <PageLoader />

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        /* ── Minimal mode — show only simple analysis ── */
        body.minimal .analysis-full { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.4s ease, max-height 0.6s cubic-bezier(0.4,0,0.2,1); pointer-events: none; }
        .analysis-full { opacity: 1; max-height: 3000px; transition: opacity 0.4s ease, max-height 0.6s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .analysis-simple { opacity: 1 !important; max-height: 300px !important; }
        .analysis-simple { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.4s ease 0.15s, max-height 0.5s cubic-bezier(0.4,0,0.2,1) 0.15s; }
        body.minimal .analysis-simple { transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .analysis-actions { opacity: 0; max-height: 0; overflow: hidden; margin: 0 !important; transition: opacity 0.3s ease, max-height 0.4s ease, margin 0.3s ease; }
        .analysis-actions { opacity: 1; max-height: 120px; transition: opacity 0.3s ease, max-height 0.4s ease; }
        body.minimal .analysis-desc { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.3s ease, max-height 0.4s ease; }
        .analysis-desc { opacity: 1; max-height: 60px; transition: opacity 0.3s ease, max-height 0.4s ease; }

        /* ── VAI Loading animation ── */
        @keyframes vaiPulse { 0%,100%{opacity:0.3;transform:scale(0.95)} 50%{opacity:1;transform:scale(1)} }
        @keyframes vaiScan { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes vaiFade { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .vai-dot { animation: vaiPulse 1.4s ease infinite; }
        .vai-dot:nth-child(2) { animation-delay: 0.2s; }
        .vai-dot:nth-child(3) { animation-delay: 0.4s; }
        .vai-scan-line { animation: vaiScan 2.4s cubic-bezier(0.4,0,0.6,1) infinite; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Intelligence</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>
          AI Analysis <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--gold)', letterSpacing: '2px', verticalAlign: 'middle' }}>VAI</span>
        </div>
        <div className="analysis-desc" style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>
          Select a campaign — VAI diagnoses exactly what's happening, why, and what to do. Includes portfolio context.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>

        {/* Campaign list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Select Campaign</div>
          {campaigns.length === 0 ? (
            <div style={{ padding: '24px', background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>No campaigns yet</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginBottom: 12 }}>Add a campaign to start AI diagnostics.</div>
              <button
                onClick={() => (window.location.href = '/dashboard/add-campaign')}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '9px 18px', borderRadius: 4, cursor: 'pointer' }}
              >
                + Add Campaign
              </button>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} onClick={() => selectCampaign(c)}
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

        {/* Right panel */}
        <div>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--gold)', letterSpacing: '4px', marginBottom: 12 }}>VAI</div>
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
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 700, color: '#fff', background: platColor[selected.platform] || '#444', padding: '2px 6px', borderRadius: 2 }}>{selected.platform.toUpperCase()}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{fmt(Number(selected.spend))}/mo</span>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: healthColor(selected.health) }}>{Number(selected.roas).toFixed(2)}x ROAS</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: healthColor(selected.health), background: healthBg(selected.health), border: `1px solid ${healthColor(selected.health)}33`, padding: '2px 6px', borderRadius: 2 }}>{selected.health}</span>
                      {wasCached && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1px' }}>· Cached today</span>}
                    </div>
                  </div>
                  <button onClick={analyze} disabled={analyzing}
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: analyzing ? 'rgba(201,168,76,0.5)' : 'var(--gold)', border: 'none', padding: '11px 22px', borderRadius: 4, cursor: analyzing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {analyzing ? 'Analyzing...' : wasCached ? 'Re-analyze →' : analysis ? 'Re-analyze →' : 'Analyze Campaign →'}
                  </button>
                </div>
              </div>

              {/* ── VAI LOADING ANIMATION ── */}
              {analyzing && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '52px 40px', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
                  {/* Scan line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', overflow: 'hidden', pointerEvents: 'none', opacity: 0.06 }}>
                    <div className="vai-scan-line" style={{ position: 'absolute', top: 0, bottom: 0, width: '20%', background: `linear-gradient(90deg, transparent, var(--gold), transparent)` }} />
                  </div>

                  {/* VAI badge */}
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--gold)', letterSpacing: '6px', marginBottom: 20, opacity: 0.9 }}>VAI</div>

                  {/* Pulsing dots */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="vai-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: 200, height: 1, background: 'var(--rule)', borderRadius: 1, margin: '0 auto 20px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: `linear-gradient(90deg, transparent, var(--gold), transparent)`, animation: 'vaiScan 1.8s ease infinite', width: '40%' }} />
                  </div>

                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--ink)', marginBottom: 10 }}>
                    VAI is Analyzing{'.'.repeat(loadDots + 1)}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8, transition: 'opacity 0.6s ease', opacity: 0.8 }}>
                    {loadingPhrases[loadPhase]}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px' }}>
                    {selected.campaign_name} · {selected.platform.toUpperCase()}
                  </div>
                </div>
              )}

              {/* ── ANALYSIS OUTPUT ── */}
              {analysis && !analyzing && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px' }}>

                  {/* Analysis header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--rule)', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>VAI Campaign Analysis</div>
                        {wasCached && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', background: 'var(--rule)', padding: '1px 6px', borderRadius: 2, letterSpacing: '1px' }}>CACHED</span>}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px' }}>
                        Vanguard AI · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Portfolio context included
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="analysis-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={exportPDF}
                        style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '7px 14px', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ↓ PDF
                      </button>
                      <button onClick={() => setShowEmailForm(s => !s)}
                        style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: 'var(--gold)', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', padding: '7px 14px', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✉ Email
                      </button>
                    </div>
                  </div>

                  {/* Email form */}
                  {showEmailForm && (
                    <div className="analysis-actions" style={{ marginBottom: 18, padding: '14px 16px', background: 'var(--rule)', border: '1px solid var(--rule2)', borderRadius: 4 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Send Analysis by Email</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="email" placeholder="recipient@email.com" value={emailInput}
                          onChange={e => setEmailInput(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 4, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}
                        />
                        <button onClick={sendEmail} disabled={sendingEmail || !emailInput}
                          style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: sendingEmail ? 'not-allowed' : 'pointer', opacity: sendingEmail || !emailInput ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                          {sendingEmail ? 'Sending...' : 'Send →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Simple analysis — shown ONLY in minimal mode */}
                  {simpleAnalysis && (
                    <div className="analysis-simple" style={{ padding: '18px 20px', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 6, marginBottom: 16 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>VAI Summary</div>
                      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.85, fontWeight: 300 }}>{simpleAnalysis}</div>
                    </div>
                  )}

                  {/* Full analysis — hidden in minimal mode */}
                  <div className="analysis-full">
                    {renderAnalysis(analysis)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}