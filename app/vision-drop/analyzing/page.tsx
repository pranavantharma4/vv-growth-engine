'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const MONO = "'DM Mono',monospace"
const SERIF = "'Cormorant Garamond',serif"
const SANS = "'DM Sans',sans-serif"
const GOLD = '#c9a84c'
const INK = 'rgba(250,248,245,0.92)'
const INK2 = 'rgba(250,248,245,0.6)'
const INK3 = 'rgba(250,248,245,0.32)'
const RULE = 'rgba(250,248,245,0.08)'

const PHRASES = [
  'Pulling the last 30 days of campaign data…',
  'Mapping spend across audiences and creatives…',
  'Identifying ROAS outliers — top and bottom…',
  'Cross-referencing CTR and frequency drift…',
  'Diagnosing the single biggest budget leak…',
  'Distilling your immediate action…',
]

export default function AnalyzingPage() {
  const router = useRouter()
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const triggeredRef = useRef(false)

  // Rotate the status phrase every 1.6s so the wait feels purposeful
  useEffect(() => {
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % PHRASES.length), 1600)
    return () => clearInterval(id)
  }, [])

  // Kick off the analysis after a brief beat so the user sees the loader at all
  useEffect(() => {
    if (triggeredRef.current) return
    triggeredRef.current = true

    const remembered = sessionStorage.getItem('vd_lead')
    if (!remembered) {
      router.replace('/vision-drop/connect')
      return
    }
    let email = ''
    try {
      email = (JSON.parse(remembered).email || '').toLowerCase()
    } catch {
      router.replace('/vision-drop/connect')
      return
    }
    if (!email) {
      router.replace('/vision-drop/connect')
      return
    }

    const minWait = new Promise((r) => setTimeout(r, 3000))

    const run = async () => {
      try {
        const res = await fetch('/api/vision-drop/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const json = await res.json()
        await minWait
        if (!res.ok) throw new Error(json.error || 'Analysis failed')
        // Stash results so the results page renders instantly without re-fetching
        sessionStorage.setItem('vd_report', JSON.stringify(json))
        router.replace('/vision-drop/results')
      } catch (e: any) {
        setErr(e.message || 'Something went wrong')
      }
    }
    run()
  }, [router])

  return (
    <main style={{ fontFamily: SANS, color: INK, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes goldPulse { 0%,100% { transform: scale(0.85); opacity: 0.45; } 50% { transform: scale(1.05); opacity: 1; } }
        .dot { width: 14px; height: 14px; border-radius: 50%; background: ${GOLD}; box-shadow: 0 0 16px rgba(201,168,76,0.55); display: inline-block; animation: goldPulse 1.3s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 0.18s; }
        .dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes scanV { 0% { transform: translateY(-100%); opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { transform: translateY(420px); opacity: 0; } }
        .scan-v { position: absolute; left: 0; right: 0; top: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent); animation: scanV 3.6s ease-in-out infinite; }
        @keyframes phraseFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .phrase { animation: phraseFade 0.42s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <header style={{ padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${RULE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, fontStyle: 'italic', color: INK, letterSpacing: 2 }}>VV</span>
          <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Ad Vision Drop</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '2px', textTransform: 'uppercase' }}>Analyzing</div>
      </header>

      <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ width: '100%', maxWidth: 560, position: 'relative', background: '#0c0b0f', border: `1px solid ${RULE}`, borderRadius: 8, padding: '64px 40px', overflow: 'hidden', textAlign: 'center' }}>
          <div className="scan-v" />

          <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '3.5px', textTransform: 'uppercase', marginBottom: 32 }}>
            VAI · Vision Drop in progress
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 36 }}>
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>

          <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: INK, fontStyle: 'italic', marginBottom: 18, letterSpacing: '-0.3px' }}>
            VAI is reading your account…
          </div>

          <div key={phraseIdx} className="phrase" style={{ fontFamily: MONO, fontSize: 11, color: INK2, letterSpacing: '0.8px', minHeight: 26 }}>
            {PHRASES[phraseIdx]}
          </div>

          {err && (
            <div style={{ marginTop: 32, padding: '14px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: 4, fontFamily: MONO, fontSize: 10, color: '#fca5a5' }}>
              ✕ {err}
              <div style={{ marginTop: 10 }}>
                <a href="/vision-drop/connect" style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  ← Try reconnecting
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer style={{ padding: '20px 32px', borderTop: `1px solid ${RULE}`, textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(250,248,245,0.18)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          This usually takes 20–60 seconds
        </div>
      </footer>
    </main>
  )
}
