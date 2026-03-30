/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ofqnhlkjazlsfctldbng.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcW5obGtqYXpsc2ZjdGxkYm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU0OTYsImV4cCI6MjA4OTA4MTQ5Nn0.abff7Fdqidvcg8hs0c5Gz7fO0cGmgVPxbrrRlpZ-sws',
  },
}
module.exports = nextConfig
