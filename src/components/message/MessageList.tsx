import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Message } from './Message';
import type { Message as MessageType } from '@/types/message';

const MESSAGES_PER_PAGE = 20;

interface MessageListProps {
  roomId: string;
  currentUserAddress: string;
  fetchMessages: (roomId: string, page: number) => Promise<MessageType[]>;
  className?: string;
}

export function MessageList({ 
  roomId, 
  currentUserAddress, 
  fetchMessages,
  className 
}: MessageListProps) {
  const { ref, inView } = useInView();
  
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['messages', roomId],
    queryFn: ({ pageParam = 1 }) => fetchMessages(roomId, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === MESSAGES_PER_PAGE ? allPages.length + 1 : undefined;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return (
      <div className={cn('space-y-4 p-4', className)}>
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
    );
  }

  if (status === 'error') {
    return (
      <div className={cn('p-4 text-center text-destructive', className)}>
        Error loading messages: {error.message}
      </div>
    );
  }

  const messages = data?.pages.flat() || [];

  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-2">
          <Skeleton className="h-4 w-32" />
        </div>
      )}
      
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Send a message to start the conversation!
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
        </div>
      )}
    </div>
  );
}
