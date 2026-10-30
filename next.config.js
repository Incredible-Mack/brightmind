/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: false,
  // Lets a check build run beside `next dev` without overwriting its files (set NEXT_DIST=.next-verify)
  distDir: process.env.NEXT_DIST || '.next',
  // Guarantee the API URL is embedded in the client bundle even if .env.local
  // is read after the initial compilation (e.g. after a server restart).
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://brightmindapi.test',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.mux.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  // In-browser speech recognition (@xenova/transformers) mentions Node-only packages the browser never uses
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, sharp$: false, 'onnxruntime-node$': false }
    return config
  },
}

module.exports = nextConfig
