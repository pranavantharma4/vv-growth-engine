// Shared helpers that make VAI's analysis hyper-specific. Every prompt that
// analyzes a Meta campaign passes (a) these strict grounding rules and (b) a
// formatted block of the account's real granular data so the model can quote
// exact figures instead of giving generic advice.

export const STRICT_SYSTEM_RULES = `You are analyzing real account data. Every single claim you make MUST reference a specific number from this account's data. Never give generic advice that could apply to any account. If you identify a problem, quote the exact metric that proves it (e.g. 'your frequency is 4.2x' not 'your frequency may be high'). If you recommend moving budget, state the exact dollar amount and the exact destination campaign. If you cite a demographic insight, name the exact age/gender segment and its exact performance. Vague advice is a failure. Generic advice is a failure. Every sentence must be grounded in this account's actual numbers.`

export type Segment = {
  segment: string
  spend?: number
  roas?: number
  conversions?: number
  impressions?: number
}

export type Granular = {
  frequency?: number | null
  cpm?: number | null
  cpc?: number | null
  ctr?: number | null
  reach?: number | null
  cost_per_result?: number | null
  objective?: string | null
  bid_strategy?: string | null
  daily_budget?: number | null
  demographic_breakdown?: Segment[] | null
  placement_breakdown?: Segment[] | null
  daily_trend?: { date: string; spend?: number; roas?: number; conversions?: number }[] | null
}

const n = (v: any): number | null =>
  v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v)

function bestWorstByRoas(segs: Segment[]) {
  const valid = segs.filter((s) => (s.spend ?? 0) > 0)
  if (!valid.length) return { best: null as Segment | null, worst: null as Segment | null }
  const sorted = [...valid].sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))
  return { best: sorted[0], worst: sorted[sorted.length - 1] }
}

function trendDirection(trend: { date: string; spend?: number; roas?: number }[]) {
  const pts = (trend || []).filter((t) => (t.spend ?? 0) > 0)
  if (pts.length < 4) return null
  const mid = Math.floor(pts.length / 2)
  const wRoas = (arr: typeof pts) => {
    const sp = arr.reduce((s, p) => s + (p.spend ?? 0), 0)
    if (sp === 0) return 0
    return arr.reduce((s, p) => s + (p.roas ?? 0) * (p.spend ?? 0), 0) / sp
  }
  const first = wRoas(pts.slice(0, mid))
  const second = wRoas(pts.slice(mid))
  if (first === 0) return null
  const pct = ((second - first) / first) * 100
  const dir = pct > 5 ? 'improving' : pct < -5 ? 'declining' : 'flat'
  return { dir, pct: Math.round(pct), firstRoas: first.toFixed(2), secondRoas: second.toFixed(2) }
}

// Renders the granular data block + explicit per-dimension instructions appended
// to the user prompt. Returns '' if there is genuinely no granular data.
export function buildGranularBlock(g: Granular): string {
  if (!g) return ''
  const demo = g.demographic_breakdown ?? []
  const place = g.placement_breakdown ?? []
  const trend = g.daily_trend ?? []
  const freq = n(g.frequency)

  const lines: string[] = ['', 'GRANULAR ACCOUNT DATA (use these exact numbers):']

  if (freq != null) lines.push(`- Frequency: ${freq.toFixed(2)}x (avg times each person saw the ad)`)
  if (n(g.reach) != null) lines.push(`- Reach: ${Number(g.reach).toLocaleString()}`)
  if (n(g.cpm) != null) lines.push(`- CPM: $${Number(g.cpm).toFixed(2)}`)
  if (n(g.cpc) != null) lines.push(`- CPC: $${Number(g.cpc).toFixed(2)}`)
  if (n(g.ctr) != null) lines.push(`- CTR: ${Number(g.ctr).toFixed(2)}%`)
  if (n(g.cost_per_result) != null) lines.push(`- Cost per result: $${Number(g.cost_per_result).toFixed(2)}`)
  if (g.objective) lines.push(`- Campaign objective: ${g.objective}`)
  if (g.bid_strategy) lines.push(`- Bid strategy: ${g.bid_strategy}`)
  if (n(g.daily_budget) != null) lines.push(`- Daily budget: $${Number(g.daily_budget).toFixed(2)}`)

  if (demo.length) {
    lines.push('', 'Demographic breakdown (age / gender — spend, ROAS, conversions):')
    for (const d of demo.slice(0, 10)) {
      lines.push(`  • ${d.segment}: $${Math.round(d.spend ?? 0).toLocaleString()} spend, ${(d.roas ?? 0).toFixed(2)}x ROAS, ${d.conversions ?? 0} conv`)
    }
  }
  if (place.length) {
    lines.push('', 'Placement breakdown (platform / position — spend, ROAS, conversions):')
    for (const p of place.slice(0, 8)) {
      lines.push(`  • ${p.segment}: $${Math.round(p.spend ?? 0).toLocaleString()} spend, ${(p.roas ?? 0).toFixed(2)}x ROAS, ${p.conversions ?? 0} conv`)
    }
  }
  if (trend.length) {
    const series = trend.map((t) => `${t.date}:$${Math.round(t.spend ?? 0)}/${(t.roas ?? 0).toFixed(1)}x`).join(', ')
    lines.push('', `Daily trend (last ${trend.length}d, date:$spend/ROAS): ${series}`)
  }

  // Pre-computed signals so the model can't dodge them.
  const { best, worst } = bestWorstByRoas(demo)
  const placeBest = bestWorstByRoas(place).best
  const td = trendDirection(trend)

  const instr: string[] = ['', 'MANDATORY — every point below must be addressed with the exact numbers above:']
  if (best && worst && best.segment !== worst.segment) {
    instr.push(`- Demographics: best segment is ${best.segment} at ${(best.roas ?? 0).toFixed(2)}x ROAS; worst is ${worst.segment} at ${(worst.roas ?? 0).toFixed(2)}x. Name both with their exact figures and recommend a concrete budget shift between them.`)
  } else if (demo.length) {
    instr.push('- Demographics: identify the best- and worst-performing age/gender segments by exact ROAS and act on them.')
  }
  if (placeBest) {
    instr.push(`- Placement: top placement is ${placeBest.segment} at ${(placeBest.roas ?? 0).toFixed(2)}x ROAS — state which placement is winning with exact numbers and which to cut.`)
  } else if (place.length) {
    instr.push('- Placement: identify the best placement (Feed/Reels/Stories) by exact ROAS.')
  }
  if (freq != null && freq > 3.0) {
    instr.push(`- Frequency: ${freq.toFixed(2)}x EXCEEDS 3.0 — explicitly call out audience saturation/creative fatigue using this exact figure and prescribe the fix.`)
  } else if (freq != null) {
    instr.push(`- Frequency: ${freq.toFixed(2)}x is within range — confirm headroom using this exact figure.`)
  }
  if (td) {
    instr.push(`- Trend: performance is ${td.dir} over the last 14 days (${td.firstRoas}x → ${td.secondRoas}x, ${td.pct > 0 ? '+' : ''}${td.pct}%). State this direction with the specific figures and what it means for budget.`)
  } else if (trend.length) {
    instr.push('- Trend: describe whether the 14-day daily trend is improving or declining with specific day-over-day figures.')
  }
  if (g.bid_strategy && g.objective) {
    instr.push(`- Bid strategy: assess whether "${g.bid_strategy}" fits the "${g.objective}" objective; if it is a mismatch, say so specifically and name the correct strategy.`)
  }

  if (instr.length <= 1) return lines.join('\n')
  return lines.concat(instr).join('\n')
}

// Normalize a campaign_snapshots row (or a campaign object carrying the same
// fields) into the Granular shape, parsing jsonb that may arrive as strings.
export function granularFromRow(row: any): Granular {
  if (!row) return {}
  const parse = (v: any) => {
    if (!v) return []
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
    return v
  }
  return {
    frequency: row.frequency ?? null,
    cpm: row.cpm ?? null,
    cpc: row.cpc ?? null,
    ctr: row.ctr ?? null,
    reach: row.reach ?? null,
    cost_per_result: row.cost_per_result ?? row.cpa ?? null,
    objective: row.objective ?? null,
    bid_strategy: row.bid_strategy ?? null,
    daily_budget: row.daily_budget ?? null,
    demographic_breakdown: parse(row.demographic_breakdown),
    placement_breakdown: parse(row.placement_breakdown),
    daily_trend: parse(row.daily_trend),
  }
}
