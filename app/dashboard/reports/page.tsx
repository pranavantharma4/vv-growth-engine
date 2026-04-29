'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

type Brief = {
  id: string
  week_start: string
  biggest_leak_campaign: string
  biggest_leak_amount: number
  biggest_leak_platform: string
  total_spend: number
  total_wasted: number
  blended_roas: number
  strong_count: number
  weak_count: number
  bleeding_count: number
  dead_count: number
  summary: string
  created_at: string
}

export default function ReportsPage() {
  const supabase = createClientComponentClient()
  const { client, toast } = useApp()

  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    if (!client) return
    load()
  }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    const { data } = await supabase
      .from('weekly_briefs')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
    setBriefs(data || [])
    setLoading(false)
  }

  async function exportPDF(brief: Brief) {
    setExporting(brief.id)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const margin = 20
      let y = 20

      // Header
      doc.setFillColor(5, 5, 9)
      doc.rect(0, 0, W, 297, 'F')
      doc.setTextColor(245, 243, 239)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'italic')
      doc.text('VV', margin, y + 8)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 160, 120)
      doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin + 14, y + 5)
      doc.text('INTELLIGENCE BRIEF', margin + 14, y + 10)
      y += 24

      // Rule
      doc.setDrawColor(60, 55, 45)
      doc.line(margin, y, W - margin, y)
      y += 8

      // Client + date
      doc.setTextColor(245, 243, 239)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(client?.name || 'Client', margin, y)
      y += 7
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 115, 110)
      const d = brief.week_start
        ? new Date(brief.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date(brief.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(`Week of ${d}`, margin, y)
      y += 14

      // Stats row
      const stats = [
        { label: 'TOTAL SPEND', value: `$${Number(brief.total_spend).toLocaleString()}` },
        { label: 'WASTED SPEND', value: `$${Number(brief.total_wasted).toLocaleString()}` },
        { label: 'BLENDED ROAS', value: `${Number(brief.blended_roas).toFixed(1)}x` },
      ]
      const colW = (W - margin * 2) / 3
      stats.forEach((s, i) => {
        const x = margin + i * colW
        doc.setFillColor(20, 18, 15)
        doc.roundedRect(x, y, colW - 4, 20, 2, 2, 'F')
        doc.setFontSize(7)
        doc.setTextColor(120, 115, 110)
        doc.text(s.label, x + 4, y + 6)
        doc.setFontSize(14)
        doc.setTextColor(245, 243, 239)
        doc.text(s.value, x + 4, y + 16)
      })
      y += 28

      // Campaign health
      const healthStats = [
        { label: 'STRONG', count: brief.strong_count || 0, color: [74, 222, 128] as [number, number, number] },
        { label: 'WEAK',   count: brief.weak_count || 0,   color: [251, 191, 36] as [number, number, number] },
        { label: 'BLEEDING', count: brief.bleeding_count || 0, color: [251, 146, 60] as [number, number, number] },
        { label: 'DEAD',   count: brief.dead_count || 0,   color: [248, 113, 113] as [number, number, number] },
      ]
      doc.setFontSize(8)
      doc.setTextColor(120, 115, 110)
      doc.text('CAMPAIGN HEALTH', margin, y)
      y += 6
      healthStats.forEach((h, i) => {
        const x = margin + i * colW
        doc.setFillColor(...h.color)
        doc.circle(x + 2, y + 2, 2, 'F')
        doc.setTextColor(...h.color)
        doc.setFontSize(7)
        doc.text(`${h.label}  ${h.count}`, x + 6, y + 3.5)
      })
      y += 14

      // Biggest leak
      doc.setDrawColor(60, 55, 45)
      doc.line(margin, y, W - margin, y)
      y += 8
      doc.setFillColor(40, 20, 10)
      doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setTextColor(201, 120, 50)
      doc.text('BIGGEST LEAK IDENTIFIED', margin + 4, y + 6)
      doc.setFontSize(12)
      doc.setTextColor(245, 243, 239)
      const leakText = doc.splitTextToSize(`${brief.biggest_leak_campaign} — $${Number(brief.biggest_leak_amount).toLocaleString()}/mo wasted`, W - margin * 2 - 8)
      doc.text(leakText, margin + 4, y + 14)
      y += 36

      // Summary
      if (brief.summary) {
        doc.setFontSize(8)
        doc.setTextColor(120, 115, 110)
        doc.text('INTELLIGENCE SUMMARY', margin, y)
        y += 7
        doc.setFontSize(10)
        doc.setTextColor(200, 198, 195)
        const lines = doc.splitTextToSize(brief.summary, W - margin * 2)
        doc.text(lines, margin, y)
        y += lines.length * 5 + 10
      }

      // Footer
      doc.setDrawColor(40, 38, 35)
      doc.line(margin, 270, W - margin, 270)
      doc.setFontSize(7)
      doc.setTextColor(80, 78, 75)
      doc.text('Vanguard Visuals · Growth Ad Engine · intelligence@vngrdvisuals.com · vngrdvisuals.com', margin, 277)
      doc.text(`Generated ${new Date().toLocaleDateString()}`, W - margin, 277, { align: 'right' })

      doc.save(`VV-Brief-${client?.name?.replace(/\s+/g, '-')}-${d}.pdf`)
      toast('Export complete', 'PDF downloaded successfully.')
    } catch (e: any) {
      toast('Export failed', e.message)
    } finally {
      setExporting(null)
    }
  }

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
  const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || ink3)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: '2px', textTransform: 'uppercase' }}>Loading reports...</div>
      </div>
    )
  }

  if (briefs.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
        <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, color: ink, marginBottom: 12 }}>No reports yet</div>
        <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85 }}>
          Your first Monday morning brief is scheduled. Reports appear here after each weekly brief is generated.
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Briefs', value: briefs.length.toString() },
          { label: 'Avg Wasted Spend', value: fmt(briefs.reduce((s, b) => s + Number(b.total_wasted), 0) / briefs.length) },
          { label: 'Avg Blended ROAS', value: fmtRoas(briefs.reduce((s, b) => s + Number(b.blended_roas), 0) / briefs.length) },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '18px 20px' }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, color: ink }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Brief list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {briefs.map((brief, i) => {
          const isOpen = expanded === brief.id
          const date = brief.week_start
            ? new Date(brief.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : new Date(brief.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

          return (
            <div key={brief.id} style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, overflow: 'hidden' }}>

              {/* Row header */}
              <div
                onClick={() => setExpanded(isOpen ? null : brief.id)}
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>
                      {i === 0 ? 'Latest Brief' : `Brief ${briefs.length - i}`}
                    </div>
                    <div style={{ fontFamily: serif, fontSize: 17, color: ink }}>Week of {date}</div>
                  </div>
                  <div style={{ height: 28, width: 1, background: rule, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 7, color: 'rgba(251,146,60,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 3 }}>Biggest Leak</div>
                    <div style={{ fontFamily: sans, fontSize: 12, color: ink2 }}>{brief.biggest_leak_campaign}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>Spend</div>
                    <div style={{ fontFamily: serif, fontSize: 16, color: ink }}>{fmt(Number(brief.total_spend))}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>ROAS</div>
                    <div style={{ fontFamily: serif, fontSize: 16, color: Number(brief.blended_roas) >= 3 ? '#4ade80' : Number(brief.blended_roas) >= 1.5 ? '#fbbf24' : '#f87171' }}>{fmtRoas(Number(brief.blended_roas))}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); exportPDF(brief) }}
                    disabled={exporting === brief.id}
                    style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '7px 14px', borderRadius: 3, cursor: exporting === brief.id ? 'not-allowed' : 'pointer', opacity: exporting === brief.id ? 0.6 : 1, whiteSpace: 'nowrap' }}
                  >
                    {exporting === brief.id ? 'Exporting...' : '↓ PDF'}
                  </button>
                  <span style={{ fontFamily: mono, fontSize: 14, color: ink3, transition: 'transform 0.2s ease', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${rule}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, margin: '16px 0' }}>
                    {[
                      { label: 'Total Spend', value: fmt(Number(brief.total_spend)), accent: undefined },
                      { label: 'Wasted Spend', value: fmt(Number(brief.total_wasted)), accent: '#f87171' },
                      { label: 'Blended ROAS', value: fmtRoas(Number(brief.blended_roas)), accent: Number(brief.blended_roas) >= 3 ? '#4ade80' : '#fbbf24' },
                      { label: 'Leaked Amount', value: fmt(Number(brief.biggest_leak_amount)), accent: '#fb923c' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${rule}`, borderRadius: 4 }}>
                        <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontFamily: serif, fontSize: 22, color: s.accent || ink }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Health */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'STRONG',   count: brief.strong_count,   h: 'strong' },
                      { label: 'WEAK',     count: brief.weak_count,     h: 'weak' },
                      { label: 'BLEEDING', count: brief.bleeding_count, h: 'bleeding' },
                      { label: 'DEAD',     count: brief.dead_count,     h: 'dead' },
                    ].map(item => (
                      <div key={item.h} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${rule}`, borderRadius: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: healthColor(item.h) }} />
                        <span style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px' }}>{item.label}</span>
                        <span style={{ fontFamily: serif, fontSize: 15, color: healthColor(item.h) }}>{item.count || 0}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  {brief.summary && (
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${rule}`, borderRadius: 4 }}>
                      <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>AI Summary</div>
                      <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{brief.summary}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}