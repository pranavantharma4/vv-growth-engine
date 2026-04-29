'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const { client, toast, isAdmin } = useApp()

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notifWeekly, setNotifWeekly] = useState(true)
  const [notifLeaks, setNotifLeaks] = useState(true)
  const [notifReports, setNotifReports] = useState(false)
  const [saving, setSaving] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!client) return
    setContactName(client.contact_name || '')
    setContactEmail(client.contact_email || '')
    const prefs = client.notification_preferences
    if (prefs) {
      setNotifWeekly(prefs.weekly ?? true)
      setNotifLeaks(prefs.leaks ?? true)
      setNotifReports(prefs.reports ?? false)
    }
    supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email || '')
    })
  }, [client])

  async function saveProfile() {
    if (!client) return
    setSaving(true)
    const { error } = await supabase
      .from('clients')
      .update({
        contact_name: contactName,
        contact_email: contactEmail,
        notification_preferences: {
          weekly: notifWeekly,
          leaks: notifLeaks,
          reports: notifReports,
          sync: true,
        },
      })
      .eq('id', client.id)
    if (error) toast('Error', error.message)
    else toast('Saved', 'Settings updated successfully.')
    setSaving(false)
  }

  async function changePassword() {
    if (!newPassword || !confirmPassword) { toast('Missing fields', 'Enter your new password.'); return }
    if (newPassword !== confirmPassword) { toast('Mismatch', 'Passwords do not match.'); return }
    if (newPassword.length < 6) { toast('Too short', 'Password must be at least 6 characters.'); return }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast('Error', error.message)
    else {
      toast('Password updated', 'Your password has been changed.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  const ink   = 'rgba(250,248,245,0.92)'
  const ink2  = 'rgba(250,248,245,0.58)'
  const ink3  = 'rgba(250,248,245,0.28)'
  const rule  = 'rgba(250,248,245,0.07)'
  const gold  = '#c9a84c'
  const mono  = "'DM Mono',monospace"
  const serif = "'Cormorant Garamond',serif"
  const sans  = "'DM Sans',sans-serif"

  const fi: React.CSSProperties = {
    width: '100%', padding: '10px 13px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${rule}`,
    borderRadius: 4, color: ink,
    fontFamily: sans, fontSize: 13,
  }

  const sectionHead = (label: string) => (
    <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${rule}` }}>
      {label}
    </div>
  )

  const toggle = (val: boolean, set: (v: boolean) => void, label: string, sub: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid rgba(250,248,245,0.04)` }}>
      <div>
        <div style={{ fontFamily: sans, fontSize: 13, color: ink, marginBottom: 3 }}>{label}</div>
        <div style={{ fontFamily: mono, fontSize: 8, color: ink3, letterSpacing: '0.5px' }}>{sub}</div>
      </div>
      <div
        onClick={() => set(!val)}
        style={{ width: 42, height: 24, borderRadius: 12, background: val ? gold : 'rgba(255,255,255,0.08)', border: `1px solid ${val ? gold : rule}`, cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease, border-color 0.2s ease', flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', top: 3, left: val ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: val ? '#050509' : 'rgba(250,248,245,0.3)', transition: 'left 0.2s ease' }} />
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <style>{`
        input::placeholder { color: rgba(250,248,245,0.18); }
        input:focus { outline: none; border-color: rgba(201,168,76,0.4) !important; }
      `}</style>

      {/* Account */}
      <div style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        {sectionHead('Account')}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Company / Brand</div>
            <div style={{ ...fi, background: 'rgba(255,255,255,0.02)', color: ink3, cursor: 'default' }}>{client?.name || '—'}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Plan</div>
            <div style={{ ...fi, background: 'rgba(255,255,255,0.02)', color: ink3, cursor: 'default', textTransform: 'capitalize' }}>{client?.plan || '—'}</div>
          </div>
        </div>
        <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Login Email</div>
        <div style={{ ...fi, background: 'rgba(255,255,255,0.02)', color: ink3, cursor: 'default', marginBottom: 14 }}>{authEmail || '—'}</div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Contact Name</div>
            <input style={fi} placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Contact Email</div>
            <input style={fi} type="email" placeholder="Reports sent here" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '10px 22px', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Changes →'}
        </button>
      </div>

      {/* Notifications */}
      <div style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        {sectionHead('Notifications')}
        {toggle(notifWeekly, setNotifWeekly, 'Monday Intelligence Brief', 'Weekly AI brief delivered to your inbox every Monday at 7AM')}
        {toggle(notifLeaks, setNotifLeaks, 'Budget Leak Alerts', 'Notified when a new BLEEDING or DEAD campaign is detected')}
        {toggle(notifReports, setNotifReports, 'Monthly Reports', 'Monthly performance summary and optimization blueprint')}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '10px 22px', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Preferences →'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        {sectionHead('Change Password')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>New Password</div>
            <input type="password" style={fi} placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Confirm New Password</div>
            <input type="password" style={fi} placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={changingPassword}
          style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: gold, border: 'none', padding: '10px 22px', borderRadius: 4, cursor: changingPassword ? 'not-allowed' : 'pointer', opacity: changingPassword ? 0.7 : 1 }}
        >
          {changingPassword ? 'Updating...' : 'Update Password →'}
        </button>
      </div>

      {/* Platform info */}
      <div style={{ background: 'var(--bg2)', border: `1px solid ${rule}`, borderRadius: 6, padding: '24px 26px' }}>
        {sectionHead('Platform')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Version', value: 'v1.1' },
            { label: 'Status', value: client?.status || 'Active' },
            { label: 'Support', value: 'intelligence@vngrdvisuals.com' },
          ].map(item => (
            <div key={item.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${rule}`, borderRadius: 4 }}>
              <div style={{ fontFamily: mono, fontSize: 7, color: ink3, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: ink2, letterSpacing: '0.5px' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}