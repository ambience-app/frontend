import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import { EMOJIS } from '@/types/message';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export function EmojiPicker({
  onSelect,
  className,
  align = 'start',
  side = 'top',
  sideOffset = 8,
}: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full text-muted-foreground hover:text-foreground',
            className
          )}
        >
          <SmilePlus className="h-4 w-4" />
          <span className="sr-only">Add reaction</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2" 
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <div className="grid grid-cols-6 gap-1">
          {EMOJIS.map(({ emoji, name }) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-xl p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label={`React with ${name}`}
              title={name}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
