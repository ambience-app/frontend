import { useState, useCallback } from 'react';
import { Address, isAddress } from 'viem';
import { usePublicClient } from 'wagmi';

type BasenameResult = {
  name: string | null;
  address: Address | null;
  timestamp: number;
};

// Base Name Service contract addresses (mainnet and testnet)
const BASENAME_REGISTRY = {
  // Base Mainnet
  8453: '0x1c8a2FbCbE2194910f35D00C87eD5c25f35f7187',
  // Base Sepolia
  84532: '0x1c8a2FbCbE2194910f35D00C87eD5c25f35f7187', // Same address for testnet in this example
} as const;

// ABI for the Basename registry (simplified for name resolution)
const BASENAME_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'getNames',
    outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'name', type: 'string' }],
    name: 'getAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

type BasenameCache = Record<string, BasenameResult>;

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory cache
let cache: BasenameCache = {};

// Clear expired cache entries
const cleanCache = () => {
  const now = Date.now();
  Object.keys(cache).forEach((key) => {
    if (now - cache[key].timestamp > CACHE_TTL) {
      delete cache[key];
    }
  });
};

export function useBasename() {
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get Basename registry address for current chain
  const getBasenameRegistry = useCallback(() => {
    if (!publicClient?.chain?.id) return null;
    return BASENAME_REGISTRY[publicClient.chain.id as keyof typeof BASENAME_REGISTRY] || null;
  }, [publicClient?.chain?.id]);

  // Resolve Basename to address
  const resolveName = useCallback(
    async (name: string): Promise<Address | null> => {
      const registry = getBasenameRegistry();
      if (!publicClient || !registry || !name) return null;

      const cacheKey = `name:${name.toLowerCase()}`;
      const cached = cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.address;
      }

      try {
        setIsLoading(true);
        setError(null);

        const address = (await publicClient.readContract({
          address: registry as Address,
          abi: BASENAME_ABI,
          functionName: 'getAddress',
          args: [name],
        })) as Address;

        // Update cache
        cache[cacheKey] = {
          name,
          address,
          timestamp: Date.now(),
        };

        cleanCache();
        return address === '0x0000000000000000000000000000000000000000' ? null : address;
      } catch (err) {
        console.error('Error resolving Basename:', err);
        setError(err instanceof Error ? err : new Error('Failed to resolve Basename'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient, getBasenameRegistry]
  );

  // Resolve address to Basename
  const lookupAddress = useCallback(
    async (address: string): Promise<string | null> => {
      const registry = getBasenameRegistry();
      if (!publicClient || !registry || !isAddress(address)) return null;

      const cacheKey = `address:${address.toLowerCase()}`;
      const cached = cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.name;
      }

      try {
        setIsLoading(true);
        setError(null);

        const names = (await publicClient.readContract({
          address: registry as Address,
          abi: BASENAME_ABI,
          functionName: 'getNames',
          args: [address],
        })) as string[];

        const name = names?.[0] || null;

        // Update cache
        if (name) {
          cache[cacheKey] = {
            name,
            address: address as Address,
            timestamp: Date.now(),
          };
          cleanCache();
        }

        return name;
      } catch (err) {
        console.error('Error looking up Basename:', err);
        setError(err instanceof Error ? err : new Error('Failed to lookup Basename'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient, getBasenameRegistry]
  );

  return {
    resolveName,
    lookupAddress,
    isLoading,
    error,
    isSupported: !!getBasenameRegistry(),
  };
}

export default useBasename;
