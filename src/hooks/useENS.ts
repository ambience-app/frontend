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
 * A comprehensive hook for Ethereum Name Service (ENS) resolution with caching support.
 * Provides functionality to resolve ENS names to addresses, lookup addresses to ENS names,
 * get ENS avatars, and fetch complete ENS data with intelligent caching.
 *
 * Features:
 * - Bidirectional ENS resolution (name ↔ address)
 * - Avatar resolution for both names and addresses
 * - Intelligent caching with 5-minute TTL
 * - Automatic cache cleanup and management
 * - Loading states and error handling
 * - Provider-based resolution using ethers.js
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { resolveName, lookupAddress, getAvatar, isLoading, error } = useENS();
 *
 * // Resolve ENS name to address
 * const address = await resolveName('vitalik.eth'); // '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 *
 * // Lookup address to ENS name
 * const name = await lookupAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // 'vitalik.eth'
 *
 * // Get ENS avatar
 * const avatar = await getAvatar('vitalik.eth'); // 'https://cloudflare-ipfs.com/ipfs/...'
 *
 * // Get complete ENS data
 * const ensData = await getENSData('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
 * // { name: 'vitalik.eth', address: '0x...', avatar: 'https://...' }
 * ```
 *
 * @returns {useENSReturn} Object containing ENS resolution functions and state
 * @property {ENSResolveFunction} resolveName - Resolve ENS name to Ethereum address
 * @property {ENSLuokupFunction} lookupAddress - Lookup address to ENS name
 * @property {ENSAvatarFunction} getAvatar - Get ENS avatar URL for name or address
 * @property {ENSDataFunction} getENSData - Get complete ENS data bundle
 * @property {boolean} isLoading - Loading state indicator
 * @property {Error | null} error - Current error state
 */

export function useENS() {
  const provider = useProvider();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Resolve ENS name to Ethereum address
   * @param {string} name - The ENS name to resolve (e.g., 'vitalik.eth')
   * @returns {Promise<string | null>} The Ethereum address or null if resolution fails
   */
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

  /**
   * Lookup Ethereum address to ENS name
   * @param {string} address - The Ethereum address to lookup
   * @returns {Promise<string | null>} The ENS name or null if lookup fails
   */
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

  /**
   * Get ENS avatar for either an ENS name or Ethereum address
   * @param {string} nameOrAddress - ENS name or Ethereum address
   * @returns {Promise<string | null>} Avatar URL or null if not found
   */
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
