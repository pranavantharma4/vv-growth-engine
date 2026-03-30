import { fmtMoney, roasColor } from '@/lib/types'

export function Pill({ health, label }: { health: string; label?: string }) {
  const map: Record<string, [string, string, string]> = {
    strong:   ['var(--greenpaper)', 'var(--green)',  'var(--greenborder)'],
    weak:     ['var(--goldpaper)',  'var(--gold)',   'var(--goldborder)'],
    bleeding: ['var(--amberpaper)', 'var(--amber)',  'var(--amberborder)'],
    dead:     ['var(--redpaper)',   'var(--red)',    'var(--redborder)'],
  }
  const [bg, color, border] = map[health] || map.weak
  const text = label || { strong:'Strong', weak:'Watch', bleeding:'Bleeding', dead:'Dead' }[health] || health
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:3, fontFamily:"'DM Mono',monospace", fontSize:7, fontWeight:500, letterSpacing:'1.5px', textTransform:'uppercase', background:bg, color, border:`1px solid ${border}` }}>{text}</span>
}

export function PlatPill({ platform }: { platform: string }) {
  const map: Record<string, [string, string]> = {
    meta:   ['#e8f0fe','#1a56cc'],
    google: ['#e8f4e8','#1a6e1a'],
    tiktok: ['#fee8ee','#cc1a3a'],
  }
  const [bg, color] = map[platform] || ['var(--card2)','var(--ink3)']
  return <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:3, fontFamily:"'DM Mono',monospace", fontSize:7, fontWeight:500, letterSpacing:1, textTransform:'uppercase', background:bg, color }}>{platform}</span>
}

export function StatCard({ label, value, hint, type }: { label:string; value:string; hint:string; type?:string }) {
  const color = type==='warn'?'var(--red)':type==='gold'?'var(--gold)':type==='good'?'var(--green)':'var(--ink)'
  return (
    <div style={{ background:'var(--card2)', border:'1px solid var(--rule)', borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--ink3)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:7 }}>{label}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:400, lineHeight:1, letterSpacing:-0.5, color }}>{value}</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:4 }}>{hint}</div>
    </div>
  )
}
