import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { uploadToIPFS } from "@/utils/ipfs";
import { profileContract } from "@/constants/contracts";

export function useProfile() {
  const { address } = useAccount();

  /** ---------------------------
   * Get user profile
   * -------------------------- */
  const {
    data: profile,
    isLoading: loadingProfile,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ["profile", address],
    enabled: !!address,
    queryFn: async () => {
      return await useReadContract({
        ...profileContract,
        functionName: "getProfile",
        args: [address]
      });
    }
  });

  /** ---------------------------
   * Set Profile (username, bio, avatar)
   * -------------------------- */
  const { writeContractAsync } = useWriteContract();

  const {
    mutateAsync: updateProfile,
    isPending: savingProfile,
    error: profileError
  } = useMutation({
    mutationFn: async ({ username, bio, avatarFile }) => {
      let avatarCID = profile?.avatar;

      // If the user selected a new avatar, upload it
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
