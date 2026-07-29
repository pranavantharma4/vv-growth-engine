import Link from 'next/link'

// Designed 404 — same dark editorial tokens as the rest of the site.
export default function NotFound() {
  return (
    <main
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
      }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: 'var(--ink3)',
          margin: 0,
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: 'clamp(32px, 5vw, 56px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          maxWidth: '20ch',
          margin: '24px 0 0',
        }}
      >
        This page doesn&rsquo;t exist. Your budget leak still&nbsp;does.
      </h1>
      <Link
        href="/"
        style={{
          marginTop: 48,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: '#050509',
          background: 'var(--gold)',
          padding: '14px 28px',
          borderRadius: 4,
          textDecoration: 'none',
        }}
      >
        Back to VV →
      </Link>
    </main>
  )
}
