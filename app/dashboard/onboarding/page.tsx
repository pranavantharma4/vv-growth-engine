'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'
import AddCampaignForm from '../add-campaign/AddCampaignForm'

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'data',    label: 'Add Campaigns' },
  { id: 'confirm', label: "You're Live" },
]

const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'
const META_APP_ID = '4462090677412633'

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { client, toast } = useApp()
  const [step, setStep] = useState(0)
  const [campaignCount, setCampaignCount] = useState(0)
  const [metaConnected, setMetaConnected] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    if (!client) return
    refreshCount()
    checkMetaConnection()

    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'meta') {
      toast('Meta Ads connected', 'Your ad account is linked. Finishing setup...')
      window.history.replaceState({}, '', '/dashboard/onboarding')
    }
    if (params.get('error')) {
      toast('Connection failed', decodeURIComponent(params.get('error') || 'Unknown error'))
      window.history.replaceState({}, '', '/dashboard/onboarding')
    }
  }, [client])

  // The Meta OAuth popup posts back here when the connection succeeds
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'META_CONNECTED') {
        checkMetaConnection()
        toast('Meta Ads connected', 'Your ad account is now connected.')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [client])

  async function checkMetaConnection() {
    if (!client) return
    const { data } = await supabase
      .from('ad_connections')
      .select('id, is_active')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .maybeSingle()
    setMetaConnected(!!data)
  }

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

  function connectMeta() {
    if (!client) return
    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`
    const scope = 'ads_read,ads_management,business_management,read_insights'
    const returnUrl = `${window.location.origin}/auth/meta-success?next=${encodeURIComponent('/dashboard/onboarding')}`
    const state = encodeURIComponent(JSON.stringify({
      client_id: client.id,
      return_url: returnUrl,
    }))
    const oauthUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&response_type=code`

    const popup = window.open(oauthUrl, 'MetaOAuth', 'width=600,height=720,scrollbars=yes')
    if (!popup) {
      toast('Popup blocked', 'Please allow popups for this site, then try again.')
      return
    }
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval)
        checkMetaConnection()
      }
    }, 1000)
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
  const sans = "'DM Sans',sans-serif"

  const hasData = metaConnected || campaignCount > 0

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
            Setup takes under 5 minutes. Connect Meta Ads with one click, or enter campaign numbers manually — either way, we'll classify every campaign, find your biggest leak, and deliver a plain-English brief every Monday morning at 7AM.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {[
              { icon: '◎', title: 'Bring in your campaigns', body: 'Connect Meta Ads with one-click OAuth, or enter spend/revenue/conversions manually.' },
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

      {/* Step 1 — Bring in campaigns (OAuth + manual side by side) */}
      {step === 1 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(201,168,76,0.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 2</div>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: ink, lineHeight: 1.1, marginBottom: 16 }}>Bring in your campaigns</div>
          <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, marginBottom: 24, fontWeight: 300 }}>
            Pick whichever is easier — one-click Meta OAuth, or manual entry. You can do both, and you can always add more after onboarding.
          </div>

          {/* Meta OAuth card */}
          <div style={{ border: `1px solid ${metaConnected ? 'rgba(74,222,128,0.25)' : rule}`, borderRadius: 6, padding: '20px 22px', marginBottom: 14, background: metaConnected ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.025)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>f</div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: ink, fontWeight: 500 }}>Meta Ads — one-click connect</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginTop: 2 }}>Facebook + Instagram, read-only OAuth</div>
                </div>
              </div>
              {metaConnected ? (
                <span style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '4px 10px', borderRadius: 3, letterSpacing: '1.5px' }}>✓ CONNECTED</span>
              ) : (
                <button onClick={connectMeta} style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#fff', background: '#1877f2', border: 'none', padding: '9px 18px', borderRadius: 4, cursor: 'pointer' }}>
                  Connect →
                </button>
              )}
            </div>
          </div>

          {/* Manual entry card */}
          <div style={{ border: `1px solid ${campaignCount > 0 ? 'rgba(74,222,128,0.25)' : rule}`, borderRadius: 6, marginBottom: 28, background: campaignCount > 0 ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowManual(v => !v)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: gold, fontFamily: mono }}>✎</div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: ink, fontWeight: 500 }}>Manual entry — any platform</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginTop: 2 }}>
                    {campaignCount > 0 ? `${campaignCount} campaign${campaignCount === 1 ? '' : 's'} added` : 'Spend, revenue, conversions per campaign'}
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 9, color: gold, letterSpacing: '1px' }}>{showManual ? '−' : '+'}</span>
            </div>
            {showManual && client && (
              <div style={{ borderTop: `1px solid ${rule}`, padding: '20px 22px', background: 'rgba(0,0,0,0.15)' }}>
                <AddCampaignForm clientId={client.id} onSuccess={onCampaignAdded} embedded />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(0)} style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: `1px solid ${rule}`, padding: '11px 20px', borderRadius: 4, cursor: 'pointer', letterSpacing: '1px' }}>
              ← Back
            </button>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {!hasData && (
                <button onClick={() => setStep(2)} style={{ fontFamily: mono, fontSize: 9, color: ink3, background: 'transparent', border: 'none', padding: '11px 14px', cursor: 'pointer', letterSpacing: '1px' }}>
                  Skip for now
                </button>
              )}
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
            {hasData ? 'Your data is live.' : "You're all set."}
          </div>
          <div style={{ fontSize: 13, color: ink2, lineHeight: 1.85, marginBottom: 28, fontWeight: 300 }}>
            {metaConnected && campaignCount > 0
              ? `Meta Ads connected and ${campaignCount} manual campaign${campaignCount === 1 ? '' : 's'} added. VAI is ready to diagnose, and your first Monday brief is scheduled.`
              : metaConnected
              ? 'Meta Ads is connected. Your campaigns are being classified now. Your first Monday morning brief is scheduled.'
              : campaignCount > 0
              ? `${campaignCount} campaign${campaignCount === 1 ? '' : 's'} added. Your dashboard is ready — VAI can diagnose any campaign on demand, and your first Monday brief is scheduled.`
              : "You can connect Meta or add campaigns from your dashboard at any time. VAI analysis and the weekly brief activate as soon as you have data in."}
          </div>

          <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 6, padding: '20px 22px', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', letterSpacing: '2px', textTransform: 'uppercase' }}>Account Active</div>
            </div>
            {[
              metaConnected ? 'Meta Ads syncing daily at 2AM UTC' : 'Dashboard ready with live campaign view',
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
