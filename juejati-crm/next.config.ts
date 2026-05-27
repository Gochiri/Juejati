import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GHL_LOCATION_ID: process.env.GHL_LOCATION_ID,
  },
  images: {
    remotePatterns: [
      // Tokko Broker CDN (fotos de propiedades)
      { protocol: 'https', hostname: '*.tokkobroker.com' },
      { protocol: 'https', hostname: 'tokkobroker.com' },
      // GHL / LeadConnector assets
      { protocol: 'https', hostname: '*.leadconnectorhq.com' },
      { protocol: 'https', hostname: '*.gohighlevel.com' },
      // Supabase Storage
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}
export default nextConfig
