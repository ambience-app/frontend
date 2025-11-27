import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Message } from './Message';
import type { Message as MessageType } from '@/types/message';
import { cn } from '@/lib/utils';
import { Bot, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MESSAGES_PER_PAGE = 20;

interface MessageListProps {
  roomId: string;
  currentUserAddress: string;
  fetchMessages: (roomId: string, page: number) => Promise<MessageType[]>;
  className?: string;
  isSending?: boolean;
  onRetry?: () => void;
}

export function MessageList({ 
  roomId, 
  currentUserAddress, 
  fetchMessages,
  className,
  isSending = false,
  onRetry
}: MessageListProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
  const isInitialLoad = useRef(true);
  const isLoadingMore = useRef(false);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<MessageType[], Error, InfiniteData<MessageType[]>, string[], number>({
    queryKey: ['messages', roomId],
    queryFn: async ({ pageParam = 1 }) => {
      const messages = await fetchMessages(roomId, pageParam as number);
      return messages;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === MESSAGES_PER_PAGE ? allPages.length + 1 : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    const messages = (data?.pages.flat() || []) as MessageType[];
    
    if (isInitialLoad.current && messages.length > 0) {
      // On initial load, scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      isInitialLoad.current = false;
    } else if (messages.length > prevMessageCount.current) {
      // New message added, scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessageCount.current = messages.length;
  }, [data]);

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      isLoadingMore.current = true;
      fetchNextPage().finally(() => {
        isLoadingMore.current = false;
      });
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

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
  }

  if (status === 'error') {
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
}
