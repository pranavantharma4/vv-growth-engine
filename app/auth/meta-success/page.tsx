'use client'

import { useEffect } from 'react'

/**
 * Popup bridge for Meta OAuth.
 * The meta-oauth-callback edge function redirects the OAuth popup here after a
 * successful connection. This page tells the page that opened the popup
 * (onboarding / connect) that Meta is connected, then closes itself.
 * If it wasn't opened as a popup, it recovers by navigating back into the app.
 */
export default function MetaSuccessPage() {
  useEffect(() => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'META_CONNECTED' }, window.location.origin)
      }
    } catch (_) {}

    // Close the popup. If there's no opener (popup blocked / same-tab),
    // close() is a no-op — recover by navigating back into the app.
    window.close()
    const t = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      let next = params.get('next') || '/dashboard'
      if (!next.startsWith('/') || next.startsWith('//')) next = '/dashboard'
      window.location.replace(next)
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
