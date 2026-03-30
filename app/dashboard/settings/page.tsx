'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width:34, height:19, borderRadius:10, position:'relative', cursor:'pointer', border:'none', background:on?'var(--green)':'var(--bg3)', transition:'background .2s', flexShrink:0, outline:'none' }}>
      <div style={{ position:'absolute', top:2, left:on?17:2, width:15, height:15, borderRadius:'50%', background:'white', transition:'left .18s', boxShadow:'0 1px 2px rgba(0,0,0,.15)' }} />
    </button>
  )
}

export default function SettingsPage() {
  const { client, dark, setDark, toast: showToast } = useApp()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [notifs, setNotifs] = useState({ weekly:true, leaks:true, reports:true, sync:false })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setEmail(user.email || '') })
  }, [])

  const accountRows = [
    ['Company', client?.name || '—'],
    ['Industry', client?.industry || '—'],
    ['Plan', client?.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) + ' · Active' : '—'],
    ['Contact', client?.contact_name || '—'],
    ['Email', client?.contact_email || email || '—'],
    ['Member Since', client ? new Date(client.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : '—'],
  ]

  const notifRows = [
    { key:'weekly',  label:'Weekly performance summary' },
    { key:'leaks',   label:'Alert when Biggest Leak exceeds $500' },
    { key:'reports', label:'Notify when monthly report is ready' },
    { key:'sync',    label:'Notify on every data sync' },
  ]

  return (
    <div style={{ maxWidth:560, display:'flex', flexDirection:'column', gap:11 }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, padding:'17px 20px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:10 }}>Account</div>
        {accountRows.map(([k,v],i) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<accountRows.length-1?'1px solid var(--rule)':'none' }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)' }}>{k}</span>
            <span style={{ fontSize:12, fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, padding:'17px 20px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:10 }}>Notifications</div>
        {notifRows.map((row,i) => (
          <div key={row.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<notifRows.length-1?'1px solid var(--rule)':'none' }}>
            <span style={{ fontSize:12 }}>{row.label}</span>
            <Toggle on={notifs[row.key as keyof typeof notifs]} onClick={() => setNotifs(prev => ({...prev,[row.key]:!prev[row.key as keyof typeof prev]}))} />
          </div>
        ))}
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, padding:'17px 20px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:10 }}>Appearance</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0' }}>
          <span style={{ fontSize:12 }}>Dark mode</span>
          <Toggle on={dark} onClick={() => setDark(!dark)} />
        </div>
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--redborder)', borderRadius:8, padding:'17px 20px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--red)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:10 }}>Danger Zone</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>Disconnect all accounts</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)' }}>Removes all OAuth tokens and halts data sync</div>
          </div>
          <button onClick={() => showToast('Action required','Contact your VV manager to disconnect all accounts.')} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid var(--redborder)', background:'transparent', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--red)', letterSpacing:1 }}>
            Disconnect All
          </button>
        </div>
      </div>
    </div>
  )
}
