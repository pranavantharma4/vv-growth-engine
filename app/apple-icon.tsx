import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// VV monogram — Cormorant italic register (Georgia serif fallback in the OG
// renderer), #faf8f5 on #050509, matching the favicon and app identity.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#050509',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 96,
            fontWeight: 600,
            fontStyle: 'italic',
            color: '#faf8f5',
            letterSpacing: 2,
          }}
        >
          VV
        </div>
      </div>
    ),
    { ...size }
  )
}
