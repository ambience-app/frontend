import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { normalize } from 'viem/ens';
import { uploadToIPFS } from "@/utils/ipfs";
import { profileContract } from "@/constants/contracts";
import { Profile } from "@/types/profile";

export function useProfile(addressParam?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const address = addressParam || connectedAddress;

  /**
   * Resolve ENS name for an address
   */
  const resolveEnsName = async (address: string) => {
    try {
      const name = await publicClient?.getEnsName({ address: address as `0x${string}` });
      return name || null;
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      return null;
    }
  };

  /**
   * Generate avatar URL from address or ENS name
   */
  const getAvatarUrl = (address: string, ensName?: string) => {
    if (ensName) {
      return `https://metadata.ens.domains/mainnet/avatar/${ensName}`;
    }
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
  };

  /**
   * Fetch profile data
   */
  const fetchProfile = async (): Promise<Profile | null> => {
    if (!address) return null;

    try {
      // Get ENS name
      const ensName = await resolveEnsName(address);
      
      // Get profile data from contract
      const profileData = await publicClient.readContract({
        ...profileContract,
        functionName: "getProfile",
        address: address as `0x${string}`,
      });

      // Generate avatar URL
      const avatar = getAvatarUrl(address, ensName || undefined);

      return {
        address,
        ensName: ensName || undefined,
        avatar,
        bio: profileData?.bio || '',
        website: profileData?.website || '',
        twitter: profileData?.twitter || '',
        discord: profileData?.discord || '',
        joinedDate: profileData?.joinedDate ? new Date(Number(profileData.joinedDate) * 1000) : new Date(),
        lastSeen: new Date(),
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Return a basic profile with just the address if contract call fails
      return {
        address,
        avatar: getAvatarUrl(address),
        joinedDate: new Date(),
        lastSeen: new Date(),
      };
    }
  };

  // Main profile query
  const {
    data: profile,
    isLoading: loadingProfile,
    error,
    refetch: refetchProfile
  } = useQuery<Profile | null>({
    queryKey: ["profile", address],
    enabled: !!address,
    queryFn: fetchProfile,
  });

  /**
   * Update profile
   */
  const { writeContractAsync } = useWriteContract();

  const {
    mutateAsync: updateProfile,
    isPending: savingProfile,
    error: profileError
  } = useMutation({
    mutationFn: async ({ 
      bio, 
      website, 
      twitter, 
      discord, 
      avatarFile 
    }: {
      bio?: string;
      website?: string;
      twitter?: string;
      discord?: string;
      avatarFile?: File;
    }) => {
      if (!address) throw new Error('No wallet connected');

      let avatarUrl = profile?.avatar;

      // Upload new avatar to IPFS if provided
      if (avatarFile) {
        const { cid } = await uploadToIPFS(avatarFile);
        avatarCID = cid;
      }

      return await writeContractAsync({
        ...profileContract,
        functionName: "setProfile",
        args: [username, bio, avatarCID]
      });
    },
    onSuccess: () => {
      refetchProfile();
    }
  });

  return {
    profile,
    loadingProfile,
    savingProfile,
    profileError,
    updateProfile,
    refetchProfile
  };
}
