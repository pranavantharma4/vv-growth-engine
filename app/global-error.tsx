'use client'

import { useEffect } from 'react'

// Last-resort boundary for errors thrown in the ROOT layout (app/layout.tsx).
// global-error replaces the entire document, so it must render its own <html>
// and <body>. This is the final backstop against a fully blank white screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] FATAL root-layout crash caught by global-error:', error)
    if (error?.digest) console.error('[app] error digest:', error.digest)
    if (error?.stack) console.error('[app] stack:', error.stack)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            textAlign: 'center',
            padding: 32,
            background: '#020203',
            color: '#f5f3ef',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ fontSize: 40, fontStyle: 'italic' }}>VV</div>
          <div style={{ fontSize: 13, color: 'rgba(245,243,239,0.6)', maxWidth: 440, lineHeight: 1.7 }}>
            The app failed to load. Please reload the page.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => reset()}
              style={{ fontSize: 11, fontWeight: 600, color: '#050509', background: '#c9a84c', border: 'none', padding: '9px 18px', borderRadius: 4, cursor: 'pointer' }}
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => { window.location.reload() }}
              style={{ fontSize: 11, fontWeight: 600, color: '#f5f3ef', background: 'transparent', border: '1px solid rgba(245,243,239,0.2)', padding: '9px 18px', borderRadius: 4, cursor: 'pointer' }}
            >
              RELOAD
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
