import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VV Ad Vision Drop — Free 60-Second Meta Ads Audit',
  description:
    'Connect your Meta Ads account. VAI analyzes every campaign. See exactly where your budget is bleeding — and exactly what to do about it. Free, read-only, 60 seconds.',
  openGraph: {
    title: 'Find out exactly how much your Meta ads are wasting.',
    description: 'Free 60-second VAI audit of your Meta Ads account.',
  },
}

export default function VisionDropLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#050509', color: '#faf8f5' }}>
      {children}
    </div>
  )
}
