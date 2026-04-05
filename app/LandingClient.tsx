'use client'
import { useState } from 'react'

export default function LandingClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit() {
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) { setStatus('success'); setEmail('') }
      else setStatus('error')
    } catch { setStatus('error') }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#06060A', color:'#faf8f5', fontFamily:"'DM Sans',sans-serif", overflowX:'hidden' }}>

      {/* Grain overlay */}
      <div style={{ position:'fixed', inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity:0.4, pointerEvents:'none', zIndex:0 }} />

      {/* Grid overlay */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(250,248,245,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(250,248,245,0.02) 1px, transparent 1px)', backgroundSize:'72px 72px', pointerEvents:'none', zIndex:0 }} />

      {/* Orb */}
      <div style={{ position:'fixed', top:'-20vh', left:'50%', transform:'translateX(-50%)', width:'80vw', height:'60vh', background:'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1 }}>

        {/* Nav */}
        <nav style={{ padding:'22px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(250,248,245,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, fontStyle:'italic', letterSpacing:2 }}>VV</span>
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(250,248,245,0.4)', letterSpacing:'2.5px', textTransform:'uppercase' }}>Vanguard Visuals</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'rgba(250,248,245,0.2)', letterSpacing:'2px', textTransform:'uppercase' }}>Growth Ad Engine</div>
            </div>
          </div>
          <a href="/login" style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(250,248,245,0.45)', letterSpacing:'1.5px', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(250,248,245,0.1)', borderRadius:4 }}>Sign In →</a>
        </nav>

        {/* Hero */}
        <section style={{ maxWidth:860, margin:'0 auto', padding:'120px 40px 80px', textAlign:'center' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(201,168,76,0.8)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:24 }}>
            ◈ Embedded Intelligence on Retainer
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(42px, 7vw, 88px)', fontWeight:300, lineHeight:1.05, letterSpacing:-1, margin:'0 0 28px', color:'#faf8f5' }}>
            Your ad spend is<br />
            <span style={{ color:'rgba(250,248,245,0.25)', fontStyle:'italic' }}>bleeding.</span>
            <br />We find the leak.
          </h1>
          <p style={{ fontSize:16, color:'rgba(250,248,245,0.5)', lineHeight:1.8, maxWidth:540, margin:'0 auto 48px', fontWeight:300 }}>
            VV Growth Ad Engine connects to your Meta and Google campaigns, classifies every campaign as STRONG, WEAK, BLEEDING, or DEAD, and delivers your single biggest budget leak in plain English — every week.
          </p>

          {/* Waitlist form */}
          <div style={{ display:'flex', maxWidth:440, margin:'0 auto', borderRadius:6, overflow:'hidden', border:'1px solid rgba(250,248,245,0.12)' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={status === 'success'}
              style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'none', padding:'14px 18px', color:'#faf8f5', fontFamily:"'DM Mono',monospace", fontSize:11, outline:'none' }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === 'loading' || status === 'success'}
              style={{ background:'#c9a84c', border:'none', padding:'14px 22px', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:10, color:'#0a0908', letterSpacing:'1.5px', fontWeight:600, whiteSpace:'nowrap', opacity:status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? 'Joining...' : status === 'success' ? "You're in ✓" : 'Join Waitlist →'}
            </button>
          </div>
          {status === 'success' && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(201,168,76,0.8)', marginTop:12, letterSpacing:1 }}>Intelligence brief incoming. We'll be in touch.</div>}
          {status === 'error' && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(220,80,80,0.8)', marginTop:12, letterSpacing:1 }}>Something went wrong. Try again.</div>}
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.2)', marginTop:16, letterSpacing:1 }}>No spam. One email when we open access.</div>
        </section>

        {/* Stats bar */}
        <div style={{ borderTop:'1px solid rgba(250,248,245,0.06)', borderBottom:'1px solid rgba(250,248,245,0.06)', padding:'28px 40px', display:'flex', justifyContent:'center', gap:'80px' }}>
          {[['$2.4M+','Ad spend analysed'],['94%','Leak detection rate'],['48h','Avg. time to first insight']].map(([val, label]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:'#faf8f5', lineHeight:1 }}>{val}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.3)', letterSpacing:'1.5px', marginTop:6, textTransform:'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section style={{ maxWidth:900, margin:'0 auto', padding:'100px 40px' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.3)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:16, textAlign:'center' }}>How it works</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:300, textAlign:'center', marginBottom:64, color:'#faf8f5' }}>Intelligence, delivered weekly</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24 }}>
            {[
              ['01','Connect','Link your Meta and Google Ads accounts in one click. Read-only access — we never touch your campaigns.'],
              ['02','Classify','Every campaign is scored STRONG, WEAK, BLEEDING, or DEAD. Updated daily from live data.'],
              ['03','Act','Every Monday, your intelligence brief arrives. One action. The biggest leak. Plain English.'],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(250,248,245,0.07)', borderRadius:8, padding:'28px 24px' }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(201,168,76,0.5)', letterSpacing:'2px', marginBottom:16 }}>{num}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:400, marginBottom:12, color:'#faf8f5' }}>{title}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(250,248,245,0.45)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Health pills showcase */}
        <section style={{ borderTop:'1px solid rgba(250,248,245,0.06)', padding:'80px 40px', textAlign:'center' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.3)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:16 }}>Campaign intelligence</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, marginBottom:48, color:'#faf8f5' }}>Every campaign. Classified.</h2>
          <div style={{ display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap', marginBottom:48 }}>
            {[['STRONG','#1a3a1a','#4c8b4c','#2a5a2a'],['WEAK','#2a2210','#c9a84c','#3a3218'],['BLEEDING','#2a1a0a','#c97a2c','#3a2a1a'],['DEAD','#2a1010','#c94c4c','#3a1818']].map(([label,bg,color,border]) => (
              <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:4, padding:'6px 16px', fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:600, letterSpacing:'2.5px', color }}>{label}</div>
            ))}
          </div>
          <div style={{ maxWidth:600, margin:'0 auto', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(250,248,245,0.07)', borderLeft:'3px solid #c94c4c', borderRadius:8, padding:'20px 24px', textAlign:'left' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'rgba(201,76,76,0.7)', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:8 }}>Biggest Leak Identified</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:400, color:'#faf8f5', marginBottom:6 }}>Summer Sale — Retargeting consuming $3.2k/mo at 1.8x ROAS</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(201,76,76,0.7)' }}>→ Reduce budget 50% and refresh creative within 48 hours.</div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding:'100px 40px', textAlign:'center', borderTop:'1px solid rgba(250,248,245,0.06)' }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(32px, 5vw, 56px)', fontWeight:300, marginBottom:16, color:'#faf8f5', lineHeight:1.15 }}>Stop guessing.<br />Start knowing.</h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:'rgba(250,248,245,0.4)', marginBottom:40, lineHeight:1.7 }}>Join founders and DTC brands getting their weekly intelligence brief.</p>
          <div style={{ display:'flex', maxWidth:440, margin:'0 auto', borderRadius:6, overflow:'hidden', border:'1px solid rgba(250,248,245,0.12)' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={status === 'success'}
              style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'none', padding:'14px 18px', color:'#faf8f5', fontFamily:"'DM Mono',monospace", fontSize:11, outline:'none' }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === 'loading' || status === 'success'}
              style={{ background:'#c9a84c', border:'none', padding:'14px 22px', cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:10, color:'#0a0908', letterSpacing:'1.5px', fontWeight:600, whiteSpace:'nowrap' }}>
              {status === 'success' ? "You're in ✓" : 'Join Waitlist →'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop:'1px solid rgba(250,248,245,0.06)', padding:'24px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.2)', letterSpacing:1 }}>© 2026 Vanguard Visuals · Growth Ad Engine</div>
          <div style={{ display:'flex', gap:20 }}>
            <a href="/privacy" style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.2)', textDecoration:'none', letterSpacing:1 }}>Privacy</a>
            <a href="/terms" style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(250,248,245,0.2)', textDecoration:'none', letterSpacing:1 }}>Terms</a>
          </div>
        </footer>

      </div>
    </div>
  )
}