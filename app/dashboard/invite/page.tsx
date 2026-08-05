'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

type Invite = {
  id: string
  name: string
  email: string
  company: string
  plan: string
  monthly_spend: number
  status: string
  created_at: string
  notes: string
  account_type: string
}

type ClientRecord = {
  id: string
  name: string
  contact_email: string
}

export default function InvitePage() {
  const { toast } = useApp()
  const supabase = createClientComponentClient()

  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Remove modal state
  const [removeModal, setRemoveModal] = useState<{ invite: Invite; client: ClientRecord | null } | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [removing, setRemoving] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', company: '', plan: 'managed',
    monthly_spend: '', notes: '', account_type: 'brand', agency_name: '',
  })

  useEffect(() => { loadInvites() }, [])

  async function loadInvites() {
    setLoading(true)
    const { data } = await supabase
      .from('client_invites')
      .select('*')
      .order('created_at', { ascending: false })
    setInvites(data || [])
    setLoading(false)
  }

  async function submitInvite() {
    if (!form.name || !form.email) { toast('Missing fields', 'Name and email are required.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monthly_spend: parseFloat(form.monthly_spend) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      toast('Added to pipeline', `${form.name} added.`)
      setForm({ name: '', email: '', company: '', plan: 'managed', monthly_spend: '', notes: '', account_type: 'brand', agency_name: '' })
      setShowForm(false)
      loadInvites()
    } finally { setSubmitting(false) }
  }

  async function provisionAccount(invite: Invite) {
    setCreating(invite.id)
    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: invite.name,
          email: invite.email,
          company: invite.company,
          plan: invite.plan,
          monthly_spend: invite.monthly_spend,
          notes: invite.notes,
          account_type: invite.account_type || 'brand',
          invite_id: invite.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      if (data.email_error) {
        toast('Account created', `Portal access sent. Note: ${data.email_error}`)
      } else {
        toast('Account created', `Portal access email sent to ${invite.email}.`)
      }
      loadInvites()
    } finally { setCreating(null) }
  }

  async function resendMagicLink(invite: Invite) {
    setResending(invite.id)
    try {
      const res = await fetch('/api/admin/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.email, name: invite.name }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      toast('Email resent', `Portal access link resent to ${invite.email}.`)
    } finally { setResending(null) }
  }

  async function openRemoveModal(invite: Invite) {
    // Check if they have an active client account
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, name, contact_email')
      .eq('contact_email', invite.email)
      .limit(1)
      .maybeSingle()
    setRemoveModal({ invite, client: clientData || null })
    setRemoveReason('')
  }

  async function confirmRemove() {
    if (!removeModal) return
    setRemoving(true)
    try {
      const res = await fetch('/api/admin/remove-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: removeModal.client?.id || null,
          invite_id: removeModal.invite.id,
          client_name: removeModal.invite.name,
          client_email: removeModal.invite.email,
          reason: removeReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast('Error', data.error); return }
      toast('Account removed', `${removeModal.invite.name} has been removed. Termination email sent.`)
      setRemoveModal(null)
      setRemoveReason('')
      loadInvites()
    } finally { setRemoving(false) }
  }

  const statusColor = (s: string) => ({
    pending: 'var(--ink3)', sent: 'var(--gold)',
    accepted: '#4ade80', expired: '#f87171',
  }[s] || 'var(--ink3)')

  const statusBg = (s: string) => ({
    pending: 'var(--rule)', sent: 'var(--goldpaper)',
    accepted: 'rgba(74,222,128,0.08)', expired: 'var(--redpaper)',
  }[s] || 'var(--rule)')

  const fi: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 4,
    fontSize: 13, fontFamily: "'DM Sans',sans-serif",
  }

  const Label = ({ text }: { text: string }) => (
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>
      {text}
    </div>
  )

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <style>{`
        body.minimal .invite-form-wrap { opacity:0;max-height:0;overflow:hidden;margin-bottom:0!important;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1),margin 0.4s ease; }
        .invite-form-wrap { opacity:1;max-height:800px;transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1),margin 0.4s ease; }
        body.minimal .invite-stats { opacity:0;max-height:0;overflow:hidden;margin-top:0!important;transition:opacity 0.35s ease,max-height 0.45s ease,margin 0.4s ease; }
        .invite-stats { opacity:1;max-height:80px;margin-top:14px;transition:opacity 0.35s ease,max-height 0.45s ease,margin 0.4s ease; }
        body.minimal .invite-extra { opacity:0;max-height:0;overflow:hidden;transition:opacity 0.3s ease,max-height 0.4s ease; }
        .invite-extra { opacity:1;max-height:40px;transition:opacity 0.3s ease,max-height 0.4s ease; }
      `}</style>

      {/* Remove confirmation modal */}
      {removeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--rule)', borderRadius: 8, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#f87171', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              Remove Account
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>
              Remove {removeModal.invite.name}?
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '0.5px', lineHeight: 1.7, marginBottom: 20 }}>
              This will remove their pipeline entry{removeModal.client ? ', delete their client account, all campaign data, briefs, and analyses' : ''}. A termination email will be sent to {removeModal.invite.email}.
            </div>

            {removeModal.client && (
              <div style={{ background: 'var(--redpaper)', border: '1px solid var(--redborder)', borderRadius: 4, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#f87171', letterSpacing: '1.5px', marginBottom: 4 }}>Active account will be deleted</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink2)' }}>{removeModal.client.name} · {removeModal.client.contact_email}</div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <Label text="Reason (optional — shown in termination email)" />
              <input
                style={fi}
                placeholder="e.g. Contract concluded, client request..."
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setRemoveModal(null); setRemoveReason('') }}
                style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', background: 'transparent', border: '1px solid var(--rule)', padding: '11px 18px', borderRadius: 4, cursor: 'pointer', letterSpacing: '1px' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#fff', background: removing ? 'rgba(248,113,113,0.5)' : '#dc2626', border: 'none', padding: '11px 18px', borderRadius: 4, cursor: removing ? 'not-allowed' : 'pointer' }}
              >
                {removing ? 'Removing...' : 'Remove & Send Email →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Client Pipeline</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>
            Track applications · Provision accounts · Send portal access
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer' }}>
          {showForm ? '✕ Cancel' : '+ Add to Pipeline'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="invite-form-wrap" style={{ marginBottom: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>New Client Application</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px', marginBottom: 16 }}>Add a brand client or a marketing agency</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[
                { value: 'brand', label: 'Brand / DTC', sub: 'Single brand, their own campaigns' },
                { value: 'agency', label: 'Agency', sub: 'Manages multiple brand clients' },
              ].map(opt => (
                <div key={opt.value} onClick={() => setForm(f => ({ ...f, account_type: opt.value }))}
                  style={{ flex: 1, padding: '12px 16px', border: `1px solid ${form.account_type === opt.value ? 'var(--goldborder)' : 'var(--rule)'}`, background: form.account_type === opt.value ? 'var(--goldpaper)' : 'var(--rule)', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, color: form.account_type === opt.value ? 'var(--gold)' : 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px' }}>{opt.sub}</div>
                </div>
              ))}
            </div>

            <div className="vv-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><Label text="Contact Name *" /><input style={fi} placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label text="Email *" /><input style={fi} type="email" placeholder="jane@brand.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label text={form.account_type === 'agency' ? 'Agency Name' : 'Company / Brand'} /><input style={fi} placeholder={form.account_type === 'agency' ? 'Smith Media Agency' : 'Brand Co.'} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div><Label text="Monthly Ad Spend ($)" /><input style={fi} type="number" placeholder="10000" value={form.monthly_spend} onChange={e => setForm(f => ({ ...f, monthly_spend: e.target.value }))} /></div>
              <div>
                <Label text="Plan" />
                <select style={{ ...fi, cursor: 'pointer' }} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  <option value="starter">Starter</option>
                  <option value="managed">Managed</option>
                  <option value="embedded">Embedded</option>
                </select>
              </div>
              <div><Label text="Notes" /><input style={fi} placeholder="Referral, urgency, context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>

            {form.account_type === 'agency' && (
              <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 4 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>Agency White-Label Settings</div>
                <Label text="Agency Display Name (on client-facing reports)" />
                <input style={fi} placeholder="e.g. Smith Media Group" value={form.agency_name} onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))} />
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 8 }}>Your agency name appears in all client outputs. Our platform is never mentioned.</div>
              </div>
            )}

            <button onClick={submitInvite} disabled={submitting}
              style={{ marginTop: 18, fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Adding...' : 'Add to Pipeline →'}
            </button>
          </div>
        </div>
      )}

      {/* Pipeline table — horizontal scroll on small screens */}
      <div className="vv-tablewrap">
      <div style={{ border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden', minWidth: 700 }}>
        <div style={{ background: 'var(--bg2)', padding: '12px 20px', borderBottom: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '2fr 70px 80px 80px 80px 90px auto', gap: 10 }}>
          {['Client', 'Type', 'Plan', 'Spend', 'Status', 'Added', 'Actions'].map(h => (
            <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>Loading pipeline...</div>
        ) : invites.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>Pipeline is empty</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: 1 }}>
              Add clients above, or they'll appear here automatically when they book a call
            </div>
          </div>
        ) : invites.map((inv, i) => (
          <div key={inv.id} style={{ padding: '14px 20px', borderBottom: i < invites.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', display: 'grid', gridTemplateColumns: '2fr 70px 80px 80px 80px 90px auto', gap: 10, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{inv.name}</div>
              <div className="invite-extra" style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 2 }}>{inv.email}</div>
              {inv.company && <div className="invite-extra" style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 1 }}>{inv.company}</div>}
            </div>
            <div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1px', textTransform: 'uppercase', color: (inv.account_type || 'brand') === 'agency' ? 'var(--gold)' : 'var(--ink3)', background: (inv.account_type || 'brand') === 'agency' ? 'var(--goldpaper)' : 'var(--rule)', padding: '2px 6px', borderRadius: 2, border: `1px solid ${(inv.account_type || 'brand') === 'agency' ? 'var(--goldborder)' : 'var(--rule2)'}` }}>
                {(inv.account_type || 'brand').toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink2)', textTransform: 'capitalize' }}>{inv.plan}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: 'var(--ink)' }}>${(inv.monthly_spend || 0).toLocaleString()}</div>
            <div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: statusColor(inv.status), background: statusBg(inv.status), padding: '3px 8px', borderRadius: 2, border: `1px solid ${statusColor(inv.status)}33` }}>
                {inv.status}
              </span>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)' }}>
              {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Create Account — for pending */}
              {(inv.status === 'pending' || inv.status === 'sent') && (
                <button onClick={() => provisionAccount(inv)} disabled={creating === inv.id}
                  style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '5px 10px', borderRadius: 3, cursor: creating === inv.id ? 'not-allowed' : 'pointer', opacity: creating === inv.id ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {creating === inv.id ? '...' : 'Create →'}
                </button>
              )}
              {/* Resend magic link — for accepted */}
              {inv.status === 'accepted' && (
                <button onClick={() => resendMagicLink(inv)} disabled={resending === inv.id}
                  style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 600, letterSpacing: '1px', color: 'var(--gold)', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', padding: '5px 10px', borderRadius: 3, cursor: resending === inv.id ? 'not-allowed' : 'pointer', opacity: resending === inv.id ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {resending === inv.id ? '...' : '✉ Resend'}
                </button>
              )}
              {/* Remove — always visible */}
              <button onClick={() => openRemoveModal(inv)}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1px', color: '#f87171', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', padding: '5px 10px', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Stats */}
      {invites.length > 0 && (
        <div className="invite-stats" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    value: invites.length },
            { label: 'Agencies', value: invites.filter(i => i.account_type === 'agency').length },
            { label: 'Brands',   value: invites.filter(i => !i.account_type || i.account_type === 'brand').length },
            { label: 'Active',   value: invites.filter(i => i.status === 'accepted').length },
            { label: 'Pending',  value: invites.filter(i => i.status === 'pending').length },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 4, padding: '9px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--ink)' }}>{s.value}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}