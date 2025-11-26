"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load the chat page content with no SSR
const ChatPageContent = dynamic(
  () => import('./ChatPageContent').then(mod => mod.ChatPageContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

type Message = {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  roomId: string;
};

type GroupedMessages = {
  date: string;
  messages: Message[];
};

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room') || '1'; // Default to room 1 if not specified

  // Use Wagmi hooks
  const { address, isConnected } = useAccount();

  // Use the chat hook for message handling
  const { messages = [], isSending, isLoading, error, sendMessage, fetchMessages } = useChat(roomId);
  
  const [messageInput, setMessageInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
  });

  // Group messages by date
  const groupedMessages = messages.reduce<GroupedMessages[]>((acc, message) => {
    const date = new Date(message.timestamp).toDateString();
    const existingGroup = acc.find(group => group.date === date);
    
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      acc.push({
        date,
        messages: [message]
      });
    }
    
    return acc;
  }, []);

  // ENS resolution for current user
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
  });

  // Wallet gate - redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
    setIsAtBottom(isNearBottom);
  }, []);

  // Auto-scroll to bottom on new messages when at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Load more messages when scrolling to top
  useEffect(() => {
    if (inView && !isLoading && !isLoadingMore && hasMore) {
      loadMoreMessages();
    }
  }, [inView, isLoading, isLoadingMore, hasMore]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const newPage = page + 1;
      const newMessages = await fetchMessages(newPage);
      
      if (newMessages.length < 20) { // Assuming 20 is the page size
        setHasMore(false);
      }
      
      if (newMessages.length > 0) {
        setPage(newPage);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  // Handle sending a new message
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !isConnected || isSending) return;
    
    try {
      await sendMessage(messageInput);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [messageInput, isConnected, isSending, sendMessage]);

  // Format message timestamp
  const formatMessageTime = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Format date header
  const formatDateHeader = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch {
      return dateString;
    }
  };

  // Check if messages are from the same sender and close in time
  const isSameSender = (current: Message, next: Message | undefined) => {
    if (!next) return false;
    const currentSender = typeof current.sender === 'string' ? current.sender : current.sender.id;
    const nextSender = typeof next.sender === 'string' ? next.sender : next.sender.id;
    return (
      currentSender.toLowerCase() === nextSender.toLowerCase() &&
      next.timestamp - current.timestamp < 5 * 60 * 1000 // 5 minutes
    );
  };

  // Format sender address
  const formatSender = (addr: string | undefined) => {
    if (!addr) return '';
    if (address && typeof addr === 'string' && addr.toLowerCase() === address.toLowerCase()) return 'You';
    if (typeof addr !== 'string') return 'Unknown';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Add scroll event listener
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Wallet Not Connected</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">Please connect your wallet to start chatting</p>
          <Button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <ChatHeader roomName={roomId} />
      </Suspense>
      
      <LazyLoader>
        {isConnected ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Suspense fallback={
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 w-full bg-muted/20 rounded-md animate-pulse" />
                ))}
              </div>
            }>
              <ChatMessages 
                messages={groupedMessages}
                isFetching={isLoading}
                hasMore={hasMore}
                onLoadMore={loadMoreMessages}
              />
            </Suspense>
            
            <Suspense fallback={<div className="p-4 border-t">Loading input...</div>}>
              <ChatInput 
                onSendMessage={handleSendMessage}
                isSending={isSending}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
              />
            </Suspense>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Button onClick={() => router.push('/')} disabled={false}>
              Connect Wallet to Chat
            </Button>
                              <AvatarFallbackComponent>You</AvatarFallbackComponent>
                            </AvatarComponent>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        {error && (
          <div className="flex items-center justify-center p-2 mb-2 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message..."
              className="w-full pr-12 resize-none"
              disabled={!isConnected || isSending}
              multiline
              rows={1}
            />
            <div className="absolute right-3 bottom-2.5 flex items-center space-x-1">
              <span className={`text-xs ${messageInput.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                {messageInput.length}/500
              </span>
            </div>
          </div>
          
          <ButtonComponent
            type="submit"
            size="icon"
            disabled={!messageInput.trim() || !isConnected || isSending || messageInput.length > 500}
            className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isConnected ? (
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                Connected as {ensName || formatSender(address || '')}
              </span>
            ) : (
              'Connect your wallet to send messages'
            )}
          </p>
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>Messages are stored on the blockchain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
