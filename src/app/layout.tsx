import dynamic from 'next/dynamic';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Lazy load non-critical components
const Toaster = dynamic(() => import('@/components/ui/sonner').then(mod => mod.Toaster), { 
  ssr: false 
});

const Providers = dynamic(() => import('@/components/Providers'), {
  ssr: true,
  loading: () => <div className="min-h-screen w-full" />
});

const PlausibleProvider = dynamic(() => import('next-plausible').then(mod => mod.default), {
  ssr: true
});

const ErrorBoundaryWrapper = dynamic(() => import('@/components/ErrorBoundaryWrapper'), {
  ssr: true
});

const WebSocketProvider = dynamic(() => import('@/context/WebSocketContext').then(mod => mod.WebSocketProvider), {
  ssr: false
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ambience Chat - Decentralized Onchain Messaging',
  description:
    'Experience the future of messaging with Ambience — a fully decentralized chat application where every message is stored onchain, ensuring immutability, transparency, and true ownership. Built on Base blockchain.',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  openGraph: {
    title: 'Ambience Chat',
    description: 'Decentralized onchain messaging on Base',
    url: 'https://ambience-chat.vercel.app',
    siteName: 'Ambience Chat',
    images: [
      {
        url: '/globe.svg',
        width: 1200,
        height: 630,
        alt: 'Ambience Chat',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ambience Chat',
    description: 'Decentralized onchain messaging on Base',
    images: ['/globe.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain =
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'ambience-chat.vercel.app';
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PlausibleProvider domain="ambience-chat.vercel.app" trackOutboundLinks>
          <ErrorBoundaryWrapper>
            <WebSocketProvider>
              <Providers>
                {children}
              </Providers>
            </WebSocketProvider>
          </ErrorBoundaryWrapper>
        </PlausibleProvider>
      </body>
    </html>
  );
}
