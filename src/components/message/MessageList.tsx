import { memo, useEffect, useRef, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Message } from './Message';
import type { Message as MessageType } from '@/types/message';
import { cn } from '@/lib/utils';

interface MessageListProps {
  roomId: string;
  messages: MessageType[];
  currentUserAddress: string;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onRefetch: () => void;
  className?: string;
}

/**
 * Optimized MessageList component with memoization and virtual scrolling support
 */
const MessageList = memo<MessageListProps>(({
  roomId,
  messages,
  currentUserAddress,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRefetch,
  className
}) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Load more messages when user scrolls to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  // Memoized message components to prevent re-renders
  const memoizedMessages = useMemo(() => {
    if (!messages.length) return null;

    return (
      <div className="space-y-6">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isCurrentUser={
              typeof message.sender === 'string'
                ? message.sender.toLowerCase() === currentUserAddress.toLowerCase()
                : message.sender.address.toLowerCase() === currentUserAddress.toLowerCase()
            }
          />
        ))}
      </div>
    );
  }, [messages, currentUserAddress]);

  // Loading skeleton
  const loadingSkeleton = useMemo(() => (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-64" />
          </div>
        </div>
      ))}
    </div>
  ), []);

  // Loading more skeleton
  const loadingMoreSkeleton = useMemo(() => (
    <div ref={ref} className="flex justify-center py-2">
      <Skeleton className="h-4 w-32" />
    </div>
  ), [ref]);

  if (isLoading) {
    return (
      <div className={cn('flex-1 overflow-y-auto', className)}>
        {loadingSkeleton}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        No messages yet. Send a message to start the conversation!
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto p-4', className)}>
      {hasNextPage && loadingMoreSkeleton}
      {memoizedMessages}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export { MessageList };
