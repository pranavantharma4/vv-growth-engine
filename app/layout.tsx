import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from './ServiceWorkerRegister'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Match the OS status bar / PWA splash to the VV editorial base.
  themeColor: '#050509',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://vngrdvisuals.com'),
  title: 'VV – Growth Ad Engine',
  description: 'Vanguard Visuals Growth Intelligence Platform',
  // The app/manifest.ts route makes the site installable; Next auto-injects the
  // <link rel="manifest">. app/icon.tsx and app/apple-icon.tsx generate the PNG
  // favicon + apple-touch-icon; this adds the scalable SVG favicon.
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  // iOS home-screen launch: run full-screen (no Safari chrome) with the VV name.
  appleWebApp: {
    capable: true,
    title: 'VV',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}