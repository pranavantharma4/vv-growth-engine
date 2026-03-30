'use client'
export const dynamic = "force-dynamic"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useApp } from '@/app/dashboard/context'
import { Pill, PlatPill, StatCard } from '@/app/dashboard/components'
import type { CampaignSnapshot, BiggestLeak, AdConnection } from '@/lib/types'
import { fmtMoney, roasColor } from '@/lib/types'

export default function DashboardPage() {
  const { client } = useApp()
  const supabase = createClientComponentClient()
  const [camps, setCamps] = useState<CampaignSnapshot[]>([])
  const [leak, setLeak] = useState<BiggestLeak | null>(null)
  const [conns, setConns] = useState<AdConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0];
    (async () => {
      const [{ data: c }, { data: l }, { data: cn }] = await Promise.all([
        supabase.from('campaign_snapshots').select('*').eq('client_id', client.id).eq('snapshot_date', today).order('spend', { ascending: false }),
        supabase.from('biggest_leaks').select('*').eq('client_id', client.id),
        supabase.from('ad_connections').select('*').eq('client_id', client.id),
      ])
      setCamps(c || []); setLeak(l?.[0] || null); setConns(cn || [])
      setLoading(false)
    })()
  }, [client])

  if (loading) return <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)' }}>Loading dashboard...</p>

  const totalSpend = camps.reduce((s, c) => s + Number(c.spend), 0)
  const totalConv  = camps.reduce((s, c) => s + c.conversions, 0)
  const wasted     = camps.filter(c => c.health==='dead'||c.health==='bleeding').reduce((s, c) => s + Number(c.spend), 0)
  const blended    = totalSpend > 0 ? camps.reduce((s, c) => s + Number(c.roas) * Number(c.spend), 0) / totalSpend : 0

  const byPlat: Record<string,{spend:number;roas:number;n:number}> = {}
  camps.forEach(c => {
    if (!byPlat[c.platform]) byPlat[c.platform] = { spend:0, roas:0, n:0 }
    byPlat[c.platform].spend += Number(c.spend)
    byPlat[c.platform].roas  += Number(c.roas)
    byPlat[c.platform].n++
  })
  Object.keys(byPlat).forEach(p => { byPlat[p].roas /= byPlat[p].n })
  const platColor: Record<string,string> = { meta:'#1a56cc', google:'#1a6e1a', tiktok:'#cc1a3a' }
  const platLabel: Record<string,string> = { meta:'Meta', google:'Google', tiktok:'TikTok' }

  return (
    <div>
      {leak && (
        <div style={{ background:'var(--redpaper)', border:'1px solid var(--redborder)', borderLeft:'3px solid var(--red)', borderRadius:8, padding:'18px 22px', marginBottom:20 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--red)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:8 }}>Biggest Leak Identified</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:400, lineHeight:1.25, marginBottom:6 }}>
            {leak.campaign_name} consuming {fmtMoney(Number(leak.spend))}/mo at {Number(leak.roas).toFixed(1)}x ROAS
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--red)', marginTop:9 }}>
            → {leak.health==='dead' ? 'Pause immediately — reallocate budget to your strongest campaign.' : 'Reduce budget 50% and refresh creative within 48 hours.'}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:11, marginBottom:20 }}>
        <StatCard label="Total Spend"   value={fmtMoney(totalSpend)} hint={`${conns.filter(c=>c.is_active).length} platforms active`} />
        <StatCard label="Conversions"   value={String(totalConv)}    hint="Last 30 days" />
        <StatCard label="Blended ROAS"  value={blended.toFixed(1)+'x'} hint="All campaigns" type="gold" />
        <StatCard label="Wasted Spend"  value={fmtMoney(wasted)}    hint="Recoverable now" type="warn" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, marginBottom:12 }}>Platform Performance</div>
          {Object.entries(byPlat).map(([plat, s]) => (
            <div key={plat} style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, padding:'13px 16px', marginBottom:9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}><PlatPill platform={plat} /><span style={{ fontSize:13, fontWeight:500 }}>{platLabel[plat]||plat}</span></div>
                <Pill health={s.roas>=3?'strong':s.roas>=2?'weak':'bleeding'} label={s.roas>=3?'Healthy':s.roas>=2?'Watch':'Critical'} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:3 }}>Spend</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22 }}>{fmtMoney(s.spend)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:3 }}>ROAS</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:roasColor(s.roas) }}>{s.roas.toFixed(1)}x</div>
                </div>
              </div>
              <div style={{ height:2, background:'var(--bg3)', borderRadius:1, overflow:'hidden' }}>
                <div style={{ height:'100%', width:totalSpend>0?((s.spend/totalSpend)*100)+'%':'0%', background:platColor[plat]||'#888', borderRadius:1 }} />
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:3 }}>{totalSpend>0?((s.spend/totalSpend)*100).toFixed(1):0}% of total spend</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, marginBottom:12 }}>Campaign Health</div>
          <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:8, overflow:'hidden' }}>
            {camps.slice(0,7).map((c,i) => (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderBottom:i<6?'1px solid var(--rule)':'none' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{c.campaign_name}</div>
                  <PlatPill platform={c.platform} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Pill health={c.health} />
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:roasColor(Number(c.roas)) }}>{Number(c.roas).toFixed(1)}x</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
