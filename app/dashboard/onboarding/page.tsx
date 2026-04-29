'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

const STEPS = [
  { id: 'welcome',  label: 'Welcome',        icon: '◈' },
  { id: 'connect',  label: 'Connect Ads',    icon: '◎' },
  { id: 'confirm',  label: 'Confirm Data',   icon: '◉' },
  { id: 'done',     label: 'You\'re Live',   icon: '✓' },
]

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { client, toast } = useApp()
  const [step, setStep] = useState(0)
  const [metaConnected, setMetaConnected] = useState(false)
  const [checking, setChecking] = useState(false)
  const [completing, setCompleting] = useState(false)

  const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'
  const META_APP_ID = '4462090677412633'

  useEffect(() => {
    checkMetaConnection()
  }, [client])

  async function checkMetaConnection() {
    if (!client) return
    const { data } = await supabase
      .from('ad_connections')
      .select('id, is_active')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .single()
    setMetaConnected(!!data)
    if (data && step < 2) setStep(2)
  }

  async function connectMeta() {
    if (!client) return
    const state = encodeURIComponent(JSON.stringify({ client_id: client.id }))
    const redirect = encodeURIComponent(`${SUPABASE_URL}/functions/v1/meta-oauth-callback`)
    const scope = 'ads_read,ads_management,business_management'
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${redirect}&scope=${scope}&state=${state}&response_type=code`
  }

  async function completeOnboarding() {
    if (!client) return
    setCompleting(true)
    await supabase.from('clients').update({ onboarding_complete: true, onboarding_step: 'done' }).eq('id', client.id)
    await supabase.from('onboarding').update({ step: 'done', completed_steps: ['welcome', 'connect', 'confirm'], completed_at: new Date().toISOString() }).eq('client_id', client.id)
    toast('Setup complete', 'Your first intelligence brief arrives Monday at 7AM.')
    router.push('/dashboard')
  }

  const ink = 'rgba(250,248,245,0.9)'
  const ink2 = 'rgba(250,248,245,0.55)'
  const ink3 = 'rgba(250,248,245,0.28)'
  const ink4 = 'rgba(250,248,245,0.11)'
  const rule = 'rgba(250,248,245,0.07)'
  const gold = '#c9a84c'
  const mono = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans = "'DM Sans',sans-serif"

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', paddingTop: 24 }}>

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
            Setup takes under 5 minutes. You'll connect your ad accounts, and we'll handle everything from there — classifying every campaign, finding your biggest leak, and delivering a plain-English brief every Monday morning at 7AM.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {[
              { icon: '◎', title: 'Connect your ad accounts', body: 'Meta Ads via OAuth — one click, read-only, we never touch your campaigns.' },
              { icon: '◉', title: 'We classify every campaign', body: 'STRONG, WEAK, BLEEDING, or DEAD. Updated daily from live data.' },
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

      {/* Step 1 — Connect Meta */}
      {step === 1 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 2</div>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: ink, lineHeight: 1.1, marginBottom: 16 }}>Connect your ad accounts</div>
          <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, marginBottom: 32, fontWeight: 300 }}>
            Connect Meta Ads to start. We use read-only OAuth — we can see your campaign data but can never modify or spend on your behalf.
          </div>

          {/* Meta connect */}
          <div style={{ border: `1px solid ${rule}`, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>f</div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: ink, fontWeight: 500 }}>Meta Ads</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginTop: 2 }}>Facebook + Instagram campaigns</div>
                </div>
              </div>
              {metaConnected ? (
                <span style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '4px 10px', borderRadius: 3, letterSpacing: '1.5px' }}>✓ CONNECTED</span>
              ) : (
                <button onClick={connectMeta} style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer' }}>
                  Connect →
                </button>
              )}
            </div>
          </div>

          {/* Google — coming soon */}
          <div style={{ border: `1px solid ${rule}`, borderRadius: 6, overflow: 'hidden', marginBottom: 28, opacity: 0.5 }}>
            <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#ea4335', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>G</div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: ink, fontWeight: 500 }}>Google Ads</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginTop: 2 }}>Search, Display, Performance Max</div>
                </div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 8, color: ink3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${rule}`, padding: '4px 10px', borderRadius: 3, letterSpacing: '1.5px' }}>Coming Soon</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(0)} style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: `1px solid ${rule}`, padding: '11px 20px', borderRadius: 4, cursor: 'pointer', letterSpacing: '1px' }}>
              ← Back
            </button>
            <button
              onClick={() => { if (metaConnected) setStep(2); else toast('Connect first', 'Please connect Meta Ads to continue.') }}
              style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: metaConnected ? '#050509' : ink3, background: metaConnected ? gold : 'rgba(255,255,255,0.04)', border: `1px solid ${metaConnected ? gold : rule}`, padding: '13px 28px', borderRadius: 4, cursor: metaConnected ? 'pointer' : 'not-allowed' }}>
              {metaConnected ? 'Continue →' : 'Connect to continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Confirm */}
      {step === 2 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Step 2 of 2</div>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: ink, lineHeight: 1.1, marginBottom: 16 }}>Your data is live.</div>
          <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, marginBottom: 28, fontWeight: 300 }}>
            Meta Ads is connected. Your campaigns are being classified now. Your first Monday morning brief is scheduled — we'll surface your biggest budget leak and tell you exactly what to do.
          </div>

          <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 6, padding: '20px 22px', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', letterSpacing: '2px', textTransform: 'uppercase' }}>Connection Active</div>
            </div>
            {[
              'Campaign data syncing daily at 2AM UTC',
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