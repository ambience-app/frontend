"use client";
import Image from "next/image";
import { useProfile } from "@/hooks/useProfile";

/**
 * ProfileView component
 *
 * Displays the current user's profile information including avatar, username, and bio.
 * Used to show user profile details in a clean, card-like format.
 *
 * Features:
 * - Displays current user's profile from their wallet address
 * - Conditional avatar display with fallback
 * - IPFS integration for decentralized avatar storage
 * - Responsive design with proper spacing
 * - Loading and empty states handling
 *
 * @component
 *
 * @example
 * ```tsx
 * // Display current user's profile
 * <ProfileView />
 *
 * // With custom styling
 * <div className="bg-white rounded-lg shadow">
 *   <ProfileView />
 * </div>
 * ```
 *
 * @returns {JSX.Element} A profile card with avatar, username, and bio
 */
export function ProfileView() {
  const { profile, loadingProfile } = useProfile();

  if (loadingProfile) {
    return <div className="flex gap-4 items-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
      <div>
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
      </div>
    </div>;
  }

  if (!profile || !Array.isArray(profile) || profile.length === 0) {
    return <p className="text-muted-foreground">No profile found.</p>;
  }

  const profileData = Array.isArray(profile) ? profile[0] : null;
  
  if (!profileData) {
    return <p className="text-muted-foreground">No profile data available.</p>;
  }

  return (
    <div className="flex gap-4 items-center">
      {profileData[2] && ( // avatar is at index 2 in the returned array
        <Image
          src={`https://ipfs.io/ipfs/${profileData[2]}`}
          alt="avatar"
          width={64}
          height={64}
          className="rounded-full"
        />
      )}

      <div>
        <h2 className="text-lg font-semibold">{profileData[0] || "Anonymous User"}</h2> {/* username at index 0 */}
        <p className="text-sm text-muted-foreground">{profileData[1] || "No bio available"}</p> {/* bio at index 1 */}
      </div>
    </div>
  );
}
