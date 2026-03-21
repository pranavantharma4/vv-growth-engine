'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { fmtMoney } from '@/lib/types'

export default function ReportsPage() {
  const { client, showToast } = useApp()
  const supabase = createClientComponentClient()
  const [briefs, setBriefs] = useState<any[]>([])
  const [blueprints, setBlueprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return
    ;(async () => {
      const [{ data: b }, { data: bp }] = await Promise.all([
        supabase.from('weekly_briefs').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
        supabase.from('optimization_blueprints').select('*').eq('client_id', client.id).order('generated_at', { ascending: false }),
      ])
      setBriefs(b || [])
      setBlueprints(bp || [])
      setLoading(false)
    })()
  }, [client])

  const included = [
    ['Campaign Performance Summary', 'All platforms · 30-day view'],
    ['Funnel Blindness Analysis',    'Where exactly your budget is lost'],
    ['AI Diagnosis Per Campaign',    'Plain English, zero jargon'],
    ['Optimization Blueprint',       'Specific actions in priority order'],
    ['Budget Reallocation Model',    'Where to move spend for max ROAS'],
    ['30-Day Implementation Plan',   'Week by week, step by step'],
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

      {/* Left — History */}
      <div>

        {/* Weekly Briefs */}
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 12 }}>Weekly Briefs</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
          {loading ? (
            <div style={{ padding: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>Loading...</div>
          ) : briefs.length === 0 ? (
            <div style={{ padding: '20px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: 'var(--bg3)', marginBottom: 8 }}>◧</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>No briefs sent yet — go to Weekly Brief to generate your first one</div>
            </div>
          ) : briefs.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: i < briefs.length - 1 ? '1px solid var(--rule)' : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>Weekly Intelligence Brief — {b.week_ref}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>
                  {b.sent_at ? new Date(b.sent_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not sent'} · {b.sent_to || '—'}
                </div>
                {b.total_spend && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>
                    Spend: {fmtMoney(Number(b.total_spend))} · Recoverable: {fmtMoney(Number(b.total_wasted || 0))} · ROAS: {Number(b.blended_roas || 0).toFixed(1)}x
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--green)', background: 'var(--greenpaper)', border: '1px solid var(--greenborder)', padding: '2px 8px', borderRadius: 3 }}>Sent</span>
                <button
                  onClick={() => window.print()}
                  style={{ padding: '4px 10px', border: '1px solid var(--rule2)', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink2)', letterSpacing: 1 }}
                >
                  ↓ PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Optimization Blueprints */}
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 12 }}>Optimization Blueprints</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
          {loading ? (
            <div style={{ padding: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>Loading...</div>
          ) : blueprints.length === 0 ? (
            <div style={{ padding: '20px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: 'var(--bg3)', marginBottom: 8 }}>◑</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1 }}>No blueprints yet — go to Ads Optimization and complete the 5-step workflow</div>
            </div>
          ) : blueprints.map((bp, i) => (
            <div key={bp.id} style={{ padding: '13px 16px', borderBottom: i < blueprints.length - 1 ? '1px solid var(--rule)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{bp.campaign_name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>
                    {bp.platform} · {bp.action_type === 'edit' ? 'Edit existing' : 'New campaign'} · {bp.objective || 'Conversions'}
                  </div>
                  {bp.daily_budget && (
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 1 }}>
                      Budget: ${bp.daily_budget}/day · {bp.audience || 'Lookalike audience'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', padding: '2px 8px', borderRadius: 3 }}>{bp.ref_id}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>
                    {new Date(bp.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              {bp.implementation_steps && Array.isArray(bp.implementation_steps) && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', background: 'var(--card2)', borderRadius: 4, padding: '6px 9px' }}>
                  {bp.implementation_steps.length} implementation steps · {bp.creative_count || 0} creative{bp.creative_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Request Audit CTA */}
        <div style={{ background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderLeft: '2px solid var(--gold)', borderRadius: 8, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--gold)', marginBottom: 6 }}>Request a Custom Audit</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.75, marginBottom: 14 }}>Full AI-powered analysis across all campaigns, with prioritized optimization blueprint and 30-day implementation roadmap delivered as a branded PDF.</div>
          <button
            onClick={() => showToast('Audit requested', 'Your VV manager will follow up within 24 hours.')}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 5, background: 'var(--gold)', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#faf8f5', letterSpacing: 1 }}
          >
            Request Audit →
          </button>
        </div>
      </div>

      {/* Right — Plan details */}
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 12 }}>What's Included</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '17px 18px', marginBottom: 11 }}>
          {included.map(([title, sub], i) => (
            <div key={title} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: i < included.length - 1 ? 12 : 0 }}>
              <span style={{ color: 'var(--gold)', fontSize: 9, marginTop: 3, flexShrink: 0 }}>◈</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{title}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '17px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Your Plan</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--gold)', marginBottom: 10, textTransform: 'capitalize' }}>{client?.plan || 'Managed'}</div>
          {[
            ['Weekly sync',     'All connected platforms'],
            ['Monthly report',  'PDF + live dashboard'],
            ['AI analysis',     'On demand, unlimited'],
            ['Manager access',  'Direct to VV team'],
            ['Weekly brief',    'Every Monday 7AM'],
          ].map(([key, val], i) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--rule)' : 'none', fontSize: 11 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>{key}</span>
              <span style={{ fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
