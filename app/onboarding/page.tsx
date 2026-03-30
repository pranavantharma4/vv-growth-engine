'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const PLATFORMS = [
  { id: 'meta',   label: 'Meta Ads',   icon: 'f',  color: '#1a56cc', bg: '#e8f0fe' },
  { id: 'google', label: 'Google Ads', icon: 'G',  color: '#1a6e1a', bg: '#e8f4e8' },
  { id: 'tiktok', label: 'TikTok Ads', icon: 'TT', color: '#cc1a3a', bg: '#fee8ee' },
]

type Campaign = {
  name: string
  platform: string
  monthly_spend: string
  roas: string
}

function Dot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: done ? 'var(--gold)' : active ? 'var(--ink)' : 'var(--bg3)',
      transition: 'background .2s'
    }} />
  )
}

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [clientId, setClientId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Step 0 — Welcome
  // Step 1 — Company info
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [contactName, setContactName] = useState('')
  const [monthlySpend, setMonthlySpend] = useState('')

  // Step 2 — Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { name: '', platform: 'meta', monthly_spend: '', roas: '' }
  ])

  // Step 3 — Platforms they use
  const [platforms, setPlatforms] = useState<string[]>([])

  // Step 4 — Done
  const [analysisReady, setAnalysisReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      // Check if they already have a client
      const { data: cu } = await supabase.from('client_users').select('client_id').eq('user_id', user.id).single()
      if (cu) {
        // Check if onboarding is done
        const { data: ob } = await supabase.from('onboarding').select('*').eq('client_id', cu.client_id).single()
        if (ob?.completed_at) { router.push('/dashboard'); return }
        setClientId(cu.client_id)
        if (ob?.step) setStep(['welcome','company','campaigns','platforms','done'].indexOf(ob.step))
      }
    })
  }, [])

  async function saveStep1() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (clientId) {
      await supabase.from('clients').update({
        name: company, industry, contact_name: contactName,
        monthly_ad_spend: Number(monthlySpend.replace(/[^0-9]/g, '')) || 0,
        contact_email: user.email, updated_at: new Date().toISOString()
      }).eq('id', clientId)
    } else {
      const { data: client } = await supabase.from('clients').insert({
        name: company, industry, contact_name: contactName,
        contact_email: user.email,
        monthly_ad_spend: Number(monthlySpend.replace(/[^0-9]/g, '')) || 0,
        plan: 'managed', status: 'active'
      }).select().single()
      if (!client) { setSaving(false); return }
      setClientId(client.id)
      await supabase.from('client_users').insert({ user_id: user.id, client_id: client.id, role: 'client' })
      await supabase.from('onboarding').insert({ client_id: client.id, step: 'campaigns' })
    }
    setSaving(false)
    setStep(2)
  }

  async function saveStep2() {
    if (!clientId) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const validCampaigns = campaigns.filter(c => c.name.trim())

    for (const c of validCampaigns) {
      const spend = Number(c.monthly_spend.replace(/[^0-9.]/g, '')) || 0
      const roas = Number(c.roas) || 1.0
      const revenue = spend * roas
      const health = roas >= 3 ? 'strong' : roas >= 2 ? 'weak' : roas >= 0.8 ? 'bleeding' : 'dead'
      await supabase.from('campaign_snapshots').insert({
        client_id: clientId,
        platform: c.platform,
        campaign_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        campaign_name: c.name,
        spend, revenue, roas, health,
        impressions: Math.floor(spend * 150),
        clicks: Math.floor(spend * 12),
        conversions: Math.floor(spend * 0.8),
        snapshot_date: today,
      })
    }
    await supabase.from('onboarding').update({ step: 'platforms', completed_steps: ['welcome','company','campaigns'] }).eq('client_id', clientId)
    setSaving(false)
    setStep(3)
  }

  async function saveStep3() {
    if (!clientId) return
    setSaving(true)
    for (const p of platforms) {
      await supabase.from('ad_connections').upsert({
        client_id: clientId, platform: p, is_active: false,
        account_name: `${company} — ${p.charAt(0).toUpperCase() + p.slice(1)} (pending connection)`
      }, { onConflict: 'client_id,platform' })
    }
    await supabase.from('onboarding').update({ step: 'done', completed_steps: ['welcome','company','campaigns','platforms'], completed_at: new Date().toISOString() }).eq('client_id', clientId)
    setSaving(false)
    setStep(4)
    setAnalysisReady(true)
  }

  const steps = ['Welcome', 'Your Account', 'Campaigns', 'Platforms', 'Done']

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', background: 'var(--card2)',
    border: '1px solid var(--rule2)', borderRadius: 6, color: 'var(--ink)',
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
    boxSizing: 'border-box'
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)',
    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6, display: 'block'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>Vanguard Visuals</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)' }}>Growth Ad Engine</div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 40 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot active={i === step} done={i < step} />
            {i < steps.length - 1 && <div style={{ width: 20, height: 1, background: i < step ? 'var(--gold)' : 'var(--rule2)' }} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 12, padding: '36px 40px' }}>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Welcome to Vanguard Intelligence</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, marginBottom: 16, lineHeight: 1.3 }}>
              Let's set up your account.<br />Takes less than 5 minutes.
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.75, marginBottom: 28 }}>
              We'll configure your Vanguard Intelligence dashboard so you can see exactly where your ad spend is going — and where it's being wasted. Your AI-powered brief will be ready the moment setup is complete.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                ['◈', 'Enter your active campaigns', 'Takes 2 minutes'],
                ['◈', 'Connect your ad accounts', 'Optional — we can do this together'],
                ['◈', 'Get your first AI analysis', 'Instant — powered by Claude'],
              ].map(([icon, title, sub]) => (
                <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gold)', fontSize: 9, marginTop: 3 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '12px 0', background: 'var(--gold)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#faf8f5', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Begin Setup →
            </button>
          </div>
        )}

        {/* Step 1 — Company info */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Step 1 of 3</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, marginBottom: 24 }}>Your Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input style={inputStyle} placeholder="Meridian Fitness Co." value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <input style={inputStyle} placeholder="Health & Fitness E-Commerce" value={industry} onChange={e => setIndustry(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input style={inputStyle} placeholder="James Caldwell" value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Estimated Monthly Ad Spend</label>
                <input style={inputStyle} placeholder="$15,000" value={monthlySpend} onChange={e => setMonthlySpend(e.target.value)} />
              </div>
            </div>
            <button
              onClick={saveStep1}
              disabled={!company || saving}
              style={{ width: '100%', padding: '12px 0', background: company ? 'var(--gold)' : 'var(--bg3)', border: 'none', borderRadius: 6, cursor: company ? 'pointer' : 'not-allowed', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#faf8f5', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 24 }}>
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        )}

        {/* Step 2 — Campaigns */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Step 2 of 3</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, marginBottom: 8 }}>Your Active Campaigns</div>
            <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20, lineHeight: 1.65 }}>Add your current running campaigns. Rough numbers are fine — we'll sync exact data once your accounts are connected.</p>

            {campaigns.map((c, i) => (
              <div key={i} style={{ background: 'var(--card2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>Campaign {i + 1}</div>
                  {campaigns.length > 1 && <button onClick={() => setCampaigns(campaigns.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 11 }}>✕</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Campaign Name</label>
                    <input style={inputStyle} placeholder="Summer Sale — Retargeting" value={c.name} onChange={e => { const arr = [...campaigns]; arr[i].name = e.target.value; setCampaigns(arr) }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Platform</label>
                    <select style={inputStyle} value={c.platform} onChange={e => { const arr = [...campaigns]; arr[i].platform = e.target.value; setCampaigns(arr) }}>
                      <option value="meta">Meta Ads</option>
                      <option value="google">Google Ads</option>
                      <option value="tiktok">TikTok Ads</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Monthly Spend ($)</label>
                    <input style={inputStyle} placeholder="3500" value={c.monthly_spend} onChange={e => { const arr = [...campaigns]; arr[i].monthly_spend = e.target.value; setCampaigns(arr) }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Current ROAS (approx)</label>
                    <input style={inputStyle} placeholder="2.4" value={c.roas} onChange={e => { const arr = [...campaigns]; arr[i].roas = e.target.value; setCampaigns(arr) }} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => setCampaigns([...campaigns, { name: '', platform: 'meta', monthly_spend: '', roas: '' }])}
              style={{ width: '100%', padding: '9px 0', background: 'transparent', border: '1px dashed var(--rule2)', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1, marginBottom: 16 }}>
              + Add Another Campaign
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: '1px solid var(--rule2)', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
              <button onClick={saveStep2} disabled={saving}
                style={{ flex: 2, padding: '11px 0', background: 'var(--gold)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#faf8f5', letterSpacing: '2px' }}>
                {saving ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Platforms */}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Step 3 of 3</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, marginBottom: 8 }}>Ad Platforms</div>
            <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20, lineHeight: 1.65 }}>Select the platforms you advertise on. Your VV manager will reach out to complete the live connections — this takes 10 minutes on a call.</p>

            {PLATFORMS.map(p => {
              const selected = platforms.includes(p.id)
              return (
                <div key={p.id} onClick={() => setPlatforms(selected ? platforms.filter(x => x !== p.id) : [...platforms, p.id])}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 8, border: `1px solid ${selected ? 'var(--goldborder)' : 'var(--rule)'}`, background: selected ? 'var(--goldpaper)' : 'var(--card2)', cursor: 'pointer', marginBottom: 10, transition: 'all .15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: p.bg, color: p.color, fontFamily: "'DM Mono', monospace", fontWeight: 700, flexShrink: 0 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>Live connection will be set up by your VV manager</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1px solid ${selected ? 'var(--gold)' : 'var(--rule2)'}`, background: selected ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selected && <span style={{ color: '#fff', fontSize: 9 }}>✓</span>}
                  </div>
                </div>
              )
            })}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: '1px solid var(--rule2)', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>← Back</button>
              <button onClick={saveStep3} disabled={saving}
                style={{ flex: 2, padding: '11px 0', background: 'var(--gold)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#faf8f5', letterSpacing: '2px' }}>
                {saving ? 'Saving...' : 'Complete Setup →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: 'var(--gold)', marginBottom: 16 }}>◈</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, marginBottom: 12 }}>Your account is ready.</div>
            <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.75, marginBottom: 28 }}>
              Vanguard Intelligence has been configured for {company || 'your account'}. Your dashboard is live with your campaigns. Your first AI analysis is ready.
            </p>
            <div style={{ background: 'var(--card2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
              {[
                ['Campaigns imported', `${campaigns.filter(c => c.name).length} active campaigns`],
                ['Biggest Leak', 'Detection active'],
                ['Weekly Brief', 'Every Monday 7AM'],
                ['AI Analysis', 'On demand, unlimited'],
                ['Platform sync', 'Your VV manager will connect within 24h'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--rule)', fontSize: 12 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: 'var(--green)' }}>✓ {v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '13px 0', background: 'var(--gold)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#faf8f5', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Enter Your Dashboard →
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--ink3)', textAlign: 'center', letterSpacing: 1 }}>
        Vanguard Visuals · Growth Ad Engine · Confidential
      </div>
    </div>
  )
}
