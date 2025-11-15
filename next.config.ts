import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * 3. Bundle Analysis
 * To enable bundle analysis:
 * 1. Install: npm install --save-dev @next/bundle-analyzer
 * 2. Wrap config with: const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
 * 3. Export: export default withBundleAnalyzer(nextConfig)
 * 4. Run: ANALYZE=true npm run build
 */

const nextConfig: NextConfig = {
  // 1. Image Domain Configuration
  // Support for wallet icon image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.walletconnect.com",
      },
      {
        protocol: "https",
        hostname: "**.walletconnect.org",
      },
      {
        protocol: "https",
        hostname: "**.reown.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.infura-ipfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ipfs.io",
      },
    ],
  },

  // 2. Webpack Configuration
  // Adjustments for wagmi library compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // 4. Security Headers
  // Content Security Policy, X-Frame-Options, and related protections
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: [
              "geolocation=()",
              "microphone=()",
              "camera=()",
              "fullscreen=(self)",
            ].join(", "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://verify.walletconnect.com https://verify.walletconnect.org https://rpc.walletconnect.com https://rpc.walletconnect.org",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss: blob:",
              "frame-ancestors 'self'",
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // 5. Compression
  // Enable response compression
  compress: true,

  // Turbopack configuration for Next.js 16
  turbopack: {},
};

const withPWAConfigured = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});

export default withSentryConfig(withPWAConfigured(nextConfig), {
  silent: true,
});
