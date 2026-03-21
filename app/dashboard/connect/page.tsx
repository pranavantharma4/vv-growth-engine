'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'

const PLATFORMS = [
  { id:'meta',     label:'Meta Ads',   icon:'f',  bg:'#e8f0fe', color:'#1a56cc', scope:'ads_read, ads_management' },
  { id:'google',   label:'Google Ads', icon:'G',  bg:'#e8f4e8', color:'#1a6e1a', scope:'adwords read-only' },
  { id:'tiktok',   label:'TikTok Ads', icon:'TT', bg:'#fee8ee', color:'#cc1a3a', scope:'ad.read' },
  { id:'linkedin', label:'LinkedIn',   icon:'in', bg:'#e8f4fb', color:'#0a66c2', scope:'r_ads' },
]

export default function ConnectionsPage() {
  const { client, showToast } = useApp()
  const supabase = createClientComponentClient()
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return
    supabase.from('ad_connections').select('*').eq('client_id', client.id)
      .then(({ data }) => { setConnections(data || []); setLoading(false) })
  }, [client])

  function getConn(platform: string) { return connections.find(c => c.platform === platform) }

  async function disconnect(platform: string) {
    const conn = getConn(platform)
    if (!conn) return
    await supabase.from('ad_connections').update({ is_active: false, access_token: null }).eq('id', conn.id)
    setConnections(prev => prev.map(c => c.platform === platform ? { ...c, is_active: false } : c))
    showToast('Disconnected', PLATFORMS.find(p=>p.id===platform)?.label + ' has been disconnected.')
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'var(--ink2)', lineHeight:1.75, marginBottom:20 }}>
        Connect your ad accounts to enable live data sync. Vanguard reads your data in read-only mode — we never modify campaigns without your explicit instruction.
      </p>

      {PLATFORMS.map(plat => {
        const conn = getConn(plat.id)
        const active = conn?.is_active === true
        return (
          <div key={plat.id} style={{ background:'var(--card2)', border:'1px solid var(--rule)', borderRadius:8, padding:'15px 19px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
            <div style={{ display:'flex', alignItems:'center' }}>
              <div style={{ width:36, height:36, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, marginRight:12, background:plat.bg, color:plat.color, fontFamily:"'DM Mono',monospace", fontWeight:700, flexShrink:0 }}>{plat.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>{plat.label}</div>
                {active && conn ? (
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--green)', marginTop:3 }}>
                    ● Connected · {conn.account_name || conn.account_id} · Last synced: {conn.last_synced_at ? new Date(conn.last_synced_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'never'}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:3 }}>○ Not connected · Requires {plat.scope}</div>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:7 }}>
              {active ? (
                <button onClick={() => disconnect(plat.id)} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid var(--redborder)', background:'transparent', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--red)', letterSpacing:1 }}>Disconnect</button>
              ) : (
                <button onClick={() => showToast('OAuth coming soon', 'Platform connections will be live in the next build session.')} style={{ padding:'4px 12px', borderRadius:5, border:'none', background:'var(--gold)', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'#faf8f5', letterSpacing:1 }}>Connect →</button>
              )}
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
