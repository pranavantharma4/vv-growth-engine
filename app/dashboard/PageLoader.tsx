'use client'
import { useEffect, useState } from 'react'

// Premium tab-load indicator. Renders NOTHING for the first 400ms so fast
// loads (the common case) never show a loading state — content simply fades in
// via the layout transition. Only genuinely slow loads reveal a quiet pulsing
// VV mark + a thin gold progress line. Never jarring "page loading" text.
export default function PageLoader() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400)
    return () => clearTimeout(t)
  }, [])

  if (!show) return <div style={{ minHeight: '55vh' }} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minHeight: '55vh' }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 300, fontSize: 34, letterSpacing: 2, color: 'var(--ink)', animation: 'vvPulse 1.6s ease-in-out infinite' }}>VV</div>
      <div style={{ width: 120, height: 1, background: 'var(--rule)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '40%', background: 'var(--gold)', borderRadius: 1, animation: 'vvBar 1.2s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes vvPulse{0%,100%{opacity:.32}50%{opacity:.95}}@keyframes vvBar{0%{transform:translateX(-130%)}100%{transform:translateX(330%)}}`}</style>
    </div>
  )
}
