import { ImageResponse } from 'next/og'

// PWA app icons, generated at /icons/192 and /icons/512. VV monogram in the
// Cormorant italic register (Georgia serif fallback inside the OG renderer),
// #faf8f5 on the #050509 base — matching the favicon, apple-touch-icon and app
// identity. The glyph sits at ~46% of the canvas so Android's maskable crop
// (central 80% safe zone) never clips it.
export const dynamicParams = false

export function generateStaticParams() {
  return [{ size: '192' }, { size: '512' }]
}

export function GET(_req: Request, { params }: { params: { size: string } }) {
  const size = params.size === '512' ? 512 : 192
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#050509',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: Math.round(size * 0.46),
            fontWeight: 600,
            fontStyle: 'italic',
            color: '#faf8f5',
            letterSpacing: Math.round(size * 0.012),
          }}
        >
          VV
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
