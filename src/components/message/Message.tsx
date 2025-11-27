import { formatDistanceToNow } from 'date-fns';
import { useEnsName } from 'wagmi';
import { shortenAddress } from '@/lib/utils';
import type { Message, Reaction } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useReactions } from '@/hooks/useReactions';
import { ReactionButton } from './ReactionButton';
import { EmojiPicker } from './EmojiPicker';
import { useState } from 'react';

interface MessageProps {
  message: Message;
  isCurrentUser?: boolean;
  className?: string;
  onReaction?: (emoji: string) => Promise<void>;
  isReacting?: boolean;
}

export function Message({ message, isCurrentUser = false, className, onReaction, isReacting = false }: MessageProps) {
  const { data: ensName } = useEnsName({
    address: typeof message.sender === 'string' ? (message.sender as `0x${string}`) : undefined,
  });
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { toggleReaction, isLoading } = useReactions();

  const senderDisplay = typeof message.sender === 'string' 
    ? ensName || shortenAddress(message.sender)
    : message.sender.ensName || message.sender.displayName || shortenAddress(message.sender.address);

  const senderInitial = senderDisplay?.charAt(0).toUpperCase() || 'U';

  const handleReaction = async (emoji: string) => {
    if (onReaction) {
      await onReaction(emoji);
    }
    setShowReactionPicker(false);
  };
  
  return (
    <div className={cn(
      'group relative flex gap-3 p-3 rounded-lg',
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
        <p className="text-sm mb-2">{message.content}</p>
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.reactions.map((reaction) => (
              <ReactionButton
                key={reaction.emoji}
                reaction={reaction}
                onReaction={handleReaction}
              />
            ))}
          </div>
        )}
        
        {/* Reaction picker */}
        <div className={cn(
          'absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center gap-1 bg-background rounded-full p-1 shadow-sm border',
          isCurrentUser ? 'left-2' : 'right-2'
        )}>
          <EmojiPicker onSelect={handleReaction} />
        </div>
        
        {message.edited && (
          <div className="text-xs mt-1 opacity-70 italic">edited</div>
        )}
      </div>
    </div>
  );
}
