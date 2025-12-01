import { Profile } from '@/types/profile';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileAddress } from './ProfileAddress';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, MessageSquare, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface ProfileCardProps {
  profile: Profile;
  className?: string;
  showActions?: boolean;
}

export function ProfileCard({ profile, className = '', showActions = true }: ProfileCardProps) {
  const socialLinks = [
    profile.website && { name: 'Website', url: profile.website },
    profile.twitter && { name: 'Twitter', url: `https://twitter.com/${profile.twitter.replace('@', '')}` },
    profile.discord && { name: 'Discord', url: `https://discord.com/users/${profile.discord}` },
  ].filter(Boolean) as Array<{ name: string; url: string }>;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <ProfileAvatar 
              address={profile.address} 
              ensName={profile.ensName} 
              size="lg"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {profile.ensName || 'Anonymous User'}
              </h2>
              <ProfileAddress 
                address={profile.address} 
                ensName={profile.ensName}
                className="mt-1"
                truncate={false}
              />
              {profile.joinedDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Joined {formatDistanceToNow(profile.joinedDate, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {profile.bio && (
        <CardContent>
          <p className="text-foreground">{profile.bio}</p>
        </CardContent>
      )}

      {socialLinks.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {link.name}
              </a>
            ))}
          </div>
        </CardContent>
      )}

      {showActions && (
        <CardFooter className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/messages/${profile.address}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Link>
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Follow
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
