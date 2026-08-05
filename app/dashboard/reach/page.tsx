'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ── Shape returned by public.reach_summary() (see /api/reach/summary) ──
type Pipeline = {
  total: number
  suppressed: number
  warm: number
  with_ad_evidence: number
  by_tier: { A: number; B: number; discard: number; unscored: number }
  by_email_status: { verified: number; unverified: number; risky: number; invalid: number; bounced: number }
}
type Sends = {
  total_outbound: number
  sent_today: number
  sent_7d: number
  by_status: Record<string, number>
}
type StepRow = { step: number; sent: number; queued: number; bounced: number; replied: number; skipped: number }
type DailyRow = { day: string; sent: number }
type AbRow = { variant: string; sends: number; bounces: number; replies: number }
type ReplyRow = { id: string; name: string | null; company: string | null; classification: string | null; step: number | null; subject: string | null; preview: string | null; at: string }
type Campaign = { id: string; name: string; channel: string; status: string; daily_cap: number | null; sender_identity: string | null; lemlist_campaign_id: string | null }
type RunToday = {
  daily_cap: number
  followups_due: number
  t2_due: number
  t3_due: number
  t4_due: number
  t1_queued: number
  last_reconciled: string | null
}
type Summary = {
  pipeline: Pipeline
  sends: Sends
  by_step: StepRow[]
  daily: DailyRow[]
  ab: AbRow[]
  replies: ReplyRow[]
  campaigns: Campaign[]
  run_today: RunToday
  generated_at: string
}

// The 4-touch sequence from the operating file — labels the raw step numbers.
const STEP_META: Record<number, { tag: string; name: string }> = {
  1: { tag: 'T1', name: 'Observation' },
  2: { tag: 'T2', name: 'Observation 2' },
  3: { tag: 'T3', name: 'Founders Program' },
  4: { tag: 'T4', name: 'Soft opt-out' },
}

const REPLY_TONE: Record<string, 'good' | 'bad' | 'neutral'> = {
  interested: 'good',
  referral: 'good',
  question: 'good',
  not_interested: 'bad',
  unsubscribe: 'bad',
  out_of_office: 'neutral',
}

function pct(n: number, d: number): string {
  if (!d) return '0%'
  return (Math.round((n / d) * 1000) / 10).toFixed((n / d) * 100 % 1 === 0 ? 0 : 1) + '%'
}
function num(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString()
}
function dayShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function whenShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── RUN TODAY prompt blocks — pasted into Claude Code, never sent from here ──
// Blocks 1 and 4 are fixed; 2 and 3 interpolate live counts pulled at page load.
const RECONCILE_PROMPT = `Morning reconcile for VV outreach — do this before sending anything.

1. Reconcile sends: compare the Gmail Sent folder for pranavan@vngrdvisuals.com against outreach.messages. Flag any email in Sent that isn't logged (missing status='sent' / sent_at / provider_message_id) and any row marked sent that isn't actually in Sent. Fix drift by the message row id, never lead_id.
2. Check replies: scan inbound threads for anything new since the last run. Classify each as a HUMAN reply or an auto-responder. Log auto-responders as an inbound row with reply_classification='out_of_office' and KEEP the lead in sequence. Log human replies with the real classification and EXIT that lead from the sequence. When unsure, treat it as auto — do not exit.
3. Report back: sends reconciled, drift fixed, new human replies, and the updated follow-ups-due count for today.`

const EOD_PROMPT = `End-of-day VV outreach report. From outreach.messages, give me:
- emails sent today, broken down by step (T1 / T2 / T3 / T4)
- new replies today: human vs auto-responder, with classification
- current bounce count
- tomorrow's follow-ups due (cadence: T1→T2→T3→T4, +3 weekdays, skip weekends), by step
- any lead that should have exited the sequence but didn't
One short paragraph, then the numbers.`

function followupPrompt(due: number, t2: number, t3: number, t4: number, cap: number): string {
  const overflow = Math.max(0, due - cap)
  const capLine = overflow > 0
    ? `Daily cap is ${cap} total — send the ${cap} most overdue today; the remaining ${overflow} roll to tomorrow.`
    : `All ${due} fit under today's ${cap}/day cap.`
  return `Send the ${due} follow-ups due today (T2 ${t2}, T3 ${t3}, T4 ${t4}).
Draft each as a threaded REPLY in the lead's original thread — never a new email. Keep their original brand reference, no link. Order by most overdue first (T2 → T3 → T4). Pace 6–7 min between sends. Send via Composio GMAIL_SEND_DRAFT.
${capLine}
Log each send: status='sent', sent_at=now(), provider_message_id='gmail:<sent id>', matched by the message row id. After the batch, verify 0 queued left for the ones you sent.`
}

function t1Prompt(toSend: number, capRoom: number, queued: number, due: number, cap: number): string {
  if (capRoom === 0) {
    return `No new T1s today — the ${cap}/day cap is already filled by the ${due} follow-ups due. Clear the follow-up backlog first; stage T1s again once there's room under the cap.`
  }
  if (queued === 0) {
    return `No T1 drafts are queued right now. There's room for ${capRoom} new T1s under today's ${cap}/day cap after the ${due} follow-ups. Stage ${capRoom} fresh T1 drafts (A-tier first — verified email + live ad evidence) before sending.`
  }
  return `Send ${toSend} queued T1 drafts, A-tier first (verified email + live ad evidence), then B-tier. Pace 6–7 min between sends. Send via Composio GMAIL_SEND_DRAFT and log each (status='sent', sent_at=now(), provider_message_id, matched by message row id).
This fills the ${cap}/day cap after the ${due} follow-ups due (room for ${capRoom}${queued < capRoom ? `, but only ${queued} are queued` : ''}). Skip any suppressed or already-replied lead.`
}

export default function ReachPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authState, setAuthState] = useState<'checking' | 'denied' | 'ok'>('checking')
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── admin gate (the API route enforces it server-side too) ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: admins } = await supabase.from('client_users').select('*').eq('role', 'admin')
      const email = (user.email || '').toLowerCase()
      const isAdmin = (admins || []).some((r: any) =>
        r.user_id === user.id || r.auth_user_id === user.id || r.auth_id === user.id ||
        r.id === user.id || (r.email && String(r.email).toLowerCase() === email))
      if (cancelled) return
      if (!isAdmin) { setAuthState('denied'); router.replace('/dashboard'); return }
      setAuthState('ok')
    })()
    return () => { cancelled = true }
  }, [supabase, router])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/reach/summary', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Failed to load'); return }
      setData(body.summary as Summary)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (authState === 'ok') load() }, [authState, load])

  if (authState !== 'ok') {
    return (
      <div style={{ padding: 48, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, color: 'var(--ink3)' }}>
        {authState === 'denied' ? 'Admin only — redirecting…' : 'Checking access…'}
      </div>
    )
  }

  const p = data?.pipeline
  const s = data?.sends
  const steps = data?.by_step || []
  const daily = data?.daily || []
  const ab = data?.ab || []
  const replies = data?.replies || []
  const campaigns = data?.campaigns || []

  // Real reply rate = genuine inbound (not auto/OOO) over total sent.
  const genuineReplies = replies.filter(r => r.classification !== 'out_of_office').length
  const totalSent = (s?.by_status?.sent || 0) + (s?.by_status?.delivered || 0) +
    (s?.by_status?.opened || 0) + (s?.by_status?.clicked || 0) + (s?.by_status?.replied || 0)
  const totalBounced = s?.by_status?.bounced || 0
  const totalQueued = steps.reduce((a, r) => a + r.queued, 0)
  const dailyMax = Math.max(1, ...daily.map(d => d.sent))

  // RUN TODAY — cap-aware daily job numbers (follow-ups take priority over T1s).
  const rt = data?.run_today
  const cap = rt?.daily_cap ?? 50
  const followupsDue = rt?.followups_due ?? 0
  const t1Queued = rt?.t1_queued ?? 0
  const t1CapRoom = Math.max(0, cap - followupsDue)
  const t1ToSend = Math.min(t1CapRoom, t1Queued)
  const followupOverflow = Math.max(0, followupsDue - cap)

  return (
    <div className="rch">
      <style>{CSS}</style>

      <header className="rch-head">
        <div>
          <p className="eyebrow">VV REACH · INTERNAL</p>
          <h1 className="title">The outreach engine.</h1>
          <p className="sub">Everything the cold email machine is doing — leads scored into tiers, the 4-touch sequence, subject-line A/B, and any replies the daily reconcile has flagged. Read-only.</p>
        </div>
        <div className="head-right">
          {data && <span className="stamp">SNAPSHOT · {whenShort(data.generated_at)}</span>}
          <button className="refresh-btn" onClick={load} disabled={loading}>
            {loading ? 'LOADING…' : 'REFRESH →'}
          </button>
        </div>
      </header>

      {error && <div className="err">{error}</div>}
      {!data && !error && <p className="empty">Loading snapshot…</p>}

      {data && (
        <>
          {/* ── RUN TODAY: the day's job as copy-paste prompt blocks ── */}
          <Section title="Run today" note="paste each into Claude Code · read-only">
            <div className="run-status">
              <span className="run-stat">
                Last reconciled · <b>{rt?.last_reconciled ? whenShort(rt.last_reconciled) : '—'}</b>
              </span>
              <span className="run-sep">/</span>
              <span className="run-stat">Cap <b>{cap}</b>/day</span>
              <span className="run-sep">/</span>
              <span className="run-stat"><b>{num(followupsDue)}</b> follow-ups due</span>
              <span className="run-sep">/</span>
              <span className="run-stat"><b>{num(t1ToSend)}</b> new T1s</span>
              {followupOverflow > 0 && (
                <span className="run-warn">{num(followupOverflow)} over cap → roll to tomorrow</span>
              )}
            </div>

            <RunBlock n={1} label="Morning reconcile" note="always first" prompt={RECONCILE_PROMPT} />
            <RunBlock n={2} label="Send follow-ups due" note={`${num(followupsDue)} due · T2 ${rt?.t2_due ?? 0} · T3 ${rt?.t3_due ?? 0} · T4 ${rt?.t4_due ?? 0}`}
              prompt={followupPrompt(followupsDue, rt?.t2_due ?? 0, rt?.t3_due ?? 0, rt?.t4_due ?? 0, cap)} />
            <RunBlock n={3} label="Send new T1s" note={t1CapRoom === 0 ? 'cap filled by follow-ups' : t1Queued === 0 ? 'none queued' : `${num(t1ToSend)} to send`}
              prompt={t1Prompt(t1ToSend, t1CapRoom, t1Queued, followupsDue, cap)} />
            <RunBlock n={4} label="End-of-day report" note="always last" prompt={EOD_PROMPT} />
          </Section>

          {/* ── top-line KPIs ── */}
          <div className="kpis">
            <Kpi label="Emails sent" value={num(totalSent)} note={`${num(s?.total_outbound)} outbound total`} />
            <Kpi label="Sent · last 7d" value={num(s?.sent_7d)} note={`${num(s?.sent_today)} today`} />
            <Kpi label="Bounced" value={num(totalBounced)} note={`${pct(totalBounced, totalSent + totalBounced)} of sent`} tone={totalBounced ? 'warn' : undefined} />
            <Kpi label="Genuine replies" value={num(genuineReplies)} note={`${pct(genuineReplies, totalSent)} reply rate`} tone={genuineReplies ? 'good' : undefined} />
          </div>

          {/* ── pipeline / tiers ── */}
          <Section title="Pipeline" note="lemlist DB → scored → sequenced">
            <div className="funnel">
              <FunnelStep label="Leads" value={num(p?.total)} sub="in outreach.leads" />
              <FunnelArrow />
              <FunnelStep label="Email verified" value={num(p?.by_email_status.verified)} sub={`${num(p?.by_email_status.unverified)} unverified`} />
              <FunnelArrow />
              <FunnelStep label="Tier A + B" value={num((p?.by_tier.A || 0) + (p?.by_tier.B || 0))} sub={`${num(p?.with_ad_evidence)} with live ad evidence`} accent />
              <FunnelArrow />
              <FunnelStep label="Suppressed" value={num(p?.suppressed)} sub="opted out / bounced / DNC" muted />
            </div>

            <div className="chips">
              <TierChip label="Tier A" value={p?.by_tier.A || 0} tone="a" />
              <TierChip label="Tier B" value={p?.by_tier.B || 0} tone="b" />
              <TierChip label="Discard" value={p?.by_tier.discard || 0} tone="muted" />
              <TierChip label="Unscored" value={p?.by_tier.unscored || 0} tone="muted" />
              <span className="chip-div" />
              <TierChip label="Verified" value={p?.by_email_status.verified || 0} tone="ok" />
              <TierChip label="Risky" value={p?.by_email_status.risky || 0} tone="warn" />
              <TierChip label="Invalid" value={p?.by_email_status.invalid || 0} tone="warn" />
            </div>
          </Section>

          {/* ── the 4-touch sequence / follow-up schedule ── */}
          <Section title="Sequence" note="4-touch · sent vs. staged follow-ups">
            <div className="seq">
              {steps.length === 0 && <p className="empty">No sends yet.</p>}
              {steps.filter(st => st.step > 0).map(st => {
                const meta = STEP_META[st.step] || { tag: 'T' + st.step, name: 'Step ' + st.step }
                return (
                  <div className="seq-row" key={st.step}>
                    <div className="seq-id">
                      <span className="seq-tag">{meta.tag}</span>
                      <span className="seq-name">{meta.name}</span>
                    </div>
                    <div className="seq-nums">
                      <SeqNum label="sent" value={st.sent} />
                      <SeqNum label="staged" value={st.queued} tone={st.queued ? 'gold' : undefined} />
                      {st.bounced > 0 && <SeqNum label="bounced" value={st.bounced} tone="warn" />}
                      {st.skipped > 0 && <SeqNum label="suppressed" value={st.skipped} tone="muted" />}
                    </div>
                  </div>
                )
              })}
            </div>
            {totalQueued > 0 && (
              <p className="seq-foot">{num(totalQueued)} follow-up{totalQueued === 1 ? '' : 's'} staged and waiting for the next send window.</p>
            )}
          </Section>

          {/* ── A/B critique: subject-line families ── */}
          <Section title="A/B critique" note="opening-line families · step 1">
            <div className="ab">
              {ab.length === 0 && <p className="empty">No step-1 sends yet.</p>}
              {ab.map(v => {
                const bounceRate = v.sends ? v.bounces / v.sends : 0
                return (
                  <div className="ab-row" key={v.variant}>
                    <div className="ab-top">
                      <span className="ab-variant">{v.variant}</span>
                      <span className="ab-sends">{num(v.sends)} sent</span>
                    </div>
                    <div className="ab-bar">
                      <div className="ab-bar-fill" style={{ width: `${Math.min(100, (v.sends / Math.max(1, ab[0].sends)) * 100)}%` }} />
                    </div>
                    <div className="ab-meta">
                      <span>{num(v.replies)} repl{v.replies === 1 ? 'y' : 'ies'}</span>
                      <span className={bounceRate > 0 ? 'warn' : ''}>{num(v.bounces)} bounce · {pct(v.bounces, v.sends)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="ab-foot">Reply volume is still too low to call a winner — read bounce rate as the early signal on deliverability per opener.</p>
          </Section>

          {/* ── sends over time ── */}
          {daily.length > 0 && (
            <Section title="Send volume" note="last 14 days">
              <div className="spark">
                {daily.map(d => (
                  <div className="spark-col" key={d.day} title={`${d.sent} on ${d.day}`}>
                    <span className="spark-val">{d.sent}</span>
                    <div className="spark-bar" style={{ height: `${Math.max(4, (d.sent / dailyMax) * 84)}px` }} />
                    <span className="spark-day">{dayShort(d.day)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── replies (DB-flagged; live feed comes later) ── */}
          <Section title="Replies" note="flagged by the daily reconcile">
            {replies.length === 0 ? (
              <div className="rep-empty">
                <p>No replies flagged yet.</p>
                <span>The daily reconcile writes inbound + <code>replied</code> messages here. A live Gmail feed lands in a later version.</span>
              </div>
            ) : (
              <div className="reps">
                {replies.map(r => {
                  const tone = REPLY_TONE[r.classification || ''] || 'neutral'
                  return (
                    <div className={`rep rep-${tone}`} key={r.id}>
                      <div className="rep-head">
                        <div className="rep-who">
                          <span className="rep-name">{r.name || 'Unknown'}</span>
                          {r.company && <span className="rep-co">{r.company}</span>}
                        </div>
                        <div className="rep-tags">
                          {r.classification && <span className={`rep-class rep-class-${tone}`}>{r.classification.replace(/_/g, ' ')}</span>}
                          <span className="rep-when">{whenShort(r.at)}</span>
                        </div>
                      </div>
                      {r.subject && <div className="rep-subj">{r.subject}</div>}
                      {r.preview && <div className="rep-preview">{r.preview}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* ── campaigns (only if any exist) ── */}
          {campaigns.length > 0 && (
            <Section title="Campaigns" note="outreach.campaigns">
              <div className="camps">
                {campaigns.map(c => (
                  <div className="camp" key={c.id}>
                    <div className="camp-top">
                      <span className="camp-name">{c.name}</span>
                      <span className={`camp-status camp-${c.status}`}>{c.status}</span>
                    </div>
                    <div className="camp-meta">
                      <span>{c.channel}</span>
                      {c.sender_identity && <span>· {c.sender_identity}</span>}
                      {c.daily_cap != null && <span>· cap {c.daily_cap}/day</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

// ── RUN TODAY block — a labelled prompt with a copy button ──
function RunBlock({ n, label, note, prompt }: { n: number; label: string; note?: string; prompt: string }) {
  return (
    <div className="run-block">
      <div className="run-block-head">
        <div className="run-block-id">
          <span className="run-n">{n}</span>
          <span className="run-block-label">{label}</span>
          {note && <span className="run-block-note">{note}</span>}
        </div>
        <CopyBtn text={prompt} />
      </div>
      <pre className="run-pre">{prompt}</pre>
    </div>
  )
}
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={`run-copy${copied ? ' copied' : ''}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch (_) { /* noop */ }
      }}
    >{copied ? 'COPIED ✓' : 'COPY'}</button>
  )
}

// ── small presentational pieces ──
function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'good' | 'warn' }) {
  return (
    <div className={`kpi${tone ? ' kpi-' + tone : ''}`}>
      <div className="kpi-val">{value}</div>
      <div className="kpi-label">{label}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  )
}
function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="sec">
      <div className="sec-head">
        <h2 className="sec-title">{title}</h2>
        {note && <span className="sec-note">{note}</span>}
      </div>
      {children}
    </section>
  )
}
function FunnelStep({ label, value, sub, accent, muted }: { label: string; value: string; sub?: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`fn${accent ? ' fn-accent' : ''}${muted ? ' fn-muted' : ''}`}>
      <div className="fn-val">{value}</div>
      <div className="fn-label">{label}</div>
      {sub && <div className="fn-sub">{sub}</div>}
    </div>
  )
}
function FunnelArrow() { return <span className="fn-arrow">›</span> }
function TierChip({ label, value, tone }: { label: string; value: number; tone: 'a' | 'b' | 'ok' | 'warn' | 'muted' }) {
  return <span className={`tchip tchip-${tone}`}>{label}<b>{value.toLocaleString()}</b></span>
}
function SeqNum({ label, value, tone }: { label: string; value: number; tone?: 'gold' | 'warn' | 'muted' }) {
  return (
    <div className={`sn${tone ? ' sn-' + tone : ''}`}>
      <span className="sn-val">{value.toLocaleString()}</span>
      <span className="sn-label">{label}</span>
    </div>
  )
}

const CSS = `
.rch{padding:36px 40px 80px;max-width:1040px;}
.rch *{box-sizing:border-box;}
.rch .eyebrow{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:3px;color:var(--gold);margin:0 0 10px;}
.rch .title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:40px;color:var(--ink);margin:0 0 8px;line-height:1;}
.rch .sub{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink2);margin:0;max-width:560px;line-height:1.6;}
.rch .rch-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:30px;}
.rch .head-right{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.rch .stamp{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--ink3);text-transform:uppercase;}
.rch .refresh-btn{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;color:var(--ink);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.14));padding:11px 20px;border-radius:5px;cursor:pointer;transition:all .15s;white-space:nowrap;}
.rch .refresh-btn:hover{border-color:var(--goldborder,rgba(201,168,76,.5));color:var(--gold);}
.rch .refresh-btn:disabled{opacity:.5;cursor:default;}
.rch .err{font-family:'DM Mono',monospace;font-size:11px;color:var(--red);background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:6px;padding:12px 14px;margin-bottom:24px;}
.rch .empty{font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink3);margin:0;}

/* KPIs */
.rch .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:34px;}
.rch .kpi{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:12px;padding:18px 18px 16px;}
.rch .kpi-val{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:34px;line-height:1;color:var(--ink);}
.rch .kpi-good .kpi-val{color:var(--green);}
.rch .kpi-warn .kpi-val{color:var(--gold);}
.rch .kpi-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink2);margin-top:9px;}
.rch .kpi-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;color:var(--ink3);margin-top:4px;}

/* RUN TODAY */
.rch .run-status{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:16px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px;color:var(--ink3);text-transform:uppercase;}
.rch .run-status b{color:var(--ink);font-size:10px;}
.rch .run-sep{color:var(--ink4,rgba(245,243,239,.18));}
.rch .run-warn{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;color:var(--red);border:1px solid rgba(248,113,113,.3);border-radius:4px;padding:3px 8px;text-transform:uppercase;}
.rch .run-block{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:12px;padding:16px 18px;margin-bottom:12px;}
.rch .run-block-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;}
.rch .run-block-id{display:flex;align-items:baseline;gap:11px;flex-wrap:wrap;min-width:0;}
.rch .run-n{font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:#050509;background:var(--gold);width:20px;height:20px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;align-self:center;}
.rch .run-block-label{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:20px;color:var(--ink);}
.rch .run-block-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);}
.rch .run-copy{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--ink2);background:transparent;border:1px solid var(--rule2,rgba(255,255,255,.14));border-radius:5px;padding:8px 14px;cursor:pointer;transition:all .15s;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
.rch .run-copy:hover{color:var(--gold);border-color:var(--goldborder,rgba(201,168,76,.5));}
.rch .run-copy.copied{color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.4));}
.rch .run-pre{font-family:'DM Mono',monospace;font-size:12px;line-height:1.65;color:var(--ink2);background:var(--bg,rgba(0,0,0,.18));border:1px solid var(--rule);border-radius:8px;padding:14px 16px;margin:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;}

/* Sections */
.rch .sec{margin-bottom:36px;}
.rch .sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px;border-bottom:1px solid var(--rule2,rgba(255,255,255,.09));padding-bottom:10px;}
.rch .sec-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:24px;color:var(--ink);margin:0;}
.rch .sec-note{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--ink3);text-transform:uppercase;}

/* Funnel */
.rch .funnel{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
.rch .fn{flex:1;min-width:140px;background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:10px;padding:15px 16px;}
.rch .fn-accent{border-color:var(--goldborder,rgba(201,168,76,.32));background:var(--goldpaper,rgba(201,168,76,.06));}
.rch .fn-muted{opacity:.72;}
.rch .fn-val{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:30px;line-height:1;color:var(--ink);}
.rch .fn-accent .fn-val{color:var(--gold);}
.rch .fn-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink2);margin-top:8px;}
.rch .fn-sub{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--ink3);margin-top:4px;line-height:1.4;}
.rch .fn-arrow{align-self:center;font-family:'DM Mono',monospace;font-size:18px;color:var(--ink4,rgba(245,243,239,.18));}

/* Tier chips */
.rch .chips{display:flex;flex-wrap:wrap;align-items:center;gap:7px;}
.rch .tchip{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink2);border:1px solid var(--rule2,rgba(255,255,255,.12));border-radius:5px;padding:6px 10px;display:inline-flex;align-items:center;gap:7px;}
.rch .tchip b{font-size:11px;color:var(--ink);}
.rch .tchip-a{border-color:var(--goldborder,rgba(201,168,76,.4));color:var(--gold);}
.rch .tchip-a b{color:var(--gold);}
.rch .tchip-b{border-color:rgba(201,168,76,.22);}
.rch .tchip-ok{border-color:var(--greenborder,rgba(74,222,128,.35));color:var(--green);}
.rch .tchip-ok b{color:var(--green);}
.rch .tchip-warn{border-color:rgba(248,113,113,.3);color:var(--red);}
.rch .tchip-warn b{color:var(--red);}
.rch .tchip-muted{opacity:.6;}
.rch .chip-div{width:1px;height:16px;background:var(--rule2,rgba(255,255,255,.12));margin:0 3px;}

/* Sequence */
.rch .seq{display:flex;flex-direction:column;gap:8px;}
.rch .seq-row{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:10px;padding:14px 18px;}
.rch .seq-id{display:flex;align-items:baseline;gap:10px;}
.rch .seq-tag{font-family:'DM Mono',monospace;font-size:10px;font-weight:600;letter-spacing:1px;color:var(--gold);}
.rch .seq-name{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:19px;color:var(--ink);}
.rch .seq-nums{display:flex;gap:22px;}
.rch .sn{display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
.rch .sn-val{font-family:'DM Mono',monospace;font-size:15px;color:var(--ink);}
.rch .sn-label{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3);}
.rch .sn-gold .sn-val{color:var(--gold);}
.rch .sn-warn .sn-val{color:var(--red);}
.rch .sn-muted{opacity:.6;}
.rch .seq-foot{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px;color:var(--gold);margin:14px 0 0;}

/* A/B */
.rch .ab{display:flex;flex-direction:column;gap:14px;}
.rch .ab-row{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:10px;padding:14px 16px;}
.rch .ab-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:9px;}
.rch .ab-variant{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--ink);}
.rch .ab-sends{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink2);white-space:nowrap;}
.rch .ab-bar{height:5px;background:var(--rule);border-radius:3px;overflow:hidden;margin-bottom:9px;}
.rch .ab-bar-fill{height:100%;background:var(--gold);border-radius:3px;transition:width .4s ease;}
.rch .ab-meta{display:flex;gap:16px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px;color:var(--ink3);text-transform:uppercase;}
.rch .ab-foot,.rch .ab-meta .warn,.rch .seq .warn{color:var(--red);}
.rch .ab-foot{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--ink3);margin:14px 0 0;line-height:1.5;font-style:italic;}

/* Sparkline */
.rch .spark{display:flex;align-items:flex-end;gap:10px;padding:8px 4px 0;overflow-x:auto;}
.rch .spark-col{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:34px;}
.rch .spark-val{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink2);}
.rch .spark-bar{width:22px;background:linear-gradient(180deg,var(--gold),rgba(201,168,76,.4));border-radius:3px 3px 0 0;transition:height .4s ease;}
.rch .spark-day{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.5px;color:var(--ink3);white-space:nowrap;}

/* Replies */
.rch .rep-empty{background:var(--bg2,rgba(255,255,255,.025));border:1px dashed var(--rule2,rgba(255,255,255,.14));border-radius:10px;padding:22px;text-align:center;}
.rch .rep-empty p{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:var(--ink2);margin:0 0 6px;}
.rch .rep-empty span{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink3);line-height:1.5;display:block;max-width:440px;margin:0 auto;}
.rch .rep-empty code{font-family:'DM Mono',monospace;font-size:11px;color:var(--gold);}
.rch .reps{display:flex;flex-direction:column;gap:10px;}
.rch .rep{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-left:2px solid var(--rule2,rgba(255,255,255,.2));border-radius:8px;padding:14px 16px;}
.rch .rep-good{border-left-color:var(--green);}
.rch .rep-bad{border-left-color:var(--red);}
.rch .rep-neutral{border-left-color:var(--ink3);}
.rch .rep-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;}
.rch .rep-who{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;}
.rch .rep-name{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:var(--ink);}
.rch .rep-co{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--ink3);}
.rch .rep-tags{display:flex;align-items:center;gap:10px;}
.rch .rep-class{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1px;text-transform:uppercase;padding:3px 7px;border-radius:4px;border:1px solid var(--rule2,rgba(255,255,255,.14));color:var(--ink2);}
.rch .rep-class-good{color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.35));}
.rch .rep-class-bad{color:var(--red);border-color:rgba(248,113,113,.3);}
.rch .rep-when{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;color:var(--ink3);white-space:nowrap;}
.rch .rep-subj{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--ink2);margin-top:9px;}
.rch .rep-preview{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink3);margin-top:5px;line-height:1.5;}

/* Campaigns */
.rch .camps{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;}
.rch .camp{background:var(--bg2,rgba(255,255,255,.025));border:1px solid var(--rule);border-radius:10px;padding:14px 16px;}
.rch .camp-top{display:flex;justify-content:space-between;align-items:center;gap:8px;}
.rch .camp-name{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--ink);}
.rch .camp-status{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1px;text-transform:uppercase;padding:3px 7px;border-radius:4px;border:1px solid var(--rule2,rgba(255,255,255,.14));color:var(--ink2);}
.rch .camp-active{color:var(--green);border-color:var(--greenborder,rgba(74,222,128,.35));}
.rch .camp-meta{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);margin-top:8px;display:flex;gap:5px;flex-wrap:wrap;}

@media (max-width:767px){
  .rch{padding:24px 18px 60px;}
  .rch .kpis{grid-template-columns:repeat(2,1fr);}
  .rch .rch-head{flex-direction:column;}
  .rch .head-right{align-items:flex-start;}
  .rch .fn-arrow{display:none;}
  .rch .seq-row{justify-content:flex-start;}
  .rch .seq-nums{gap:16px;flex-wrap:wrap;}
  .rch .rep-head{flex-wrap:wrap;}
}
`
