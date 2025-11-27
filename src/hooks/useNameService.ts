import { useCallback, useState } from 'react';
import { Address, isAddress } from 'viem';
import { useENS } from './useENS';
import useBasename from './useBasename';

type NameServiceResult = {
  name: string | null;
  address: string | null;
  avatar: string | null;
  isENS: boolean;
  isBasename: boolean;
  loading: boolean;
  error: Error | null;
};

export function useNameService() {
  const { ensName: ensLookup, loading: ensLoading, error: ensError } = useENS();
  // Note: resolveBasename and lookupBasename are used in the resolveName and lookupAddress functions
  const { resolveName: resolveBasename, lookupAddress: lookupBasename, isSupported: isBasenameSupported } = useBasename?.() || {};
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Resolve name to address with fallback
  const resolveName = useCallback(
    async (name: string): Promise<NameServiceResult> => {
      if (!name) return { 
        name: null, 
        address: null, 
        avatar: null, 
        isENS: false, 
        isBasename: false, 
        loading: false, 
        error: null 
      };
      
      // If it's already an address, just return it
      if (isAddress(name)) {
        return { 
          name: null, 
          address: name as Address, 
          avatar: null, 
          isENS: false, 
          isBasename: false, 
          loading: false, 
          error: null 
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try Basename first if supported
        if (isBasenameSupported && resolveBasename) {
          const basenameAddress = await resolveBasename(name);
          if (basenameAddress) {
            return {
              name,
              address: basenameAddress,
              avatar: null, // TODO: Add avatar support if needed
              isENS: false,
              isBasename: true,
              loading: false,
              error: null
            };
          }
        }

        // For now, we'll just return the name as we don't have a way to resolve ENS names
        // without the full implementation
        return { 
          name, 
          address: null, 
          avatar: null, 
          isENS: false, 
          isBasename: false, 
          loading: false, 
          error: new Error('Name resolution not fully implemented') 
        };
      } catch (err) {
        console.error('Error resolving name:', err);
        const error = err instanceof Error ? err : new Error('Failed to resolve name');
        setError(error);
        return { 
          name: null, 
          address: null, 
          avatar: null, 
          isENS: false, 
          isBasename: false, 
          loading: false, 
          error 
        };
      } finally {
        setIsLoading(false);
      }
    },
    [isBasenameSupported, resolveBasename]
  );

  // Resolve address to name with fallback
  const lookupAddress = useCallback(
    async (address: string): Promise<NameServiceResult> => {
      if (!address || !isAddress(address)) {
        return { 
          name: null, 
          address: null, 
          avatar: null, 
          isENS: false, 
          isBasename: false, 
          loading: false, 
          error: null 
        };
      }
      
      // Ensure address is checksummed for consistent caching
      address = address as Address;

      setIsLoading(true);
      setError(null);

      try {
        // Try Basename first if supported
        if (isBasenameSupported && lookupBasename) {
          const basename = await lookupBasename(address);
          if (basename) {
            return {
              name: basename,
              address,
              avatar: null, // TODO: Add avatar support if needed
              isENS: false,
              isBasename: true,
              loading: false,
              error: null
            };
          }
        }

        // Use the ENS name from the useENS hook if available
        if (ensLookup) {
          return {
            name: ensLookup,
            address,
            avatar: null, // TODO: Add avatar support if needed
            isENS: true,
            isBasename: false,
            loading: false,
            error: null
          };
        }

        return { 
          name: null, 
          address, 
          avatar: null, 
          isENS: false, 
          isBasename: false, 
          loading: false, 
          error: null 
        };
      } catch (err) {
        console.error('Error looking up address:', err);
        const error = err instanceof Error ? err : new Error('Failed to lookup address');
        setError(error);
        return { 
          name: null, 
          address, 
          avatar: null, 
          isENS: false, 
          isBasename: false, 
          loading: false, 
          error 
        };
      } finally {
        setIsLoading(false);
      }
    },
    [ensLookup, isBasenameSupported, lookupBasename, resolveBasename, resolveName]
  );

  return {
    resolveName,
    lookupAddress,
    isLoading: isLoading || ensLoading,
    error: error || ensError || null,
  };
}

export default useNameService;
