import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/lib/errors/errorLogger';

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
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers();
  }

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="w-full max-w-md p-6 space-y-4 bg-card rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
                <p className="text-muted-foreground">
                  {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        >
          <ErrorProvider>
            <ErrorBoundaryWrapper>
              <WebSocketProvider>
                <Providers>
                  {children}
                  <Toaster position="top-right" />
                </Providers>
              </WebSocketProvider>
            </ErrorBoundaryWrapper>
          </ErrorProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
