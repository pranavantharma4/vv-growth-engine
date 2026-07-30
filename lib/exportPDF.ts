import jsPDF from 'jspdf'

// ── Unicode font embedding ─────────────────────────────────────────────────
// jsPDF's built-in Helvetica is a single-byte WinAnsi font. Any glyph it can't
// map (e.g. → U+2192, ≥ U+2265) forces jsPDF to re-encode the whole drawn
// string as UTF-16 — but a standard font has no Unicode CMap, so a viewer
// renders those bytes as garbage ("→" becomes "!’") AND the entire wrapped
// line they sit on turns unreadable, which looks like mid-sentence truncation.
// Embedding DejaVu Sans (full Unicode, permissively licensed) makes jsPDF emit
// a proper CID font with real glyphs + a ToUnicode map, fixing both. Fonts are
// fetched from /public once and cached; each exporter falls back to Helvetica
// if the assets can't be loaded so exports never hard-fail.
let _fontCache: { normal: string; bold: string } | null = null
async function loadFontCache() {
  if (_fontCache) return _fontCache
  const toB64 = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`font fetch failed: ${url} (${res.status})`)
    const bytes = new Uint8Array(await res.arrayBuffer())
    // chunked to avoid a call-stack overflow on String.fromCharCode(...bigArray)
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)))
    }
    return btoa(bin)
  }
  const [normal, bold] = await Promise.all([
    toB64('/fonts/DejaVuSans.ttf'),
    toB64('/fonts/DejaVuSans-Bold.ttf'),
  ])
  _fontCache = { normal, bold }
  return _fontCache
}
// Registers DejaVu Sans (normal + bold) on the doc; returns the family name to
// use for body text. Throws if assets can't be fetched — callers keep 'helvetica'.
async function registerUnicodeFonts(doc: any): Promise<string> {
  const { normal, bold } = await loadFontCache()
  doc.addFileToVFS('DejaVuSans.ttf', normal)
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
  doc.addFileToVFS('DejaVuSans-Bold.ttf', bold)
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold')
  return 'DejaVuSans'
}

export async function exportBriefPDF(clientName: string, weekRef: string) {
  const el = document.getElementById('brief-doc')
  if (!el) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin
  // Embed a full-Unicode font so → / ≥ etc. render (see note at top of file);
  // fall back to Helvetica if the asset can't be fetched.
  let bodyFont = 'helvetica'
  try { bodyFont = await registerUnicodeFonts(doc) }
  catch (e) { console.warn('[exportPDF] Unicode font unavailable, using Helvetica', e) }

  function addLine() {
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
  }

  function addSectionLabel(text: string) {
    doc.setFont(bodyFont,'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text(text.toUpperCase(), margin, y)
    y += 4
    addLine()
  }

  function addBodyText(text: string, indent = 0) {
    doc.setFont(bodyFont,'normal')
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
    doc.setFont(bodyFont,'normal')
    doc.setFontSize(9)
    doc.setTextColor(154, 147, 144)
    doc.text(key, margin, y)
    doc.setFont(bodyFont,'bold')
    doc.setTextColor(26, 23, 20)
    doc.text(value, pageWidth - margin, y, { align: 'right' })
    y += 16
  }

  // ── Header ──
  doc.setFont(bodyFont,'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 23, 20)
  doc.text('VV', margin, y)
  doc.setFont(bodyFont,'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin, y + 12)
  doc.text('Weekly Intelligence Brief', margin, y + 22)

  doc.setFont(bodyFont,'normal')
  doc.setFontSize(8)
  doc.setTextColor(154, 147, 144)
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  doc.text(dateStr, pageWidth - margin, y, { align: 'right' })
  doc.setFont(bodyFont,'bold')
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
          doc.setFont(bodyFont,'bold')
          doc.setFontSize(10)
          doc.setTextColor(26, 23, 20)
          doc.text(name, margin, y)
          doc.setFont(bodyFont,'normal')
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
  doc.setFont(bodyFont,'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('Vanguard Visuals · Growth Ad Engine · Confidential', margin, pageHeight - 18)
  doc.setTextColor(139, 105, 20)
  doc.text(weekRef, pageWidth - margin, pageHeight - 18, { align: 'right' })

  doc.save(`VV-Brief-${weekRef}-${clientName.replace(/\s+/g, '-')}.pdf`)
}

export async function exportBlueprintPDF(refId: string, clientName: string) {
  const el = document.getElementById('pdf-blueprint')
  if (!el) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin
  // Embed a full-Unicode font so → / ≥ etc. render (see note at top of file);
  // fall back to Helvetica if the asset can't be fetched.
  let bodyFont = 'helvetica'
  try { bodyFont = await registerUnicodeFonts(doc) }
  catch (e) { console.warn('[exportPDF] Unicode font unavailable, using Helvetica', e) }

  function checkPage() {
    if (y > pageHeight - margin) { doc.addPage(); y = margin }
  }

  function addSectionLabel(text: string) {
    doc.setFont(bodyFont,'bold')
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
  doc.setFont(bodyFont,'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 23, 20)
  doc.text('VV', margin, y)
  doc.setFont(bodyFont,'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin, y + 12)
  doc.text('Implementation Blueprint', margin, y + 22)
  doc.setFont(bodyFont,'bold')
  doc.setFontSize(8)
  doc.setTextColor(139, 105, 20)
  doc.text(`REF: ${refId}`, pageWidth - margin, y, { align: 'right' })
  doc.setFont(bodyFont,'normal')
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
      doc.setFont(bodyFont,'normal')
      doc.setFontSize(9)
      doc.setTextColor(154, 147, 144)
      doc.text(key, margin, y)
      doc.setFont(bodyFont,'bold')
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
      doc.setFont(bodyFont,'bold')
      doc.setFontSize(7)
      doc.setTextColor(139, 105, 20)
      doc.text(`STEP ${i + 1} OF ${steps.length}`, margin + 8, y + 2)
      doc.setFont(bodyFont,'normal')
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
  doc.setFont(bodyFont,'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('Vanguard Visuals · Growth Ad Engine · Confidential Client Blueprint', margin, pageHeight - 18)
  doc.setTextColor(139, 105, 20)
  doc.text(`REF: ${refId}`, pageWidth - margin, pageHeight - 18, { align: 'right' })

  doc.save(`VV-Blueprint-${refId}.pdf`)
}

export async function exportAnalysisPDF(campaignName: string, platform: string) {
  const el = document.getElementById('analysis-export')
  if (!el) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin
  // Embed a full-Unicode font so → / ≥ etc. render (see note at top of file);
  // fall back to Helvetica if the asset can't be fetched.
  let bodyFont = 'helvetica'
  try { bodyFont = await registerUnicodeFonts(doc) }
  catch (e) { console.warn('[exportPDF] Unicode font unavailable, using Helvetica', e) }

  // Header
  doc.setFont(bodyFont,'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 23, 20)
  doc.text('VV', margin, y)
  doc.setFont(bodyFont,'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('VANGUARD VISUALS · GROWTH AD ENGINE', margin, y + 12)
  doc.text('Campaign AI Analysis', margin, y + 22)
  doc.setFont(bodyFont,'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 23, 20)
  doc.text(campaignName, pageWidth - margin, y, { align: 'right' })
  doc.setFont(bodyFont,'normal')
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
    doc.setFont(bodyFont,'bold')
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
      doc.setFont(bodyFont,'normal')
      doc.setFontSize(9)
      doc.setTextColor(154, 147, 144)
      doc.text(label, margin, y)
      doc.setFont(bodyFont,'bold')
      doc.setTextColor(26, 23, 20)
      doc.text(val, pageWidth - margin, y, { align: 'right' })
      y += 16
    })
    y += 8
  }

  // Analysis text
  const analysisEl = el.querySelector('[data-analysis]')
  if (analysisEl) {
    doc.setFont(bodyFont,'bold')
    doc.setFontSize(7)
    doc.setTextColor(139, 105, 20)
    doc.text('ANALYSIS — CLAUDE AI', margin, y)
    y += 4
    doc.setDrawColor(200, 195, 190)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
    doc.setFont(bodyFont,'normal')
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
    doc.setFont(bodyFont,'bold')
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
    doc.setFont(bodyFont,'normal')
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
  doc.setFont(bodyFont,'normal')
  doc.setFontSize(7)
  doc.setTextColor(154, 147, 144)
  doc.text('Vanguard Visuals · Growth Ad Engine · Confidential', margin, pageHeight - 18)
  doc.text(new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), pageWidth - margin, pageHeight - 18, { align: 'right' })

  doc.save(`VV-Analysis-${campaignName.replace(/\s+/g, '-')}.pdf`)
}