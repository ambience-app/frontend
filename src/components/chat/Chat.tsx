import { memo, useMemo } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAccount } from 'wagmi';
import { usePerformanceMonitoring } from '@/lib/performanceMonitoring';
import { useMemoryOptimizer } from '@/lib/memoryOptimization';
import { MessageList } from '@/components/message/MessageList';
import { MessageInput } from '@/components/message/MessageInput';
import { cn } from '@/lib/utils';

interface ChatProps {
  roomId: string;
  className?: string;
}

/**
 * Optimized Chat component with memoization and performance monitoring
 */
const Chat = memo(({ roomId, className }: ChatProps) => {
  const { address } = useAccount();
  
  // Performance monitoring
  const { trackNetworkCall, trackCacheHit, getCurrentMetrics } = usePerformanceMonitoring('Chat', {
    maxRenderTime: 16, // 60fps target
    maxMemoryUsage: 50, // 50MB
    maxNetworkCalls: 5, // per minute
    minCacheHitRate: 80, // 80%
  });

  // Memory optimization
  const { registerCleanup } = useMemoryOptimizer();

  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useChat(roomId);

  // Register cleanup for performance monitoring
  useMemo(() => {
    registerCleanup(() => {
      const metrics = getCurrentMetrics();
      console.log('Chat component cleanup metrics:', metrics);
    });
  }, [registerCleanup, getCurrentMetrics]);

  // Memoize current user address to prevent re-renders
  const currentUserAddress = useMemo(() => address || '', [address]);

  // Memoize message data to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    trackNetworkCall(); // Track this as a network operation
    return messages;
  }, [messages, trackNetworkCall]);

  // Memoize send message function with performance tracking
  const memoizedSendMessage = useMemo(() => {
    return async (content: string) => {
      trackNetworkCall(); // Track as a network call
      await sendMessage(content);
    };
  }, [sendMessage, trackNetworkCall]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <MessageList 
        roomId={roomId}
        messages={memoizedMessages}
        currentUserAddress={currentUserAddress}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        onRefetch={refetch}
        className="flex-1 overflow-y-auto"
      />
      <MessageInput 
        onSend={memoizedSendMessage}
        disabled={isSending}
        className="border-t border-border"
      />
    </div>
  );
});

Chat.displayName = 'Chat';

export { Chat };
