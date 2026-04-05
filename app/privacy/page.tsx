export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px', fontFamily: "'DM Sans', sans-serif", color: '#1a1816' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 40 }}>Last updated: April 2026</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>1. Data We Collect</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>VV Growth Ad Engine collects advertising performance data from connected ad platforms (Meta Ads, Google Ads) including campaign spend, impressions, clicks, conversions, and revenue. We also collect account information necessary to provide our service.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>2. How We Use Your Data</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>Your advertising data is used solely to generate campaign performance reports, health classifications, and AI-powered recommendations within the VV Growth Ad Engine platform. We do not sell, share, or resell your data to third parties.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>3. Data Storage & Security</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>All data is stored securely using industry-standard AES-256 encryption. Access tokens are stored encrypted and never exposed to unauthorized parties. We use Supabase for secure database management with row-level security enabled on all tables.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>4. Third-Party Platforms</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>We access Meta Ads and Google Ads data only with your explicit authorization through OAuth. We request read-only access where possible and never modify your campaigns without your explicit instruction through the platform.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>5. Data Deletion</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>You may request deletion of your data at any time by contacting us at agency.vanguardia@gmail.com. Upon request, all your data including access tokens, campaign snapshots, and account information will be permanently deleted within 30 days.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>6. Contact</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>For privacy-related questions, contact Vanguard Visuals at agency.vanguardia@gmail.com.</p>
    </div>
  )
}