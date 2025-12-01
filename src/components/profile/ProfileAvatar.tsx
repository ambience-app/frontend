import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  address: string;
  ensName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export function ProfileAvatar({
  address,
  ensName,
  size = 'md',
  className = '',
  onClick,
}: ProfileAvatarProps) {
  const avatarUrl = ensName
    ? `https://metadata.ens.domains/mainnet/avatar/${ensName}`
    : `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;

  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-full bg-muted overflow-hidden',
        sizeClasses[size],
        onClick ? 'cursor-pointer' : '',
        className
      )}
      onClick={onClick}
    >
      <img
        src={avatarUrl}
        alt={ensName || address}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to identicon if ENS avatar fails to load
          if (ensName) {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
          }
        }}
      />
    </div>
  );
}
