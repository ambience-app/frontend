import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  roomId: string;
};

type ChatMessagesProps = {
  messages: Message[];
  isFetching: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isFetching, hasMore, onLoadMore }, ref) => {
    const formatDate = (timestamp: number) => {
      return format(new Date(timestamp), 'h:mm a');
    };

    const formatSender = (address: string) => {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isFetching && hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3 group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {message.sender.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-semibold">
                  {formatSender(message.sender)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(message.timestamp)}
                </span>
              </div>
              <p className="text-sm mt-1">{message.content}</p>
            </div>
          </div>
        ))}

        {!isFetching && hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              disabled={isFetching}
            >
              {isFetching ? 'Loading...' : 'Load more messages'}
            </button>
          </div>
        )}

        <div ref={ref} />
      </div>
    );
  }
);

ChatMessages.displayName = 'ChatMessages';
