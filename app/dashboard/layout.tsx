'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppCtx } from './context'
import type { Client } from '@/lib/types'

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',       icon: '◈', section: 'Overview',      admin: false },
  { id: 'campaigns',     label: 'Campaigns',        icon: '◫', section: null,            admin: false },
  { id: 'add-campaign',  label: 'Add Campaign',     icon: '+', section: null,            admin: false },
  { id: 'analysis',      label: 'AI Analysis',      icon: '◉', section: 'Intelligence', admin: false },
  { id: 'optimize',      label: 'Ads Optimization', icon: '◑', section: null,            admin: false },
  { id: 'brief',         label: 'Weekly Brief',     icon: '◧', section: null,            admin: false },
  { id: 'reports',       label: 'Reports',          icon: '▣', section: null,            admin: false },
  { id: 'admin',         label: 'Client Health',    icon: '▲', section: 'Admin',         admin: true  },
  { id: 'settings',      label: 'Settings',         icon: '◌', section: 'Account',       admin: false },
  { id: 'invite',        label: 'Invite Client',    icon: '+', section: 'Admin',         admin: true  },
  { id: 'data-tool',     label: 'Campaign Data',    icon: '✎', section: 'Admin',         admin: true  },
]

const TITLES: Record<string, [string, string]> = {
  dashboard:      ['Overview',          ''],
  campaigns:      ['Campaigns',         'All active campaigns across platforms'],
  'add-campaign': ['Campaign Data',     'Add and manage your campaign numbers'],
  analysis:       ['AI Analysis',       'Claude-powered campaign diagnostics'],
  optimize:       ['Ads Optimization',  'Build and refine campaigns from AI insights'],
  brief:          ['Weekly Brief',      'Automated intelligence summary'],
  reports:        ['Reports',           'Monthly audits and optimization blueprints'],
  admin:          ['Client Health',     'All accounts at a glance'],
  settings:       ['Settings',          'Account preferences and notifications'],
  invite:         ['Invite Client',     'Create and onboard a new client account'],
  'data-tool':    ['Campaign Data',     'Update client campaign metrics'],
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()

  const [clients, setClients] = useState<Client[]>([])
  const [client, setClientState] = useState<Client | null>(null)
  const [roles, setRoles] = useState<{ client_id: string; role: string }[]>([])
  const [hasAnyAdminRole, setHasAnyAdminRole] = useState(false)
  const [dark, setDarkState] = useState(true)
  const [minimal, setMinimalState] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const [toastData, setToastData] = useState({ show: false, title: '', body: '' })
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
      const t: ReturnType<typeof setTimeout>[] = []
      t.push(setTimeout(() => setPortalPhase(1), 60))
      t.push(setTimeout(() => setPortalPhase(2), 440))
      t.push(setTimeout(() => setPortalPhase(3), 820))
      t.push(setTimeout(() => setPortalPhase(4), 1020))
      t.push(setTimeout(() => setPortalDone(true), 1420))
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
    NAV.map(n => '/dashboard' + (n.id === 'dashboard' ? '' : '/' + n.id))
      .forEach(r => router.prefetch(r))
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
    if (v) document.body.classList.remove('light')
    else document.body.classList.add('light')
    localStorage.setItem('vv_dark', v ? '1' : '0')
  }

  function setMinimal(v: boolean) {
    setMinimalState(v)
    if (v) document.body.classList.add('minimal')
    else document.body.classList.remove('minimal')
    localStorage.setItem('vv_minimal', v ? '1' : '0')
  }

  useEffect(() => {
    // Restore saved mode preferences
    const savedDark    = localStorage.getItem('vv_dark')
    const savedMinimal = localStorage.getItem('vv_minimal')
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

      // Get this user's roles across all linked clients
      const { data: allRoles } = await supabase
        .from('client_users')
        .select('role, client_id')
        .eq('user_id', user.id)

      if (!allRoles || allRoles.length === 0) {
        router.push('/login')
        return
      }

      // Track every role this user has — admin nav visibility is then computed
      // per active client. A user only sees admin tabs when the active client
      // is one they hold an admin role on.
      setRoles(allRoles)
      const hasAdminRole = allRoles.some(r => r.role === 'admin')
      setHasAnyAdminRole(hasAdminRole)

      // Fetch ONLY the clients this user is linked to
      const linkedClientIds = allRoles.map(r => r.client_id)

      const { data: cd } = await supabase
        .from('clients')
        .select('*')
        .in('id', linkedClientIds)
        .order('name')

      if (cd?.length) {
        setClients(cd)
        const saved = localStorage.getItem('vv_client')

        // Users with no admin role anywhere are locked to their first client
        if (!hasAdminRole) {
          setClientState(cd[0])
          localStorage.setItem('vv_client', cd[0].id)
        } else {
          // Users with at least one admin link can switch — restore last selected
          setClientState(cd.find((c: Client) => c.id === saved) || cd[0])
        }
      }
    })()
  }, [])

  // Admin nav reflects the role on the ACTIVE client, not a global flag.
  // pranavantharma4 (role=client only) never sees admin tabs; an agency admin
  // who switches the dropdown to a client-role client also drops to client view.
  const activeRole = client ? roles.find(r => r.client_id === client.id)?.role : null
  const isAdmin = activeRole === 'admin'

  const page = pathname.split('/').pop() || 'dashboard'
  const [title, sub] = TITLES[page] || ['', '']
  const now = new Date()
  const subtitle = page === 'dashboard'
    ? (client?.name || '') + ' · ' + now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : sub

  const isActive = (id: string) => {
    const t = '/dashboard' + (id === 'dashboard' ? '' : '/' + id)
    return navTarget ? navTarget === t : page === id
  }

  const MONO  = "'DM Mono',monospace"
  const SERIF = "'Cormorant Garamond',serif"
  const I3    = 'rgba(245,243,239,0.28)'
  const I4    = 'rgba(245,243,239,0.11)'
  const G     = '#c9a84c'
  const INK   = 'rgba(245,243,239,0.95)'

  const symVisible = portalPhase === 1
  const vvVisible  = portalPhase >= 2 && portalPhase <= 4
  const tagVisible = portalPhase >= 3
  const overlayOn  = portalPhase < 4

  return (
    <AppCtx.Provider value={{ client, setClient, clients, isAdmin, dark, setDark, toast }}>

      {/* Portal intro */}
      {!portalDone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#020203', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: overlayOn ? 1 : 0, transition: portalPhase >= 4 ? 'opacity 0.42s cubic-bezier(0.4,0,0.6,1)' : 'none', pointerEvents: portalPhase >= 4 ? 'none' : 'all' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)', opacity: vvVisible ? 1 : 0, transition: 'opacity 1.8s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 24, opacity: symVisible ? 1 : 0, transition: 'opacity 0.18s ease' }}>
            {[{ s: '↑', c: 'rgba(74,222,128,0.65)' }, { s: '·', c: 'rgba(245,243,239,0.14)' }, { s: '↓', c: 'rgba(248,113,113,0.65)' }].map((x, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: 12, color: x.c }}>{x.s}</span>
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
        body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }

        @keyframes contentIn  { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
        @keyframes contentOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-4px)} }
        .content-in  { animation: contentIn  0.22s cubic-bezier(0.16,1,0.3,1) both; will-change: opacity,transform; }
        .content-out { animation: contentOut 0.09s ease both; pointer-events:none; will-change: opacity,transform; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .nav-btn { transform:translateZ(0); backface-visibility:hidden; transition:background-color 0.15s ease,border-color 0.15s ease; border:none; outline:none; }
        .nav-btn:hover { background-color:rgba(255,255,255,0.055) !important; }
        .nav-btn:active { transform:scale(0.975) translateZ(0) !important; }

        .min-hide { overflow:hidden; opacity:1; max-height:400px; transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .min-hide { opacity:0 !important; max-height:0 !important; pointer-events:none; }

        .nav-section-label { overflow:hidden; max-height:40px; opacity:1; transition:opacity 0.35s ease,max-height 0.45s cubic-bezier(0.4,0,0.2,1),padding 0.35s ease; }
        body.minimal .nav-section-label { opacity:0 !important; max-height:0 !important; padding:0 !important; }

        .main-scroll { transition:padding 0.4s cubic-bezier(0.4,0,0.2,1); padding:24px 26px; overflow-y:auto; overscroll-behavior:contain; transform:translateZ(0); }
        body.minimal .main-scroll { padding:14px 18px !important; }

        .header-sub { overflow:hidden; max-height:30px; opacity:1; transition:opacity 0.35s ease,max-height 0.45s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .header-sub { opacity:0 !important; max-height:0 !important; }

        .mode-btn { flex:1; padding:4px 8px; border-radius:3px; cursor:pointer; font-family:'DM Mono',monospace; font-size:7px; letter-spacing:1px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); color:rgba(250,248,245,0.38); transition:all 0.18s ease; white-space:nowrap; }
        .mode-btn.active { background:rgba(201,168,76,0.14); border-color:rgba(201,168,76,0.32); color:#c9a84c; }
        .mode-btn:hover { background:rgba(255,255,255,0.08); }

        @keyframes dropIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .client-dropdown { animation:dropIn 0.14s cubic-bezier(0.16,1,0.3,1) both; }
        .dropdown-item { transition:background 0.1s ease; }
        .dropdown-item:hover { background:rgba(255,255,255,0.06) !important; }
        .client-sw { transition:background 0.12s ease; }
        .client-sw:hover { background:rgba(255,255,255,0.05) !important; }

        button { transform:translateZ(0); }
        button:active { transform:scale(0.97) translateZ(0) !important; transition:transform 0.08s ease !important; }

        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--rule2); border-radius:2px; }

        .toast-wrap { will-change:transform,opacity; transition:transform 0.32s cubic-bezier(0.16,1,0.3,1),opacity 0.24s ease; }
        * { -webkit-tap-highlight-color:transparent; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{ width: 214, background: 'var(--sb)', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid var(--sb-rule)', transform: 'translateZ(0)' }}>

          {/* Logo */}
          <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--sb-rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 600, fontStyle: 'italic', color: '#faf8f5', letterSpacing: 2, flexShrink: 0 }}>VV</span>
            <div className="min-hide">
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Vanguard Visuals</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, color: 'rgba(250,248,245,0.2)', marginTop: 1, whiteSpace: 'nowrap' }}>Growth Ad Engine</div>
            </div>
          </div>

          {/* Client switcher — only show if user is admin somewhere with multiple clients */}
          {hasAnyAdminRole && clients.length > 0 && (
            <div className="client-sw" onClick={() => setDropdown(d => !d)}
              style={{ margin: '10px 10px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sb-rule)', borderRadius: 6, padding: '9px 11px', cursor: 'pointer', position: 'relative' }}>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Active Client</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--sb-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client?.name || 'Loading...'}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--goldlt)', marginTop: 2, textTransform: 'capitalize' }}>
                    {client?.plan} · {client?.status}
                  </div>
                </div>
                {clients.length > 1 && (
                  <span style={{ color: 'rgba(250,248,245,0.28)', fontSize: 10, flexShrink: 0, marginLeft: 6, display: 'inline-block', transition: 'transform 0.2s ease', transform: dropdown ? 'rotate(180deg)' : 'none' }}>▾</span>
                )}
              </div>
              {dropdown && clients.length > 1 && (
                <div className="client-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1816', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, marginTop: 4, zIndex: 100, overflow: 'hidden' }}>
                  {clients.map((c: Client) => (
                    <div key={c.id} className="dropdown-item" onClick={e => { e.stopPropagation(); setClient(c) }}
                      style={{ padding: '10px 11px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: client?.id === c.id ? 'rgba(201,168,76,0.1)' : 'transparent' }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: client?.id === c.id ? 'var(--goldlt)' : 'rgba(250,248,245,0.85)' }}>{c.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(250,248,245,0.3)', marginTop: 2 }}>{c.plan} · ${(c.monthly_ad_spend || 0).toLocaleString()}/mo</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client name display for non-admin — no switcher */}
          {!hasAnyAdminRole && client && (
            <div style={{ margin: '10px 10px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sb-rule)', borderRadius: 6, padding: '9px 11px' }}>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Your Account</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--sb-text)' }}>{client.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--goldlt)', marginTop: 2, textTransform: 'capitalize' }}>{client.plan} · {client.status}</div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
            {NAV.filter(n => !n.admin || isAdmin).map(item => {
              const active = isActive(item.id)
              const target = '/dashboard' + (item.id === 'dashboard' ? '' : '/' + item.id)
              return (
                <div key={item.id}>
                  {item.section && (
                    <div className="nav-section-label" style={{ fontFamily: MONO, fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', padding: '10px 9px 4px' }}>
                      {item.section}
                    </div>
                  )}
                  <button className="nav-btn" onClick={() => navigate(target)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 5, borderLeft: `2px solid ${active ? 'var(--goldlt)' : 'transparent'}`, backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <span style={{ fontSize: 11, width: 16, textAlign: 'center', color: active ? 'var(--goldlt)' : 'rgba(250,248,245,0.28)', flexShrink: 0, transition: 'color 0.15s ease' }}>{item.icon}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: active ? 'var(--sb-text)' : 'rgba(250,248,245,0.4)', fontWeight: active ? 500 : 400, transition: 'color 0.15s ease' }}>{item.label}</span>
                  </button>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--sb-rule)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2.5s ease infinite' }} />
                <span style={{ fontFamily: MONO, fontSize: 7, color: 'var(--sb-muted)', letterSpacing: 1 }}>Live</span>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 8, color: 'rgba(250,248,245,0.22)', padding: 3 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className={`mode-btn ${!dark ? 'active' : ''}`} onClick={() => setDark(!dark)}>
                {dark ? 'Dark' : 'Light'}
              </button>
              <button className={`mode-btn ${minimal ? 'active' : ''}`} onClick={() => setMinimal(!minimal)}>
                {minimal ? 'Full' : 'Minimal'}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', transition: 'background 0.35s ease' }}>

          {/* Header */}
          <header style={{ padding: '13px 24px', borderBottom: '1px solid var(--rule2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', flexShrink: 0, transition: 'background 0.35s ease, border-color 0.35s ease' }}>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 300, letterSpacing: 0.5, color: 'var(--ink)', transition: 'color 0.35s ease' }}>{title}</div>
              <div className="header-sub" style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>{subtitle}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', padding: '5px 10px', border: '1px solid var(--rule2)', borderRadius: 4, letterSpacing: 1 }}>
                {now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="main-scroll" style={{ flex: 1, background: 'var(--bg)', transition: 'background 0.35s ease' }}>
            <div key={contentKey} className={navTarget ? 'content-out' : 'content-in'}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-wrap" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--sb)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '14px 18px', zIndex: 9998, maxWidth: 300, transform: toastData.show ? 'translateY(0)' : 'translateY(80px)', opacity: toastData.show ? 1 : 0, pointerEvents: toastData.show ? 'all' : 'none' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: 'var(--sb-text)', marginBottom: 3 }}>{toastData.title}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--sb-muted)', lineHeight: 1.5 }}>{toastData.body}</div>
      </div>

    </AppCtx.Provider>
  )
}