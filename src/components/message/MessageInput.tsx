import { useRef, useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperPlaneIcon } from '@radix-ui/react-icons';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({ onSend, disabled = false, className }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex gap-2 items-end p-2 border-t bg-background', className)}>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="min-h-[40px] max-h-32 resize-none"
        disabled={disabled}
      />
      <Button 
        onClick={handleSend} 
        size="icon" 
        disabled={!message.trim() || disabled}
        className="h-10 w-10"
      >
        <PaperPlaneIcon className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}
