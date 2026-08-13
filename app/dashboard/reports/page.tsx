'use client'
export const dynamic = "force-dynamic"
import { useState } from 'react'
import { useApp } from '../context'
import { useReports } from '../queries'
import { TableSkeleton } from '../Skeletons'

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
  const { client, toast } = useApp()
  const { data, isPending } = useReports(client?.id)
  const briefs = (data || []) as Brief[]
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  async function exportPDF(brief: Brief) {
    setExporting(brief.id)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, margin = 20
      let y = 24
      doc.setFillColor(5, 5, 9)
      doc.rect(0, 0, W, 297, 'F')
      doc.setTextColor(245, 243, 239)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'italic')
      doc.text('VV', margin, y)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 160, 120)
      doc.text('VANGUARD VISUALS · GROWTH AD ENGINE · INTELLIGENCE BRIEF', margin + 14, y - 4)
      doc.text(client?.name || '', margin + 14, y + 2)
      y += 16
      doc.setDrawColor(50, 48, 45)
      doc.line(margin, y, W - margin, y)
      y += 10
      const d = brief.week_start
        ? new Date(brief.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date(brief.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.setTextColor(200, 195, 190)
      doc.setFontSize(9)
      doc.text(`Week of ${d}`, margin, y)
      y += 12
      // Stats
      const stats = [
        { l: 'TOTAL SPEND', v: `$${Number(brief.total_spend).toLocaleString()}` },
        { l: 'WASTED SPEND', v: `$${Number(brief.total_wasted).toLocaleString()}` },
        { l: 'BLENDED ROAS', v: `${Number(brief.blended_roas).toFixed(1)}x` },
      ]
      const colW = (W - margin * 2) / 3
      stats.forEach((s, i) => {
        const x = margin + i * colW
        doc.setFillColor(20, 18, 15)
        doc.roundedRect(x, y, colW - 4, 18, 2, 2, 'F')
        doc.setFontSize(6)
        doc.setTextColor(120, 115, 110)
        doc.text(s.l, x + 4, y + 5)
        doc.setFontSize(13)
        doc.setTextColor(245, 243, 239)
        doc.text(s.v, x + 4, y + 14)
      })
      y += 26
      // Biggest leak
      doc.setFillColor(40, 20, 10)
      doc.roundedRect(margin, y, W - margin * 2, 24, 2, 2, 'F')
      doc.setFontSize(6)
      doc.setTextColor(201, 120, 50)
      doc.text('BIGGEST LEAK', margin + 4, y + 5)
      doc.setFontSize(11)
      doc.setTextColor(245, 243, 239)
      const leakText = doc.splitTextToSize(`${brief.biggest_leak_campaign} — $${Number(brief.biggest_leak_amount).toLocaleString()}/mo`, W - margin * 2 - 8)
      doc.text(leakText, margin + 4, y + 14)
      y += 32
      // Summary
      if (brief.summary) {
        doc.setFontSize(7)
        doc.setTextColor(120, 115, 110)
        doc.text('INTELLIGENCE SUMMARY', margin, y)
        y += 7
        doc.setFontSize(9)
        doc.setTextColor(200, 195, 190)
        const lines = doc.splitTextToSize(brief.summary, W - margin * 2)
        doc.text(lines, margin, y)
      }
      // Footer
      doc.setDrawColor(40, 38, 35)
      doc.line(margin, 270, W - margin, 270)
      doc.setFontSize(6)
      doc.setTextColor(80, 78, 75)
      doc.text('Vanguard Visuals · Growth Ad Engine · intelligence@vngrdvisuals.com', margin, 277)
      doc.text(`Generated ${new Date().toLocaleDateString()}`, W - margin, 277, { align: 'right' })
      doc.save(`VV-Brief-${client?.name?.replace(/\s+/g, '-')}-${d}.pdf`)
      toast('Export complete', 'PDF downloaded.')
    } catch (e: any) { toast('Export failed', e.message) }
    finally { setExporting(null) }
  }

  const fmt     = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toLocaleString()}`
  const fmtRoas = (r: number) => `${Number(r).toFixed(1)}x`
  const healthColor = (h: string) => ({ strong: '#4ade80', weak: '#fbbf24', bleeding: '#fb923c', dead: '#f87171' }[h] || 'var(--ink3)')

  if (isPending) return <TableSkeleton rows={5} maxWidth={900} />

  if (briefs.length === 0) return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 300, color: 'var(--ink)', marginBottom: 12 }}>No reports yet</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.85 }}>Reports appear here after each Monday morning brief is generated.</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      <style>{`
        body.minimal .reports-summary { opacity: 0; max-height: 0; overflow: hidden; margin-bottom: 0 !important; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; }
        .reports-summary { opacity: 1; max-height: 120px; margin-bottom: 20px; transition: opacity 0.35s ease, max-height 0.45s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; }
        body.minimal .report-expanded { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.35s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
        .report-expanded { opacity: 1; max-height: 800px; transition: opacity 0.35s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Intelligence</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Reports</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>All weekly intelligence briefs · PDF export available</div>
      </div>

      {/* Summary */}
      <div className="reports-summary vv-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Total Briefs',      value: briefs.length.toString() },
          { label: 'Avg Wasted/Week',   value: fmt(briefs.reduce((s, b) => s + Number(b.total_wasted), 0) / briefs.length) },
          { label: 'Avg Blended ROAS',  value: fmtRoas(briefs.reduce((s, b) => s + Number(b.blended_roas), 0) / briefs.length) },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '16px 18px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)' }}>{s.value}</div>
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
            <div key={brief.id} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
              <div onClick={() => setExpanded(isOpen ? null : brief.id)}
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                    {i === 0 ? 'Latest Brief' : `Brief ${briefs.length - i}`}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: 'var(--ink)' }}>Week of {date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>Wasted</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: '#f87171' }}>{fmt(Number(brief.total_wasted))}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>ROAS</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: Number(brief.blended_roas) >= 3 ? '#4ade80' : '#fbbf24' }}>{fmtRoas(Number(brief.blended_roas))}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); exportPDF(brief) }} disabled={exporting === brief.id}
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '7px 14px', borderRadius: 3, cursor: exporting === brief.id ? 'not-allowed' : 'pointer', opacity: exporting === brief.id ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                    {exporting === brief.id ? '...' : '↓ PDF'}
                  </button>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--ink3)', display: 'inline-block', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
              </div>
              {isOpen && (
                <div className="report-expanded" style={{ padding: '0 20px 20px', borderTop: '1px solid var(--rule)' }}>
                  <div className="vv-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, margin: '16px 0' }}>
                    {[
                      { label: 'Total Spend', value: fmt(Number(brief.total_spend)), accent: undefined },
                      { label: 'Wasted', value: fmt(Number(brief.total_wasted)), accent: '#f87171' },
                      { label: 'ROAS', value: fmtRoas(Number(brief.blended_roas)), accent: Number(brief.blended_roas) >= 3 ? '#4ade80' : '#fbbf24' },
                      { label: 'Biggest Leak', value: fmt(Number(brief.biggest_leak_amount)), accent: '#fb923c' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '12px 14px', background: 'var(--rule)', border: '1px solid var(--rule)', borderRadius: 4 }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: s.accent || 'var(--ink)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Health */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'STRONG', count: brief.strong_count || 0, h: 'strong' },
                      { label: 'WEAK', count: brief.weak_count || 0, h: 'weak' },
                      { label: 'BLEEDING', count: brief.bleeding_count || 0, h: 'bleeding' },
                      { label: 'DEAD', count: brief.dead_count || 0, h: 'dead' },
                    ].map(item => (
                      <div key={item.h} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: 'var(--rule)', border: '1px solid var(--rule2)', borderRadius: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: healthColor(item.h) }} />
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px' }}>{item.label}</span>
                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: healthColor(item.h) }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                  {brief.summary && (
                    <div style={{ padding: '14px 16px', background: 'var(--rule)', border: '1px solid var(--rule2)', borderRadius: 4 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>AI Summary</div>
                      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{brief.summary}</div>
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