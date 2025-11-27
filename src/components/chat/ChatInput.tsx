import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

type ChatInputProps = {
  onSendMessage: (content: string) => void;
  isSending: boolean;
  messageInput: string;
  setMessageInput: (value: string) => void;
};

export function ChatInput({
  onSendMessage,
  isSending,
  messageInput,
  setMessageInput,
}: ChatInputProps) {
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (messageInput.trim()) {
        onSendMessage(messageInput.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && !isSending) {
      onSendMessage(messageInput.trim());
    }
  };

  return (
    <div className="border-t p-4 bg-background">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Type a message..."
            className="w-full min-h-[40px] max-h-32 px-4 py-2 pr-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 resize-none"
            rows={1}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            className="absolute right-2 bottom-2 p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="h-5 w-5 border-2 border-muted-foreground/50 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
