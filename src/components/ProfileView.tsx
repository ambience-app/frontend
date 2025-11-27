"use client";
import Image from "next/image";
import { useProfile } from "@/hooks/useProfile";

export function ProfileView({ userAddress }) {
  const { profile } = useProfile(userAddress);

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
