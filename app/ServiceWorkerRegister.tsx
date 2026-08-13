'use client'

import { useEffect } from 'react'

// Registers the PWA service worker (/sw.js) after the page loads. Client-only,
// renders nothing. The SW itself is network-first (see public/sw.js), so this
// adds installability without risking stale content.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
