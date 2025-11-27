"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AppKit, wagmiConfig } from "@/context/appkit";
import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

/**
 * Providers component
 *
 * Wraps the entire application with all required global providers,
 * including:
 * - WagmiProvider for Web3 wallet & blockchain configuration
 * - QueryClientProvider for React Query state management
 * - ThemeProvider for UI theme control
 * - AppKit custom provider for additional app context
 *
 * Ensures global contexts are available across the app for
 * blockchain interactions, data fetching, caching, and theming.
 *
 * @param {{ children: React.ReactNode }} props - Nested React components.
 * @returns {JSX.Element} Application wrapped in necessary context providers.
 */

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AppKit>{children}</AppKit>
          </ThemeProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </I18nextProvider>
  );
}

