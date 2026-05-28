'use client'

import { useEffect } from 'react'

// Popup bridge for the Vision Drop OAuth flow. The Meta callback edge function
// redirects the popup here after a successful save into vision_drop_leads. We
// postMessage the opener (the /vision-drop/connect page) and close ourselves.
// If we weren't opened as a popup (popup blocked → same-tab redirect), we
// recover by navigating straight to /vision-drop/analyzing.
export default function VisionDropOAuthBridge() {
  useEffect(() => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'VISION_DROP_META_CONNECTED' },
          window.location.origin,
        )
      }
    } catch (_) {}

    window.close()
    const t = setTimeout(() => {
      window.location.replace('/vision-drop/analyzing')
    }, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, fontStyle: 'italic', color: 'rgba(245,243,239,0.95)', marginBottom: 14 }}>VV</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#4ade80', marginBottom: 8 }}>✓ Meta Ads Connected</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', color: 'rgba(245,243,239,0.4)' }}>You can close this window.</div>
      </div>
    </div>
  )
}
