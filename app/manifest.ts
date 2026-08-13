import type { MetadataRoute } from 'next'

// PWA web app manifest. Next.js serves this at /manifest.webmanifest and auto-
// injects <link rel="manifest"> into every route's <head>. VV identity: the
// dark editorial base (#050509) is both theme + background so the OS splash and
// status bar match the app. Icons are generated on the fly by the ImageResponse
// route handlers under app/icons/* (VV monogram, Cormorant italic).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vanguard Visuals',
    short_name: 'VV',
    description: 'VV Growth Ad Engine — read-only Meta ad intelligence.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050509',
    theme_color: '#050509',
    orientation: 'portrait',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Maskable copies let Android crop to its adaptive-icon shape without
      // clipping the monogram (the generator keeps ample padding).
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
