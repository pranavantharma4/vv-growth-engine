'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'
import ConnectionsSection from '../ConnectionsSection'

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const { client, toast, dark, setDark } = useApp()
  const [minimal, setMinimal] = useState(false)
  useEffect(() => { setMinimal(typeof document !== 'undefined' && document.body.classList.contains('minimal')) }, [])
  function toggleMinimal(v: boolean) {
    setMinimal(v)
    if (v) document.body.classList.add('minimal'); else document.body.classList.remove('minimal')
    localStorage.setItem('vv_minimal', v ? '1' : '0')
  }
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notifWeekly, setNotifWeekly] = useState(true)
  const [notifLeaks, setNotifLeaks] = useState(true)
  const [notifReports, setNotifReports] = useState(false)
  const [saving, setSaving] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!client) return
    setContactName(client.contact_name || '')
    setContactEmail(client.contact_email || '')
    const prefs = client.notification_preferences
    if (prefs) { setNotifWeekly(prefs.weekly ?? true); setNotifLeaks(prefs.leaks ?? true); setNotifReports(prefs.reports ?? false) }
    supabase.auth.getUser().then(({ data }) => setAuthEmail(data.user?.email || ''))
  }, [client])

  async function saveProfile() {
    if (!client) return
    setSaving(true)
    const { error } = await supabase.from('clients').update({
      contact_name: contactName,
      contact_email: contactEmail,
      notification_preferences: { weekly: notifWeekly, leaks: notifLeaks, reports: notifReports, sync: true },
    }).eq('id', client.id)
    if (error) toast('Error', error.message)
    else toast('Saved', 'Settings updated.')
    setSaving(false)
  }

  async function changePassword() {
    if (!newPassword || !confirmPassword) { toast('Missing fields', 'Enter your new password.'); return }
    if (newPassword !== confirmPassword) { toast('Mismatch', 'Passwords do not match.'); return }
    if (newPassword.length < 6) { toast('Too short', 'Min. 6 characters.'); return }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast('Error', error.message)
    else { toast('Password updated', 'Your password has been changed.'); setNewPassword(''); setConfirmPassword('') }
    setChangingPassword(false)
  }

  const Toggle = ({ val, set, label, sub }: { val: boolean, set: (v: boolean) => void, label: string, sub: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--rule)' }}>
      <div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'var(--ink)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px' }}>{sub}</div>
      </div>
      <div onClick={() => set(!val)} style={{ width: 42, height: 24, borderRadius: 12, background: val ? 'var(--gold)' : 'var(--rule2)', border: `1px solid ${val ? 'var(--gold)' : 'var(--rule)'}`, cursor: 'pointer', position: 'relative', transition: 'background 0.22s ease, border-color 0.22s ease', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: val ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: val ? '#050509' : 'var(--ink3)', transition: 'left 0.22s ease' }} />
      </div>
    </div>
  )

  const Section = ({ title }: { title: string }) => (
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--rule)' }}>{title}</div>
  )

  const fi: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 4, fontSize: 13 }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <style>{`
        body.minimal .settings-password { opacity: 0; max-height: 0; overflow: hidden; margin-bottom: 0 !important; transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; }
        .settings-password { opacity: 1; max-height: 400px; transition: opacity 0.4s ease, max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin 0.4s ease; margin-bottom: 16px; }
        body.minimal .settings-platform { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.35s ease, max-height 0.45s ease; }
        .settings-platform { opacity: 1; max-height: 200px; transition: opacity 0.35s ease, max-height 0.45s ease; }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Account</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Settings</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>Profile, notifications, and account preferences</div>
      </div>

      {/* Ad Account Connections */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        <Section title="Ad Account Connections" />
        <ConnectionsSection />
      </div>

      {/* Account */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        <Section title="Account" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Company / Brand</div>
            <div style={{ ...fi, background: 'var(--rule)', border: '1px solid var(--rule)', color: 'var(--ink3)', borderRadius: 4, padding: '10px 13px' }}>{client?.name || '—'}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Plan</div>
            <div style={{ ...fi, background: 'var(--rule)', border: '1px solid var(--rule)', color: 'var(--ink3)', borderRadius: 4, padding: '10px 13px', textTransform: 'capitalize' }}>{client?.plan || '—'}</div>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Login Email</div>
          <div style={{ ...fi, background: 'var(--rule)', border: '1px solid var(--rule)', color: 'var(--ink3)', borderRadius: 4, padding: '10px 13px' }}>{authEmail || '—'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Contact Name</div>
            <input style={fi} placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)} />
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Contact Email</div>
            <input style={fi} type="email" placeholder="Reports sent here" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes →'}
        </button>
      </div>

      {/* Notifications */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        <Section title="Notifications" />
        <Toggle val={notifWeekly} set={setNotifWeekly} label="Monday Intelligence Brief" sub="Weekly AI brief delivered every Monday at 7AM" />
        <Toggle val={notifLeaks} set={setNotifLeaks} label="Budget Leak Alerts" sub="Notified when a BLEEDING or DEAD campaign is detected" />
        <Toggle val={notifReports} set={setNotifReports} label="Monthly Reports" sub="Monthly performance summary and optimization blueprint" />
        <div style={{ marginTop: 16 }}>
          <button onClick={saveProfile} disabled={saving}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Preferences →'}
          </button>
        </div>
      </div>

      {/* Display Preferences */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
        <Section title="Display Preferences" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[{ label: 'Dark Mode', active: dark, on: () => setDark(true) }, { label: 'Light Mode', active: !dark, on: () => setDark(false) }].map(o => (
            <button key={o.label} onClick={o.on}
              style={{ flex: 1, minWidth: 130, padding: '11px', borderRadius: 4, cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', border: `1px solid ${o.active ? 'var(--goldborder)' : 'var(--rule)'}`, background: o.active ? 'var(--goldpaper)' : 'transparent', color: o.active ? 'var(--gold)' : 'var(--ink3)' }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {[{ label: 'Full View', active: !minimal, on: () => toggleMinimal(false) }, { label: 'Minimal View', active: minimal, on: () => toggleMinimal(true) }].map(o => (
            <button key={o.label} onClick={o.on}
              style={{ flex: 1, minWidth: 130, padding: '11px', borderRadius: 4, cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', border: `1px solid ${o.active ? 'var(--goldborder)' : 'var(--rule)'}`, background: o.active ? 'var(--goldpaper)' : 'transparent', color: o.active ? 'var(--gold)' : 'var(--ink3)' }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', marginTop: 12, lineHeight: 1.7 }}>
          Minimal view hides secondary panels for a focused, board-room presentation.
        </div>
      </div>

      {/* Password */}
      <div className="settings-password" style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px' }}>
        <Section title="Change Password" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>New Password</div>
            <input type="password" style={fi} placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Confirm New Password</div>
            <input type="password" style={fi} placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <button onClick={changePassword} disabled={changingPassword}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 22px', borderRadius: 4, cursor: changingPassword ? 'not-allowed' : 'pointer', opacity: changingPassword ? 0.7 : 1 }}>
          {changingPassword ? 'Updating...' : 'Update Password →'}
        </button>
      </div>

      {/* Platform info */}
      <div className="settings-platform" style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 6, padding: '24px 26px', marginTop: 16 }}>
        <Section title="Platform" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Version', value: 'v1.1' },
            { label: 'Status', value: client?.status || 'Active' },
            { label: 'Support', value: 'intelligence@\nvngrdvisuals.com' },
          ].map(item => (
            <div key={item.label} style={{ padding: '12px 14px', background: 'var(--rule)', border: '1px solid var(--rule2)', borderRadius: 4 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink2)', letterSpacing: '0.5px' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}