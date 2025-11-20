"use client";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

export function ProfileForm() {
  const { profile, updateProfile, savingProfile } = useProfile();
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatar, setAvatar] = useState<File | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({ username, bio, avatarFile: avatar });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <textarea
        className="input"
        placeholder="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatar(e.target.files?.[0] || null)}
      />

      <Button disabled={savingProfile}>
        {savingProfile ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
