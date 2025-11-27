// src/hooks/useENS.ts
import { useState, useEffect, useCallback } from 'react';
import { Address, isAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { useAccount, usePublicClient } from 'wagmi';

type ENSCache = {
  [key: string]: string | null;
};

const cache: ENSCache = {};

export function useENS(address?: string | null) {
  const provider = usePublicClient();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolveENS = useCallback(async (addr: string) => {
    if (cache[addr] !== undefined) {
      return cache[addr];
    }

    try {
      setLoading(true);
      const name = await provider.lookupAddress(addr);
      cache[addr] = name;
      return name;
    } catch (err) {
      console.error('Error resolving ENS:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    if (!address) return;

    const fetchENS = async () => {
      const name = await resolveENS(address);
      if (name) {
        setEnsName(name);
      }
    };

    fetchENS();
  }, [address, resolveENS]);

  return { ensName, loading, error };
}