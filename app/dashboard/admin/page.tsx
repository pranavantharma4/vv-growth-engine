'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { fmtMoney } from '@/lib/types'

export default function AdminPage() {
  const { isAdmin, clients, setClient, showToast } = useApp()
  const supabase = createClientComponentClient()
  const [summary, setSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('client_health_summary').select('*').order('total_spend', { ascending: false })
      .then(({ data }) => { setSummary(data || []); setLoading(false) })
  }, [isAdmin])

  if (!isAdmin) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', textAlign:'center' }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'var(--bg3)', marginBottom:12 }}>▲</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, marginBottom:8 }}>Access Restricted</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)', letterSpacing:1 }}>Admin access required</div>
    </div>
  )

  const totalSpend = summary.reduce((s,c) => s + Number(c.total_spend||0), 0)
  const totalWasted = summary.reduce((s,c) => s + Number(c.wasted_spend||0), 0)

  function statusStyle(row: any) {
    if (Number(row.dead_count) > 0 || Number(row.bleeding_count) > 1) return { label:'Critical', color:'var(--red)', bg:'var(--redpaper)', border:'var(--redborder)' }
    if (Number(row.bleeding_count) > 0 || Number(row.weak_count) > 2) return { label:'Review', color:'var(--amber)', bg:'var(--amberpaper)', border:'var(--amberborder)' }
    return { label:'Healthy', color:'var(--green)', bg:'var(--greenpaper)', border:'var(--greenborder)' }
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:11, marginBottom:20 }}>
        {[
          { label:'Active Clients', value:String(summary.length), hint:'All plans', type:'' },
          { label:'Total Managed Spend', value:fmtMoney(totalSpend), hint:'Monthly across all accounts', type:'gold' },
          { label:'Total Wasted Spend', value:fmtMoney(totalWasted), hint:'Recoverable across all accounts', type:'warn' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--card2)', border:'1px solid var(--rule)', borderRadius:8, padding:'14px 16px' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:7 }}>{s.label}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:s.type==='warn'?'var(--red)':s.type==='gold'?'var(--gold)':'var(--ink)' }}>{s.value}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:4 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, marginBottom:12 }}>All Client Accounts</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 110px 110px 100px 120px', background:'var(--card2)', borderBottom:'2px solid var(--rule2)' }}>
          {['Client','Status','Spend','Wasted','Campaigns',''].map(h => (
            <div key={h} style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:2, textTransform:'uppercase', padding:'9px 12px', fontWeight:400 }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding:20, fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)' }}>Loading client data...</div>
        ) : summary.map((row, i) => {
          const st = statusStyle(row)
          const clientObj = clients.find(c => c.id === row.client_id)
          return (
            <div key={row.client_id} style={{ display:'grid', gridTemplateColumns:'1fr 90px 110px 110px 100px 120px', borderBottom:i<summary.length-1?'1px solid var(--rule)':'none', cursor:'pointer', transition:'background .1s' }}
              onMouseOver={e => (e.currentTarget.style.background='var(--card2)')}
              onMouseOut={e => (e.currentTarget.style.background='transparent')}
              onClick={() => { if (clientObj) setClient(clientObj) }}
            >
              <div style={{ padding:'11px 12px' }}>
                <div style={{ fontSize:12, fontWeight:500 }}>{row.client_name}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:2, textTransform:'capitalize' }}>{row.plan} · {row.status}</div>
              </div>
              <div style={{ padding:'11px 12px', display:'flex', alignItems:'center' }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, fontWeight:500, color:st.color, background:st.bg, border:`1px solid ${st.border}`, padding:'2px 8px', borderRadius:3 }}>{st.label}</span>
              </div>
              <div style={{ padding:'11px 12px', fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--ink2)', display:'flex', alignItems:'center' }}>{fmtMoney(Number(row.total_spend||0))}</div>
              <div style={{ padding:'11px 12px', fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--red)', display:'flex', alignItems:'center' }}>{fmtMoney(Number(row.wasted_spend||0))}</div>
              <div style={{ padding:'11px 12px', fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--ink2)', display:'flex', alignItems:'center' }}>{row.total_campaigns || 0}</div>
              <div style={{ padding:'11px 12px', display:'flex', alignItems:'center' }}>
                <button onClick={e => { e.stopPropagation(); if (clientObj) { setClient(clientObj); showToast('Client switched', 'Now viewing ' + row.client_name) }}}
                  style={{ padding:'3px 9px', borderRadius:3, fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--gold)', border:'1px solid var(--goldborder)', background:'var(--goldpaper)', cursor:'pointer' }}>
                  View Account
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {summary.filter(s => Number(s.dead_count) > 0).length > 0 && (
        <div style={{ background:'var(--goldpaper)', border:'1px solid var(--goldborder)', borderLeft:'2px solid var(--gold)', borderRadius:6, padding:'12px 15px', marginTop:14 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--goldlt)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:5 }}>Action Required This Week</div>
          <div style={{ fontSize:12, color:'var(--ink2)', lineHeight:1.65 }}>
            {summary.filter(s => Number(s.dead_count) > 0).length} account{summary.filter(s => Number(s.dead_count) > 0).length > 1 ? 's have' : ' has'} campaigns flagged as Dead. Click each account to run AI analysis and generate implementation blueprints. Prioritize by wasted spend.
          </div>
        </div>
      )}
    </div>
  )
}
