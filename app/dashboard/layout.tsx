'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppCtx } from './context'
import { warmTab } from './queries'
import Tutorial from './Tutorial'
import type { Client } from '@/lib/types'

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',        icon: '◈', section: 'Overview',      admin: false },
  { id: 'campaigns',     label: 'Campaigns',        icon: '◫', section: null,            admin: false },
  { id: 'analysis',      label: 'AI Analysis',      icon: '◉', section: 'Intelligence',  admin: false },
  { id: 'optimize',      label: 'Ads Optimization', icon: '◑', section: null,            admin: false },
  { id: 'brief',         label: 'Weekly Brief',     icon: '◧', section: null,            admin: false },
  { id: 'reports',       label: 'Reports',          icon: '▣', section: null,            admin: false },
  { id: 'add-campaign',  label: 'Performance Calculator', icon: '⌁', section: 'Tools',   admin: false },
  { id: 'admin',         label: 'Client Health',    icon: '▲', section: 'Admin',         admin: true  },
  { id: 'invite',        label: 'Invite Client',    icon: '+', section: null,            admin: true  },
  { id: 'data-tool',     label: 'Campaign Data',    icon: '✎', section: null,            admin: true  },
  { id: 'reach',         label: 'VV Reach',         icon: '➤', section: null,            admin: true  },
  { id: 'signal',        label: 'VV Signal',        icon: '✶', section: null,            admin: true  },
  { id: 'settings',      label: 'Settings',         icon: '◌', section: 'Account',       admin: false },
]

const TITLES: Record<string, [string, string]> = {
  dashboard:      ['Overview',          ''],
  campaigns:      ['Campaigns',         'All active campaigns across platforms'],
  'add-campaign': ['Performance Calculator', 'Run any campaign through VAI in real time'],
  analysis:       ['AI Analysis',       'Claude-powered campaign diagnostics'],
  optimize:       ['Ads Optimization',  'Build and refine campaigns from AI insights'],
  brief:          ['Weekly Brief',      'Automated intelligence summary'],
  reports:        ['Reports',           'Monthly audits and optimization blueprints'],
  admin:          ['Client Health',     'All accounts at a glance'],
  settings:       ['Settings',          'Account preferences and notifications'],
  invite:         ['Invite Client',     'Create and onboard a new client account'],
  'data-tool':    ['Campaign Data',     'Update client campaign metrics'],
  reach:          ['VV Reach',          'Cold outreach engine — sends, tiers, follow-ups, replies'],
  signal:         ['VV Signal',         'Daily marketing content — generated in VV voice'],
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()

  // Shared React Query cache lives here, above every dashboard route, so tab
  // data survives cross-tab navigation. staleTime keeps a revisited tab from
  // refetching for a minute; gcTime keeps it cached for 5. Window-focus
  // refetch is off so returning to the tab doesn't flash a reload.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, gcTime: 300_000, refetchOnWindowFocus: false, retry: 1 },
    },
  }))

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
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle')
  const [syncing, setSyncing] = useState(false)
  // Mobile drawer: on <768px the sidebar becomes a slide-in overlay opened
  // by the header hamburger. Closes on navigation and backdrop tap.
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Portal intro
  const [portalPhase, setPortalPhase] = useState(0)
  const [portalDone, setPortalDone] = useState(true)

  // First-run tutorial (Fix 1c)
  const [showTutorial, setShowTutorial] = useState(false)

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
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When the URL changes, swap the content key (forces remount of the page
  // wrapper with .page-enter at opacity 0), then drop the class on the next
  // paint so the base CSS transition animates opacity 0→1 over 180ms.
  useEffect(() => {
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname
    setContentKey(pathname)
    setNavTarget('')
    setPhase('enter')
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('idle'))
    })
    return () => cancelAnimationFrame(raf1)
  }, [pathname])

  // Prefetch every dashboard route on mount so cross-tab navigation has no
  // network wait — the page transition is the only thing the user perceives.
  useEffect(() => {
    NAV.map(n => '/dashboard' + (n.id === 'dashboard' ? '' : '/' + n.id))
      .forEach(r => router.prefetch(r))
  }, [])

  // Warm the DATA cache for the most likely next tabs as soon as we know the
  // active client — dashboard home + campaigns are the two most-visited views,
  // so their first open is instant instead of hitting Supabase live.
  useEffect(() => {
    if (!client?.id) return
    warmTab(queryClient, '/dashboard', client.id)
    warmTab(queryClient, '/dashboard/campaigns', client.id)
  }, [client?.id, queryClient])

  // Show the first-run tutorial once, on the dashboard home only (that's where
  // the highlighted elements live). "Replay tutorial" in Settings sets a local
  // flag that re-triggers it without resetting the persisted DB column.
  useEffect(() => {
    if (!client || pathname !== '/dashboard') { setShowTutorial(false); return }
    let replay = false
    try { replay = localStorage.getItem('vv_replay_tutorial') === '1' } catch {}
    if (replay || client.tutorial_completed !== true) {
      // Wait past the portal intro + first paint so the highlighted elements exist.
      const t = setTimeout(() => setShowTutorial(true), 700)
      return () => clearTimeout(t)
    }
  }, [client?.id, client?.tutorial_completed, pathname])

  async function finishTutorial() {
    setShowTutorial(false)
    try { localStorage.removeItem('vv_replay_tutorial') } catch {}
    if (client && client.tutorial_completed !== true) {
      await supabase.from('clients').update({ tutorial_completed: true }).eq('id', client.id)
      setClientState(prev => (prev ? { ...prev, tutorial_completed: true } : prev))
      setClients(list => list.map(c => (c.id === client.id ? { ...c, tutorial_completed: true } : c)))
    }
  }

  // Lock background scroll while the mobile drawer is open (body class toggled
  // so the CSS rule is the single source of truth; cleaned up on close/unmount).
  useEffect(() => {
    document.body.classList.toggle('vv-drawer-locked', drawerOpen)
    return () => document.body.classList.remove('vv-drawer-locked')
  }, [drawerOpen])

  function toast(title: string, body: string) {
    setToastData({ show: true, title, body })
    setTimeout(() => setToastData(t => ({ ...t, show: false })), 3500)
  }

  function navigate(path: string) {
    setDrawerOpen(false)
    if (pathname === path) return
    setNavTarget(path)
    if (exitTimer.current) clearTimeout(exitTimer.current)
    setPhase('exit')
    // CSS handles the 100ms fade-out — push the route exactly as it completes.
    exitTimer.current = setTimeout(() => router.push(path), 100)
  }

  async function syncNow() {
    if (!client || syncing) return
    setSyncing(true)
    try {
      const { error } = await supabase.functions.invoke('sync-meta-campaigns', {
        body: { client_id: client.id },
      })
      if (error) {
        const msg = (error as any)?.context?.error || (error as any)?.message || 'Sync failed'
        toast('Sync failed', String(msg))
      } else {
        toast('Sync complete', 'Latest Meta campaign data pulled into the dashboard.')
        router.refresh()
      }
    } catch (e: any) {
      toast('Sync failed', e?.message || 'Unknown error')
    } finally {
      setSyncing(false)
    }
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

        // Client-side onboarding gate. Middleware enforces this server-side,
        // but if a deploy/edge race ever lets a non-onboarded client slip past
        // the middleware to /dashboard or /dashboard/add-campaign, push them
        // back into the onboarding flow before any sensitive UI renders.
        if (!hasAdminRole && pathname !== '/dashboard/onboarding') {
          const nonAdminClients = cd.filter(c =>
            allRoles.some(r => r.client_id === c.id && r.role === 'client')
          )
          const stillOnboarding = nonAdminClients.length > 0 &&
            nonAdminClients.every(c => c.onboarding_complete !== true)
          if (stillOnboarding) {
            router.replace('/dashboard/onboarding')
            return
          }
        }
      }
    })()
  }, [])

  // Admin nav reflects the role on the ACTIVE client, not a global flag.
  // pranavantharma4 (role=client only) never sees admin tabs; an agency admin
  // who switches the dropdown to a client-role client also drops to client view.
  const activeRole = client ? roles.find(r => r.client_id === client.id)?.role : null
  const isAdmin = activeRole === 'admin'
  // Account-tier treatment (Fix 5) — a distinct, on-brand status marker per tier,
  // all on the dark editorial base:
  //   ARCHITECT (platinum / silver-white) — admin operators, highest tier
  //   FOUNDING MEMBER (gold) — real Founders Program clients
  //   SANDBOX (slate blue / muted cyan) — internal test account(s), not a tier
  // Precedence: admin → architect; known sandbox id → sandbox (overrides its
  // is_founder flag); any other is_founder client → founding.
  const SANDBOX_CLIENT_IDS = ['dcf08b53-2abb-4b5d-935a-a7fb8e85502b'] // pranavantharma4 / Vngrd Visuals (test account)
  type Tier = 'architect' | 'founding' | 'sandbox'
  const TIERS: Record<Tier, { label: string; pill: string; pillText: string; accent: string; tint: string; border: string; headerTint: string; glow: string }> = {
    architect: { label: 'ARCHITECT',       pill: 'linear-gradient(180deg,#f4f2ec,#cdccc6)', pillText: '#141310', accent: '#e6e3dc', tint: 'rgba(240,238,232,0.08)', border: 'rgba(240,238,232,0.34)', headerTint: 'rgba(240,238,232,0.05)', glow: 'rgba(240,238,232,0.22)' },
    founding:  { label: 'FOUNDING MEMBER', pill: 'linear-gradient(180deg,#d8b95e,#c9a84c)', pillText: '#050509', accent: '#c9a84c', tint: 'rgba(201,168,76,0.09)',  border: 'rgba(201,168,76,0.32)',  headerTint: 'rgba(201,168,76,0.05)',  glow: 'rgba(201,168,76,0.22)' },
    sandbox:   { label: 'SANDBOX',         pill: 'linear-gradient(180deg,#93b6d6,#5f8fb3)', pillText: '#04101c', accent: '#7fa8c9', tint: 'rgba(127,168,201,0.10)', border: 'rgba(127,168,201,0.34)', headerTint: 'rgba(127,168,201,0.06)', glow: 'rgba(127,168,201,0.20)' },
  }
  const tier: Tier | null =
    isAdmin ? 'architect'
    : (client && SANDBOX_CLIENT_IDS.includes(client.id)) ? 'sandbox'
    : client?.is_founder ? 'founding'
    : null
  const tierCfg = tier ? TIERS[tier] : null

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

  // Tier pill — small, premium; color/label driven by the active tier. Editorial,
  // not gaudy. Renders null when the active account has no tier.
  const tierPill = tierCfg && (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 7, fontWeight: 600, letterSpacing: '1.5px', color: tierCfg.pillText, background: tierCfg.pill, padding: '3px 8px', borderRadius: 3, marginTop: 7, boxShadow: `0 2px 10px ${tierCfg.glow}` }}>
      <span style={{ fontSize: 8, lineHeight: 1 }}>◆</span> {tierCfg.label}
    </span>
  )

  const symVisible = portalPhase === 1
  const vvVisible  = portalPhase >= 2 && portalPhase <= 4
  const tagVisible = portalPhase >= 3
  const overlayOn  = portalPhase < 4

  return (
    <QueryClientProvider client={queryClient}>
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

        /* Premium tab transition — outgoing fades out 100ms; incoming fades in
           with a subtle 8px rise over 220ms. min-height holds the container so
           the remount never collapses and nothing jumps. */
        .page-content { opacity: 1; transform: none; min-height: 70vh; will-change: opacity, transform; transition: opacity 220ms cubic-bezier(.22,.61,.36,1), transform 220ms cubic-bezier(.22,.61,.36,1); }
        .page-content.page-exit { opacity: 0; transform: none; transition: opacity 100ms cubic-bezier(.22,.61,.36,1); pointer-events: none; }
        .page-content.page-enter { opacity: 0; transform: translateY(8px); transition: none; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .nav-btn { transform:translateZ(0); backface-visibility:hidden; transition:background-color 0.15s ease,border-color 0.15s ease; border:none; outline:none; }
        .nav-btn:hover { background-color:rgba(255,255,255,0.055) !important; }
        .nav-btn:active { transform:scale(0.975) translateZ(0) !important; }

        .min-hide { overflow:hidden; opacity:1; max-height:400px; transition:opacity 0.4s ease,max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
        body.minimal .min-hide { opacity:0 !important; max-height:0 !important; pointer-events:none; }

        .nav-section-label { overflow:hidden; max-height:40px; opacity:1; transition:opacity 0.35s ease,max-height 0.45s cubic-bezier(0.4,0,0.2,1),padding 0.35s ease; }
        body.minimal .nav-section-label { opacity:0 !important; max-height:0 !important; padding:0 !important; }

        .main-scroll { transition:padding 0.4s cubic-bezier(0.4,0,0.2,1); padding:24px 26px; overflow-y:auto; scrollbar-gutter:stable; overscroll-behavior:contain; transform:translateZ(0); }
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

        /* ─── RESPONSIVE: sidebar → drawer, header wrap, tighter padding ─── */
        .vv-burger { display:none; }
        .vv-backdrop { display:none; }
        .vv-drawer-close { display:none; }
        @keyframes vvFadeIn { from{opacity:0} to{opacity:1} }

        @media (max-width: 767px) {
          /* Sidebar becomes an 82%-width slide-in drawer (capped so a backdrop
             strip always shows on the right). It leaves the flex flow so main
             content gets full width. Off-screen by default; .vv-open slides it
             in. !important is required to beat the aside's inline transform. */
          .vv-sidebar {
            position:fixed !important; top:0; left:0; bottom:0;
            width:82% !important; max-width:330px; z-index:9997;
            transform:translateX(-102%) !important;
            transition:transform 0.24s cubic-bezier(0.22,0.61,0.36,1) !important;
            box-shadow:8px 0 40px rgba(0,0,0,0.6);
          }
          .vv-sidebar.vv-open { transform:translateX(0) !important; }
          .vv-backdrop {
            display:block; position:fixed; inset:0; z-index:9996;
            background:rgba(3,2,4,0.66); animation:vvFadeIn 0.2s ease;
          }
          .vv-burger {
            display:inline-flex; align-items:center; justify-content:center;
            width:44px; height:44px; flex-shrink:0; margin-right:10px;
            background:var(--bg2); border:1px solid var(--rule2);
            border-radius:8px; color:var(--ink); font-size:17px; cursor:pointer;
          }
          /* ✕ close, top-right inside the drawer (tap target 40px). */
          .vv-drawer-close {
            display:inline-flex; align-items:center; justify-content:center;
            position:absolute; top:9px; right:9px; width:40px; height:40px;
            z-index:3; background:transparent; border:none; cursor:pointer;
            color:var(--sb-muted); font-size:19px; line-height:1;
          }
          /* Header stacks: [burger][title] on row 1, actions wrap to row 2. */
          .vv-header { flex-wrap:wrap; justify-content:flex-start !important; padding:11px 16px !important; row-gap:10px; }
          .vv-header-titles { flex:1; min-width:0; }
          .vv-header-actions { flex:1 1 100%; justify-content:flex-start !important; }
          /* Roomier tap targets in the drawer nav; footer stays pinned (never
             scrolls over nav items) while the nav list scrolls internally. */
          .vv-sidebar .nav-btn { padding:13px 12px !important; }
          .vv-sidebar-nav { -webkit-overflow-scrolling:touch; }
          .vv-sidebar-footer { flex-shrink:0 !important; }
          .main-scroll { padding:16px 15px !important; }
        }
        /* Lock the background from scrolling while the drawer is open. */
        body.vv-drawer-locked { overflow:hidden; }
      `}</style>

      <div className="vv-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Mobile drawer backdrop — only rendered/visible on <768px when open */}
        {drawerOpen && <div className="vv-backdrop" onClick={() => setDrawerOpen(false)} />}

        {/* SIDEBAR */}
        <aside className={`vv-sidebar${drawerOpen ? ' vv-open' : ''}`} style={{ position: 'relative', width: 214, background: 'var(--sb)', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid var(--sb-rule)' }}>

          {/* Drawer close — mobile only (hidden on desktop via CSS) */}
          <button className="vv-drawer-close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>✕</button>

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
              style={{ margin: '10px 10px 4px', background: tierCfg ? tierCfg.tint : 'rgba(255,255,255,0.04)', border: `1px solid ${tierCfg ? tierCfg.border : 'var(--sb-rule)'}`, borderRadius: 6, padding: '9px 11px', cursor: 'pointer', position: 'relative' }}>
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
              {tierPill && <div>{tierPill}</div>}
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

          {/* Client name display for non-admin — no switcher. Tiered accounts get
              a tinted box + colored badge (Fix 5). */}
          {!hasAnyAdminRole && client && (
            <div style={{ margin: '10px 10px 4px', background: tierCfg ? tierCfg.tint : 'rgba(255,255,255,0.04)', border: `1px solid ${tierCfg ? tierCfg.border : 'var(--sb-rule)'}`, borderRadius: 6, padding: '9px 11px' }}>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--sb-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 4 }}>Your Account</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--sb-text)' }}>{client.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--goldlt)', marginTop: 2, textTransform: 'capitalize' }}>{client.plan} · {client.status}</div>
              {tierPill}
            </div>
          )}

          {/* Nav */}
          <nav className="vv-sidebar-nav" style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
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
                    onMouseEnter={() => warmTab(queryClient, target, client?.id)}
                    data-tour={item.id === 'analysis' ? 'diagnosis' : item.id === 'settings' ? 'settings' : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 5, borderLeft: `2px solid ${active ? 'var(--goldlt)' : 'transparent'}`, backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <span style={{ fontSize: 11, width: 16, textAlign: 'center', color: active ? 'var(--goldlt)' : 'rgba(250,248,245,0.28)', flexShrink: 0, transition: 'color 0.15s ease' }}>{item.icon}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: active ? 'var(--sb-text)' : 'rgba(250,248,245,0.4)', fontWeight: active ? 500 : 400, transition: 'color 0.15s ease' }}>{item.label}</span>
                  </button>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="vv-sidebar-footer" style={{ padding: '10px 14px', borderTop: '1px solid var(--sb-rule)' }}>
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

          {/* Header — tiered accounts get a subtle colored hairline + gradient (Fix 5) */}
          <header className="vv-header" style={{ padding: '13px 24px', borderTop: tierCfg ? `2px solid ${tierCfg.accent}` : 'none', borderBottom: '1px solid var(--rule2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: tierCfg ? `linear-gradient(180deg, ${tierCfg.headerTint}, var(--bg) 60%)` : 'var(--bg)', flexShrink: 0, transition: 'background 0.35s ease, border-color 0.35s ease' }}>
            <button className="vv-burger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>☰</button>
            <div className="vv-header-titles">
              <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 300, letterSpacing: 0.5, color: 'var(--ink)', transition: 'color 0.35s ease' }}>{title}</div>
              <div className="header-sub" style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>{subtitle}</div>
            </div>
            <div className="vv-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={syncNow}
                disabled={!client || syncing}
                title="Pull the latest Meta campaign data into the dashboard"
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: syncing ? 'var(--ink3)' : '#050509',
                  background: syncing ? 'rgba(201,168,76,0.18)' : G,
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 4,
                  cursor: !client || syncing ? 'not-allowed' : 'pointer',
                  opacity: !client ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.18s ease, color 0.18s ease, opacity 0.18s ease',
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1, display: 'inline-block', animation: syncing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', padding: '5px 10px', border: '1px solid var(--rule2)', borderRadius: 4, letterSpacing: 1 }}>
                {now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="main-scroll" style={{ flex: 1, background: 'var(--bg)', transition: 'background 0.35s ease' }}>
            <div
              key={contentKey}
              className={`page-content${phase === 'exit' ? ' page-exit' : ''}${phase === 'enter' ? ' page-enter' : ''}`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* First-run tutorial — only on the dashboard home, after the portal intro */}
      {portalDone && showTutorial && pathname === '/dashboard' && (
        <Tutorial onDone={finishTutorial} />
      )}

      {/* Toast */}
      <div className="toast-wrap" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--sb)', border: '1px solid var(--rule2)', borderRadius: 8, padding: '14px 18px', zIndex: 9998, maxWidth: 300, transform: toastData.show ? 'translateY(0)' : 'translateY(80px)', opacity: toastData.show ? 1 : 0, pointerEvents: toastData.show ? 'all' : 'none' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: 'var(--sb-text)', marginBottom: 3 }}>{toastData.title}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--sb-muted)', lineHeight: 1.5 }}>{toastData.body}</div>
      </div>

    </AppCtx.Provider>
    </QueryClientProvider>
  )
}