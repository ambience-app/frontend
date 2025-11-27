import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Address, isAddress } from 'viem';
import { useENS } from './useENS';
import { useTransaction } from '@/context/TransactionContext';

type Profile = {
  address: Address;
  name?: string | null;
  avatar?: string | null;
  bio?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  lastUpdated?: number;
};

type ProfileUpdate = Omit<Partial<Profile>, 'address' | 'lastUpdated'>;

// In-memory cache for profiles
const profileCache = new Map<string, Profile>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear expired cache entries
const cleanProfileCache = () => {
  const now = Date.now();
  for (const [key, profile] of profileCache.entries()) {
    if (now - (profile.lastUpdated || 0) > CACHE_TTL) {
      profileCache.delete(key);
    }
  }
};

/**
 * useUserProfile hook
 *
 * A hook that provides user profile functionality.
 * It allows fetching user profile data from the blockchain and IPFS,
 * and updating the user profile.
 *
 * @returns {Object} An object with functions to fetch user profile data, update user profile, and refresh user profile.
 * @property {Profile | null} profile - The current user profile.
 * @property {boolean} isLoading - Whether the profile is loading.
 * @property {Error | null} error - The error object if the profile fails to load.
 * @property {boolean} isOwner - Whether the current user is the profile owner.
 * @property {function} updateProfile - A function to update the user profile.
 * @property {function} refreshProfile - A function to refresh the user profile.
 */

// Remove unused type
// type UseUserProfileProps = {
//   addressOrName?: string | null;
// };

export function useUserProfile(addressOrName?: string | null) {
  const { address: connectedAddress } = useAccount();
  // Remove unused publicClient
  // const publicClient = usePublicClient();
  const { executeTransaction } = useTransaction();
  const { ensName: resolvedENS, loading: ensLoading, error: ensError } = useENS();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Resolve address from ENS name if needed
  const resolveAddress = useCallback(async (input: string): Promise<Address | null> => {
    if (!input) return null;
    
    // If it's already a valid address, return it
    if (isAddress(input)) {
      return input as Address;
    }
    
    // For ENS resolution, we would need to implement this properly
    // For now, we'll just return null as we don't have the full implementation
    console.warn('ENS name resolution not fully implemented');
    return null;
  }, []);

  // Fetch profile from blockchain and IPFS
  const fetchProfile = useCallback(async (address: Address): Promise<Profile | null> => {
    if (!address || !isAddress(address)) return null;
    
    const cacheKey = address.toLowerCase();
    const cachedProfile = profileCache.get(cacheKey);
    
    // Return cached profile if it's still valid
    if (cachedProfile && (Date.now() - (cachedProfile.lastUpdated || 0) < CACHE_TTL)) {
      return cachedProfile;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Note: ENS data resolution would go here
      
      // TODO: Fetch additional profile data from your smart contract or IPFS
      // This is a placeholder - replace with your actual implementation
      const additionalData = {};
      
      // Note: ENS data resolution would go here
      // For now, we'll just use the basic profile data
      const profileData: Profile = {
        address,
        name: undefined,
        avatar: undefined,
        ...cachedProfile,
        lastUpdated: Date.now(),
      };
      
      // Update cache
      profileCache.set(cacheKey, profileData);
      cleanProfileCache();
      
      return profileData;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!connectedAddress) {
      throw new Error('No connected wallet');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would call a contract method to update the profile
      // For now, we'll just update the local cache
      const cacheKey = connectedAddress.toLowerCase();
      const currentProfile = profileCache.get(cacheKey) || { address: connectedAddress };
      
      const updatedProfile: Profile = {
        ...currentProfile,
        ...updates,
        lastUpdated: Date.now(),
      };
      
      // Update cache
      profileCache.set(cacheKey, updatedProfile);
      setProfile(updatedProfile);
      
      // TODO: Call contract method to update profile on-chain
      // Example:
      /*
      await executeTransaction(
        () => profileContract.write.updateProfile(updatedProfile),
        {
          pending: 'Updating profile...',
          success: 'Profile updated!',
          error: 'Failed to update profile',
        }
      );
      */
      
      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connectedAddress]); // Remove executeTransaction from dependencies as it's not used

  // Load profile when address/name changes
  useEffect(() => {
    const loadProfile = async () => {
      if (!addressOrName && !connectedAddress) {
        setProfile(null);
        return;
      }
      
      try {
        const targetAddress = addressOrName || connectedAddress;
        if (!targetAddress) return;
        
        // Resolve to address if it's an ENS name
        const address = await resolveAddress(targetAddress);
        if (!address) {
          setProfile(null);
          return;
        }
        
        const profileData = await fetchProfile(address);
        setProfile(profileData);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err : new Error('Failed to load profile'));
      }
    };
    
    loadProfile();
  }, [addressOrName, connectedAddress, fetchProfile, resolveAddress]);

  // Check if the current user is the profile owner
  const isOwner = useMemo(() => {
    if (!profile || !connectedAddress) return false;
    return profile.address.toLowerCase() === connectedAddress.toLowerCase();
  }, [profile, connectedAddress]);

  return {
    profile,
    isLoading,
    error,
    isOwner,
    updateProfile,
    refreshProfile: () => profile && fetchProfile(profile.address),
  };
}

export default useUserProfile;
