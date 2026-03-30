'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppCtx } from './context'
import type { Client } from '@/lib/types'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',       icon: '◈', section: 'Overview',      admin: false },
  { id: 'campaigns', label: 'Campaigns',        icon: '◫', section: null,            admin: false },
  { id: 'analysis',  label: 'AI Analysis',      icon: '◉', section: 'Intelligence', admin: false },
  { id: 'optimize',  label: 'Ads Optimization', icon: '◑', section: null,            admin: false },
  { id: 'brief',     label: 'Weekly Brief',     icon: '◧', section: null,            admin: false },
  { id: 'reports',   label: 'Reports',          icon: '▣', section: null,            admin: false },
  { id: 'admin',     label: 'Client Health',    icon: '▲', section: 'Admin',         admin: true  },
  { id: 'connect',   label: 'Connections',      icon: '◎', section: null,            admin: false },
  { id: 'settings',  label: 'Settings',         icon: '◌', section: null,            admin: false },
  { id: 'invite',    label: 'Invite Client',    icon: '+', section: 'Admin',         admin: true  },
  { id: 'data-tool', label: 'Campaign Data',    icon: '✎', section: 'Admin',         admin: true  },
]

const TITLES: Record<string, [string, string]> = {
  dashboard:   ['Overview',          ''],
  campaigns:   ['Campaigns',         'All active campaigns across platforms'],
  analysis:    ['AI Analysis',       'Claude-powered campaign diagnostics'],
  optimize:    ['Ads Optimization',  'Build and refine campaigns from AI insights'],
  brief:       ['Weekly Brief',      'Automated intelligence summary'],
  reports:     ['Reports',           'Monthly audits and optimization blueprints'],
  admin:       ['Client Health',     'All accounts at a glance'],
  connect:     ['Connections',       'Manage ad account integrations'],
  settings:    ['Settings',          'Account preferences and notifications'],
  invite:      ['Invite Client',     'Create and onboard a new client account'],
  'data-tool': ['Campaign Data',     'Update client campaign metrics'],
}

const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcW5obGtqYXpsc2ZjdGxkYm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU0OTYsImV4cCI6MjA4OTA4MTQ5Nn0.abff7Fdqidvcg8hs0c5Gz7fO0cGmgVPxbrrRlpZ-sws'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()

  const [clients, setClients] = useState<Client[]>([])
  const [client, setClientState] = useState<Client | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dark, setDarkState] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const [toastData, setToastData] = useState({ show: false, title: '', body: '' })
  const [syncing, setSyncing] = useState(false)

  function toast(title: string, body: string) {
    setToastData({ show: true, title, body })
    setTimeout(() => setToastData(t => ({ ...t, show: false })), 3500)
  }

  function setClient(c: Client) {
    setClientState(c)
    localStorage.setItem('vv_client', c.id)
    setDropdown(false)
    toast('Client switched', 'Now viewing ' + c.name)
  }

  function setDark(v: boolean) {
    setDarkState(v)
    document.body.classList.toggle('dark', v)
    localStorage.setItem('vv_dark', v ? '1' : '0')
  }

  async function handleSync() {
    if (!client) { toast('No client', 'Select a client first.'); return }
    if (syncing) return

    // Check if client has an active Meta connection
    const { data: conn } = await supabase
      .from('ad_connections')
      .select('id, platform, is_active, expires_at')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .single()

    if (!conn) {
      toast('No connection', 'Connect a Meta Ads account first under Connections.')
      return
    }

    // Check token expiry
    if (conn.expires_at && new Date(conn.expires_at) < new Date()) {
      toast('Token expired', 'Meta connection expired. Please reconnect under Connections.')
      return
    }

    setSyncing(true)
    toast('Syncing', 'Pulling latest campaigns from Meta Ads...')

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-meta-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ client_id: client.id }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast('Sync failed', data.error || 'Something went wrong. Check your connection.')
      } else {
        toast('Sync complete', `${data.campaigns_synced} campaigns updated from Meta Ads.`)
      }
    } catch (err) {
      toast('Sync failed', 'Network error. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (localStorage.getItem('vv_dark') === '1') { setDarkState(true); document.body.classList.add('dark') }
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: cu } = await supabase.from('client_users').select('role').eq('user_id', user.id).limit(1).single()
      setIsAdmin(cu?.role === 'admin')
      const { data: cd } = await supabase.from('clients').select('*').order('name')
      if (cd?.length) {
        setClients(cd)
        const saved = localStorage.getItem('vv_client')
        setClientState(cd.find((c: Client) => c.id === saved) || cd[0])
      }
    })()
  }, [])

  const page = pathname.split('/').pop() || 'dashboard'
  const [title, sub] = TITLES[page] || ['', '']
  const subtitle = page === 'dashboard' ? (client?.name || '') + ' · March 2026' : sub

  return (
    <AppCtx.Provider value={{ client, setClient, clients, isAdmin, dark, setDark, toast }}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 214, background: 'var(--sb)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

          {/* Logo */}
          <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--sb-rule)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: '#faf8f5', letterSpacing: 2 }}>VV</span>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(250,248,245,0.55)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Vanguard Visuals</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: 'rgba(250,248,245,0.25)', marginTop: 2 }}>Growth Ad Engine</div>
              </div>
            </div>
          </div>

          {/* Client switcher */}
          <div onClick={() => setDropdown(d => !d)} style={{ margin: '12px 12px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sb-rule)', borderRadius: 6, padding: '9px 12px', cursor: 'pointer', position: 'relative' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Active Client</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--sb-text)' }}>{client?.name || 'Loading...'}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--goldlt)', marginTop: 2, textTransform: 'capitalize' }}>{client?.plan} · {client?.status}</div>
              </div>
              <span style={{ color: 'rgba(250,248,245,0.3)', fontSize: 10 }}>▾</span>
            </div>
            {dropdown && clients.length > 1 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1816', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, marginTop: 4, zIndex: 100 }}>
                {clients.map((c: Client) => (
                  <div key={c.id} onClick={e => { e.stopPropagation(); setClient(c) }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: client?.id === c.id ? 'rgba(201,168,76,0.1)' : 'transparent' }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: client?.id === c.id ? 'var(--goldlt)' : 'rgba(250,248,245,0.85)' }}>{c.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.3)', marginTop: 2 }}>{c.plan} · ${(c.monthly_ad_spend || 0).toLocaleString()}/mo</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '6px 10px', overflowY: 'auto' }}>
            {NAV.filter(n => !n.admin || isAdmin).map(item => {
              const active = page === item.id
              return (
                <div key={item.id}>
                  {item.section && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', padding: '12px 10px 5px' }}>{item.section}</div>}
                  <button onClick={() => router.push('/dashboard' + (item.id === 'dashboard' ? '' : '/' + item.id))}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 5, border: 'none', borderLeft: `2px solid ${active ? 'var(--goldlt)' : 'transparent'}`, background: active ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <span style={{ fontSize: 11, width: 16, textAlign: 'center', color: active ? 'var(--goldlt)' : 'rgba(250,248,245,0.28)' }}>{item.icon}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: active ? 'var(--sb-text)' : 'rgba(250,248,245,0.4)', fontWeight: active ? 500 : 400 }}>{item.label}</span>
                  </button>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '11px 15px', borderTop: '1px solid var(--sb-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4c8b4c', animation: 'pulse 2.5s ease infinite' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--sb-muted)', letterSpacing: 1 }}>Live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button onClick={() => setDark(!dark)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '4px 9px', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.45)' }}>{dark ? 'Dark' : 'Light'}</button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.25)', padding: 4 }}>✕</button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', fl