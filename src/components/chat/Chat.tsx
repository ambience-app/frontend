import { useChat } from '@/hooks/useChat';
import { MessageList } from './message/MessageList';
import { MessageInput } from './message/MessageInput';

interface ChatProps {
  roomId: string;
  className?: string;
}

export function Chat({ roomId, className }: ChatProps) {
  const { messages, isSending, sendMessage, fetchMessages } = useChat(roomId);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <MessageList 
        roomId={roomId}
        currentUserAddress={''} // This should be the current user's address
        fetchMessages={fetchMessages}
        className="flex-1 overflow-y-auto"
      />
      <MessageInput 
        onSend={sendMessage}
        disabled={isSending}
        className="border-t border-border"
      />
    </div>
  );
}
