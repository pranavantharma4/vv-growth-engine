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

export default function InvitePage() {
  const { toast, isAdmin } = useApp()
  const supabase = createClientComponentClient()

  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    plan: 'managed',
    monthly_spend: '',
    notes: '',
    account_type: 'brand',
    agency_name: '',
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
        body: JSON.stringify({
          ...form,
          monthly_spend: parseFloat(form.monthly_spend) || 0,
        }),
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
      toast('Account created', `Portal access sent to ${invite.email}.`)
      loadInvites()
    } finally { setCreating(null) }
  }

  const ink   = 'rgba(250,248,245,0.9)'
  const ink2  = 'rgba(250,248,245,0.55)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const ink4  = 'rgba(250,248,245,0.11)'
  const rule  = 'rgba(250,248,245,0.07)'
  const gold  = '#c9a84c'
  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"

  const statusColor = (s: string) => ({ pending: ink3, sent: gold, accepted: '#4ade80', expired: 'rgba(248,113,113,0.6)' }[s] || ink3)
  const statusBg    = (s: string) => ({ pending: 'rgba(255,255,255,0.04)', sent: 'rgba(201,168,76,0.08)', accepted: 'rgba(74,222,128,0.08)', expired: 'rgba(248,113,113,0.08)' }[s] || 'transparent')

  const fi: React.CSSProperties = {
    width: '100%', padding: '10px 13px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${rule}`,
    borderRadius: 4, color: ink,
    fontFamily: sans, fontSize: 13,
  }

  const label = (text: string) => (
    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>{text}</div>
  )

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <style>{`
        input::placeholder,textarea::placeholder{color:rgba(250,248,245,0.18);}
        input:focus,textarea:focus,select:focus{border-color:rgba(201,168,76,0.4)!important;outline:none;}
        select option{background:#1a1816;color:#faf8f5;}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</div>
          <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: ink, marginBottom: 4 }}>Client Pipeline</div>
          <div style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: '1px' }}>
            Track applications · Provision accounts · Send portal access · Manage agencies
          </div>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer' }}
        >
          {showForm ? '✕ Cancel' : '+ Add to Pipeline'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 6, padding: '24px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 18, color: ink, marginBottom: 6 }}>New Client Application</div>
          <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1px', marginBottom: 20 }}>Add a brand client or a marketing agency that manages multiple brands</div>

          {/* Account type toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { value: 'brand', label: 'Brand / DTC Client', sub: 'Single brand running their own campaigns' },
              { value: 'agency', label: 'Marketing Agency', sub: 'Agency managing campaigns for multiple brands' },
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, account_type: opt.value }))}
                style={{ flex: 1, padding: '12px 16px', border: `1px solid ${form.account_type === opt.value ? gold : rule}`, background: form.account_type === opt.value ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, color: form.account_type === opt.value ? gold : ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px' }}>{opt.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>{label('Contact Name *')}<input style={fi} placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div>{label('Email *')}<input style={fi} type="email" placeholder="jane@brand.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div>
              {label(form.account_type === 'agency' ? 'Agency Name' : 'Company / Brand')}
              <input style={fi} placeholder={form.account_type === 'agency' ? 'Smith Media Agency' : 'Brand Co.'} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>{label('Monthly Ad Spend ($)')}<input style={fi} type="number" placeholder="10000" value={form.monthly_spend} onChange={e => setForm(f => ({ ...f, monthly_spend: e.target.value }))} /></div>
            <div>
              {label('Plan')}
              <select style={{ ...fi, cursor: 'pointer' }} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="starter">Starter</option>
                <option value="managed">Managed</option>
                <option value="embedded">Embedded</option>
              </select>
            </div>
            <div>{label('Notes')}<input style={fi} placeholder="Referral source, urgency, context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>

          {/* Agency-specific fields */}
          {form.account_type === 'agency' && (
            <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.12)`, borderRadius: 4 }}>
              <div style={{ fontFamily: mono, fontSize: 7, color: 'rgba(201,168,76,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Agency White-Label Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  {label('Agency Display Name (shown on client-facing reports)')}
                  <input style={fi} placeholder="e.g. Smith Media Group" value={form.agency_name} onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))} />
                </div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px', marginTop: 10 }}>
                Agency accounts get white-labelled briefs and reports — your agency name appears in all client-facing outputs, never ours.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={submitInvite}
              disabled={submitting}
              style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '10px 22px', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Adding...' : 'Add to Pipeline →'}
            </button>
          </div>
        </div>
      )}

      {/* Pipeline table */}
      <div style={{ border: `1px solid ${rule}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ background: 'rgba(255,255,255,0.025)', padding: '12px 20px', borderBottom: `1px solid ${rule}`, display: 'grid', gridTemplateColumns: '2fr 80px 1fr 1fr 80px 1fr auto', gap: 12 }}>
          {['Client', 'Type', 'Plan', 'Spend', 'Status', 'Added', 'Action'].map(h => (
            <div key={h} style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: 1 }}>Loading pipeline...</div>
        ) : invites.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: serif, fontSize: 20, color: ink, marginBottom: 8 }}>Pipeline is empty</div>
            <div style={{ fontFamily: mono, fontSize: 9, color: ink3, letterSpacing: 1 }}>Add clients manually above, or they'll appear here when they book a call</div>
          </div>
        ) : invites.map((inv, i) => (
          <div key={inv.id} style={{ padding: '14px 20px', borderBottom: i < invites.length - 1 ? `1px solid rgba(250,248,245,0.04)` : 'none', display: 'grid', gridTemplateColumns: '2fr 80px 1fr 1fr 80px 1fr auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 12, color: ink, fontWeight: 500 }}>{inv.name}</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: ink3, marginTop: 2 }}>{inv.email}</div>
              {inv.company && <div style={{ fontFamily: mono, fontSize: 8, color: ink3, marginTop: 1 }}>{inv.company}</div>}
            </div>
            <div>
              <span style={{ fontFamily: mono, fontSize: 7, letterSpacing: '1px', textTransform: 'uppercase', color: (inv.account_type || 'brand') === 'agency' ? gold : ink3, background: (inv.account_type || 'brand') === 'agency' ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 2, border: `1px solid ${(inv.account_type || 'brand') === 'agency' ? 'rgba(201,168,76,0.2)' : rule}` }}>
                {(inv.account_type || 'brand').toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, color: ink2, textTransform: 'capitalize' }}>{inv.plan}</div>
            <div style={{ fontFamily: serif, fontSize: 15, color: ink }}>${(inv.monthly_spend || 0).toLocaleString()}</div>
            <div>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: statusColor(inv.status), background: statusBg(inv.status), padding: '3px 8px', borderRadius: 2, border: `1px solid ${statusColor(inv.status)}22` }}>
                {inv.status}
              </span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 8, color: ink3 }}>
              {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div>
              {inv.status === 'pending' || inv.status === 'sent' ? (
                <button
                  onClick={() => provisionAccount(inv)}
                  disabled={creating === inv.id}
                  style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '6px 14px', borderRadius: 3, cursor: creating === inv.id ? 'not-allowed' : 'pointer', opacity: creating === inv.id ? 0.6 : 1, whiteSpace: 'nowrap' }}
                >
                  {creating === inv.id ? 'Creating...' : 'Create Account →'}
                </button>
              ) : inv.status === 'accepted' ? (
                <span style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', letterSpacing: 1 }}>✓ Active</span>
              ) : (
                <span style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: 1 }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      {invites.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: invites.length },
            { label: 'Agencies', value: invites.filter(i => i.account_type === 'agency').length },
            { label: 'Brands', value: invites.filter(i => !i.account_type || i.account_type === 'brand').length },
            { label: 'Active', value: invites.filter(i => i.status === 'accepted').length },
            { label: 'Pending', value: invites.filter(i => i.status === 'pending').length },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule}`, borderRadius: 4, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: serif, fontSize: 20, color: ink }}>{s.value}</span>
              <span style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}