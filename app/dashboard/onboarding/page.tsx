'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'
import AddCampaignForm from '../add-campaign/AddCampaignForm'

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'data',    label: 'Add Data' },
  { id: 'confirm', label: "You're Live" },
]

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { client, toast } = useApp()
  const [step, setStep] = useState(0)
  const [campaignCount, setCampaignCount] = useState(0)
  const [completing, setCompleting] = useState(false)

  useEffect(() => { if (client) refreshCount() }, [client])

  async function refreshCount() {
    if (!client) return
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('campaign_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('snapshot_date', today)
      .like('campaign_id', 'manual_%')
    setCampaignCount(count || 0)
  }

  function onCampaignAdded() {
    toast('Campaign added', 'Add more or continue to your dashboard.')
    refreshCount()
  }

  async function completeOnboarding() {
    if (!client) return
    setCompleting(true)
    await supabase.from('clients').update({ onboarding_complete: true, onboarding_step: 'done' }).eq('id', client.id)
    await supabase.from('onboarding').update({ step: 'done', completed_steps: ['welcome', 'data', 'confirm'], completed_at: new Date().toISOString() }).eq('client_id', client.id)
    toast('Setup complete', 'Your first intelligence brief arrives Monday at 7AM.')
    sessionStorage.setItem('vv_just_logged_in', '1')
    router.push('/dashboard')
  }

  const ink = 'rgba(250,248,245,0.9)'
  const ink2 = 'rgba(250,248,245,0.55)'
  const ink3 = 'rgba(250,248,245,0.28)'
  const rule = 'rgba(250,248,245,0.07)'
  const gold = '#c9a84c'
  const mono = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 24 }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 48, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 1, background: rule, zIndex: 0 }} />
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? gold : active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${done || active ? gold : rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: done ? '#050509' : active ? gold : ink3, fontFamily: mono, transition: 'all 0.3s ease' }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ fontFamily: mono, fontSize: 7, color: active ? gold : ink3, letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center', transition: 'color 0.3s ease' }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Step 0 — Welcome */}
      {step === 0 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Welcome to VV Growth Ad Engine</div>
          <div style={{ fontFamily: serif, fontSize: 38, fontWeight: 300, color: ink, lineHeight: 1.05, letterSpacing: '-0.5px', marginBottom: 20 }}>Let's get your intelligence system live.</div>
          <div style={{ fontSize: 14, color: ink2, lineHeight: 1.85, marginBottom: 32, fontWeight: 300 }}>
            Setup takes under 5 minutes. Enter your current campaign numbers, and we'll handle everything from there — classifying every campaign, finding your biggest leak, and delivering a plain-English brief every Monday morning at 7AM.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {[
              { icon: '◎', title: 'Add your campaign data', body: 'A simple form — spend, revenue, conversions per campaign. You can edit or add more anytime.' },
              { icon: '◉', title: 'We classify every campaign', body: 'STRONG, WEAK, BLEEDING, or DEAD. Updated the moment your numbers change.' },
              { icon: '◧', title: 'Monday brief in your inbox', body: 'Your single biggest budget leak. One action to take. Plain English.' },
            ].map(item => (
              <div key={item.icon} style={{ display: 'flex', gap: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 6 }}>
                <span style={{ fontFamily: mono, fontSize: 14, color: gold, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 17, color: ink, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: ink2, lineHeight: 1.7 }}>{item.body}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: gold, border: 'none', padding: '13px 32px', borderRadius: 4, cursor: 'pointer' }}>
            Get Started →
          </button>
        </div>
      )}

      {/* Step 1 — Add Campaign Data */}
      {step === 1 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 2</div>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: ink, lineHeight: 1.1, marginBottom: 16 }}>Add your first campaign</div>
          <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, marginBottom: 24, fontWeight: 300 }}>
            Enter the numbers from your ad platform for one of your active campaigns. You can add more after onboarding — every entry powers the AI diagnostics and weekly brief.
          </div>

          {campaignCount > 0 && (
            <div style={{ marginBottom: 18, padding: '12px 16px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, fontFamily: mono, fontSize: 9, color: '#4ade80', letterSpacing: '0.5px' }}>
              ✓ {campaignCount} campaign{campaignCount === 1 ? '' : 's'} added — add more or continue.
            </div>
          )}

          {client && (
            <div style={{ marginBottom: 22, padding: '20px 22px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 6 }}>
              <AddCampaignForm clientId={client.id} onSuccess={onCampaignAdded} embedded />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(0)} style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: `1px solid ${rule}`, padding: '11px 20px', borderRadius: 4, cursor: 'pointer', letterSpacing: '1px' }}>
              ← Back
            </button>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => setStep(2)} style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: 'none', padding: '11px 14px', cursor: 'pointer', letterSpacing: '1px' }}>
                {campaignCount === 0 ? 'Skip for now' : 'Continue without adding more'}
              </button>
              <button
                onClick={() => setStep(2)}
                style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: gold, border: 'none', padding: '13px 28px', borderRadius: 4, cursor: 'pointer' }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Confirm */}
      {step === 2 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Step 2 of 2</div>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: ink, lineHeight: 1.1, marginBottom: 16 }}>
            {campaignCount > 0 ? 'Your data is live.' : "You're all set."}
          </div>
          <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, marginBottom: 28, fontWeight: 300 }}>
            {campaignCount > 0
              ? `${campaignCount} campaign${campaignCount === 1 ? '' : 's'} added. Your dashboard is ready — VAI can diagnose any campaign on demand, and your first Monday morning brief is scheduled.`
              : "Skip noted — you can add campaign data from your dashboard at any time. VAI analysis and the weekly brief activate as soon as you have data in."}
          </div>

          <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 6, padding: '20px 22px', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', letterSpacing: '2px', textTransform: 'uppercase' }}>Account Active</div>
            </div>
            {[
              'Dashboard ready with live campaign view',
              'AI diagnosis available for each campaign',
              'Monday 7AM — your first intelligence brief',
              'Weekly leak detection running',
            ].map((item, i) => (
              <div key={i} style={{ fontFamily: mono, fontSize: 9, color: ink2, letterSpacing: '0.5px', marginBottom: 7, display: 'flex', gap: 8 }}>
                <span style={{ color: '#4ade80' }}>✓</span> {item}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(1)} style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: `1px solid ${rule}`, padding: '11px 20px', borderRadius: 4, cursor: 'pointer', letterSpacing: '1px' }}>
              ← Back
            </button>
            <button onClick={completeOnboarding} disabled={completing}
              style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: gold, border: 'none', padding: '13px 32px', borderRadius: 4, cursor: completing ? 'not-allowed' : 'pointer', opacity: completing ? 0.7 : 1 }}>
              {completing ? 'Entering...' : 'Enter Dashboard →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
