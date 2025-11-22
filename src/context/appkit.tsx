// context/appkit.tsx
"use client";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia, celo, celoSepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ReactNode } from "react";

// Environment detection
const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';

// Dynamic network configuration based on environment
const mainnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [base, celo];
const testnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia, celoSepolia];

// Use appropriate networks based on environment (always ensure at least one network)
const supportedNetworks = isMainnet ? mainnetNetworks : testnetNetworks;

// 1. Get projectId at https://cloud.reown.com
// You'll need to get your own project ID from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// 2. Create a metadata object
const metadata = {
  name: 'Ambience Chat',
  description: 'Decentralized onchain messaging application',
  url:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ambience-chat.vercel.app',
  icons: [
    typeof window !== 'undefined'
      ? `${window.location.origin}/logo.png`
      : 'https://ambience-chat.vercel.app/logo.png',
  ],
};

// Log environment info for debugging (development only)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log(`🌍 AppKit Environment: ${isMainnet ? 'Mainnet' : 'Testnet'}`);
  console.log(
    `📡 Supported Networks:`,
    supportedNetworks.map((n) => n.name)
  );
}

// 3. Create the WagmiAdapter with configuration
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: projectId!,
  networks: supportedNetworks,
});

// 4. Get the wagmi config from the adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// 5. Create the AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  metadata,
  networks: supportedNetworks,
  projectId: projectId!,
  features: {
    analytics: true,
    email: false, // Disable email login for now
    socials: [], // Disable social logins for now
  },
  allWallets: 'SHOW', // Display all wallets
});

interface AppKitProps {
  children: ReactNode;
}

export function AppKit({ children }: AppKitProps) {
  return <>{children}</>;
}
