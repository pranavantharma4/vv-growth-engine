import jsPDF from 'jspdf'

export function exportBriefPDF(clientName: string, weekRef: string) {
  const el = document.getElementById('brief-doc')
  if (!el) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  function addLine() {
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
  }

  function addSectionLabel(text: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text(text.toUpperCase(), margin, y)
    y += 4
    addLine()
  }

  function addBodyText(text: string, indent = 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(74, 69, 64)
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent)
    lines.forEach((line: string) => {
      if (y > pageHeight - margin) { doc.addPage(); y = margin }
      doc.text(line, margin + indent, y)
      y += 14
    })
  }

  function addKV(key: string, value: string) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(154, 147, 144)
    doc.text(key, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 23, 20)
    doc.text(value, pageWidth - margin, y, { align: 'right' })
    y += 16
  }

  // ── Header ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 23, 20)
  doc.text('VV', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin, y + 12)
  doc.text('Weekly Intelligence Brief', margin, y + 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(154, 147, 144)
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  doc.text(dateStr, pageWidth - margin, y, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 105, 20)
  doc.text(clientName, pageWidth - margin, y + 12, { align: 'right' })
  doc.text(weekRef, pageWidth - margin, y + 22, { align: 'right' })

  y += 36
  doc.setDrawColor(26, 23, 20)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20

  // ── Pull content from DOM ──
  const rows = el.querySelectorAll('tr')
  const leak = el.querySelector('[data-section="leak"]')
  const stats = el.querySelectorAll('[data-stat]')
  const recs = el.querySelectorAll('[data-rec]')

  // Biggest Leak
  if (leak) {
    addSectionLabel('Biggest Leak This Week')
    addBodyText(leak.textContent || '')
    y += 8
  }

  // Stats
  if (stats.length > 0) {
    addSectionLabel('Summary')
    stats.forEach(s => {
      const label = s.getAttribute('data-stat') || ''
      const val = s.textContent || ''
      addKV(label, val)
    })
    y += 8
  }

  // Campaign health table
  if (rows.length > 0) {
    addSectionLabel('Campaign Health Overview')
    rows.forEach(row => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 2) {
        const name = cells[0]?.textContent?.trim() || ''
        const health = cells[1]?.textContent?.trim() || ''
        const spend = cells[2]?.textContent?.trim() || ''
        const roas = cells[3]?.textContent?.trim() || ''
        if (name) {
          if (y > pageHeight - margin) { doc.addPage(); y = margin }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(26, 23, 20)
          doc.text(name, margin, y)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(154, 147, 144)
          doc.text(`${health}  ${spend}  ${roas}`, pageWidth - margin, y, { align: 'right' })
          y += 16
        }
      }
    })
    y += 8
  }

  // Recommendations
  if (recs.length > 0) {
    addSectionLabel("This Week's Recommended Actions")
    recs.forEach((rec, i) => {
      addBodyText(`${i + 1}. ${rec.textContent?.trim() || ''}`)
    })
    y += 8
  }

  // Footer
  if (y > pageHeight - 40) { doc.addPage(); y = margin }
  doc.setDrawColor(200, 195, 190)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('Vanguard Visuals · Growth Ad Engine · Confidential', margin, pageHeight - 18)
  doc.setTextColor(139, 105, 20)
  doc.text(weekRef, pageWidth - margin, pageHeight - 18, { align: 'right' })

  doc.save(`VV-Brief-${weekRef}-${clientName.replace(/\s+/g, '-')}.pdf`)
}

export function exportBlueprintPDF(refId: string, clientName: string) {
  const el = document.getElementById('pdf-blueprint')
  if (!el) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  function checkPage() {
    if (y > pageHeight - margin) { doc.addPage(); y = margin }
  }

  function addSectionLabel(text: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text(text.toUpperCase(), margin, y)
    y += 4
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 23, 20)
  doc.text('VV', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin, y + 12)
  doc.text('Implementation Blueprint', margin, y + 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(139, 105, 20)
  doc.text(`REF: ${refId}`, pageWidth - margin, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(154, 147, 144)
  doc.text(clientName, pageWidth - margin, y + 12, { align: 'right' })
  doc.text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), pageWidth - margin, y + 22, { align: 'right' })

  y += 40
  doc.setDrawColor(26, 23, 20)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20

  // Parameters from DOM
  const paramRows = el.querySelectorAll('[data-param]')
  if (paramRows.length > 0) {
    addSectionLabel('Campaign Parameters')
    paramRows.forEach(row => {
      checkPage()
      const key = row.getAttribute('data-param') || ''
      const val = row.textContent?.trim() || ''
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(154, 147, 144)
      doc.text(key, margin, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(26, 23, 20)
      doc.text(val, pageWidth - margin, y, { align: 'right' })
      y += 16
    })
    y += 8
  }

  // Steps from DOM
  const steps = el.querySelectorAll('[data-step]')
  if (steps.length > 0) {
    addSectionLabel('Step-by-Step Implementation')
    steps.forEach((step, i) => {
      checkPage()
      const text = step.textContent?.trim() || ''
      doc.setFillColor(253, 246, 227)
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - 20)
      const blockHeight = lines.length * 14 + 16
      if (y + blockHeight > pageHeight - margin) { doc.addPage(); y = margin }
      doc.roundedRect(margin, y - 8, pageWidth - margin * 2, blockHeight, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(139, 105, 20)
      doc.text(`STEP ${i + 1} OF ${steps.length}`, margin + 8, y + 2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(74, 69, 64)
      lines.forEach((line: string, li: number) => {
        doc.text(line, margin + 8, y + 14 + li * 14)
      })
      y += blockHeight + 6
    })
  }

  // Footer
  doc.setDrawColor(200, 195, 190)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('Vanguard Visuals · Growth Ad Engine · Confidential Client Blueprint', margin, pageHeight - 18)
  doc.setTextColor(139, 105, 20)
  doc.text(`REF: ${refId}`, pageWidth - margin, pageHeight - 18, { align: 'right' })

  doc.save(`VV-Blueprint-${refId}.pdf`)
}

export function exportAnalysisPDF(campaignName: string, platform: string) {
  const el = document.getElementById('analysis-export')
  if (!el) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 23, 20)
  doc.text('VV', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin, y + 12)
  doc.text('Campaign AI Analysis', margin, y + 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 23, 20)
  doc.text(campaignName, pageWidth - margin, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(154, 147, 144)
  doc.text(platform.toUpperCase(), pageWidth - margin, y + 12, { align: 'right' })
  doc.text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), pageWidth - margin, y + 22, { align: 'right' })

  y += 40
  doc.setDrawColor(26, 23, 20)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20

  // Metrics
  const metrics = el.querySelectorAll('[data-metric]')
  if (metrics.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text('CAMPAIGN METRICS', margin, y)
    y += 4
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
    metrics.forEach(m => {
      const label = m.getAttribute('data-metric') || ''
      const val = m.textContent?.trim() || ''
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(154, 147, 144)
      doc.text(label, margin, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(26, 23, 20)
      doc.text(val, pageWidth - margin, y, { align: 'right' })
      y += 16
    })
    y += 8
  }

  // Analysis text
  const analysisEl = el.querySelector('[data-analysis]')
  if (analysisEl) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text('ANALYSIS — CLAUDE AI', margin, y)
    y += 4
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(74, 69, 64)
    const lines = doc.splitTextToSize(analysisEl.textContent?.trim() || '', pageWidth - margin * 2)
    lines.forEach((line: string) => {
      if (y > pageHeight - margin) { doc.addPage(); y = margin }
      doc.text(line, margin, y)
      y += 14
    })
    y += 8
  }

  // Recommended action
  const actionEl = el.querySelector('[data-action]')
  if (actionEl) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text('RECOMMENDED ACTION', margin, y)
    y += 4
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
    doc.setFillColor(253, 246, 227)
    const actionLines = doc.splitTextToSize(actionEl.textContent?.trim() || '', pageWidth - margin * 2 - 16)
    const actionHeight = actionLines.length * 14 + 16
    doc.roundedRect(margin, y - 8, pageWidth - margin * 2, actionHeight, 3, 3, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(74, 69, 64)
    actionLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 8, y + 6 + i * 14)
    })
  }

  // Footer
  doc.setDrawColor(200, 195, 190)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('Vanguard Visuals · Growth Ad Engine · Confidential', margin, pageHeight - 18)
  doc.text(new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), pageWidth - margin, pageHeight - 18, { align: 'right' })

  doc.save(`VV-Analysis-${campaignName.replace(/\s+/g, '-')}.pdf`)
}