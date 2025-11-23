import { memo, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useEnsName } from 'wagmi';
import { shortenAddress } from '@/lib/utils';
import type { Message } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: Message;
  isCurrentUser?: boolean;
  className?: string;
}

/**
 * Optimized Message component with memoization to prevent unnecessary re-renders
 */
const Message = memo<MessageProps>(({ message, isCurrentUser = false, className }) => {
  const { data: ensName } = useEnsName({
    address: typeof message.sender === 'string' ? (message.sender as `0x${string}`) : undefined,
  }, {
    // Cache ENS resolution for longer periods
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Memoize computed values to prevent recalculation on re-renders
  const senderDisplay = useMemo(() => {
    if (typeof message.sender === 'string') {
      return ensName || shortenAddress(message.sender);
    }
    return message.sender.ensName || message.sender.displayName || shortenAddress(message.sender.address);
  }, [message.sender, ensName]);

  const senderInitial = useMemo(() => {
    return senderDisplay?.charAt(0).toUpperCase() || 'U';
  }, [senderDisplay]);

  const timestamp = useMemo(() => {
    return formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
  }, [message.timestamp]);

  const avatarImage = useMemo(() => {
    return typeof message.sender !== 'string' ? message.sender.avatar : undefined;
  }, [message.sender]);

  const containerClassName = useMemo(() => {
    return cn(
      'flex gap-3 p-3 rounded-lg',
      isCurrentUser ? 'justify-end' : 'justify-start',
      className
    );
  }, [isCurrentUser, className]);

  const contentClassName = useMemo(() => {
    return cn(
      'max-w-[80%] p-4 rounded-xl',
      isCurrentUser 
        ? 'bg-primary text-primary-foreground rounded-tr-none'
        : 'bg-muted rounded-tl-none'
    );
  }, [isCurrentUser]);

  if (isCurrentUser) {
    return (
      <div className={containerClassName}>
        <div className={contentClassName}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm">{senderDisplay}</span>
            <span className="text-xs opacity-80">
              {timestamp}
            </span>
          </div>
          <p className="text-sm">{message.content}</p>
          {message.edited && (
            <div className="text-xs mt-1 opacity-70 italic">edited</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarImage} />
        <AvatarFallback>{senderInitial}</AvatarFallback>
      </Avatar>
      <div className={contentClassName}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">{senderDisplay}</span>
          <span className="text-xs opacity-80">
            {timestamp}
          </span>
        </div>
        <p className="text-sm">{message.content}</p>
        {message.edited && (
          <div className="text-xs mt-1 opacity-70 italic">edited</div>
        )}
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export { Message };
