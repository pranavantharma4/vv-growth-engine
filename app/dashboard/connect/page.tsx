'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'

const PLATFORMS = [
  { id:'meta',     label:'Meta Ads',   icon:'f',  bg:'#e8f0fe', color:'#1a56cc', scope:'ads_read, ads_management' },
  { id:'google',   label:'Google Ads', icon:'G',  bg:'#e8f4e8', color:'#1a6e1a', scope:'adwords read-only' },
  { id:'tiktok',   label:'TikTok Ads', icon:'TT', bg:'#fee8ee', color:'#cc1a3a', scope:'ad.read' },
  { id:'linkedin', label:'LinkedIn',   icon:'in', bg:'#e8f4fb', color:'#0a66c2', scope:'r_ads' },
]

const META_APP_ID = '4462090677412633'
const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'

function getMetaOAuthURL(clientId: string): string {
  const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`
  const state = btoa(clientId)
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: redirectUri,
    scope: 'ads_read,ads_management,business_management',
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
}

function getTokenStatus(conn: any): 'expired' | 'expiring' | 'healthy' {
  if (!conn?.expires_at) return 'healthy'
  const expiresAt = new Date(conn.expires_at)
  const now = new Date()
  const daysLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 7) return 'expiring'
  return 'healthy'
}

function daysUntilExpiry(conn: any): number {
  if (!conn?.expires_at) return 999
  const expiresAt = new Date(conn.expires_at)
  return Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function ConnectionsPage() {
  const { client, toast: showToast } = useApp()
  const supabase = createClientComponentClient()
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return
    supabase.from('ad_connections').select('*').eq('client_id', client.id)
      .then(({ data }) => { setConnections(data || []); setLoading(false) })
  }, [client])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    if (success === 'meta_connected') {
      showToast('Meta Ads connected', 'Your Meta Ads account is now syncing data.')
      window.history.replaceState({}, '', window.location.pathname)
      if (client) {
        supabase.from('ad_connections').select('*').eq('client_id', client.id)
          .then(({ data }) => setConnections(data || []))
      }
    } else if (error) {
      const messages: Record<string, string> = {
        meta_denied: 'Meta connection was cancelled.',
        meta_token_failed: 'Meta token exchange failed. Please try again.',
        meta_longtoken_failed: 'Meta token upgrade failed. Please try again.',
        meta_db_failed: 'Failed to save Meta connection. Please try again.',
      }
      showToast('Connection failed', messages[error] || 'Something went wrong.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [client])

  function getConn(platform: string) { return connections.find(c => c.platform === platform) }

  async function disconnect(platform: string) {
    const conn = getConn(platform)
    if (!conn) return
    await supabase.from('ad_connections').update({ is_active: false, access_token: null }).eq('id', conn.id)
    setConnections(prev => prev.map(c => c.platform === platform ? { ...c, is_active: false } : c))
    showToast('Disconnected', PLATFORMS.find(p => p.id === platform)?.label + ' has been disconnected.')
  }

  function handleConnect(platformId: string) {
    if (platformId === 'meta') {
      if (!client?.id) { showToast('Error', 'No client session found. Please refresh.'); return }
      window.location.href = getMetaOAuthURL(client.id)
    } else {
      showToast('Coming soon', 'Platform connections will be live in the next build session.')
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'var(--ink2)', lineHeight:1.75, marginBottom:20 }}>
        Connect your ad accounts to enable live data sync. Vanguard reads your data in read-only mode — we never modify campaigns without your explicit instruction.
      </p>

      {PLATFORMS.map(plat => {
        const conn = getConn(plat.id)
        const active = conn?.is_active === true
        const tokenStatus = plat.id === 'meta' && active ? getTokenStatus(conn) : 'healthy'
        const days = plat.id === 'meta' && active ? daysUntilExpiry(conn) : 999

        return (
          <div key={plat.id}>
            {/* Expiry warning banner — shown above the card */}
            {active && tokenStatus !== 'healthy' && (
              <div style={{
                background: tokenStatus === 'expired' ? 'var(--redpaper)' : 'var(--amberpaper)',
                border: `1px solid ${tokenStatus === 'expired' ? 'var(--redborder)' : 'var(--amberborder)'}`,
                borderRadius: 6,
                padding: '10px 14px',
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, fontWeight:500, color: tokenStatus === 'expired' ? 'var(--red)' : 'var(--amber)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>
                    {tokenStatus === 'expired' ? '⚠ Meta token expired' : `⚠ Token expiring in ${days} day${days === 1 ? '' : 's'}`}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'var(--ink2)' }}>
                    {tokenStatus === 'expired'
                      ? 'Reconnect your Meta account to resume data sync.'
                      : 'Reconnect now to avoid losing sync continuity.'}
                  </div>
                </div>
                <button
                  onClick={() => handleConnect(plat.id)}
                  style={{ padding:'5px 12px', borderRadius:5, border:'none', background: tokenStatus === 'expired' ? 'var(--red)' : 'var(--amber)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'#faf8f5', letterSpacing:1, flexShrink:0, marginLeft:12 }}>
                  Reconnect →
                </button>
              </div>
            )}

            {/* Platform card */}
            <div style={{ background:'var(--card2)', border:`1px solid ${tokenStatus !== 'healthy' && active ? (tokenStatus === 'expired' ? 'var(--redborder)' : 'var(--amberborder)') : 'var(--rule)'}`, borderRadius:8, padding:'15px 19px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
              <div style={{ display:'flex', alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, marginRight:12, background:plat.bg, color:plat.color, fontFamily:"'DM Mono',monospace", fontWeight:700, flexShrink:0 }}>{plat.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{plat.label}</div>
                  {active && conn ? (
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color: tokenStatus === 'expired' ? 'var(--red)' : tokenStatus === 'expiring' ? 'var(--amber)' : 'var(--green)', marginTop:3 }}>
                      {tokenStatus === 'expired'
                        ? '✕ Token expired · reconnect required'
                        : tokenStatus === 'expiring'
                          ? `● Connected · expires in ${days}d · Last synced: ${conn.last_synced_at ? new Date(conn.last_synced_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'never'}`
                          : `● Connected · ${conn.account_name || conn.account_id || 'account linked'} · Last synced: ${conn.last_synced_at ? new Date(conn.last_synced_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'never'}`
                      }
                    </div>
                  ) : (
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:3 }}>○ Not connected · Requires {plat.scope}</div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:7 }}>
                {active ? (
                  <>
                    {tokenStatus === 'expired' && (
                      <button onClick={() => handleConnect(plat.id)} style={{ padding:'4px 10px', borderRadius:5, border:'none', background:'var(--gold)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'#faf8f5', letterSpacing:1 }}>Reconnect →</button>
                    )}
                    <button onClick={() => disconnect(plat.id)} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid var(--redborder)', background:'transparent', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--red)', letterSpacing:1 }}>Disconnect</button>
                  </>
                ) : (
                  <button onClick={() => handleConnect(plat.id)} style={{ padding:'4px 12px', borderRadius:5, border:'none', background: plat.id === 'meta' ? 'var(--gold)' : 'var(--card3)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color: plat.id === 'meta' ? '#faf8f5' : 'var(--ink3)', letterSpacing:1 }}>
                    {plat.id === 'meta' ? 'Connect →' : 'Soon'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <div style={{ background:'var(--card2)', border:'1px solid var(--rule)', borderRadius:8, padding:'15px 18px', marginTop:14 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Data Security</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[['Read-only','We never modify your campaigns'],['AES-256','Tokens encrypted at rest'],['No resale','Your data stays yours, always']].map(([t,s]) => (
            <div key={t} style={{ display:'flex', gap:7 }}>
              <span style={{ color:'var(--green)', fontSize:9, marginTop:3 }}>◈</span>
              <div><div style={{ fontSize:11, fontWeight:500 }}>{t}</div><div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:1 }}>{s}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}