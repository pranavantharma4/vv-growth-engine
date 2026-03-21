'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { Pill, PlatPill } from '@/app/dashboard/page'
import { fmtMoney, roasColor } from '@/lib/types'
import type { CampaignSnapshot, BiggestLeak } from '@/lib/types'

// ── Unique ID generator ──────────────────────────────────────────
function uid() { return 'VV-' + Date.now().toString(36).toUpperCase().slice(-6) }

// ── Platform-specific implementation steps ───────────────────────
function buildSteps(platform: string, mode: string, form: Record<string, string>, creativeType: string): string[] {
  const isEdit = mode === 'edit'
  const camp = form.name || 'New Campaign'
  const budget = form.budget ? '$' + form.budget + '/day' : 'Not specified'
  const aud = form.aud || 'Lookalike — 1% Past Purchasers'
  const obj = form.obj || 'Conversions'
  const bid = form.bid || 'Lowest Cost'
  const start = form.start || new Date().toISOString().split('T')[0]
  const creativeLine = creativeType === 'ai'
    ? 'Upload the AI-generated creatives from this blueprint. Create one ad per creative to enable individual performance tracking.'
    : 'Upload your external creative files. Create one ad per creative variant — naming each clearly so performance can be attributed by creative.'

  const meta = [
    'Open Meta Ads Manager at business.facebook.com/adsmanager. ' + (isEdit ? 'Find "' + camp + '" in your Campaigns list.' : 'Click the green Create button in the top left.'),
    isEdit ? 'Click into the campaign. Select Edit from the toolbar. Confirm you are editing at Campaign level, not Ad Set or Ad level.' : 'Select "' + obj + '" as your campaign objective. Name it exactly: "' + camp + '". Click Continue.',
    'At the Ad Set level, configure audience: ' + aud + '. ' + (aud.includes('Lookalike') ? 'Upload your customer list of 500+ purchasers as the source audience for the lookalike.' : 'Confirm your pixel is firing on the correct conversion event before proceeding.'),
    'Set daily budget to ' + budget + '. Bid strategy: ' + bid + '. Leave Advantage+ Campaign Budget OFF — manage budgets at Ad Set level for maximum control.',
    creativeLine,
    'Set start date to ' + start + '. Review all settings one final time. Click Publish. Do not make changes during the 7-day learning phase — allow the algorithm to stabilise.',
    'Return to your VV Growth Dashboard after 7 days to generate an updated AI analysis. Compare new ROAS against this baseline and share results with your VV account manager.',
  ]

  const google = [
    'Open Google Ads at ads.google.com. ' + (isEdit ? 'Navigate to Campaigns and select "' + camp + '".' : 'Click the blue New Campaign button.'),
    isEdit ? 'Click Edit campaign settings in the left panel. Verify you have the correct campaign selected before making any changes.' : 'Choose campaign goal: "' + obj + '". Select campaign type: Search. Name it: "' + camp + '".',
    'Set daily budget to ' + budget + '. Bidding: ' + bid + '. Enable conversion tracking before setting bids — Google cannot optimise without verified conversion data.',
    'Configure keywords under Ad Groups. Use Exact Match and Phrase Match. Avoid Broad Match until ROAS is proven at this budget level.',
    creativeLine,
    'Set start date to ' + start + '. Review for flagged issues. Click Publish. Allow 2-4 weeks for full data accumulation before drawing performance conclusions.',
    'Monitor in your VV Growth Dashboard. Flag any campaigns entering Limited status to your VV account manager immediately.',
  ]

  const tiktok = [
    'Open TikTok Ads Manager at ads.tiktok.com. ' + (isEdit ? 'Find "' + camp + '" in your Campaign list.' : 'Click Create in the top right.'),
    isEdit ? 'Select Edit next to the campaign name. Verify scope before saving — changes at Campaign level propagate to all Ad Sets.' : 'Select objective: "' + obj + '". Name the campaign: "' + camp + '".',
    'At the Ad Group level, configure audience: ' + aud + '. Enable TikTok Pixel and verify it fires on your purchase event. Without this, conversion bidding will not function.',
    'Set daily budget: ' + budget + '. Minimum for Conversion objective is $50/day — adjust if your specified budget is below this threshold.',
    creativeType === 'ai' ? 'Upload AI-generated creatives. TikTok requires 9:16 vertical format. Videos must be 5-60 seconds. Add captions — 85% of TikTok is watched without sound.' : creativeLine,
    'Launch with start date ' + start + '. Learning phase: 7 days or 50 conversion events, whichever comes first. Do not edit during this period.',
    'Check your VV Growth Dashboard after the learning phase. TikTok performance is highly creative-dependent — VV will flag creative fatigue within 2-3 weeks.',
  ]

  const map: Record<string, string[]> = { meta, google, tiktok }
  return map[platform] || meta
}

// ── Stepper component ────────────────────────────────────────────
function Stepper({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 500, flexShrink: 0,
              background: i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--card2)',
              border: '1.5px solid ' + (i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--rule2)'),
              color: i <= step ? '#fff' : 'var(--ink3)',
              transition: 'all .2s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, textTransform: 'uppercase',
              color: i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--ink3)',
              transition: 'color .2s',
            }}>{label}</div>
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green)' : 'var(--rule2)', margin: '0 8px', maxWidth: 40, transition: 'background .2s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Form components ──────────────────────────────────────────────
function FieldLabel({ children }: { children: string }) {
  return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>{children}</div>
}

function Input({ id, placeholder, value, type = 'text' }: { id: string; placeholder?: string; value?: string; type?: string }) {
  return <input id={id} type={type} defaultValue={value} placeholder={placeholder} style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'var(--card2)', color: 'var(--ink)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: 'none' }} />
}

function Select({ id, options, defaultValue }: { id: string; options: string[]; defaultValue?: string }) {
  return (
    <select id={id} defaultValue={defaultValue} style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'var(--card2)', color: 'var(--ink)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: 'none', cursor: 'pointer' }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

// ── Main optimize page ───────────────────────────────────────────
function OptimizeContent() {
  const { client } = useApp()
  const supabase = createClientComponentClient()
  const params = useSearchParams()
  const preId = params.get('id')

  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'edit' | 'new'>('edit')
  const [camps, setCamps] = useState<CampaignSnapshot[]>([])
  const [leaks, setLeaks] = useState<BiggestLeak[]>([])
  const [selected, setSelected] = useState<CampaignSnapshot | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [creativeType, setCreativeType] = useState<'external' | 'ai' | null>(null)
  const [selCreatives, setSelCreatives] = useState<number[]>([])
  const [aiStep, setAiStep] = useState('')
  const [showCreatives, setShowCreatives] = useState(false)
  const [blueprint, setBlueprint] = useState<{ refId: string; steps: string[] } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!client) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('campaign_snapshots').select('*').eq('client_id', client.id).eq('snapshot_date', today).order('spend', { ascending: false })
      .then(({ data }) => setCamps(data || []))
    supabase.from('biggest_leaks').select('*').eq('client_id', client.id)
      .then(({ data }) => setLeaks(data || []))
    if (preId) {
      supabase.from('campaign_snapshots').select('*').eq('client_id', client.id).eq('campaign_id', preId).single()
        .then(({ data }) => { if (data) { setSelected(data); setMode('edit') } })
    }
  }, [client])

  function saveFormValues() {
    const get = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement)?.value || ''
    setForm({
      name:   get('f-name'),
      plat:   get('f-plat'),
      budget: get('f-budget'),
      obj:    get('f-obj'),
      aud:    get('f-aud'),
      bid:    get('f-bid'),
      start:  get('f-start'),
      notes:  get('f-notes'),
    })
  }

  function toggleCreative(i: number) {
    setSelCreatives(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  function runAICreatives() {
    const steps = ['Analyzing creative brief...', 'Generating image variants...', 'Applying brand formatting...', 'Optimising for platform specs...', 'Finalising assets...']
    let i = 0
    setAiStep(steps[0])
    const iv = setInterval(() => {
      i++
      if (i < steps.length) setAiStep(steps[i])
      if (i >= steps.length - 1) { clearInterval(iv); setTimeout(() => setShowCreatives(true), 500) }
    }, 700)
  }

  async function generateBlueprint() {
    setSaving(true)
    const refId = uid()
    const platKey = form.plat?.toLowerCase().includes('meta') ? 'meta' : form.plat?.toLowerCase().includes('google') ? 'google' : 'tiktok'
    const steps = buildSteps(platKey, mode, form, creativeType || 'external')
    setBlueprint({ refId, steps })

    // Save to Supabase
    await supabase.from('optimization_blueprints').insert({
      client_id: client!.id,
      ref_id: refId,
      campaign_name: form.name || 'New Campaign',
      platform: form.plat || 'Meta Ads',
      action_type: mode,
      daily_budget: form.budget ? parseFloat(form.budget) : null,
      objective: form.obj || null,
      audience: form.aud || null,
      bid_strategy: form.bid || null,
      start_date: form.start || null,
      creative_type: creativeType,
      creative_count: selCreatives.length,
      form_data: form,
      implementation_steps: steps,
    })
    setSaving(false)
    setStep(4)
  }

  // ── Leak sidebar ──
  const LeakSidebar = () => (
    <div style={{ background: 'var(--redpaper)', border: '1px solid var(--redborder)', borderLeft: '3px solid var(--red)', borderRadius: 8, padding: 15, position: 'sticky', top: 0 }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--red)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 9 }}>AI Recommendations</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: 1, marginBottom: 10 }}>From Funnel Blindness Analysis</div>
      {leaks.map((l, i) => (
        <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < leaks.length - 1 ? '1px solid var(--redborder)' : 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3, lineHeight: 1.3 }}>{l.campaign_name}</div>
          <div style={{ marginBottom: 3 }}><PlatPill platform={l.platform} /></div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--red)', lineHeight: 1.4 }}>
            → {l.health === 'dead' ? 'Pause immediately. Reallocate ' + fmtMoney(Number(l.spend)) + ' to top performer.' : 'Reduce budget 50%. Refresh creative within 48 hours.'}
          </div>
        </div>
      ))}
      {leaks.length === 0 && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>No critical leaks detected.</div>
      )}
    </div>
  )

  // ── Step 0: Mode ──
  const StepMode = () => (
    <div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, marginBottom: 16 }}>What would you like to do?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { id: 'edit', icon: '◫', title: 'Edit Existing Campaign', desc: 'Adjust settings, replace creatives, or update targeting on a live campaign.' },
          { id: 'new',  icon: '◈', title: 'Build New Campaign',    desc: 'Start from scratch with full control over every parameter and creative.' },
        ].map(opt => (
          <div key={opt.id} onClick={() => { setMode(opt.id as 'edit' | 'new'); if (opt.id === 'new') setSelected(null) }}
            style={{ padding: 20, cursor: 'pointer', background: 'var(--card)', border: '2px solid ' + (mode === opt.id ? 'var(--gold)' : 'var(--rule2)'), borderRadius: 8, transition: 'border-color .15s' }}>
            <div style={{ fontSize: 22, marginBottom: 9, color: 'var(--gold)' }}>{opt.icon}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, marginBottom: 5 }}>{opt.title}</div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>{opt.desc}</div>
          </div>
        ))}
      </div>

      {mode === 'edit' && (
        <>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, marginBottom: 12 }}>Select Campaign to Edit</div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Campaign','Platform','Spend','ROAS','Health',''].map(h => (
                  <th key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: 2, textTransform: 'uppercase', padding: '9px 12px', borderBottom: '1px solid var(--rule2)', textAlign: 'left', fontWeight: 400 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {camps.map((c, i) => (
                  <tr key={c.id} onClick={() => setSelected(c)} style={{ borderBottom: i < camps.length - 1 ? '1px solid var(--rule)' : 'none', background: selected?.id === c.id ? 'var(--goldpaper)' : 'transparent', cursor: 'pointer' }}>
                    <td style={{ padding: '11px 12px', fontSize: 12, fontWeight: 500 }}>{c.campaign_name}</td>
                    <td style={{ padding: '11px 12px' }}><PlatPill platform={c.platform} /></td>
                    <td style={{ padding: '11px 12px', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ink2)' }}>{fmtMoney(Number(c.spend))}</td>
                    <td style={{ padding: '11px 12px', fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: roasColor(Number(c.roas)) }}>{Number(c.roas).toFixed(1)}x</td>
                    <td style={{ padding: '11px 12px' }}><Pill health={c.health} /></td>
                    <td style={{ padding: '11px 12px' }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(c) }} style={{ padding: '3px 9px', borderRadius: 3, fontFamily: "'DM Mono',monospace", fontSize: 8, color: selected?.id === c.id ? '#faf8f5' : 'var(--gold)', border: '1px solid var(--goldborder)', background: selected?.id === c.id ? 'var(--gold)' : 'var(--goldpaper)', cursor: 'pointer' }}>
                        {selected?.id === c.id ? 'Selected ✓' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setStep(1)} disabled={mode === 'edit' && !selected} style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: (mode === 'edit' && !selected) ? 'var(--bg3)' : 'var(--gold)', color: '#faf8f5', cursor: (mode === 'edit' && !selected) ? 'not-allowed' : 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1 }}>
          Continue →
        </button>
      </div>
    </div>
  )

  // ── Step 1: Settings ──
  const StepSettings = () => {
    const c = selected
    const platOptions = ['Meta (Facebook/Instagram)', 'Google Ads', 'TikTok Ads']
    const defaultPlat = c?.platform === 'meta' ? platOptions[0] : c?.platform === 'google' ? platOptions[1] : c?.platform === 'tiktok' ? platOptions[2] : platOptions[0]
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>{mode === 'edit' ? 'Edit Campaign Settings' : 'New Campaign Settings'}</div>
          <button onClick={() => setStep(0)} style={{ padding: '5px 12px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
        </div>
        {mode === 'edit' && c && (
          <div style={{ background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderLeft: '2px solid var(--gold)', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--goldlt)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Editing</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{c.campaign_name}</div>
          </div>
        )}
        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '18px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><FieldLabel>Campaign Name</FieldLabel><Input id="f-name" placeholder={mode === 'new' ? 'Enter campaign name' : c?.campaign_name} value={mode === 'edit' ? c?.campaign_name : ''} /></div>
            <div><FieldLabel>Platform</FieldLabel><Select id="f-plat" options={platOptions} defaultValue={defaultPlat} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><FieldLabel>Daily Budget ($)</FieldLabel><Input id="f-budget" type="number" placeholder="e.g. 150" value={c ? String(Math.round(Number(c.spend) / 30)) : ''} /></div>
            <div><FieldLabel>Campaign Objective</FieldLabel><Select id="f-obj" options={['Conversions', 'Traffic', 'Lead Generation', 'Brand Awareness / Reach', 'Catalog Sales']} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><FieldLabel>Audience Type</FieldLabel><Select id="f-aud" options={['Lookalike — 1% Past Purchasers', 'Retargeting — Website Visitors', 'Broad — Interest Based', 'Custom — Email List', 'Cold — Demographic Targeting']} /></div>
            <div><FieldLabel>Bid Strategy</FieldLabel><Select id="f-bid" options={['Lowest Cost (Automatic)', 'Cost Cap', 'Target ROAS', 'Manual CPC']} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><FieldLabel>Start Date</FieldLabel><Input id="f-start" type="date" value={new Date().toISOString().split('T')[0]} /></div>
            <div><FieldLabel>End Date (optional)</FieldLabel><Input id="f-end" type="date" /></div>
          </div>
          <div><FieldLabel>Notes / Context</FieldLabel><textarea id="f-notes" rows={3} placeholder="Any specific instructions or context for this campaign..." style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'var(--card2)', color: 'var(--ink)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: 'none', resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={() => setStep(0)} style={{ padding: '8px 14px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
          <button onClick={() => { saveFormValues(); setStep(2) }} style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: 'var(--gold)', color: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1 }}>Continue →</button>
        </div>
      </div>
    )
  }

  // ── Step 2: Creatives ──
  const StepCreatives = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>Creatives</div>
        <button onClick={() => setStep(1)} style={{ padding: '5px 12px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {[
          { id: 'external', icon: '↑', title: 'Upload External Creatives', desc: 'Upload your own images or video files. JPG, PNG, MP4. Up to 10 files per campaign.' },
          { id: 'ai', icon: '◉', title: 'Generate AI Creatives', desc: 'Describe your brief and AI generates ad-ready images across all required platform formats.' },
        ].map(opt => (
          <div key={opt.id} onClick={() => { setCreativeType(opt.id as 'external' | 'ai'); setShowCreatives(false) }}
            style={{ padding: 18, cursor: 'pointer', background: 'var(--card)', border: '2px solid ' + (creativeType === opt.id ? 'var(--gold)' : 'var(--rule2)'), borderRadius: 8, transition: 'border-color .15s' }}>
            <div style={{ fontSize: 20, marginBottom: 8, color: 'var(--gold)' }}>{opt.icon}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, marginBottom: 4 }}>{opt.title}</div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>{opt.desc}</div>
          </div>
        ))}
      </div>

      {/* External upload */}
      {creativeType === 'external' && (
        <div>
          <div style={{ border: '1.5px dashed var(--rule2)', borderRadius: 8, padding: '28px 20px', textAlign: 'center', background: 'var(--card2)', marginBottom: 12 }}>
            <div style={{ fontSize: 26, color: 'var(--ink3)', marginBottom: 9 }}>↑</div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 3 }}>Drop files here or click to browse</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>JPG, PNG, MP4 · Up to 10 files · 50MB max each</div>
          </div>
          <div style={{ padding: '11px 13px', background: 'var(--card2)', borderRadius: 6, border: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 7 }}>Uploaded Files</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['1:1 Square.jpg','9:16 Story.jpg','16:9 Banner.jpg'].map(f => (
                <div key={f} style={{ padding: '5px 10px', background: 'var(--greenpaper)', border: '1px solid var(--greenborder)', borderRadius: 4, fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--green)' }}>✓ {f}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI creatives */}
      {creativeType === 'ai' && (
        <div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '17px 19px', marginBottom: 11 }}>
            <div style={{ marginBottom: 12 }}>
              <FieldLabel>Creative Brief</FieldLabel>
              <textarea id="ai-brief" rows={3} placeholder="Describe your ad creative in plain English. e.g. Woman in athletic wear, morning yoga, natural light, minimal text: Summer Sale 20% Off" style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'var(--card2)', color: 'var(--ink)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><FieldLabel>Visual Style</FieldLabel><Select id="ai-style" options={['Clean and Minimal', 'Bold and High Contrast', 'Lifestyle / UGC Feel', 'Product Focus']} /></div>
              <div><FieldLabel>Output Formats</FieldLabel><Select id="ai-formats" options={['All Formats (1:1, 9:16, 16:9)', 'Square Only (1:1)', 'Story Only (9:16)']} /></div>
            </div>
            {!showCreatives && !aiStep && (
              <button onClick={runAICreatives} style={{ width: '100%', padding: '9px', border: 'none', borderRadius: 5, background: 'var(--gold)', color: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1 }}>
                Generate Creatives →
              </button>
            )}
          </div>

          {aiStep && !showCreatives && (
            <div style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--rule2)', borderTopColor: 'var(--gold)', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, marginBottom: 5 }}>{aiStep}</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {showCreatives && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '15px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Select Creatives to Use</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
                {[{name:'Variant A — Square',dim:'1080 × 1080',bg:'#f0f7f0',em:'🧘'},{name:'Variant B — Story',dim:'1080 × 1920',bg:'#fdf6e3',em:'⚡'},{name:'Variant C — Banner',dim:'1200 × 628',bg:'#fdf0f0',em:'🏃'}].map((c, i) => (
                  <div key={i} onClick={() => toggleCreative(i)} style={{ border: '2px solid ' + (selCreatives.includes(i) ? 'var(--gold)' : 'var(--rule)'), borderRadius: 8, overflow: 'hidden', cursor: 'pointer', boxShadow: selCreatives.includes(i) ? '0 0 0 1px var(--gold)' : 'none', transition: 'all .15s' }}>
                    <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, fontSize: 32 }}>{c.em}</div>
                    <div style={{ padding: '7px 9px', borderTop: '1px solid var(--rule)' }}>
                      <div style={{ fontSize: 10, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{c.dim}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>Select 2-3 variants — multiple creatives allow the platform to identify the top performer.</div>
            </div>
          )}
        </div>
      )}

      {creativeType && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={() => setStep(1)} style={{ padding: '8px 14px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
          <button onClick={() => setStep(3)} style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: 'var(--gold)', color: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1 }}>Continue →</button>
        </div>
      )}
    </div>
  )

  // ── Step 3: Review ──
  const StepReview = () => {
    const platLabel = form.plat?.includes('Google') ? 'Google Ads' : form.plat?.includes('TikTok') ? 'TikTok Ads' : 'Meta Ads'
    const rows = [
      ['Action', mode === 'edit' ? 'Editing existing campaign' : 'Building new campaign'],
      ['Campaign', form.name || 'New Campaign'],
      ['Platform', platLabel],
      ['Daily Budget', form.budget ? '$' + form.budget + '/day' : 'Not set'],
      ['Objective', form.obj || 'Conversions'],
      ['Audience', form.aud || 'Lookalike — 1% Past Purchasers'],
      ['Bid Strategy', form.bid || 'Lowest Cost'],
      ['Start Date', form.start || 'Today'],
      ['Creatives', creativeType === 'ai' ? selCreatives.length + ' AI-generated variant' + (selCreatives.length !== 1 ? 's' : '') + ' selected' : creativeType === 'external' ? 'External assets uploaded' : 'None selected'],
    ]
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>Review and Verify</div>
          <button onClick={() => setStep(2)} style={{ padding: '5px 12px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '17px 20px', marginBottom: 14 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>Campaign Summary</div>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--rule)', fontSize: 12 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderLeft: '2px solid var(--gold)', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--goldlt)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>What Happens Next</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.7 }}>Once you verify, you receive a unique implementation blueprint — step-by-step instructions calibrated to your exact campaign settings, ready to execute directly on the ad platform.</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setStep(2)} style={{ padding: '8px 14px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
          <button onClick={generateBlueprint} disabled={saving} style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: saving ? 'var(--bg3)' : 'var(--gold)', color: '#faf8f5', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1 }}>
            {saving ? 'Generating...' : 'Verify and Generate Blueprint →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 4: Blueprint PDF ──
  const StepBlueprint = () => {
    if (!blueprint) return null
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const platLabel = form.plat?.includes('Google') ? 'Google Ads' : form.plat?.includes('TikTok') ? 'TikTok Ads' : 'Meta Ads'
    const paramRows = [
      ['Campaign', form.name || 'New Campaign'],
      ['Platform', platLabel],
      ['Action', mode === 'edit' ? 'Edit existing campaign' : 'Create new campaign'],
      ['Daily Budget', form.budget ? '$' + form.budget + '/day' : 'Not specified'],
      ['Objective', form.obj || 'Conversions'],
      ['Audience', form.aud || 'Lookalike — 1% Past Purchasers'],
      ['Bid Strategy', form.bid || 'Lowest Cost (Automatic)'],
      ['Start Date', form.start || 'Today'],
      ['Creatives', creativeType === 'ai' ? selCreatives.length + ' AI-generated variants' : 'External assets provided'],
    ]
    return (
      <div>
        <div style={{ background: 'var(--greenpaper)', border: '1px solid var(--greenborder)', borderLeft: '2px solid var(--green)', borderRadius: 6, padding: '11px 15px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--green)', letterSpacing: '2px', marginBottom: 3 }}>BLUEPRINT GENERATED · SAVED TO SUPABASE</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)' }}>Your implementation blueprint is ready. Follow the steps below on your ad platform to execute all changes.</div>
        </div>

        {/* PDF Document */}
        <div id="pdf-blueprint" style={{ background: '#fff', color: '#1a1714', border: '1px solid #ddd', borderRadius: 8, padding: '34px 38px', maxWidth: 680, margin: '0 auto', boxShadow: '0 6px 24px rgba(0,0,0,.1)' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #1a1714', paddingBottom: 14, marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: '#1a1714', letterSpacing: 2 }}>VV</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9a9390', letterSpacing: '1.5px', marginTop: 2 }}>VANGUARD VISUALS · GROWTH AD ENGINE</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9a9390', marginTop: 2 }}>Implementation Blueprint</div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9a9390', lineHeight: 1.7 }}>
              Reference: <strong style={{ color: '#8b6914' }}>{blueprint.refId}</strong><br />
              {dateStr}<br />
              Client: {client?.name}<br />
              Prepared by: VV Growth Team
            </div>
          </div>

          {/* Parameters */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b6914', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #e8e3da' }}>Campaign Parameters</div>
            {paramRows.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f2efe9', fontSize: 12 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9a9390' }}>{k}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, color: '#1a1714' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b6914', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #e8e3da' }}>Step-by-Step Implementation</div>
            {blueprint.steps.map((s, i) => (
              <div key={i} style={{ background: '#fdf6e3', borderLeft: '3px solid #8b6914', padding: '10px 13px', marginBottom: 7, borderRadius: '0 5px 5px 0' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b6914', letterSpacing: 1, marginBottom: 3 }}>STEP {i + 1} OF {blueprint.steps.length}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#4a4540', lineHeight: 1.65 }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e8e3da', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9a9390', letterSpacing: 1 }}>Vanguard Visuals · Growth Ad Engine · Confidential Client Blueprint</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8b6914', background: '#fdf6e3', padding: '3px 8px', borderRadius: 3 }}>REF: {blueprint.refId}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }} className="no-print">
          <button onClick={() => window.print()} style={{ padding: '8px 16px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink2)', letterSpacing: 1 }}>↓ Print PDF</button>
          <button onClick={() => { setStep(0); setSelected(null); setForm({}); setCreativeType(null); setSelCreatives([]); setBlueprint(null); setShowCreatives(false); setAiStep('') }}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 5, background: 'var(--gold)', color: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1 }}>
            New Optimization →
          </button>
        </div>
      </div>
    )
  }

  const LABELS = ['Mode', 'Settings', 'Creatives', 'Review', 'Blueprint']

  return (
    <div>
      <Stepper step={step} total={LABELS.length} labels={LABELS} />
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'start' }}>
        <LeakSidebar />
        <div>
          {step === 0 && <StepMode />}
          {step === 1 && <StepSettings />}
          {step === 2 && <StepCreatives />}
          {step === 3 && <StepReview />}
          {step === 4 && <StepBlueprint />}
        </div>
      </div>
    </div>
  )
}

export default function OptimizePage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>Loading...</div>}>
      <OptimizeContent />
    </Suspense>
  )
}
