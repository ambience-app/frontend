"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AppKit, wagmiConfig } from "@/context/appkit";
import { useState } from "react";
import { ThemeProvider } from "next-themes";

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

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppKit>{children}</AppKit>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

