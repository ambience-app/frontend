
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import PlausibleProvider from "next-plausible";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { WebSocketProvider } from "@/context/WebSocketContext";
import AccessibilityInitializer from "@/components/AccessibilityInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ambience Chat - Decentralized Onchain Messaging",
  description: "Experience the future of messaging with Ambience — a fully decentralized chat application where every message is stored onchain, ensuring immutability, transparency, and true ownership. Built on Base blockchain.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  openGraph: {
    title: "Ambience Chat",
    description: "Decentralized onchain messaging on Base",
    url: "https://ambience-chat.vercel.app",
    siteName: "Ambience Chat",
    images: [
      {
        url: "/globe.svg",
        width: 1200,
        height: 630,
        alt: "Ambience Chat",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambience Chat",
    description: "Decentralized onchain messaging on Base",
    images: ["/globe.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "ambience-chat.vercel.app";
  
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Skip navigation for screen readers */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .skip-nav-link {
              position: absolute;
              top: -40px;
              left: 6px;
              background: #2563eb;
              color: white;
              padding: 8px 16px;
              text-decoration: none;
              border-radius: 4px;
              z-index: 100;
              transition: top 0.3s ease;
            }
            .skip-nav-link:focus {
              top: 6px;
            }
            .sr-only {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
          `
        }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PlausibleProvider domain="ambience-chat.vercel.app" trackOutboundLinks>
          <ErrorBoundaryWrapper>
            <WebSocketProvider>
              <Providers>
                {/* Skip navigation links for accessibility */}
                <a href="#main-content" className="skip-nav-link">
                  Skip to main content
                </a>
                <a href="#navigation" className="skip-nav-link" style={{ top: '50px' }}>
                  Skip to navigation
                </a>
                
                <AccessibilityInitializer />
                
                {/* Live region for dynamic content announcements */}
                <div 
                  id="live-region" 
                  className="sr-only" 
                  aria-live="polite" 
                  aria-atomic="true"
                ></div>
                
                <header role="banner">
                  {/* Header content will be handled by individual page components */}
                </header>
                
                <nav id="navigation" role="navigation" aria-label="Main navigation">
                  {/* Navigation will be handled by individual page components */}
                </nav>
                
                <main id="main-content" role="main" tabIndex={-1}>
                  {children}
                </main>
                
                <footer role="contentinfo">
                  {/* Footer content will be handled by individual page components */}
                </footer>
              </Providers>
            </WebSocketProvider>
          </ErrorBoundaryWrapper>
        </PlausibleProvider>
      </body>
    </html>
  );
}
