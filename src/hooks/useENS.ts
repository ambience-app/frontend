import { useState, useEffect, useCallback } from 'react';
import { useProvider } from '@reown/appkit/react';
import { ethers } from 'ethers';

type ENSCache = {
  [key: string]: {
    name?: string | null;
    address?: string | null;
    avatar?: string | null;
    timestamp: number;
  };
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory cache
let cache: ENSCache = {};

// Clear expired cache entries
const cleanCache = () => {
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > CACHE_TTL) {
      delete cache[key];
    }
  });
};


/**
 * useENS hook
 *
 * A hook that provides ENS resolution functionality.
 * It allows resolving ENS names to addresses and vice versa,
 * and getting ENS avatar information.
 *
 * @returns {Object} An object with functions to resolve ENS names, lookup addresses, get ENS avatar, and get ENS data.
 * @property {function} resolveName - A function to resolve an ENS name to an address.
 * @property {function} lookupAddress - A function to lookup an address to an ENS name.
 * @property {function} getAvatar - A function to get an ENS avatar.
 * @property {function} getENSData - A function to get all ENS data for an address.
 * @property {boolean} isLoading - Whether the ENS data is loading.
 * @property {Error | null} error - The error object if the ENS data fails to load.
 */

export function useENS() {
  const provider = useProvider();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Resolve ENS name to address
  const resolveName = useCallback(async (name: string): Promise<string | null> => {
    if (!provider) return null;
    
    // Check cache first
    const cacheKey = `name:${name.toLowerCase()}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      return cache[cacheKey].address || null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const address = await provider.resolveName(name);
      
      // Update cache
      cache[cacheKey] = {
        name,
        address,
        timestamp: Date.now(),
      };
      
      cleanCache();
      return address;
    } catch (err) {
      console.error('Error resolving ENS name:', err);
      setError(err instanceof Error ? err : new Error('Failed to resolve ENS name'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Resolve address to ENS name
  const lookupAddress = useCallback(async (address: string): Promise<string | null> => {
    if (!provider || !ethers.isAddress(address)) return null;
    
    // Check cache first
    const cacheKey = `address:${address.toLowerCase()}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      return cache[cacheKey].name || null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const name = await provider.lookupAddress(address);
      
      // Update cache
      cache[cacheKey] = {
        name,
        address,
        timestamp: Date.now(),
      };
      
      cleanCache();
      return name;
    } catch (err) {
      console.error('Error looking up address:', err);
      setError(err instanceof Error ? err : new Error('Failed to lookup address'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Get ENS avatar
  const getAvatar = useCallback(async (nameOrAddress: string): Promise<string | null> => {
    if (!provider) return null;
    
    const cacheKey = `avatar:${nameOrAddress.toLowerCase()}`;
    if (cache[cacheKey]?.avatar && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      return cache[cacheKey].avatar || null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // If it's an address, try to resolve to name first
      let name = nameOrAddress;
      if (ethers.isAddress(nameOrAddress)) {
        name = (await lookupAddress(nameOrAddress)) || nameOrAddress;
      }
      
      const avatar = await provider.getAvatar(name);
      
      // Update cache
      cache[cacheKey] = {
        ...cache[cacheKey],
        avatar,
        timestamp: Date.now(),
      };
      
      cleanCache();
      return avatar;
    } catch (err) {
      console.error('Error getting avatar:', err);
      setError(err instanceof Error ? err : new Error('Failed to get avatar'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [provider, lookupAddress]);

  // Get all ENS data for an address
  const getENSData = useCallback(async (address: string) => {
    if (!provider || !ethers.isAddress(address)) return null;
    
    const cacheKey = `address:${address.toLowerCase()}`;
    const cachedData = cache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return {
        name: cachedData.name,
        address: cachedData.address,
        avatar: cachedData.avatar || null,
      };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const name = await lookupAddress(address);
      const avatar = name ? await getAvatar(name) : null;
      
      // Update cache
      cache[cacheKey] = {
        name,
        address,
        avatar,
        timestamp: Date.now(),
      };
      
      cleanCache();
      return { name, address, avatar };
    } catch (err) {
      console.error('Error getting ENS data:', err);
      setError(err instanceof Error ? err : new Error('Failed to get ENS data'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [provider, lookupAddress, getAvatar]);

  return {
    resolveName,
    lookupAddress,
    getAvatar,
    getENSData,
    isLoading,
    error,
  };
}

export default useENS;
