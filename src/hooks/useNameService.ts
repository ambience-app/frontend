import { useCallback, useState } from 'react';
import { Address, isAddress } from 'viem';
import useENS from './useENS';
import useBasename from './useBasename';

type NameServiceResult = {
  name: string | null;
  address: string | null;
  avatar: string | null;
  isENS: boolean;
  isBasename: boolean;
};

type NameServiceResult = {
  name: string | null;
  address: string | null;
  avatar: string | null;
  isENS: boolean;
  isBasename: boolean;
};

export function useNameService() {
  const { resolveName: resolveENS, lookupAddress: lookupENS, getAvatar } = useENS();
  const { resolveName: resolveBasename, lookupAddress: lookupBasename, isSupported: isBasenameSupported } = useBasename();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Resolve name to address with fallback
  const resolveName = useCallback(
    async (name: string): Promise<NameServiceResult> => {
      if (!name) return { name: null, address: null, avatar: null, isENS: false, isBasename: false };
      
      // If it's already an address, just format it
      if (isAddress(name)) {
        const result = await lookupAddress(name);
        return result;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try Basename first if supported
        if (isBasenameSupported) {
          const basenameAddress = await resolveBasename(name);
          if (basenameAddress) {
            return {
              name,
              address: basenameAddress,
              avatar: await getAvatar(name),
              isENS: false,
              isBasename: true,
            };
          }
        }

        // Fallback to ENS
        const ensAddress = await resolveENS(name);
        if (ensAddress) {
          return {
            name,
            address: ensAddress,
            avatar: await getAvatar(name),
            isENS: true,
            isBasename: false,
          };
        }

        return { name: null, address: null, avatar: null, isENS: false, isBasename: false };
      } catch (err) {
        console.error('Error resolving name:', err);
        setError(err instanceof Error ? err : new Error('Failed to resolve name'));
        return { name: null, address: null, avatar: null, isENS: false, isBasename: false };
      } finally {
        setIsLoading(false);
      }
    },
    [resolveENS, resolveBasename, getAvatar, isBasenameSupported]
  );

  // Resolve address to name with fallback
  const lookupAddress = useCallback(
    async (address: string): Promise<NameServiceResult> => {
      if (!address || !isAddress(address)) {
        return { name: null, address: null, avatar: null, isENS: false, isBasename: false };
      }
      
      // Ensure address is checksummed for consistent caching
      address = address as Address;

      try {
        setIsLoading(true);
        setError(null);

        // Try Basename first if supported
        if (isBasenameSupported) {
          const basename = await lookupBasename(address);
          if (basename) {
            return {
              name: basename,
              address,
              avatar: await getAvatar(basename),
              isENS: false,
              isBasename: true,
            };
          }
        }

        // Fallback to ENS
        const ensName = await lookupENS(address);
        if (ensName) {
          return {
            name: ensName,
            address,
            avatar: await getAvatar(ensName),
            isENS: true,
            isBasename: false,
          };
        }

        // If no name found, return address with no name
        return { name: null, address, avatar: null, isENS: false, isBasename: false };
      } catch (err) {
        console.error('Error looking up address:', err);
        setError(err instanceof Error ? err : new Error('Failed to lookup address'));
        return { name: null, address, avatar: null, isENS: false, isBasename: false };
      } finally {
        setIsLoading(false);
      }
    },
    [lookupENS, lookupBasename, getAvatar, isBasenameSupported]
  );

  // Format address with optional ENS/Basename
  const formatAddress = useCallback(
    async (address: string, truncate = true): Promise<string> => {
      if (!address) return '';
      
      // If it's a valid address, try to resolve it
      if (isAddress(address)) {
        const { name } = await lookupAddress(address);
        if (name) return name;
        return truncate ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
      }
      
      // If it's not an address but might be a name, try to resolve it
      try {
        const result = await resolveName(address);
        if (result.name) return result.name;
      } catch (e) {
        console.error('Error resolving name:', e);
      }
      
      // Return as is if resolution fails
      return address;
    },
    [lookupAddress]
  );

  return {
    resolveName,
    lookupAddress,
    formatAddress,
    isLoading,
    error,
  };
}

export default useNameService;
