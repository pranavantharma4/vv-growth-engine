'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { Pill } from '@/app/dashboard/components'
import { fmtMoney } from '@/lib/types'
import type { CampaignSnapshot, BiggestLeak } from '@/lib/types'
import { exportBriefPDF } from '@/lib/exportPDF'

function getWeekRef() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  return `W${week}-${now.getFullYear()}`
}

export default function BriefPage() {
  const { client, toast: showToast } = useApp()
  const supabase = createClientComponentClient()
  const [camps, setCamps] = useState<CampaignSnapshot[]>([])
  const [leak, setLeak] = useState<BiggestLeak | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pastBriefs, setPastBriefs] = useState<any[]>([])

  useEffect(() => {
    if (!client) return
    const today = new Date().toISOString().split('T')[0];
    (async () => {
      const [{ data: c }, { data: l }, { data: b }] = await Promise.all([
        supabase.from('campaign_snapshots').select('*').eq('client_id', client.id).eq('snapshot_date', today).order('spend', { ascending: false }),
        supabase.from('biggest_leaks').select('*').eq('client_id', client.id),
        supabase.from('weekly_briefs').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(6),
      ])
      setCamps(c || [])
      setLeak(l?.[0] || null)
      setPastBriefs(b || [])
      setLoading(false)
    })()
  }, [client])

  async function sendBrief() {
    setSending(true)
    try {
      const res = await fetch('/api/brief/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client?.id }),
      })
      if (res.ok) {
        setSent(true)
        showToast('Brief sent', 'Weekly intelligence brief delivered to ' + (client?.contact_email || 'client'))
        const { data } = await supabase.from('weekly_briefs').select('*').eq('client_id', client!.id).order('created_at', { ascending: false }).limit(6)
        setPastBriefs(data || [])
      } else {
        showToast('Send failed', 'Could not send brief. Check your Resend API key.')
      }
    } catch {
      showToast('Send failed', 'Network error. Please try again.')
    }
    setSending(false)
  }

  const totalSpend = camps.reduce((s, c) => s + Number(c.spend), 0)
  const totalWasted = camps.filter(c => c.health === 'dead' || c.health === 'bleeding').reduce((s, c) => s + Number(c.spend), 0)
  const blendedROAS = totalSpend > 0 ? camps.reduce((s, c) => s + Number(c.roas) * Number(c.spend), 0) / totalSpend : 0
  const weekRef = getWeekRef()
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const recommendations = [
    leak ? `Pause ${leak.campaign_name} immediately — ${fmtMoney(Number(leak.spend))}/mo at ${Number(leak.roas).toFixed(1)}x ROAS is a clear loss. Reallocate budget to your strongest campaign this week.` : null,
    camps.find(c => c.health === 'strong') ? `Scale ${camps.find(c => c.health === 'strong')!.campaign_name} — ${Number(camps.find(c => c.health === 'strong')!.roas).toFixed(1)}x ROAS with room to grow. Increase budget 20-30% and monitor CPM for 7 days.` : null,
    camps.find(c => c.health === 'bleeding') ? `Refresh creative on ${camps.find(c => c.health === 'bleeding')!.campaign_name} — frequency is likely at saturation point. New variants needed within 7 days.` : null,
  ].filter(Boolean) as string[]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400 }}>Weekly Intelligence Brief</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Auto-generated · {weekRef} · {dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => exportBriefPDF(client?.name || 'Client', weekRef)}
            style={{ padding: '7px 14px', border: '1px solid var(--rule2)', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink2)', letterSpacing: 1 }}>
            ↓ Export PDF
          </button>
          <button
            onClick={sendBrief}
            disabled={sending}
            style={{ padding: '7px 16px', border: 'none', borderRadius: 5, background: sending ? 'var(--bg3)' : sent ? 'var(--green)' : 'var(--gold)', color: '#faf8f5', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1 }}>
            {sending ? 'Sending...' : sent ? '✓ Brief Sent' : '✉ Send to Client'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

        <div id="brief-doc" style={{ background: '#fff', color: '#1a1714', border: '1px solid #ddd', borderRadius: 8, padding: '34px 38px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1714', paddingBottom: 14, marginBottom: 22 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, fontStyle: 'italic', color: '#1a1714', letterSpacing: 2 }}>VV</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9a9390', letterSpacing: '1.5px', marginTop: 2 }}>VANGUARD VISUALS · GROWTH AD ENGINE</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9a9390', marginTop: 1 }}>Weekly Intelligence Brief</div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9a9390', lineHeight: 1.8 }}>
              <div>{dateStr}</div>
              <div>Client: <strong style={{ color: '#1a1714' }}>{client?.name}</strong></div>
              <div style={{ color: '#8b6914', fontWeight: 500 }}>{weekRef}</div>
            </div>
          </div>

          {/* Biggest Leak */}
          {leak && (
            <div data-section="leak" style={{ background: '#fdf0f0', borderLeft: '3px solid #8b1a1a', padding: '14px 16px', marginBottom: 20, borderRadius: '0 6px 6px 0' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b1a1a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Biggest Leak This Week</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>{leak.campaign_name} — {fmtMoney(Number(leak.spend))}/mo at {Number(leak.roas).toFixed(1)}x ROAS</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8b1a1a' }}>{fmtMoney(Number(leak.spend))} recoverable this month · Action required this week</div>
            </div>
          )}

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              ['Total Spend', fmtMoney(totalSpend), ''],
              ['Blended ROAS', blendedROAS.toFixed(1) + 'x', blendedROAS >= 3 ? '#1a5c1a' : blendedROAS >= 1.5 ? '#8b6914' : '#8b1a1a'],
              ['Recoverable', fmtMoney(totalWasted), '#8b1a1a'],
            ].map(([label, value, color]) => (
              <div key={label} data-stat={label} style={{ background: '#f2efe9', borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9a9390', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: (color as string) || '#1a1714' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Campaign Health */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b6914', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #e8e3da' }}>Campaign Health Overview</div>
            {loading ? (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9a9390' }}>Loading...</div>
            ) : camps.slice(0, 8).map((c, i) => (
              <tr key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f2efe9' }}>
                <td style={{ listStyle: 'none' }}>
                  <div style={{ fontSize: 12, color: '#1a1714', fontWeight: 500 }}>{c.campaign_name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9a9390', marginTop: 1 }}>
                    {{ meta: 'Meta', google: 'Google', tiktok: 'TikTok' }[c.platform] || c.platform} · {fmtMoney(Number(c.spend))}/mo
                  </div>
                </td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10, listStyle: 'none' }}>
                  <Pill health={c.health} />
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: Number(c.roas) >= 3 ? '#1a5c1a' : Number(c.roas) >= 1.5 ? '#8b6914' : '#8b1a1a' }}>
                    {Number(c.roas).toFixed(1)}x
                  </div>
                </td>
              </tr>
            ))}
          </div>

          {/* Recommended Actions */}
          {recommendations.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b6914', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #e8e3da' }}>This Week's Recommended Actions</div>
              {recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8b6914', flexShrink: 0, marginTop: 1 }}>{i + 1}.</div>
                  <div data-rec style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#4a4540', lineHeight: 1.7 }}>{rec}</div>
                </div>
              ))}
            </div>
          )}

          {/* Platform breakdown */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8b6914', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #e8e3da' }}>Platform Breakdown</div>
            {(['meta', 'google', 'tiktok'] as const).map(plat => {
              const platCamps = camps.filter(c => c.platform === plat)
              if (!platCamps.length) return null
              const platSpend = platCamps.reduce((s, c) => s + Number(c.spend), 0)
              const platROAS = platCamps.reduce((s, c) => s + Number(c.roas), 0) / platCamps.length
              return (
                <div key={plat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f2efe9' }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500 }}>{{ meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads' }[plat]}</div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#4a4540' }}>{fmtMoney(platSpend)}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: platROAS >= 3 ? '#1a5c1a' : platROAS >= 1.5 ? '#8b6914' : '#8b1a1a' }}>{platROAS.toFixed(1)}x</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e8e3da', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#9a9390', letterSpacing: 1 }}>Vanguard Visuals · Growth Ad Engine · Confidential</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8b6914', background: '#fdf6e3', padding: '3px 8px', borderRadius: 3 }}>{weekRef}</div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '15px 16px', marginBottom: 11 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Delivery</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--rule)', fontSize: 11 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>Recipient</span>
              <span style={{ fontWeight: 500 }}>{client?.contact_email || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--rule)', fontSize: 11 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>Week</span>
              <span style={{ fontWeight: 500 }}>{weekRef}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 11 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>Schedule</span>
              <span style={{ fontWeight: 500 }}>Every Monday 7AM</span>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '15px 16px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Past Briefs</div>
            {pastBriefs.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)' }}>No briefs sent yet. Send this week's brief to get started.</div>
            ) : pastBriefs.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < pastBriefs.length - 1 ? '1px solid var(--rule)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{b.week_ref}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 1 }}>
                    {b.sent_at ? new Date(b.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Saved'}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--green)', background: 'var(--greenpaper)', padding: '2px 7px', borderRadius: 3 }}>Sent</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}