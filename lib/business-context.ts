// ─────────────────────────────────────────────────────────────────────────
// Business context — per-client unit economics that make VAI's analysis
// brand-aware instead of generic. Captured in onboarding / Settings and stored
// as columns on `clients` (product_category, aov, gross_margin, primary_goal,
// monthly_budget, break_even_roas).
//
// Injected into EVERY VAI prompt (analyze, optimize, vision-drop, weekly-brief)
// and used by the Performance Calculator so profitability is judged against the
// brand's REAL break-even ROAS — a 1.8x campaign is profitable at a 1.5x
// break-even but unprofitable at a 2.5x break-even.
//
// Keep this file dependency-free and runtime-agnostic (no Node/Deno APIs).
// It is mirrored conceptually into the weekly-brief edge function (inline) the
// same way vai-rules.ts is — if you change the prompt block here, update that
// inline copy too.
// ─────────────────────────────────────────────────────────────────────────

export type PrimaryGoal = 'acquisition' | 'retention' | 'scaling' | 'lead_gen'

export type BusinessContext = {
  productCategory?: string | null
  aov?: number | null            // average order value, $
  grossMargin?: number | null    // percent, 0–100
  primaryGoal?: PrimaryGoal | string | null
  monthlyBudget?: number | null  // $
  breakEvenRoas?: number | null  // explicit override
}

export const GOAL_LABELS: Record<string, string> = {
  acquisition: 'New customer acquisition',
  retention: 'Customer retention',
  scaling: 'Scaling (profitable growth)',
  lead_gen: 'Lead generation',
}

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Normalize a `clients` table row (snake_case) into the BusinessContext shape.
export function businessContextFromRow(row: any): BusinessContext {
  if (!row) return {}
  return {
    productCategory: row.product_category ?? null,
    aov: toNum(row.aov),
    grossMargin: toNum(row.gross_margin),
    primaryGoal: row.primary_goal ?? null,
    monthlyBudget: toNum(row.monthly_budget),
    breakEvenRoas: toNum(row.break_even_roas),
  }
}

// Break-even ROAS: revenue ÷ spend at which the campaign exactly covers cost of
// goods. With a gross margin m (fraction), each $1 of revenue yields $m of
// gross profit, so break-even is when spend = revenue × m → ROAS = 1/m.
// An explicit override always wins; otherwise compute from gross margin.
export function computeBreakEvenRoas(ctx: BusinessContext): number | null {
  const explicit = toNum(ctx.breakEvenRoas)
  if (explicit != null && explicit > 0) return Math.round(explicit * 100) / 100
  const m = toNum(ctx.grossMargin)
  if (m != null && m > 0 && m <= 100) return Math.round((100 / m) * 100) / 100
  return null
}

// True when we have enough to judge profitability against real economics.
export function hasBusinessContext(ctx: BusinessContext): boolean {
  return (
    (ctx.grossMargin != null && ctx.grossMargin > 0) ||
    (ctx.breakEvenRoas != null && ctx.breakEvenRoas > 0) ||
    ctx.aov != null ||
    !!ctx.productCategory ||
    !!ctx.primaryGoal
  )
}

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

// Drop-in prompt block appended to every VAI prompt. When the brand's economics
// are on file it forces VAI to use their REAL margin/AOV and judge against their
// REAL break-even ROAS. When they're absent (e.g. a cold prospect audit) it
// returns a short note that still teaches the break-even principle and explains
// what connecting the account unlocks — so every prompt carries economics.
export function buildBusinessContextBlock(ctx: BusinessContext): string {
  const goalLabel =
    ctx.primaryGoal ? (GOAL_LABELS[String(ctx.primaryGoal)] || String(ctx.primaryGoal)) : null
  const be = computeBreakEvenRoas(ctx)

  if (!hasBusinessContext(ctx)) {
    return [
      '',
      'BUSINESS ECONOMICS: This account has not provided its margin/AOV yet, so use a generic working break-even of ~2.0x ROAS — but be explicit that real break-even depends entirely on gross margin (a 50% margin = 2.0x break-even, a 70% margin = ~1.43x, a 40% margin = 2.5x). Do not declare a campaign "profitable" or "unprofitable" in absolute terms without flagging that the verdict flips with their true margin, and note that providing margin + AOV unlocks exact, dollar-accurate judgments.',
    ].join('\n')
  }

  const lines: string[] = [
    '',
    'BUSINESS CONTEXT — judge this campaign against THESE real economics, not generic DTC assumptions:',
  ]
  if (ctx.productCategory) lines.push(`- Sells: ${ctx.productCategory}`)
  if (ctx.aov != null) lines.push(`- Average order value (AOV): ${money(ctx.aov)}`)
  if (ctx.grossMargin != null) lines.push(`- Gross margin: ${Math.round(ctx.grossMargin)}%`)
  if (goalLabel) lines.push(`- Primary goal: ${goalLabel}`)
  if (ctx.monthlyBudget != null) lines.push(`- Monthly ad budget: ${money(ctx.monthlyBudget)}`)
  if (be != null) {
    const src = ctx.breakEvenRoas != null && ctx.breakEvenRoas > 0
      ? 'provided'
      : `computed as 1 ÷ ${Math.round(ctx.grossMargin || 0)}% margin`
    lines.push(`- BREAK-EVEN ROAS: ${be.toFixed(2)}x (${src}). Below this they lose money after cost of goods; above it they profit.`)
  }

  const mandatory: string[] = ['', 'MANDATORY — apply these economics throughout:']
  if (be != null) {
    mandatory.push(
      `- Judge profitability against the ${be.toFixed(2)}x break-even, NOT a generic 2x/2.5x bar. State plainly whether this campaign's ROAS is above or below ${be.toFixed(2)}x and therefore profitable or unprofitable for THIS brand. (A 1.8x campaign is profitable at a 1.5x break-even but loss-making at a 2.5x break-even — context decides.)`,
    )
  }
  if (ctx.grossMargin != null) {
    mandatory.push(
      `- When you compute profit or recoverable waste, use the real ${Math.round(ctx.grossMargin)}% gross margin (gross profit = revenue × ${(Math.round(ctx.grossMargin) / 100).toFixed(2)}), not revenue itself. Quote the actual dollar profit/loss.`,
    )
  }
  if (ctx.aov != null) {
    mandatory.push(
      `- Use their real ${money(ctx.aov)} AOV in any per-customer math (max profitable CPA = ${money((ctx.aov || 0) * ((ctx.grossMargin ?? 100) / 100))} at their margin). Don't assume a generic order value.`,
    )
  }
  if (goalLabel) {
    mandatory.push(
      `- Frame recommendations around their primary goal (${goalLabel}). The right move for a scaling brand differs from a retention or lead-gen brand.`,
    )
  }

  return lines.concat(mandatory).join('\n')
}
