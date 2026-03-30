'use client'
export const dynamic = "force-dynamic"
import { useState } from 'react'
import { useApp } from '@/app/dashboard/context'

const INDUSTRIES = [
  'Health & Fitness', 'Real Estate', 'Dental & Medical', 'E-Commerce',
  'Restaurants & Food', 'Legal Services', 'Education', 'SaaS & Tech',
  'Home Services', 'Fashion & Beauty', 'Finance', 'Other'
]

const PLANS = [
  { id: 'managed',  label: 'Managed',  desc: '$2,000/mo — VV manages all campaigns' },
  { id: 'embedded', label: 'Embedded', desc: '$3,500/mo — VV embedded in their team' },
  { id: 'enterprise',label:'Enterprise',desc: 'Custom — large accounts' },
]

export default function InvitePage() {
  const { isAdmin, toast: showToast } = useApp()
  const [step, setStep]       = useState<'form'|'sending'|'done'>('form')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [contact, setContact] = useState('')
  const [industry, setIndustry] = useState('')
  const [plan, setPlan]       = useState('managed')
  const [spend, setSpend]     = useState('')
  const [error, setError]     = useState('')
  const [result, setResult]   = useState<any>(null)

  if (!isAdmin) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', textAlign:'center' }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'var(--bg3)', marginBottom:12 }}>▲</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300 }}>Admin access required</div>
    </div>
  )

  async function sendInvite() {
    if (!name || !email) { setError('Company name and email are required.'); return }
    setError('')
    setStep('sending')

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, contact, industry, plan, monthly_spend: Number(spend.replace(/[^0-9]/g,'')) || 0 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      setResult(data)
      setStep('done')
    } catch (e: any) {
      setError(e.message)
      setStep('form')
    }
  }

  function reset() {
    setStep('form'); setName(''); setEmail(''); setContact('')
    setIndustry(''); setPlan('managed'); setSpend(''); setResult(null); setError('')
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'10px 13px', background:'var(--card2)',
    border:'1px solid var(--rule2)', borderRadius:6, color:'var(--ink)',
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:'none', boxSizing:'border-box'
  }
  const labelStyle: React.CSSProperties = {
    fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)',
    letterSpacing:'2px', textTransform:'uppercase', marginBottom:6, display:'block'
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, marginBottom:6 }}>Invite New Client</div>
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)', marginBottom:24, lineHeight:1.7 }}>
        Creates the client account, sends them a password setup email, and prepares their dashboard.
      </p>

      {step === 'form' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:10, padding:'28px 32px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input style={inputStyle} placeholder="Meridian Fitness Co." value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Contact Name</label>
                <input style={inputStyle} placeholder="James Caldwell" value={contact} onChange={e=>setContact(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Client Email Address *</label>
              <input style={inputStyle} type="email" placeholder="owner@meridianfitness.com" value={email} onChange={e=>setEmail(e.target.value)} />
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:5 }}>They'll receive a password setup link at this address</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <select style={inputStyle} value={industry} onChange={e=>setIndustry(e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Monthly Ad Spend</label>
                <input style={inputStyle} placeholder="$15,000" value={spend} onChange={e=>setSpend(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Plan</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {PLANS.map(p => (
                  <div key={p.id} onClick={()=>setPlan(p.id)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:6, border:`1px solid ${plan===p.id?'var(--goldborder)':'var(--rule)'}`, background:plan===p.id?'var(--goldpaper)':'var(--card2)', cursor:'pointer', transition:'all .15s' }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', border:`1px solid ${plan===p.id?'var(--gold)':'var(--rule2)'}`, background:plan===p.id?'var(--gold)':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {plan===p.id && <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500 }}>{p.label}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)', marginTop:1 }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <div style={{ background:'var(--redpaper)', border:'1px solid var(--redborder)', borderRadius:5, padding:'9px 12px', fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--red)', marginTop:16 }}>{error}</div>}

          <button onClick={sendInvite} style={{ width:'100%', padding:'13px 0', background:'var(--gold)', border:'none', borderRadius:6, cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:10, color:'#faf8f5', letterSpacing:'2px', textTransform:'uppercase', marginTop:24 }}>
            Send Invite →
          </button>
        </div>
      )}

      {step === 'sending' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:10, padding:'48px 32px', textAlign:'center' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:'var(--gold)', marginBottom:16 }}>◈</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, marginBottom:8 }}>Creating account...</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)' }}>Setting up {name}'s dashboard and sending invite</div>
        </div>
      )}

      {step === 'done' && result && (
        <div style={{ background:'var(--card)', border:'1px solid var(--rule2)', borderRadius:10, padding:'28px 32px' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--green)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:10 }}>✓ Invite Sent</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, marginBottom:16 }}>{name} is ready.</div>

          <div style={{ background:'var(--card2)', border:'1px solid var(--rule)', borderRadius:8, padding:'14px 16px', marginBottom:20 }}>
            {[
              ['Client account', 'Created in database'],
              ['Auth invite', `Sent to ${email}`],
              ['Plan', plan.charAt(0).toUpperCase()+plan.slice(1)],
              ['Dashboard', 'Ready on login'],
              ['Weekly brief', 'Active from next Monday'],
            ].map(([k,v],i,arr) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:i<arr.length-1?'1px solid var(--rule)':'none', fontSize:12 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'var(--ink3)' }}>{k}</span>
                <span style={{ fontWeight:500, color:'var(--green)' }}>✓ {v}</span>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--goldpaper)', border:'1px solid var(--goldborder)', borderLeft:'2px solid var(--gold)', borderRadius:6, padding:'12px 15px', marginBottom:20 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'var(--goldlt)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:5 }}>Next Steps</div>
            <div style={{ fontSize:12, color:'var(--ink2)', lineHeight:1.7 }}>
              {name} will receive an email to set their password. Once they log in, the onboarding flow guides them through entering their campaigns. After that, connect their ad accounts within 24h.
            </div>
          </div>

          <button onClick={reset} style={{ width:'100%', padding:'11px 0', background:'transparent', border:'1px solid var(--rule2)', borderRadius:6, cursor:'pointer', fontFamily:"'DM Mono',monospace", fontSize:9, color:'var(--ink3)', letterSpacing:'2px' }}>
            Invite Another Client
          </button>
        </div>
      )}
    </div>
  )
}
