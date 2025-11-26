"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Loader2, Send } from 'lucide-react';

// Lazy load components
const ChatHeader = dynamic(
  () => import('@/components/chat/ChatHeader').then(mod => mod.ChatHeader),
  { 
    loading: () => <div className="h-16 border-b flex items-center px-4 bg-background">Loading chat...</div>,
    ssr: false
  }
);

const ChatMessages = dynamic(
  () => import('@/components/chat/ChatMessages').then(mod => mod.ChatMessages),
  { 
    loading: () => (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 w-full bg-muted/20 rounded-md animate-pulse" />
        ))}
      </div>
    ),
    ssr: false
  }
);

const ChatInput = dynamic(
  () => import('@/components/chat/ChatInput').then(mod => mod.ChatInput),
  { 
    loading: () => (
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-10 bg-muted/20 rounded-md animate-pulse" />
          <div className="w-20 h-10 bg-muted/20 rounded-md animate-pulse" />
        </div>
      </div>
    ),
    ssr: false
  }
);

// Simple inView hook
function useInView(options: IntersectionObserverInit = {}): [React.Dispatch<React.SetStateAction<HTMLElement | null>>, boolean] {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );
    
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);
  
  return [setRef, inView];
}

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

type ChatInputProps = {
  onSendMessage: (content: string) => void;
  isSending: boolean;
  messageInput: string;
  setMessageInput: (value: string) => void;
};

type ChatHeaderProps = {
  roomName: string;
};

export function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams?.get('room') || '1';
  const { isConnected } = useAccount();
  
  // Mock data - replace with your actual data fetching logic
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [loadMoreRef, inView] = useInView();

  // Load more messages when scrolled to top
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreMessages();
    }
  }, [inView, hasMore, isLoading]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      // Replace with your actual API call
      // const newMessages = await fetchMessages(roomId, page + 1);
      // setMessages(prev => [...newMessages, ...prev]);
      // setPage(prev => prev + 1);
      // setHasMore(newMessages.length > 0);
      
      // Mock implementation
      setTimeout(() => {
        const newMessages = Array(10).fill(0).map((_, i) => ({
          id: `msg-${page * 10 + i}`,
          content: `Message ${page * 10 + i + 1}`,
          sender: '0x123...',
          timestamp: Date.now() - (page * 10 + i) * 1000 * 60,
          roomId
        }));
        
        setMessages(prev => [...newMessages, ...prev]);
        setPage(prev => prev + 1);
        setHasMore(page < 2); // Only load 3 pages for demo
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load more messages:', error);
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, roomId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;
    
    setIsSending(true);
    try {
      // Replace with your actual API call
      // await sendMessage(roomId, content);
      
      // Mock implementation
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content,
        sender: '0x123...', // Replace with actual sender
        timestamp: Date.now(),
        roomId
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [isSending, roomId]);

  // Initial load
  useEffect(() => {
    loadMoreMessages();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to start chatting.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <ChatHeader roomName={`Room ${roomId}`} />
      </Suspense>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div ref={loadMoreRef} className="h-1" />
              <Suspense fallback={
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 w-full bg-muted/20 rounded-md animate-pulse" />
                  ))}
                </div>
              }>
                <ChatMessages 
                  messages={messages}
                  isFetching={isLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMoreMessages}
                />
              </Suspense>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <Suspense fallback={
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-10 bg-muted/20 rounded-md animate-pulse" />
              <div className="w-20 h-10 bg-muted/20 rounded-md animate-pulse" />
            </div>
          </div>
        }>
          <ChatInput 
            onSendMessage={handleSendMessage}
            isSending={isSending}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
          />
        </Suspense>
      </div>
    </div>
  );
}
