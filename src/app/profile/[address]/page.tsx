import { notFound } from 'next/navigation';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage({
  params,
}: {
  params: { address: string };
}) {
  const { profile, isLoading, error } = useProfile(params.address as `0x${string}`);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-8">
      <ProfileCard profile={profile} className="w-full" />
    </div>
  );
}
