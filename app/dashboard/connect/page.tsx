'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '../context'

const SUPABASE_URL = 'https://ofqnhlkjazlsfctldbng.supabase.co'
const META_APP_ID = '4462090677412633'

export default function ConnectPage() {
  const supabase = createClientComponentClient()
  const { client, toast } = useApp()

  const [connection, setConnection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (client) load()

    // Check if we just returned from Meta OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'meta') {
      toast('Meta Ads connected', 'Your ad account is now connected. Click Sync Now to pull your campaigns.')
      // Clean the URL
      window.history.replaceState({}, '', '/dashboard/connect')
    }
    if (params.get('error')) {
      toast('Connection failed', decodeURIComponent(params.get('error') || 'Unknown error'))
      window.history.replaceState({}, '', '/dashboard/connect')
    }
  }, [client])

  async function load() {
    if (!client) return
    setLoading(true)
    const { data } = await supabase
      .from('ad_connections')
      .select('*')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .maybeSingle()
    setConnection(data)
    setLoading(false)
  }

  async function connectMeta() {
    if (!client) return

    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`
    const scope = 'ads_read,ads_management,business_management,read_insights'
    const state = encodeURIComponent(JSON.stringify({
      client_id: client.id,
      return_url: `${window.location.origin}/dashboard/connect?connected=meta`,
    }))

    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&response_type=code`

    // Open in same tab — Meta OAuth works best this way
    // The callback edge function will redirect back to return_url
    window.location.href = oauthUrl
  }

  async function disconnect() {
    if (!client || !connection) return
    setDisconnecting(true)
    await supabase
      .from('ad_connections')
      .update({ is_active: false, access_token: null })
      .eq('id', connection.id)
    toast('Disconnected', 'Meta Ads account disconnected.')
    setConnection(null)
    setDisconnecting(false)
  }

  const isExpired = connection?.expires_at && new Date(connection.expires_at) < new Date()
  const daysUntilExpiry = connection?.expires_at
    ? Math.max(0, Math.ceil((new Date(connection.expires_at).getTime() - Date.now()) / 86400000))
    : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading connections...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Connections</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Ad Account Connections</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--ink3)', letterSpacing: '1px' }}>
          Connect your ad platforms to start syncing campaign data automatically
        </div>
      </div>

      {/* Meta Ads */}
      <div style={{ background: 'var(--bg2)', border: `1px solid ${connection && !isExpired ? 'rgba(74,222,128,0.2)' : isExpired ? 'rgba(248,113,113,0.2)' : 'var(--rule)'}`, borderRadius: 8, padding: '24px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#1877f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Arial' }}>f</span>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Meta Ads</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px', marginTop: 2 }}>Facebook & Instagram Advertising</div>
            </div>
          </div>
          <div>
            {connection && !isExpired ? (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '3px 10px', borderRadius: 2, letterSpacing: '1.5px' }}>
                ● CONNECTED
              </span>
            ) : isExpired ? (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '3px 10px', borderRadius: 2, letterSpacing: '1.5px' }}>
                ● EXPIRED
              </span>
            ) : (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', background: 'var(--rule)', border: '1px solid var(--rule2)', padding: '3px 10px', borderRadius: 2, letterSpacing: '1.5px' }}>
                NOT CONNECTED
              </span>
            )}
          </div>
        </div>

        {connection && !isExpired && (
          <div style={{ background: 'var(--rule)', borderRadius: 4, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Account</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'var(--ink)' }}>{connection.account_name || 'Connected'}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--ink3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Token Expires</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: daysUntilExpiry && daysUntilExpiry < 14 ? '#fbbf24' : '#4ade80' }}>
                  {daysUntilExpiry !== null ? `${daysUntilExpiry} days` : 'Long-lived'}
                </div>
              </div>
            </div>
          </div>
        )}

        {isExpired && (
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 4, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#f87171', letterSpacing: '1px', lineHeight: 1.7 }}>
              Your Meta connection has expired. Reconnect to resume syncing.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {!connection || isExpired ? (
            <button onClick={connectMeta}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: '#fff', background: '#1877f2', border: 'none', padding: '11px 22px', borderRadius: 4, cursor: 'pointer' }}>
              {isExpired ? 'Reconnect Meta Ads →' : 'Connect Meta Ads →'}
            </button>
          ) : (
            <>
              <button onClick={connectMeta}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: 'var(--gold)', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', padding: '10px 18px', borderRadius: 4, cursor: 'pointer' }}>
                Reconnect
              </button>
              <button onClick={disconnect} disabled={disconnecting}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', color: '#f87171', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', padding: '10px 18px', borderRadius: 4, cursor: 'pointer', opacity: disconnecting ? 0.6 : 1 }}>
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Google Ads — coming soon */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '24px', marginBottom: 12, opacity: 0.6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#ea4335', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'Arial' }}>G</span>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Google Ads</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px', marginTop: 2 }}>Search, Display & YouTube</div>
            </div>
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', background: 'var(--rule)', border: '1px solid var(--rule2)', padding: '3px 10px', borderRadius: 2, letterSpacing: '1.5px' }}>
            COMING SOON
          </span>
        </div>
      </div>

      {/* TikTok Ads — coming soon */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--rule)', borderRadius: 8, padding: '24px', opacity: 0.6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#010101', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#00f2ea', fontWeight: 700, fontSize: 13, fontFamily: 'Arial' }}>T</span>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>TikTok Ads</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '1px', marginTop: 2 }}>TikTok for Business</div>
            </div>
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', background: 'var(--rule)', border: '1px solid var(--rule2)', padding: '3px 10px', borderRadius: 2, letterSpacing: '1.5px' }}>
            COMING SOON
          </span>
        </div>
      </div>

      {/* Info note */}
      <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--goldpaper)', border: '1px solid var(--goldborder)', borderRadius: 4 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Read-Only Access</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'var(--ink3)', letterSpacing: '0.5px', lineHeight: 1.8 }}>
          VV Growth Ad Engine only reads your campaign data. We never create, edit, pause, or delete any of your ads. Your ad accounts remain fully under your control at all times.
        </div>
      </div>
    </div>
  )
}