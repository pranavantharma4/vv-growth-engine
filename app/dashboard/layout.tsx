'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect, useRef } from 'react'
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
  const [dark, setDarkState] = useState(true)
  const [minimal, setMinimalState] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const [toastData, setToastData] = useState({ show: false, title: '', body: '' })
  const [syncing, setSyncing] = useState(false)
  const [navTarget, setNavTarget] = useState('')
  const [contentKey, setContentKey] = useState(pathname)

  // Portal intro
  const [portalPhase, setPortalPhase] = useState(0)
  const [portalDone, setPortalDone] = useState(true)

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('vv_just_logged_in')
    if (justLoggedIn) {
      sessionStorage.removeItem('vv_just_logged_in')
      setPortalDone(false)
      setPortalPhase(0)
      const t: ReturnType<typeof setTimeout>[] = []
      t.push(setTimeout(() => setPortalPhase(1), 60))
      t.push(setTimeout(() => setPortalPhase(2), 440))
      t.push(setTimeout(() => setPortalPhase(3), 820))
      t.push(setTimeout(() => setPortalPhase(4), 1020))
      t.push(setTimeout(() => { setPortalDone(true) }, 1420))
      return () => t.forEach(clearTimeout)
    }
  }, [])

  const prevPathRef = useRef(pathname)
  const routeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname
    if (routeTimer.current) clearTimeout(routeTimer.current)
    routeTimer.current = setTimeout(() => {
      setContentKey(pathname)
      setNavTarget('')
    }, 90)
    return () => { if (routeTimer.current) clearTimeout(routeTimer.current) }
  }, [pathname])

  useEffect(() => {
    const routes = NAV.map(n => '/dashboard' + (n.id === 'dashboard' ? '' : '/' + n.id))
    routes.forEach(r => router.prefetch(r))
  }, [])

  function toast(title: string, body: string) {
    setToastData({ show: true, title, body })
    setTimeout(() => setToastData(t => ({ ...t, show: false })), 3500)
  }

  function navigate(path: string) {
    if (pathname === path) return
    setNavTarget(path)
    setTimeout(() => router.push(path), 90)
  }

  function setClient(c: Client) {
    setClientState(c)
    localStorage.setItem('vv_client', c.id)
    setDropdown(false)
    toast('Client switched', 'Now viewing ' + c.name)
  }

  function setDark(v: boolean) {
    setDarkState(v)
    if (v) {
      document.body.classList.remove('light')
    } else {
      document.body.classList.add('light')
    }
    localStorage.setItem('vv_dark', v ? '1' : '0')
  }

  function setMinimal(v: boolean) {
    setMinimalState(v)
    if (v) {
      document.body.classList.add('minimal')
    } else {
      document.body.classList.remove('minimal')
    }
    localStorage.setItem('vv_minimal', v ? '1' : '0')
  }

  async function handleSync() {
    if (!client) { toast('No client', 'Select a client first.'); return }
    if (syncing) return
    const { data: conn } = await supabase
      .from('ad_connections')
      .select('id, platform, is_active, expires_at')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .single()
    if (!conn) { toast('No connection', 'Connect a Meta Ads account first under Connections.'); return }
    if (conn.expires_at && new Date(conn.expires_at) < new Date()) { toast('Token expired', 'Meta connection expired. Please reconnect.'); return }
    setSyncing(true)
    toast('Syncing', 'Pulling latest campaigns from Meta Ads...')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-meta-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ client_id: client.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) toast('Sync failed', data.error || 'Something went wrong.')
      else toast('Sync complete', `${data.campaigns_synced} campaigns updated from Meta Ads.`)
    } catch { toast('Sync failed', 'Network error. Please try again.') }
    finally { setSyncing(false) }
  }

  useEffect(() => {
    const savedDark = localStorage.getItem('vv_dark')
    const savedMinimal = localStorage.getItem('vv_minimal')
    // Default to dark mode
    if (savedDark === '0') {
      setDarkState(false)
      document.body.classList.add('light')
    } else {
      setDarkState(true)
      document.body.classList.remove('light')
    }
    if (savedMinimal === '1') {
      setMinimalState(true)
      document.body.classList.add('minimal')
    }
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
  const now = new Date()
  const subtitle = page === 'dashboard'
    ? (client?.name || '') + ' · ' + now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : sub

  const isActive = (id: string) => {
    const t = '/dashboard' + (id === 'dashboard' ? '' : '/' + id)
    if (navTarget) return navTarget === t
    return page === id
  }

  const G = '#c9a84c'
  const INK = 'rgba(245,243,239,0.95)'
  const I3 = 'rgba(245,243,239,0.28)'
  const I4 = 'rgba(245,243,239,0.11)'
  const MONO = "'DM Mono',monospace"
  const SERIF = "'Cormorant Garamond',serif"

  const symVisible  = portalPhase === 1
  const vvVisible   = portalPhase >= 2 && portalPhase <= 4
  const tagVisible  = portalPhase >= 3
  const overlayOn   = portalPhase < 4

  return (
    <AppCtx.Provider value={{ client, setClient, clients, isAdmin, dark, setDark, toast }}>

      {/* Portal intro */}
      {!portalDone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#020203', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: overlayOn ? 1 : 0, transition: portalPhase >= 4 ? 'opacity 0.42s cubic-bezier(0.4,0,0.6,1)' : 'none', pointerEvents: portalPhase >= 4 ? 'none' : 'all', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23f)'/%3E%3C/svg%3E\")", backgroundSize: '200px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)', opacity: vvVisible ? 1 : 0, transition: 'opacity 1.8s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) translateY(-72px)', height: '1px', width: portalPhase >= 1 ? '240px' : '0', background: `linear-gradient(to right,transparent,${G},transparent)`, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)', opacity: 0.28 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) translateY(76px)', height: '1px', width: portalPhase >= 1 ? '240px' : '0', background: `linear-gradient(to right,transparent,${G},transparent)`, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 0.12s', opacity: 0.28 }} />
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 24, opacity: symVisible ? 1 : 0, transition: symVisible ? 'opacity 0.18s ease' : 'opacity 0.12s ease' }}>
            {[{ s: '↑', c: 'rgba(74,222,128,0.65)', d: '0ms' }, { s: '·', c: 'rgba(245,243,239,0.14)', d: '50ms' }, { s: '↓', c: 'rgba(248,113,113,0.65)', d: '100ms' }].map((x, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: 12, color: x.c, opacity: symVisible ? 1 : 0, transform: symVisible ? 'none' : 'translateY(3px)', transition: `opacity 0.18s ease ${x.d}, transform 0.18s ease ${x.d}` }}>{x.s}</span>
            ))}
          </div>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: SERIF, fontSize: 'clamp(80px,17vw,148px)', fontWeight: 300, fontStyle: 'italic', color: INK, letterSpacing: '1px', lineHeight: 1, userSelect: 'none', opacity: vvVisible ? 1 : 0, transform: vvVisible ? 'none' : 'scale(0.97)', transition: vvVisible ? 'opacity 0.32s cubic-bezier(0.16,1,0.3,1), transform 0.38s cubic-bezier(0.16,1,0.3,1)' : 'opacity 0.18s ease, transform 0.18s ease' }}>VV</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: tagVisible ? 1 : 0, transform: tagVisible ? 'translateY(0)' : 'translateY(5px)', transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: I3, letterSpacing: '4px', textTransform: 'uppercase' }}>Growth Ad Engine</div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '3px', textTransform: 'uppercase' }}>v1.1</div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: 26, left: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase', opacity: vvVisible ? 0.55 : 0, transition: 'opacity 0.8s ease 0.3s' }}>vngrdvisuals.com</div>
          <div style={{ position: 'absolute', top: 26, right: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '2px', textTransform: 'uppercase', opacity: vvVisible ? 0.55 : 0, transition: 'opacity 0.8s ease 0.5s' }}>Intelligence Platform</div>
          <div style={{ position: 'absolute', bottom: 26, left: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px', opacity: tagVisible ? 0.45 : 0, transition: 'opacity 0.8s ease 0.2s' }}>Secured access</div>
          <div style={{ position: 'absolute', bottom: 26, right: 32, fontFamily: MONO, fontSize: 7, color: I4, letterSpacing: '1.5px', opacity: tagVisible ? 0.45 : 0, transition: 'opacity 0.8s ease 0.4s' }}>Est. 2026</div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }

        @keyframes contentIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes contentOut { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-5px)} }
        .content-in  { animation: contentIn  0.22s cubic-bezier(0.16,1,0.3,1) both; }
        .content-out { animation: contentOut 0.09s ease both; pointer-events: none; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .nav-btn { transition: background-color 0.1s ease, border-color 0.1s ease, opacity 0.1s ease; transform: translateZ(0); backface-visibility: hidden; }
        .nav-btn:hover { background-color: rgba(255,255,255,0.055) !important; }
        .nav-btn:active { transform: scale(0.975) translateZ(0) !important; }
        .nav-icon { transition: color 0.12s ease; }
        .nav-label { transition: color 0.12s ease; }

        .dropdown-item { transition: background-color 0.1s ease; }
        .dropdown-item:hover { background-color: rgba(255,255,255,0.06) !important; }
        .client-switcher { transition: background-color 0.12s ease; }
        .client-switcher:hover { background-color: rgba(255,255,255,0.05) !important; }

        @keyframes dropIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .client-dropdown { animation: dropIn 0.14s cubic-bezier(0.16,1,0.3,1) both; }

        button { transform: translateZ(0); transition: opacity 0.12s ease, background-color 0.12s ease, border-color 0.12s ease, transform 0.1s ease; }
        button:active { transform: scale(0.97) translateZ(0) !important; }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.09); border-radius: 2px; }

        .main-scroll { overflow-y: auto; overscroll-behavior: contain; transform: translateZ(0); }
        .sidebar { transform: translateZ(0); will-change: auto; }
        .toast-wrap { will-change: transform, opacity; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.24s ease; }

        /* Mode toggle buttons */
        .mode-btn { padding: 3px 8px; border-radius: 3px; cursor: pointer; font-family: 'DM Mono',monospace; font-size: 7px; letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: rgba(250,248,245,0.45); transition: all 0.15s ease; }
        .mode-btn.active { background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
        .mode-btn:hover { background: rgba(255,255,255,0.08); }

        /* Minimal mode */
        body.minimal .minimal-hide { display: none !important; }
        body.minimal .main-scroll { padding: 16px 20px !important; }

        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside className="sidebar" style={{ width: 214, background: 'var(--sb)', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid var(--sb-rule)' }}>

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
          <div className="client-switcher" onClick={() => setDropdown(d => !d)} style={{ margin: '12px 12px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sb-rule)', borderRadius: 6, padding: '9px 12px', cursor: 'pointer', position: 'relative' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Active Client</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--sb-text)' }}>{client?.name || 'Loading...'}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--goldlt)', marginTop: 2, textTransform: 'capitalize' }}>{client?.plan} · {client?.status}</div>
              </div>
              <span style={{ color: 'rgba(250,248,245,0.3)', fontSize: 10, display: 'inline-block', transition: 'transform 0.2s ease', transform: dropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </div>
            {dropdown && clients.length > 1 && (
              <div className="client-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1816', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, marginTop: 4, zIndex: 100, overflow: 'hidden' }}>
                {clients.map((c: Client) => (
                  <div key={c.id} className="dropdown-item" onClick={e => { e.stopPropagation(); setClient(c) }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: client?.id === c.id ? 'rgba(201,168,76,0.1)' : 'transparent' }}>
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
              const active = isActive(item.id)
              const target = '/dashboard' + (item.id === 'dashboard' ? '' : '/' + item.id)
              return (
                <div key={item.id}>
                  {item.section && (
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', padding: '12px 10px 5px' }}>{item.section}</div>
                  )}
                  <button className="nav-btn" onClick={() => navigate(target)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 5, border: 'none', borderLeft: `2px solid ${active ? 'var(--goldlt)' : 'transparent'}`, backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <span className="nav-icon" style={{ fontSize: 11, width: 16, textAlign: 'center', color: active ? 'var(--goldlt)' : 'rgba(250,248,245,0.28)' }}>{item.icon}</span>
                    <span className="nav-label" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: active ? 'var(--sb-text)' : 'rgba(250,248,245,0.4)', fontWeight: active ? 500 : 400 }}>{item.label}</span>
                  </button>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '11px 15px', borderTop: '1px solid var(--sb-rule)' }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4c8b4c', animation: 'pulse 2.5s ease infinite' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--sb-muted)', letterSpacing: 1 }}>Live</span>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(250,248,245,0.25)', padding: 4 }}>✕</button>
            </div>
            {/* Mode toggles */}
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                className={`mode-btn ${dark ? '' : 'active'}`}
                onClick={() => setDark(!dark)}
                style={{ flex: 1 }}
              >
                {dark ? 'Dark' : 'Light'}
              </button>
              <button
                className={`mode-btn ${minimal ? 'active' : ''}`}
                onClick={() => setMinimal(!minimal)}
                style={{ flex: 1 }}
              >
                {minimal ? 'Full' : 'Minimal'}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ padding: '15px 26px', borderBottom: '1px solid var(--rule2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300, letterSpacing: 0.8, color: 'var(--ink)' }}>{title}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 3 }}>{subtitle}</div>
            </div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
              <button onClick={handleSync} disabled={syncing} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: syncing ? 'var(--ink3)' : 'var(--green)', padding: '5px 10px', border: `1px solid ${syncing ? 'var(--rule2)' : 'var(--greenborder)'}`, borderRadius: 4, background: syncing ? 'transparent' : 'var(--greenpaper)', cursor: syncing ? 'not-allowed' : 'pointer', letterSpacing: 1, opacity: syncing ? 0.6 : 1 }}>
                {syncing ? '↻ Syncing...' : '↻ Sync Now'}
              </button>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', padding: '5px 10px', border: '1px solid var(--rule2)', borderRadius: 4, letterSpacing: 1 }}>
                {now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          </header>

          <main className="main-scroll" style={{ flex: 1, padding: '24px 26px', background: 'var(--bg)' }}>
            <div key={contentKey} className={navTarget ? 'content-out' : 'content-in'}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-wrap" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--sb)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '14px 18px', zIndex: 9998, maxWidth: 300, transform: toastData.show ? 'translateY(0)' : 'translateY(80px)', opacity: toastData.show ? 1 : 0, pointerEvents: toastData.show ? 'all' : 'none' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, color: '#faf8f5', marginBottom: 3 }}>{toastData.title}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(250,248,245,0.55)', lineHeight: 1.5 }}>{toastData.body}</div>
      </div>

    </AppCtx.Provider>
  )
}