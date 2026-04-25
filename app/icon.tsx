import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0a0908',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#faf8f5',
            letterSpacing: 1,
          }}
        >
          VV
        </div>
      </div>
    ),
    { ...size }
  )
}