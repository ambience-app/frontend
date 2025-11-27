import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAccount } from 'wagmi';
import { Reaction } from '@/types/message';

interface ReactionButtonProps {
  reaction: Reaction;
  onReaction: (emoji: string) => void;
  className?: string;
}

export function ReactionButton({ reaction, onReaction, className }: ReactionButtonProps) {
  const { address } = useAccount();
  const hasReacted = address ? reaction.users.includes(address) : false;
  const userCount = reaction.users.length;
  const userText = userCount === 1 ? '1 person' : `${userCount} people`;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onReaction(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full border',
            'transition-colors duration-200',
            hasReacted 
              ? 'bg-primary/10 border-primary text-primary' 
              : 'bg-muted/50 hover:bg-muted border-border',
            className
          )}
          aria-label={`React with ${reaction.emoji}`}
        >
          <span className="text-base">{reaction.emoji}</span>
          <span className="text-xs font-medium">{reaction.count}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {userText} reacted with {reaction.emoji}
      </TooltipContent>
    </Tooltip>
  );
}
