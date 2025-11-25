import type { NextConfig } from "next";
// Disable type checking for these imports to avoid conflicts
// @ts-ignore
import withPWA from "next-pwa";
// @ts-ignore
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  compress: true,
};

// Configure PWA
const withPWAContent = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// Apply PWA configuration to nextConfig
const configWithPWA = withPWAContent(nextConfig);

// Apply Sentry configuration
const configWithSentry = withSentryConfig(configWithPWA, {
  silent: true,
});

export default configWithSentry;