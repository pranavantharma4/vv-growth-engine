'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from './context'
import { computeBreakEvenRoas, GOAL_LABELS } from '../../lib/business-context'

// Reusable Business Profile editor. Captures the per-client unit economics that
// make VAI's analysis brand-aware (what they sell, AOV, gross margin, primary
// goal, monthly budget, break-even ROAS). Used in onboarding and Settings.
// Loads/saves the new columns on `clients` directly.

type Props = {
  clientId: string
  embedded?: boolean        // hide outer chrome when nested in onboarding
  onSaved?: () => void
}

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"

const GOALS: { id: string; label: string }[] = [
  { id: 'acquisition', label: GOAL_LABELS.acquisition },
  { id: 'scaling', label: GOAL_LABELS.scaling },
  { id: 'retention', label: GOAL_LABELS.retention },
  { id: 'lead_gen', label: GOAL_LABELS.lead_gen },
]

export default function BusinessContextForm({ clientId, embedded, onSaved }: Props) {
  const supabase = createClientComponentClient()
  const { toast } = useApp()

  const [productCategory, setProductCategory] = useState('')
  const [aov, setAov] = useState('')
  const [grossMargin, setGrossMargin] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [breakEvenOverride, setBreakEvenOverride] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!clientId) return
    ;(async () => {
      const { data } = await supabase
        .from('clients')
        .select('product_category, aov, gross_margin, primary_goal, monthly_budget, break_even_roas')
        .eq('id', clientId)
        .maybeSingle()
      if (data) {
        setProductCategory(data.product_category ?? '')
        setAov(data.aov != null ? String(data.aov) : '')
        setGrossMargin(data.gross_margin != null ? String(data.gross_margin) : '')
        setPrimaryGoal(data.primary_goal ?? '')
        setMonthlyBudget(data.monthly_budget != null ? String(data.monthly_budget) : '')
        setBreakEvenOverride(data.break_even_roas != null ? String(data.break_even_roas) : '')
      }
      setLoaded(true)
    })()
  }, [clientId])

  const marginNum = parseFloat(grossMargin)
  // Live break-even preview: explicit override wins, else 100/margin.
  const computed = computeBreakEvenRoas({
    grossMargin: Number.isFinite(marginNum) ? marginNum : null,
    breakEvenRoas: breakEvenOverride.trim() === '' ? null : parseFloat(breakEvenOverride),
  })

  async function save() {
    if (!clientId) return
    setSaving(true)
    const numOrNull = (v: string) => {
      const n = parseFloat(v)
      return v.trim() === '' || !Number.isFinite(n) ? null : n
    }
    const { error } = await supabase
      .from('clients')
      .update({
        product_category: productCategory.trim() || null,
        aov: numOrNull(aov),
        gross_margin: numOrNull(grossMargin),
        primary_goal: primaryGoal || null,
        monthly_budget: numOrNull(monthlyBudget),
        break_even_roas: numOrNull(breakEvenOverride),
      })
      .eq('id', clientId)
    setSaving(false)
    if (error) { toast('Error', error.message); return }
    toast('Saved', 'Business profile updated — VAI now uses your real economics.')
    onSaved?.()
  }

  const fi: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 4, fontSize: 13, fontFamily: SANS }
  const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }

  if (!loaded) {
    return <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--ink3)', letterSpacing: '0.5px' }}>Loading business profile…</div>
  }

  return (
    <div>
      {!embedded && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: SANS, fontSize: 12, color: 'var(--ink2)', lineHeight: 1.7 }}>
            VAI uses these to judge every campaign against <strong>your</strong> real economics — your margin, AOV, and break-even ROAS — instead of generic assumptions.
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={lbl}>What you sell (product / category)</div>
        <input style={fi} value={productCategory} onChange={e => setProductCategory(e.target.value)} placeholder="e.g. Premium skincare serums" />
      </div>

      <div className="vv-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={lbl}>Average Order Value ($)</div>
          <input style={fi} type="number" inputMode="decimal" min="0" value={aov} onChange={e => setAov(e.target.value)} placeholder="e.g. 65" />
        </div>
        <div>
          <div style={lbl}>Gross Margin (%)</div>
          <input style={fi} type="number" inputMode="decimal" min="0" max="100" value={grossMargin} onChange={e => setGrossMargin(e.target.value)} placeholder="e.g. 60" />
        </div>
      </div>

      <div className="vv-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={lbl}>Primary Goal</div>
          <select style={{ ...fi, cursor: 'pointer' }} value={primaryGoal} onChange={e => setPrimaryGoal(e.target.value)}>
            <option value="">Select a goal…</option>
            {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <div style={lbl}>Monthly Ad Budget ($)</div>
          <input style={fi} type="number" inputMode="decimal" min="0" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} placeholder="e.g. 10000" />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={lbl}>Break-Even ROAS <span style={{ color: 'var(--ink4,rgba(255,255,255,.2))' }}>· optional override</span></div>
        <input
          style={fi}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={breakEvenOverride}
          onChange={e => setBreakEvenOverride(e.target.value)}
          placeholder={computed != null ? `Auto: ${computed.toFixed(2)}x (from your margin)` : 'Enter margin above to auto-calculate'}
        />
        <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px', marginTop: 6, lineHeight: 1.7 }}>
          {computed != null
            ? `At ${Number.isFinite(marginNum) && breakEvenOverride.trim() === '' ? `${Math.round(marginNum)}% margin, ` : ''}you break even at ${computed.toFixed(2)}x ROAS — below this you lose money after cost of goods, above it you profit. Leave the override blank to keep it tied to your margin.`
            : 'Break-even ROAS = 1 ÷ gross margin. Enter your margin above and we compute it automatically (50% margin → 2.0x, 70% → ~1.43x).'}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : 'Save Business Profile →'}
      </button>
    </div>
  )
}
