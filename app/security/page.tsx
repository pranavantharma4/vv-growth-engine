import SecurityClient from './SecurityClient'

export const metadata = {
  title: 'Security — Vanguard Visuals',
  description:
    'VV requests read-only access to your Meta ad account. We can see your data. We cannot change your campaigns.',
}

export default function SecurityPage() {
  return <SecurityClient />
}
