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
  const { profile } = useProfile();

  if (!profile) return <p> No profile found for this user.</p>;

  return (
    <div className="flex gap-4 items-center">
      {profile.avatar && (
        <Image
          src={`https://ipfs.io/ipfs/${profile.avatar}`}
          alt="avatar"
          width={64}
          height={64}
          className="rounded-full"
        />
      )}

      <div>
        <h2 className="text-lg font-semibold">{profile.username}</h2>
        <p className="text-sm text-muted-foreground">{profile.bio}</p>
      </div>
    </div>
  );
}
