'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from './context'

const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'
const META_APP_ID = '4462090677412633'
const MONO = "'DM Mono',monospace"
const SANS = "'DM Sans',sans-serif"

// Ad-account connection management — lives inside Settings. Connect / Sync /
// Reconnect / Disconnect for Meta, with Google + TikTok marked coming soon.
export default function ConnectionsSection() {
  const supabase = createClientComponentClient()
  const { client, toast } = useApp()

  const [connection, setConnection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (client) load()
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'META_CONNECTED') {
        load()
        toast('Meta Ads connected', 'Your ad account is connected. Click Sync Now to pull your campaigns.')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    const { data } = await supabase
      .from('ad_connections')
      .select('*')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .order('connected_at', { ascending: false })
      .limit(1)
    setConnection((data && data[0]) || null)
    setLoading(false)
  }

  function connectMeta() {
    if (!client) return
    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`
    const scope = 'ads_read,ads_management,business_management'
    const returnUrl = `${window.location.origin}/auth/meta-success?next=${encodeURIComponent('/dashboard/settings')}`
    const state = encodeURIComponent(JSON.stringify({ client_id: client.id, return_url: returnUrl }))
    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`
    const popup = window.open(oauthUrl, 'MetaOAuth', 'width=600,height=720,scrollbars=yes')
    if (!popup) { toast('Popup blocked', 'Please allow popups for this site, then try again.'); return }
    const interval = setInterval(() => { if (popup.closed) { clearInterval(interval); load() } }, 1000)
  }

  async function syncNow() {
    if (!client || syncing) return
    setSyncing(true)
    try {
      const { error } = await supabase.functions.invoke('sync-meta-campaigns', { body: { client_id: client.id } })
      if (error) {
        const msg = (error as any)?.context?.error || (error as any)?.message || 'Sync failed'
        toast('Sync failed', String(msg))
      } else {
        toast('Sync complete', 'Latest Meta campaign data pulled into your dashboard.')
        load()
      }
    } catch (e: any) {
      toast('Sync failed', e?.message || 'Unknown error')
    } finally { setSyncing(false) }
  }

  async function disconnect() {
    if (!client || !connection) return
    setDisconnecting(true)
    await supabase.from('ad_connections').update({ is_active: false, access_token: null }).eq('id', connection.id)
    toast('Disconnected', 'Meta Ads account disconnected.')
    setConnection(null)
    setDisconnecting(false)
  }

  const isExpired = connection?.expires_at && new Date(connection.expires_at) < new Date()
  const daysUntilExpiry = connection?.expires_at
    ? Math.max(0, Math.ceil((new Date(connection.expires_at).getTime() - Date.now()) / 86400000))
    : null

  const card: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '20px 22px', marginBottom: 12 }

  return (
    <div>
      {/* Meta */}
      <div style={{ ...card, border: `1px solid ${connection && !isExpired ? 'rgba(74,222,128,0.2)' : isExpired ? 'rgba(248,113,113,0.2)' : 'var(--rule)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: connection && !isExpired ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, background: '#1877f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'Arial' }}>f</span>
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Meta Ads</div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px', marginTop: 2 }}>Facebook &amp; Instagram</div>
            </div>
          </div>
          <span style={{
            fontFamily: MONO, fontSize: 8, letterSpacing: '1.5px', padding: '3px 10px', borderRadius: 2,
            color: connection && !isExpired ? '#4ade80' : isExpired ? '#f87171' : 'var(--ink3)',
            background: connection && !isExpired ? 'rgba(74,222,128,0.08)' : isExpired ? 'rgba(248,113,113,0.08)' : 'var(--rule)',
            border: `1px solid ${connection && !isExpired ? 'rgba(74,222,128,0.2)' : isExpired ? 'rgba(248,113,113,0.2)' : 'var(--rule2)'}`,
          }}>
            {loading ? '· · ·' : connection && !isExpired ? '● CONNECTED' : isExpired ? '● EXPIRED' : 'NOT CONNECTED'}
          </span>
        </div>

        {connection && !isExpired && (
          <div style={{ background: 'var(--rule)', borderRadius: 4, padding: '12px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Account</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: 'var(--ink)' }}>{connection.account_name || 'Connected'}</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Token Expires</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: daysUntilExpiry && daysUntilExpiry < 14 ? '#fbbf24' : '#4ade80' }}>
                {daysUntilExpiry !== null ? `${daysUntilExpiry} days` : 'Long-lived'}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!connection || isExpired ? (
            <button onClick={connectMeta}
              style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#fff', background: '#1877f2', border: 'none', padding: '11px 22px', borderRadius: 4, cursor: 'pointer' }}>
              {isExpired ? 'Reconnect Meta Ads →' : 'Connect Meta Ads →'}
            </button>
          ) : (
            <>
              <button onClick={syncNow} disabled={syncing}
                style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#050509', background: 'var(--gold)', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.6 : 1 }}>
                {syncing ? 'Syncing…' : 'Sync Now →'}
              </button>
              <button onClick={connectMeta}
                style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: 'var(--gold)', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', padding: '10px 18px', borderRadius: 4, cursor: 'pointer' }}>
                Reconnect
              </button>
              <button onClick={disconnect} disabled={disconnecting}
                style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '1px', color: '#f87171', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', padding: '10px 18px', borderRadius: 4, cursor: 'pointer', opacity: disconnecting ? 0.6 : 1 }}>
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Google Ads + TikTok Ads connection cards are deferred to a later
          version — those integrations aren't built yet, so the placeholder
          "coming soon" cards were removed rather than shown as dead UI. When
          Google/TikTok ad-account ingestion ships, re-add connect cards here
          mirroring the Meta card above. */}

      <div style={{ padding: '12px 14px', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 4 }}>
        <div style={{ fontFamily: MONO, fontSize: 7, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Read-Only Access</div>
        <div style={{ fontFamily: MONO, fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px', lineHeight: 1.8 }}>
          VAI only reads your campaign data. We never create, edit, pause, or delete any of your ads. Your ad accounts remain fully under your control.
        </div>
      </div>
    </div>
  )
}
