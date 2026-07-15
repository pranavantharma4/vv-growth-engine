'use client'

import { useEffect } from 'react'

// Dashboard-scoped error boundary. Without this, any runtime error thrown while
// rendering a dashboard tab unmounts the React tree to a BLANK WHITE SCREEN with
// nothing logged where the user can see it. This catches the crash, logs the
// real error + stack to the console (so we can diagnose exactly what broke), and
// renders a recoverable UI instead of white.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Loud, greppable console output — this is our production diagnosis surface.
    console.error('[dashboard] render crash caught by error boundary:', error)
    if (error?.digest) console.error('[dashboard] error digest:', error.digest)
    if (error?.stack) console.error('[dashboard] stack:', error.stack)
  }, [error])

  const MONO = "'DM Mono',monospace"
  const SERIF = "'Cormorant Garamond',serif"
  const GOLD = '#c9a84c'

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        textAlign: 'center',
        padding: 32,
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 300, fontStyle: 'italic', color: 'var(--ink)' }}>
        Something glitched
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--ink3)', maxWidth: 420, lineHeight: 1.7 }}>
        This screen hit an unexpected error. Your account and data are safe — nothing was lost.
        Try again, and if it keeps happening the details are in the browser console.
      </div>

      {process.env.NODE_ENV !== 'production' && error?.message && (
        <pre
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: '#f87171',
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 6,
            padding: '10px 14px',
            maxWidth: 520,
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
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#050509',
            background: GOLD,
            border: 'none',
            padding: '9px 18px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.location.href = '/dashboard' }}
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            background: 'transparent',
            border: '1px solid var(--rule2)',
            padding: '9px 18px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Reload dashboard
        </button>
      </div>
    </div>
  )
}
