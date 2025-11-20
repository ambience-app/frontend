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

export function Message({ message, isCurrentUser = false, className }: MessageProps) {
  const { data: ensName } = useEnsName({
    address: typeof message.sender === 'string' ? (message.sender as `0x${string}`) : undefined,
  });

  const senderDisplay = typeof message.sender === 'string' 
    ? ensName || shortenAddress(message.sender)
    : message.sender.ensName || message.sender.displayName || shortenAddress(message.sender.address);

  const senderInitial = senderDisplay?.charAt(0).toUpperCase() || 'U';
  
  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-lg',
      isCurrentUser ? 'justify-end' : 'justify-start',
      className
    )}>
      {!isCurrentUser && (
        <Avatar className="h-10 w-10">
          <AvatarImage src={typeof message.sender !== 'string' ? message.sender.avatar : undefined} />
          <AvatarFallback>{senderInitial}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        'max-w-[80%] p-4 rounded-xl',
        isCurrentUser 
          ? 'bg-primary text-primary-foreground rounded-tr-none'
          : 'bg-muted rounded-tl-none'
      )}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">{senderDisplay}</span>
          <span className="text-xs opacity-80">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
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
