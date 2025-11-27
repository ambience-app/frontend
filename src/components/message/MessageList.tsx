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
  isSending?: boolean;
  onRetry?: () => void;
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

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      refetch();
    }
  }, [onRetry, refetch]);

  const renderLoadingSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <div key={`skeleton-${i}`} className={cn(
        'flex gap-3 p-3',
        i % 2 === 0 ? 'justify-start' : 'justify-end'
      )}>
        {i % 2 === 0 && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className={cn('flex-1 max-w-[80%] space-y-2', i % 2 === 0 ? 'ml-2' : 'mr-2')}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full" />}
      </div>
    ));
  };

  const messages = (data?.pages.flat() || []) as MessageType[];
  const isEmpty = messages.length === 0 && !isSending;

  if (status === 'pending' && isInitialLoad.current) {
    return (
      <div className={cn('flex-1 overflow-y-auto p-4 space-y-6', className)}>
        {renderLoadingSkeletons(5)}
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
      <div className={cn('flex flex-col items-center justify-center h-full p-6 text-center', className)}>
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2">Failed to load messages</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {error.message || 'An error occurred while loading messages'}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRetry}
          className="gap-2"
        >
          <Loader2 className={cn('h-4 w-4', isFetchingNextPage && 'animate-spin')} />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading older messages...
            </div>
          </div>
        )}
        
        {hasNextPage && !isFetchingNextPage && (
          <div ref={ref} className="h-4" aria-hidden="true" />
        )}
        
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-muted p-6 rounded-full mb-6">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground max-w-md">
              Be the first to send a message in this room. Start the conversation!
            </p>
          </div>
        ) : (
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
            {isSending && (
              <div className="flex items-start gap-3 opacity-70">
                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-16 w-64 bg-muted rounded-lg" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export { MessageList };
