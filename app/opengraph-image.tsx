import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'VV — Know what your money is doing.'

// Root OG image, applied to every route. #050509 field, VV monogram, and the
// hero line in a serif register (Georgia fallback in the OG renderer).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#050509',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 92,
            fontWeight: 600,
            fontStyle: 'italic',
            color: '#faf8f5',
            letterSpacing: 3,
          }}
        >
          VV
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontFamily: 'Georgia, serif',
            fontSize: 68,
            fontWeight: 400,
            color: 'rgba(250,248,245,0.92)',
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          <span>Know what your money&nbsp;</span>
          <span style={{ color: '#c9a84c' }}>is doing.</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'monospace',
            fontSize: 22,
            letterSpacing: 3,
            color: 'rgba(250,248,245,0.32)',
          }}
        >
          <div>META ADS INTELLIGENCE</div>
          <div>vngrdvisuals.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
