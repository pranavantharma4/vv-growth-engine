// ─────────────────────────────────────────────────────────────────────────
// VAI classification + fatigue-prediction engine — THE single source of truth.
//
// This file is mirrored verbatim into the Deno edge functions at
//   supabase/functions/sync-meta-campaigns/vai-rules.ts
//   supabase/functions/weekly-brief/vai-rules.ts
// because Deno can't import from the Next.js lib/ path. If you change the rules
// here, copy this file into both of those locations and redeploy. Keep it
// dependency-free and runtime-agnostic (no Node or Deno APIs) so all five
// consumers (sync, analyze, optimize, vision-drop, weekly-brief) behave
// identically.
//
// Classification: a campaign is labelled by the WORST applicable trigger,
// evaluated DEAD → BLEEDING → WEAK → STRONG.
// ─────────────────────────────────────────────────────────────────────────

export type Health = 'dead' | 'bleeding' | 'weak' | 'strong'

export type TrendPoint = {
  date?: string
  spend?: number | null
  roas?: number | null
  conversions?: number | null
  impressions?: number | null
  clicks?: number | null
  ctr?: number | null        // percent, e.g. 0.62 means 0.62%
  cpm?: number | null
  frequency?: number | null
}

export type CampaignInput = {
  spend?: number | null
  conversions?: number | null
  roas?: number | null
  impressions?: number | null
  clicks?: number | null
  ctr?: number | null        // percent
  cpm?: number | null
  frequency?: number | null
  cost_per_result?: number | null
  daily_trend?: TrendPoint[] | null
}

export type Classification = {
  health: Health
  reasons: string[]
  primaryReason: string      // e.g. "classified BLEEDING because ROAS is 1.8x ..."
}

export type TrendStats = {
  days: number
  enoughData: boolean        // >= 7 days of delivery → day-level forecast allowed
  roasDeclining: boolean
  conversionsFlatOrDeclining: boolean
  costPerResultChangePct: number | null
  costPerResultRising30: boolean
  cpmChangePct: number | null
  ctrSlope: number | null    // %/day
  ctrNow: number | null
  freqSlope: number | null   // per day
  freqNow: number | null
}

export type FatigueForecast = {
  enoughData: boolean
  daysToFatigue: number | null
  text: string
}

// ── small numeric helpers ────────────────────────────────────────────────
const num = (v: any): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const fmt0 = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (n: number | null) => (n == null ? 'n/a' : `${n >= 0 ? '+' : ''}${Math.round(n)}%`)

// least-squares slope of y over x (x = day index). null if < 2 points.
function slope(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 2) return null
  const sx = xs.reduce((s, x) => s + x, 0)
  const sy = ys.reduce((s, y) => s + y, 0)
  const sxx = xs.reduce((s, x) => s + x * x, 0)
  const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const d = n * sxx - sx * sx
  if (d === 0) return null
  return (n * sxy - sx * sy) / d
}

function halves<T>(arr: T[]): [T[], T[]] {
  const mid = Math.floor(arr.length / 2)
  return [arr.slice(0, mid), arr.slice(mid)]
}
const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)

// ── trend analysis ───────────────────────────────────────────────────────
export function analyzeTrend(trend?: TrendPoint[] | null): TrendStats {
  const pts = (trend ?? []).filter((p) => p && (p.spend != null || p.roas != null))
  const days = pts.length
  const enoughData = days >= 7

  const idx = pts.map((_, i) => i)
  const finite = (vals: (number | null | undefined)[]) =>
    vals.map((v) => (v == null ? NaN : Number(v)))

  // ROAS declining: second-half avg > 5% below first-half avg (needs >= 4 pts)
  let roasDeclining = false
  if (days >= 4) {
    const [a, b] = halves(pts.map((p) => num(p.roas)))
    const fa = avg(a), fb = avg(b)
    roasDeclining = fa > 0 && fb < fa * 0.95
  }

  // Conversions flat or declining: second-half avg not growing > 5%
  let conversionsFlatOrDeclining = true
  if (days >= 4) {
    const [a, b] = halves(pts.map((p) => num(p.conversions)))
    conversionsFlatOrDeclining = avg(b) <= avg(a) * 1.05
  }

  // Cost per result change over the window (first-half vs second-half avg)
  let costPerResultChangePct: number | null = null
  if (days >= 4) {
    const cprDay = pts.map((p) => {
      const c = num(p.conversions)
      return c > 0 ? num(p.spend) / c : null
    })
    const [a, b] = halves(cprDay)
    const av = a.filter((v): v is number => v != null)
    const bv = b.filter((v): v is number => v != null)
    if (av.length && bv.length && avg(av) > 0) {
      costPerResultChangePct = ((avg(bv) - avg(av)) / avg(av)) * 100
    }
  }
  const costPerResultRising30 = (costPerResultChangePct ?? 0) > 30

  // CPM change first-half vs second-half avg
  let cpmChangePct: number | null = null
  if (days >= 4) {
    const cpmDay = pts.map((p) => p.cpm).filter((v): v is number => v != null)
    if (cpmDay.length >= 4) {
      const [a, b] = halves(cpmDay)
      if (avg(a) > 0) cpmChangePct = ((avg(b) - avg(a)) / avg(a)) * 100
    }
  }

  // CTR slope (%/day) over defined ctr points
  const ctrPts = pts.map((p, i) => ({ i, v: p.ctr })).filter((p) => p.v != null) as { i: number; v: number }[]
  const ctrSlope = ctrPts.length >= 2 ? slope(ctrPts.map((p) => p.i), ctrPts.map((p) => p.v)) : null
  const ctrNow = ctrPts.length ? ctrPts[ctrPts.length - 1].v : null

  // Frequency slope (per day)
  const freqPts = pts.map((p, i) => ({ i, v: p.frequency })).filter((p) => p.v != null) as { i: number; v: number }[]
  const freqSlope = freqPts.length >= 2 ? slope(freqPts.map((p) => p.i), freqPts.map((p) => p.v)) : null
  const freqNow = freqPts.length ? freqPts[freqPts.length - 1].v : null

  void idx; void finite
  return {
    days,
    enoughData,
    roasDeclining,
    conversionsFlatOrDeclining,
    costPerResultChangePct,
    costPerResultRising30,
    cpmChangePct,
    ctrSlope,
    ctrNow,
    freqSlope,
    freqNow,
  }
}

// ── classification (worst applicable trigger) ─────────────────────────────
export function classifyCampaign(c: CampaignInput): Classification {
  const t = analyzeTrend(c.daily_trend)
  const spend = num(c.spend)
  const conv = num(c.conversions)
  const roas = num(c.roas)
  const impr = num(c.impressions)
  const ctr = c.ctr == null ? null : num(c.ctr)
  const freq = c.frequency == null ? null : num(c.frequency)

  const mk = (health: Health, reasons: string[]): Classification => ({
    health,
    reasons,
    primaryReason: `classified ${health.toUpperCase()} because ${reasons[0]}`,
  })

  // DEAD
  const dead: string[] = []
  if (spend > 100 && conv === 0) dead.push(`spend is $${fmt0(spend)} over the period with 0 conversions`)
  if (roas < 0.5 && spend > 200) dead.push(`ROAS is ${roas.toFixed(2)}x on $${fmt0(spend)} spend (below the 0.5x floor)`)
  if (ctr != null && ctr < 0.4 && impr >= 2000 && conv === 0)
    dead.push(`CTR is ${ctr.toFixed(2)}% after ${fmt0(impr)} impressions with 0 conversions`)
  if (dead.length) return mk('dead', dead)

  // BLEEDING
  const bleed: string[] = []
  if (roas >= 0.5 && roas < 1.5) bleed.push(`ROAS is ${roas.toFixed(2)}x (between 0.5x and 1.5x — losing money after margin)`)
  if (freq != null && freq > 3.5 && t.roasDeclining)
    bleed.push(`frequency is ${freq.toFixed(1)} (over 3.5) and ROAS is declining across the 14-day trend`)
  if (t.costPerResultRising30 && t.conversionsFlatOrDeclining)
    bleed.push(`cost per result is up ${pct(t.costPerResultChangePct)} over 14 days while conversions are flat or declining`)
  if (bleed.length) return mk('bleeding', bleed)

  // WEAK
  const weak: string[] = []
  if (roas >= 1.5 && roas <= 2.5) weak.push(`ROAS is ${roas.toFixed(2)}x (1.5x–2.5x: profitable but underperforming)`)
  if (freq != null && freq >= 2.5 && freq <= 3.5) weak.push(`frequency is ${freq.toFixed(1)} (2.5–3.5: approaching saturation)`)
  if (ctr != null && ctr >= 0.4 && ctr < 0.8) weak.push(`CTR is ${ctr.toFixed(2)}% (between 0.4% and 0.8%)`)
  if (conv < 50 && spend >= 100) weak.push(`only ${conv} conversions on $${fmt0(spend)} spend (still in the learning phase, under 50)`)
  if (weak.length) return mk('weak', weak)

  // STRONG (all conditions)
  if (roas > 2.5 && freq != null && freq < 2.5 && !t.roasDeclining) {
    return mk('strong', [
      `ROAS is ${roas.toFixed(2)}x (over 2.5x), frequency is ${freq.toFixed(1)} (under 2.5), and the 14-day trend is stable or improving`,
    ])
  }

  // Fallback — insufficient signal to certify STRONG; default to WEAK.
  const bits = [`ROAS ${roas.toFixed(2)}x`]
  if (freq != null) bits.push(`frequency ${freq.toFixed(1)}`)
  return mk('weak', [`metrics are mixed or low-volume (${bits.join(', ')}) and cannot be certified STRONG — needs diagnosis`])
}

// Back-compat shim for the old positional signature used by the sync function.
export function classifyHealth(roas: number, spend: number, conversions: number): Health {
  return classifyCampaign({ roas, spend, conversions }).health
}

// ── fatigue forecast ──────────────────────────────────────────────────────
// Uses ONLY real numbers from daily_trend. Predicts a day count only with 7+
// days of data; otherwise returns the insufficient-data statement.
export function fatigueForecast(
  trend?: TrendPoint[] | null,
  fallback?: { frequency?: number | null; ctr?: number | null },
): FatigueForecast {
  const t = analyzeTrend(trend)

  if (!t.enoughData) {
    return {
      enoughData: false,
      daysToFatigue: null,
      text: `Insufficient trend data for a fatigue forecast yet (only ${t.days} day${t.days === 1 ? '' : 's'} of delivery; need 7+).`,
    }
  }

  const freqNow = t.freqNow ?? (fallback?.frequency ?? null)
  const ctrNow = t.ctrNow ?? (fallback?.ctr ?? null)

  // Days until frequency crosses 3.5 (only if climbing and not already past it)
  let freqDays: number | null = null
  if (freqNow != null && t.freqSlope != null && t.freqSlope > 0.001 && freqNow < 3.5) {
    freqDays = (3.5 - freqNow) / t.freqSlope
  }

  // Days until CTR decays below 0.8% (only if declining and currently above)
  let ctrDays: number | null = null
  if (ctrNow != null && t.ctrSlope != null && t.ctrSlope < -0.0001 && ctrNow > 0.8) {
    ctrDays = (ctrNow - 0.8) / -t.ctrSlope
  }

  const candidates = [freqDays, ctrDays].filter((d): d is number => d != null && d > 0 && Number.isFinite(d))
  const cpmClimbing = (t.cpmChangePct ?? 0) > 20

  // Build the "why" fragments from whichever signals are real.
  const frag: string[] = []
  if (freqNow != null && t.freqSlope != null && t.freqSlope > 0.001)
    frag.push(`frequency trajectory (rising ${t.freqSlope.toFixed(2)}/day, now at ${freqNow.toFixed(1)})`)
  if (ctrNow != null && t.ctrSlope != null && t.ctrSlope < -0.0001)
    frag.push(`CTR decay (${t.ctrSlope.toFixed(2)}%/day, now ${ctrNow.toFixed(2)}%)`)
  if (cpmClimbing) frag.push(`CPM up ${pct(t.cpmChangePct)} over 14 days`)

  if (candidates.length && frag.length) {
    const days = Math.max(1, Math.round(Math.min(...candidates)))
    return {
      enoughData: true,
      daysToFatigue: days,
      text:
        `Based on the current ${frag.join(' and ')}, this campaign will cross into fatigue in approximately ` +
        `${days} day${days === 1 ? '' : 's'}. Prepare a new creative variation now.`,
    }
  }

  // No decline signals — report the stable picture with real current values.
  const stable: string[] = []
  if (freqNow != null) stable.push(`frequency ${freqNow.toFixed(1)}`)
  if (ctrNow != null) stable.push(`CTR ${ctrNow.toFixed(2)}%`)
  if (cpmClimbing) stable.push(`CPM up ${pct(t.cpmChangePct)} (watch)`)
  const detail = stable.length ? ` (${stable.join(', ')})` : ''
  return {
    enoughData: true,
    daysToFatigue: null,
    text: `No fatigue signals in the 14-day trend${detail} — healthy headroom for now.`,
  }
}

// ── prompt block ──────────────────────────────────────────────────────────
// Drop-in block appended to every VAI prompt so the model explains the
// classification with the EXACT thresholds + the campaign's real numbers, and
// surfaces the (real-number) fatigue forecast.
const THRESHOLDS_REFERENCE =
  'VAI THRESHOLDS — DEAD: spend>$100 & 0 conv, OR ROAS<0.5x & spend>$200, OR CTR<0.4% after 2,000+ impr & 0 conv. ' +
  'BLEEDING: ROAS 0.5x–1.5x, OR frequency>3.5 & ROAS declining (14d), OR cost-per-result up >30% (14d) while conversions flat/declining. ' +
  'WEAK: ROAS 1.5x–2.5x, OR frequency 2.5–3.5, OR CTR 0.4%–0.8%, OR <50 conversions with meaningful spend (learning). ' +
  'STRONG: ROAS>2.5x AND frequency<2.5 AND stable/improving 14-day trend.'

export function buildVaiRulesBlock(c: CampaignInput): string {
  const cls = classifyCampaign(c)
  const fc = fatigueForecast(c.daily_trend, { frequency: c.frequency, ctr: c.ctr })
  return [
    '',
    `VAI CLASSIFICATION: ${cls.health.toUpperCase()}`,
    `Why (engine): ${cls.primaryReason}.${cls.reasons.length > 1 ? ' Also: ' + cls.reasons.slice(1).join('; ') + '.' : ''}`,
    THRESHOLDS_REFERENCE,
    `FATIGUE FORECAST (computed from the real 14-day daily_trend — quote these exact numbers, do not alter or invent any): ${fc.text}`,
    '',
    `MANDATORY: when you explain WHY this campaign is ${cls.health.toUpperCase()}, cite the exact threshold and the campaign's exact numbers (e.g. "classified BLEEDING because ROAS is 1.8x and frequency has hit 3.6 while your 14-day trend shows CTR declining"). Include the fatigue forecast above in your output verbatim — never fabricate a day count.`,
  ].join('\n')
}
