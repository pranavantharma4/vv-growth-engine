'use client'

import { useEffect } from 'react'

// Root-segment error boundary. Catches runtime errors thrown in app/layout's
// children AND — critically — in app/dashboard/layout.tsx itself, which the
// dashboard-segment error.tsx cannot catch (a segment's error boundary never
// catches its own layout). Without this, a crash in the dashboard shell is a
// blank white screen. Logs the real error so we can diagnose it.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] render crash caught by root error boundary:', error)
    if (error?.digest) console.error('[app] error digest:', error.digest)
    if (error?.stack) console.error('[app] stack:', error.stack)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        textAlign: 'center',
        padding: 32,
        background: '#020203',
        color: 'rgba(245,243,239,0.95)',
      }}
    >
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 40, fontWeight: 300, fontStyle: 'italic', letterSpacing: 1 }}>
        VV
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'rgba(245,243,239,0.55)', maxWidth: 440, lineHeight: 1.7 }}>
        Something went wrong loading the app. Your account is safe. Try again, or reload the page.
      </div>

      {process.env.NODE_ENV !== 'production' && error?.message && (
        <pre
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            color: '#f87171',
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 6,
            padding: '10px 14px',
            maxWidth: 560,
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
          }}
        >
          {error.message}
        </pre>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={() => reset()}
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#050509',
            background: '#c9a84c',
            border: 'none',
            padding: '9px 18px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.location.reload() }}
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: 'rgba(245,243,239,0.95)',
            background: 'transparent',
            border: '1px solid rgba(245,243,239,0.18)',
            padding: '9px 18px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Reload page
        </button>
      </div>
    </div>
  )
}
