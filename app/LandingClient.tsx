'use client'
import { useState, useEffect, useRef } from 'react'

const SYMPTOMS = [
  "You increased budget. ROAS dropped. Nobody knows why.",
  "Your agency sends reports. They never say what to cut.",
  "You're spending $15k/mo and still guessing.",
  "Your best month was 8 months ago.",
  "You have data. You don't have answers.",
]

const RESULTS = [
  { metric: '$9,200', label: 'recovered in 30 days', client: 'DTC Skincare Brand' },
  { metric: '4.1x',   label: 'ROAS from 1.6x in 6 weeks', client: 'Fitness Equipment Co.' },
  { metric: '41%',    label: 'budget waste eliminated', client: 'Home Goods Brand' },
]

const STEPS = [
  {
    n: '01',
    title: 'Connect',
    body: 'Link Meta and Google Ads in one click. Read-only access — we never touch your campaigns.',
    detail: 'OAuth 2.0 · AES-256 encryption · No campaign modifications ever',
  },
  {
    n: '02',
    title: 'Classify',
    body: 'Every campaign is scored STRONG, WEAK, BLEEDING, or DEAD. Updated daily from live data.',
    detail: 'Proprietary health scoring · Real-time sync · Cross-platform view',
  },
  {
    n: '03',
    title: 'Act',
    body: 'Every Monday — one brief, one action, your biggest leak. Plain English, zero jargon.',
    detail: 'Claude AI diagnosis · Weekly delivery · PDF export',
  },
]

const FAQS = [
  {
    q: 'How is this different from my agency reports?',
    a: 'Agency reports show you what happened. VV Growth Ad Engine tells you exactly what is wrong and what to do about it — in plain English, every Monday, without a call.',
  },
  {
    q: 'What ad platforms do you connect to?',
    a: 'Meta Ads (Facebook + Instagram) and Google Ads currently. TikTok Ads coming soon. You connect once via OAuth — we never store passwords or modify campaigns.',
  },
  {
    q: 'How do I get access?',
    a: 'VV Growth Ad Engine is invitation-only. Book a 15-minute call with the Vanguard team. We review your ad spend, confirm fit, and onboard you within 24 hours if it\'s the right match.',
  },
  {
    q: 'How long until I see results?',
    a: 'Your first intelligence brief arrives the Monday after you connect. Most clients identify their biggest budget leak within 48 hours of onboarding.',
  },
  {
    q: 'Do I need to change agencies or ad managers?',
    a: 'No. VV Growth Ad Engine sits on top of your existing setup. Think of us as the intelligence layer — we tell you and your team exactly what to change and why.',
  },
]

export default function LandingClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [symptomIdx, setSymptomIdx] = useState(0)
  const [resultIdx, setResultIdx] = useState(0)
  const [showBook, setShowBook] = useState(false)
  const [bookName, setBookName] = useState('')
  const [bookEmail, setBookEmail] = useState('')
  const [bookCompany, setBookCompany] = useState('')
  const [bookSpend, setBookSpend] = useState('')
  const [bookStatus, setBookStatus] = useState<'idle'|'loading'|'success'>('idle')
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const iv1 = setInterval(() => setSymptomIdx(i => (i + 1) % SYMPTOMS.length), 3000)
    const iv2 = setInterval(() => setResultIdx(i => (i + 1) % RESULTS.length), 2500)
    return () => { clearInterval(iv1); clearInterval(iv2) }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleWaitlist() {
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

  async function handleBook() {
    if (!bookName || !bookEmail) return
    setBookStatus('loading')
    try {
      await fetch('/api/book-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: bookName, email: bookEmail, company: bookCompany, spend: bookSpend }),
      })
    } catch {}
    setBookStatus('success')
  }

  if (!mounted) return null

  return (
    <div style={{ minHeight:'100vh', background:'#06060A', color:'#faf8f5', fontFamily:"'DM Sans', sans-serif", overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --gold:#c9a84c;--gold-dim:rgba(201,168,76,0.6);--gold-faint:rgba(201,168,76,0.06);
          --red-faint:rgba(201,76,76,0.06);--ink:#faf8f5;--ink2:rgba(250,248,245,0.65);
          --ink3:rgba(250,248,245,0.38);--ink4:rgba(250,248,245,0.15);
          --rule:rgba(250,248,245,0.07);--bg2:rgba(255,255,255,0.025);
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ticker{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes scan{0%{transform:translateY(-100vh)}100%{transform:translateY(200vh)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes glow{0%,100%{border-color:rgba(201,168,76,0.1)}50%{border-color:rgba(201,168,76,0.35)}}
        @keyframes countUp{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}

        .a1{animation:fadeUp 0.8s ease 0.05s both}
        .a2{animation:fadeUp 0.8s ease 0.2s both}
        .a3{animation:fadeUp 0.8s ease 0.35s both}
        .a4{animation:fadeUp 0.8s ease 0.5s both}
        .a5{animation:fadeUp 0.8s ease 0.65s both}
        .a6{animation:fadeUp 0.8s ease 0.8s both}

        .s1{animation:fadeUp 0.7s ease 0.0s both}
        .s2{animation:fadeUp 0.7s ease 0.12s both}
        .s3{animation:fadeUp 0.7s ease 0.24s both}

        .ticker{animation:ticker 0.4s ease both}
        .countup{animation:countUp 0.5s ease both}
        .float{animation:float 7s ease infinite}
        .glow{animation:glow 4s ease infinite}
        .scan{animation:scan 14s linear infinite}

        .btn-gold{background:var(--gold);color:#0a0908;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-weight:600;letter-spacing:1.5px;transition:all 0.2s ease;}
        .btn-gold:hover{background:#b8972a;transform:translateY(-1px);box-shadow:0 8px 28px rgba(201,168,76,0.22);}
        .btn-ghost{background:transparent;color:var(--gold-dim);border:1px solid rgba(201,168,76,0.2);cursor:pointer;font-family:'DM Mono',monospace;letter-spacing:1.5px;transition:all 0.2s ease;}
        .btn-ghost:hover{border-color:rgba(201,168,76,0.45);color:var(--gold);background:var(--gold-faint);}
        .nav-a{text-decoration:none;transition:color 0.2s ease;font-family:'DM Mono',monospace;font-size:9px;color:var(--ink4);letter-spacing:1.5px;}
        .nav-a:hover{color:var(--ink)!important;}
        .hp{display:inline-block;font-family:'DM Mono',monospace;font-weight:500;letter-spacing:2px;border-radius:3px;}
        .hs{background:#1a3a1a;color:#4c8b4c;border:1px solid #2a5a2a;}
        .hw{background:#2a2210;color:#c9a84c;border:1px solid #3a3218;}
        .hb{background:#2a1a0a;color:#c97a2c;border:1px solid #3a2a1a;}
        .hd{background:#2a1010;color:#c94c4c;border:1px solid #3a1818;}
        .sc{transition:transform 0.25s ease,border-color 0.25s ease;}
        .sc:hover{transform:translateY(-5px);border-color:rgba(201,168,76,0.3)!important;}
        input::placeholder{color:var(--ink4);}
        input:focus{outline:none;border-color:rgba(201,168,76,0.45)!important;}
        .modal-in{animation:fadeIn 0.2s ease;}
        .box-in{animation:fadeUp 0.3s ease;}
        @media(max-width:768px){
          .g3{grid-template-columns:1fr!important;}
          .g2{grid-template-columns:1fr!important;}
          .h1r{font-size:clamp(42px,11vw,96px)!important;}
          .hnav{display:none!important;}
          .sp{padding-left:24px!important;padding-right:24px!important;}
          .srow{gap:32px!important;}
        }
      `}</style>

      {/* Atmosphere */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div className="scan" style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.08),transparent)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(250,248,245,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,245,0.013) 1px,transparent 1px)',backgroundSize:'88px 88px'}}/>
        <div style={{position:'absolute',top:'-25vh',left:'50%',transform:'translateX(-50%)',width:'110vw',height:'85vh',background:'radial-gradient(ellipse,rgba(88,90,220,0.07) 0%,rgba(59,130,246,0.03) 45%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'35vh',background:'linear-gradient(to top,rgba(6,6,10,0.9),transparent)'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>

        {/* NAV */}
        <nav style={{padding:'16px 52px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--rule)',position:'sticky',top:0,background:'rgba(6,6,10,0.92)',backdropFilter:'blur(18px)',zIndex:100}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,fontStyle:'italic',letterSpacing:2}}>VV</span>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(250,248,245,0.38)',letterSpacing:'2.5px',textTransform:'uppercase'}}>Vanguard Visuals</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(250,248,245,0.18)',letterSpacing:'2px',textTransform:'uppercase'}}>Growth Ad Engine</div>
            </div>
          </div>
          <div className="hnav" style={{display:'flex',alignItems:'center',gap:28}}>
            <a href="#how" className="nav-a">How it works</a>
            <a href="#results" className="nav-a">Results</a>
            <a href="#team" className="nav-a">The Team</a>
            <a href="#vision" className="nav-a">VV Ad Vision</a>
            <a href="#faq" className="nav-a">FAQ</a>
            <button onClick={() => setShowBook(true)} className="btn-ghost" style={{fontSize:9,padding:'7px 16px',borderRadius:4}}>Apply for Access</button>
            <a href="/login" style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink4)',letterSpacing:'1.5px',textDecoration:'none',padding:'7px 14px',border:'1px solid var(--rule)',borderRadius:4}}>Sign In →</a>
          </div>
        </nav>

        {/* HERO */}
        <section className="sp" style={{maxWidth:1020,margin:'0 auto',padding:'108px 52px 72px',textAlign:'center'}}>

          <div className="a1">
            <div style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--gold-dim)',letterSpacing:'2.5px',textTransform:'uppercase',padding:'6px 16px',border:'1px solid rgba(201,168,76,0.16)',borderRadius:20,marginBottom:34,background:'var(--gold-faint)'}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'var(--gold)',animation:'pulse 2s ease infinite',display:'inline-block'}}/>
              Invitation Only · Intelligence Platform · vngrdvisuals.com
            </div>
          </div>

          <div className="a2">
            <h1 className="h1r" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(50px,8.5vw,100px)',fontWeight:300,lineHeight:1.0,letterSpacing:-2,marginBottom:26,color:'var(--ink)'}}>
              Your ad spend is<br/>
              <em style={{color:'rgba(250,248,245,0.12)',fontStyle:'italic'}}>bleeding.</em><br/>
              We find the leak.
            </h1>
          </div>

          <div className="a3" style={{marginBottom:22,minHeight:38}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:10,padding:'9px 20px',background:'rgba(201,76,76,0.05)',border:'1px solid rgba(201,76,76,0.1)',borderRadius:4}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(201,76,76,0.5)',letterSpacing:2}}>SOUND FAMILIAR?</span>
              <span key={symptomIdx} className="ticker" style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink3)'}}>{SYMPTOMS[symptomIdx]}</span>
            </div>
          </div>

          <div className="a4" style={{marginBottom:48}}>
            <p style={{fontSize:16,color:'var(--ink3)',lineHeight:1.9,maxWidth:600,margin:'0 auto',fontWeight:300}}>
              VV Growth Ad Engine connects to your Meta and Google campaigns, classifies every campaign as{' '}
              <strong style={{color:'var(--ink2)',fontWeight:500}}>STRONG, WEAK, BLEEDING,</strong> or{' '}
              <strong style={{color:'var(--ink2)',fontWeight:500}}>DEAD</strong>, and delivers your single biggest budget leak — in plain English, every Monday morning, directly to your inbox.
            </p>
          </div>

          <div className="a5">
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:14}}>
              <button onClick={() => setShowBook(true)} className="btn-gold" style={{padding:'15px 36px',borderRadius:5,fontSize:10}}>
                Apply for Access →
              </button>
              <div style={{display:'flex',maxWidth:360,borderRadius:5,overflow:'hidden',border:'1px solid var(--rule)'}}>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleWaitlist()} disabled={status==='success'}
                  style={{flex:1,background:'rgba(255,255,255,0.022)',border:'none',padding:'15px 16px',color:'var(--ink)',fontFamily:"'DM Mono',monospace",fontSize:10}}/>
                <button onClick={handleWaitlist} disabled={status==='loading'||status==='success'} className="btn-gold" style={{padding:'15px 18px',fontSize:9,borderRadius:0}}>
                  {status==='loading'?'...' : status==='success'?"You're in ✓":'Join Waitlist'}
                </button>
              </div>
            </div>
            {status==='success' && <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--gold-dim)',letterSpacing:1,marginBottom:8}}>Intelligence brief incoming. We'll be in touch.</div>}
            {status==='error' && <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(201,76,76,0.7)',letterSpacing:1,marginBottom:8}}>Something went wrong. Try again.</div>}
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:1}}>Invitation only · Onboarding in under 1 hour · First brief within 48 hours</div>
          </div>
        </section>

        {/* LIVE DASHBOARD PREVIEW */}
        <section className="sp" style={{maxWidth:940,margin:'0 auto 88px',padding:'0 52px'}}>
          <div className="a6">
            <div className="float glow" style={{border:'1px solid rgba(250,248,245,0.07)',borderRadius:10,overflow:'hidden',background:'rgba(255,255,255,0.01)'}}>
              <div style={{background:'rgba(255,255,255,0.03)',padding:'12px 18px',borderBottom:'1px solid var(--rule)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',gap:6}}>
                  {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>)}
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:2}}>vngrdvisuals.com · live intelligence dashboard</div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:'#4c8b4c',animation:'pulse 2s ease infinite'}}/>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--ink4)',letterSpacing:1}}>LIVE</span>
                </div>
              </div>
              <div style={{padding:'14px 22px',borderBottom:'1px solid var(--rule)',background:'rgba(201,76,76,0.05)',borderLeft:'3px solid rgba(201,76,76,0.4)'}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(201,76,76,0.5)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:4}}>⚠ Biggest Leak Identified</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:'var(--ink)',marginBottom:3}}>Summer Sale — Retargeting consuming $3.2k/mo at 1.8x ROAS</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(201,76,76,0.5)'}}>→ Reduce budget 50% and refresh creative within 48 hours. Est. recovery: $1,600/mo.</div>
              </div>
              <div style={{padding:'8px 22px'}}>
                {[
                  {name:'Lookalike — Past Purchasers',spend:'$9.2k',roas:'6.2x',h:'s'},
                  {name:'Summer Sale — Retargeting',spend:'$3.2k',roas:'1.8x',h:'b'},
                  {name:'Performance Max — All Products',spend:'$2.8k',roas:'0.9x',h:'d'},
                  {name:'Search — Branded Keywords',spend:'$1.4k',roas:'9.0x',h:'s'},
                  {name:'UGC Creative — Ages 18–24',spend:'$1.8k',roas:'3.4x',h:'s'},
                ].map((c,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<4?'1px solid rgba(250,248,245,0.04)':'none'}}>
                    <div style={{fontSize:12,color:'rgba(250,248,245,0.58)',fontWeight:500}}>{c.name}</div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink4)'}}>{c.spend}</span>
                      <span className={`hp h${c.h}`} style={{fontSize:8,padding:'2px 8px'}}>{c.h==='s'?'STRONG':c.h==='b'?'BLEEDING':'DEAD'}</span>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:c.h==='s'?'#4c8b4c':c.h==='b'?'#c97a2c':'#c94c4c'}}>{c.roas}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{textAlign:'center',marginTop:10,fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:1}}>
              ↑ This is what your dashboard looks like. Real data. Real campaigns. Real answers.
            </div>
          </div>
        </section>

        {/* STATS */}
        <div style={{borderTop:'1px solid var(--rule)',borderBottom:'1px solid var(--rule)',padding:'36px 52px'}}>
          <div className="srow" style={{display:'flex',justifyContent:'center',gap:80,flexWrap:'wrap'}}>
            {[['$2.4M+','Ad spend analysed'],['94%','Leak detection rate'],['48h','First insight delivery'],['3.8x','Avg ROAS improvement']].map(([v,l],i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:'var(--ink)',lineHeight:1}}>{v}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'1.5px',marginTop:6,textTransform:'uppercase'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* THE PROBLEM */}
        <section id="results" className="sp" style={{maxWidth:980,margin:'0 auto',padding:'100px 52px'}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>The Problem</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(30px,5vw,50px)',fontWeight:300,textAlign:'center',marginBottom:52,color:'var(--ink)',lineHeight:1.15}}>
            Most brands are bleeding 30–40%<br/>of their ad budget. Right now.
          </h2>
          <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:52}}>
            {[
              {icon:'◈',title:'No visibility',body:"You see spend and ROAS but not which campaigns are actively destroying your returns day by day."},
              {icon:'◫',title:'Agency opacity',body:"Agencies report what looked good. Nobody tells you what to kill. That's not an accident — it's a conflict of interest."},
              {icon:'◉',title:'Data without action',body:"Dashboards show you what happened. Nobody tells you what it means or what to do about it Monday morning."},
            ].map((c,i)=>(
              <div key={i} className="sc" style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderRadius:8,padding:'28px 24px'}}>
                <div style={{fontSize:20,color:'var(--gold)',marginBottom:14}}>{c.icon}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,marginBottom:10,color:'var(--ink)'}}>{c.title}</div>
                <div style={{fontSize:13,color:'var(--ink3)',lineHeight:1.78}}>{c.body}</div>
              </div>
            ))}
          </div>

          {/* RESULTS TICKER */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderRadius:8,padding:'28px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:20}}>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--gold-dim)',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:8}}>Client Result</div>
              <div key={resultIdx} className="countup" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:300,color:'var(--gold)',lineHeight:1}}>{RESULTS[resultIdx].metric}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'var(--ink3)',marginTop:4}}>{RESULTS[resultIdx].label}</div>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink4)',letterSpacing:1}}>{RESULTS[resultIdx].client}</div>
            <div style={{display:'flex',gap:7}}>
              {RESULTS.map((_,i)=>(
                <div key={i} onClick={()=>setResultIdx(i)} style={{width:6,height:6,borderRadius:'50%',background:i===resultIdx?'var(--gold)':'rgba(201,168,76,0.18)',cursor:'pointer',transition:'background 0.2s'}}/>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{borderTop:'1px solid var(--rule)',padding:'100px 52px'}}>
          <div style={{maxWidth:980,margin:'0 auto'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>How it works</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(30px,5vw,48px)',fontWeight:300,textAlign:'center',marginBottom:64,color:'var(--ink)',lineHeight:1.15}}>
              From connection to intelligence<br/>in under 48 hours.
            </h2>
            <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              {STEPS.map((s,i)=>(
                <div key={i} className="sc" style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderRadius:8,padding:'32px 26px'}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(201,168,76,0.32)',letterSpacing:'2px',marginBottom:20}}>{s.n}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:400,marginBottom:12,color:'var(--ink)'}}>{s.title}</div>
                  <div style={{fontSize:13,color:'var(--ink3)',lineHeight:1.78,marginBottom:16}}>{s.body}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:0.5,paddingTop:14,borderTop:'1px solid var(--rule)'}}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HEALTH SYSTEM */}
        <section style={{borderTop:'1px solid var(--rule)',padding:'80px 52px',textAlign:'center'}}>
          <div style={{maxWidth:720,margin:'0 auto'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',marginBottom:14}}>The Intelligence System</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,4vw,44px)',fontWeight:300,marginBottom:32,color:'var(--ink)'}}>Every campaign. Classified. Every day.</h2>
            <div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap',marginBottom:40}}>
              {[['STRONG','s'],['WEAK','w'],['BLEEDING','b'],['DEAD','d']].map(([l,h])=>(
                <span key={l} className={`hp h${h}`} style={{fontSize:11,padding:'8px 20px',letterSpacing:'3px'}}>{l}</span>
              ))}
            </div>
            <div style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderLeft:'3px solid rgba(201,76,76,0.4)',borderRadius:8,padding:'20px 24px',textAlign:'left',marginBottom:16}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(201,76,76,0.5)',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:7}}>Weekly Intelligence Brief — Monday 7AM</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'var(--ink)',marginBottom:5}}>Summer Sale — Retargeting consuming $3.2k/mo at 1.8x ROAS</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(201,76,76,0.5)'}}>→ Reduce budget 50% and refresh creative within 48 hours. Est. $1,600 recovered this month.</div>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink4)',letterSpacing:1}}>
              Sent from intelligence@vngrdvisuals.com · Every Monday · Your inbox, not your dashboard
            </div>
          </div>
        </section>

        {/* WHO YOU'RE DEALING WITH */}
        <section id="team" style={{borderTop:'1px solid var(--rule)',padding:'100px 52px'}}>
          <div style={{maxWidth:860,margin:'0 auto'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>Who You're Dealing With</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,4vw,44px)',fontWeight:300,color:'var(--ink)',textAlign:'center',marginBottom:48,lineHeight:1.15}}>
              Built by people who've seen<br/>the bleed firsthand.
            </h2>
            <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              {[
                {name:'Pranavan T.',role:'Co-Founder · Product & Technology',bio:'Built VV Growth Ad Engine from the ground up — the entire platform, AI integration, and intelligence system. Background in growth systems and software architecture. Every feature in the platform was built to solve a real problem he saw firsthand.',tag:'Builder'},
                {name:'Bardy',role:'Co-Founder · Sales & Strategy',bio:'One of the strongest sales operators in his generation. Chamber of Commerce network, enterprise background, closes high-ticket deals with precision. Your main point of contact — he speaks your language and knows your problems before you do.',tag:'Closer'},
              ].map((p,i)=>(
                <div key={i} style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderRadius:8,padding:'28px 24px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                    <div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'var(--ink)',marginBottom:3}}>{p.name}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--gold-dim)',letterSpacing:1}}>{p.role}</div>
                    </div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--gold)',background:'var(--gold-faint)',padding:'4px 10px',borderRadius:3,border:'1px solid rgba(201,168,76,0.18)',letterSpacing:2}}>{p.tag}</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--ink3)',lineHeight:1.78}}>{p.bio}</div>
                </div>
              ))}
            </div>
            <div style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderRadius:8,padding:'20px 24px'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--ink4)',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:8}}>Vanguard Visuals</div>
              <div style={{fontSize:13,color:'var(--ink3)',lineHeight:1.75}}>Growth intelligence agency. We run ads for our own products using VV Growth Ad Engine — so every recommendation we make is one we'd stake our own budget on. We eat our own cooking.</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{borderTop:'1px solid var(--rule)',padding:'100px 52px'}}>
          <div style={{maxWidth:720,margin:'0 auto'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>FAQ</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,4vw,40px)',fontWeight:300,color:'var(--ink)',textAlign:'center',marginBottom:48}}>Everything you need to know.</h2>
            {FAQS.map((f,i)=>(
              <div key={i} style={{borderBottom:'1px solid var(--rule)'}}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:'100%',background:'transparent',border:'none',cursor:'pointer',padding:'20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,textAlign:'left'}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'var(--ink)',fontWeight:400,lineHeight:1.3}}>{f.q}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:'var(--gold)',flexShrink:0,transition:'transform 0.3s',display:'inline-block',transform:openFaq===i?'rotate(45deg)':'none'}}>+</span>
                </button>
                <div style={{maxHeight:openFaq===i?'300px':'0',opacity:openFaq===i?1:0,overflow:'hidden',transition:'max-height 0.35s ease,opacity 0.35s ease',paddingBottom:openFaq===i?20:0}}>
                  <div style={{fontSize:13,color:'var(--ink3)',lineHeight:1.82}}>{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VV AD VISION */}
        <section id="vision" style={{borderTop:'1px solid var(--rule)',padding:'80px 52px'}}>
          <div style={{maxWidth:920,margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:36}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',whiteSpace:'nowrap'}}>Coming Soon</div>
              <div style={{height:1,flex:1,background:'var(--rule)'}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--gold-dim)',letterSpacing:2,padding:'4px 10px',border:'1px solid rgba(201,168,76,0.18)',borderRadius:3,whiteSpace:'nowrap'}}>FREE TOOL</span>
            </div>
            <div style={{background:'var(--bg2)',border:'1px solid var(--rule)',borderRadius:8,padding:'40px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.28),transparent)'}}/>
              <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--gold-dim)',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:14}}>VV Ad Vision Drop</div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:300,color:'var(--ink)',marginBottom:16,lineHeight:1.15}}>See where your budget goes. Free.</h3>
                  <p style={{fontSize:13,color:'var(--ink3)',lineHeight:1.82,marginBottom:24}}>A free diagnostic snapshot — connect your ad account and instantly see your campaign health, wasted budget, and your single biggest leak. No commitment. No card required.</p>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink4)',lineHeight:1.7,marginBottom:24}}>The free entry point to the full VV Growth Ad Engine. See the intelligence before you commit to the platform.</p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {['Free snapshot','No credit card','Instant results','Meta + Google'].map(t=>(
                      <span key={t} style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',padding:'4px 10px',border:'1px solid var(--rule)',borderRadius:3}}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="glow" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(250,248,245,0.08)',borderRadius:8,padding:'22px'}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--gold-dim)',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:14}}>Ad Vision Snapshot</div>
                  {[
                    {label:'Total Spend Analysed',value:'$12.4k',color:'var(--ink)'},
                    {label:'Wasted Spend',value:'$4.1k',color:'#c94c4c'},
                    {label:'Recovery Potential',value:'33%',color:'var(--gold)'},
                    {label:'Campaigns Flagged',value:'3 of 7',color:'#c97a2c'},
                  ].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<3?'1px solid rgba(250,248,245,0.04)':'none'}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)'}}>{r.label}</span>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:r.color}}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{borderTop:'1px solid var(--rule)',padding:'108px 52px',textAlign:'center'}}>
          <div style={{maxWidth:620,margin:'0 auto'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:'3px',textTransform:'uppercase',marginBottom:14}}>Invitation Only</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(38px,6.5vw,68px)',fontWeight:300,marginBottom:18,color:'var(--ink)',lineHeight:1.05}}>
              Stop the bleed.<br/>Start knowing.
            </h2>
            <p style={{fontSize:14,color:'var(--ink3)',marginBottom:44,lineHeight:1.8,maxWidth:480,margin:'0 auto 44px'}}>
              Book a 15-minute call. We'll pull up your live ad data, show you your biggest leak using your own numbers, and tell you exactly what we'd do about it. No pitch deck. No obligation.
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:16}}>
              <button onClick={()=>setShowBook(true)} className="btn-gold" style={{padding:'15px 40px',borderRadius:5,fontSize:10}}>
                Apply for Access →
              </button>
              <div style={{display:'flex',maxWidth:340,borderRadius:5,overflow:'hidden',border:'1px solid var(--rule)'}}>
                <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleWaitlist()} disabled={status==='success'}
                  style={{flex:1,background:'rgba(255,255,255,0.022)',border:'none',padding:'15px 14px',color:'var(--ink)',fontFamily:"'DM Mono',monospace",fontSize:10}}/>
                <button onClick={handleWaitlist} disabled={status==='loading'||status==='success'} className="btn-gold" style={{padding:'15px 16px',fontSize:9,borderRadius:0}}>
                  {status==='success'?'✓':'Join List'}
                </button>
              </div>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:1}}>
              No obligation · Onboarding in under 1 hour · Cancel anytime
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{borderTop:'1px solid var(--rule)',padding:'22px 52px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:1}}>© 2026 Vanguard Visuals · Growth Ad Engine · intelligence@vngrdvisuals.com</div>
          <div style={{display:'flex',gap:22}}>
            <a href="/privacy" style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',textDecoration:'none',letterSpacing:1}}>Privacy</a>
            <a href="/terms" style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',textDecoration:'none',letterSpacing:1}}>Terms</a>
            <button onClick={()=>setShowBook(true)} style={{background:'transparent',border:'none',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',letterSpacing:1,padding:0}}>Book a Call</button>
          </div>
        </footer>

      </div>

      {/* BOOK A CALL MODAL */}
      {showBook && (
        <div className="modal-in" onClick={e=>{if(e.target===e.currentTarget)setShowBook(false)}}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:24,backdropFilter:'blur(10px)'}}>
          <div className="box-in" style={{background:'#0f0e0d',border:'1px solid rgba(250,248,245,0.09)',borderRadius:10,padding:'40px',maxWidth:480,width:'100%',position:'relative',maxHeight:'90vh',overflowY:'auto'}}>
            <button onClick={()=>setShowBook(false)} style={{position:'absolute',top:16,right:18,background:'transparent',border:'none',cursor:'pointer',color:'var(--ink4)',fontSize:20,lineHeight:1}}>×</button>

            {bookStatus==='success' ? (
              <div style={{textAlign:'center',padding:'24px 0'}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:52,color:'var(--gold)',marginBottom:18,lineHeight:1}}>✓</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'var(--ink)',marginBottom:12}}>Request received.</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--ink4)',letterSpacing:0.5,lineHeight:1.8}}>
                  We'll reach out within 24 hours to confirm your call. Check your inbox at {bookEmail}.
                </div>
              </div>
            ) : (
              <>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--gold-dim)',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:8}}>Apply for Access</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'var(--ink)',marginBottom:6}}>Talk to Vanguard</div>
                <div style={{fontSize:13,color:'var(--ink3)',lineHeight:1.78,marginBottom:28}}>
                  15 minutes. We pull up your live ad data, show you your biggest leak using your own numbers, and tell you exactly what we'd do. No pitch deck. Real numbers only.
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {[
                    {label:'Full Name *',ph:'Your name',val:bookName,set:setBookName},
                    {label:'Email *',ph:'your@company.com',val:bookEmail,set:setBookEmail},
                    {label:'Company / Brand',ph:'Your brand or company',val:bookCompany,set:setBookCompany},
                    {label:'Monthly Ad Spend',ph:'e.g. $10,000/mo',val:bookSpend,set:setBookSpend},
                  ].map(f=>(
                    <div key={f.label}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'var(--ink4)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:5}}>{f.label}</div>
                      <input type="text" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}
                        style={{width:'100%',padding:'10px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(250,248,245,0.08)',borderRadius:5,color:'var(--ink)',fontFamily:"'DM Sans',sans-serif",fontSize:13}}/>
                    </div>
                  ))}
                  <button onClick={handleBook} disabled={bookStatus==='loading'||!bookName||!bookEmail} className="btn-gold"
                    style={{marginTop:8,padding:'13px',borderRadius:5,fontSize:10,opacity:(!bookName||!bookEmail)?0.35:1,cursor:(!bookName||!bookEmail)?'not-allowed':'pointer'}}>
                    {bookStatus==='loading'?'Submitting...':'Request Call →'}
                  </button>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--ink4)',textAlign:'center',letterSpacing:1}}>We follow up within 24 hours to confirm your time.</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}