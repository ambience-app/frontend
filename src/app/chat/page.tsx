"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, User, Loader2, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from 'date-fns';
import { useInView } from 'react-intersection-observer';

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

  // Using REOWN AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();

  // Fallback to Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();

  // Use AppKit values first, fallback to Wagmi
  const address = appkitAddress || wagmiAddress;
  const isConnected = appkitIsConnected || wagmiIsConnected;

  // Use the chat hook for message handling
  const { messages, isSending, isLoading, error, sendMessage, fetchMessages } = useChat(roomId);
  
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
    address: address as `0x${string}` | undefined,
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
    return (
      current.sender.toLowerCase() === next.sender.toLowerCase() &&
      next.timestamp - current.timestamp < 5 * 60 * 1000 // 5 minutes
    );
  };

  // Format sender address
  const formatSender = (address: string) => {
    if (!address) return '';
    if (address.toLowerCase() === address?.toLowerCase()) return 'You';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
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
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Hash className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white">
                Room #{roomId}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {messages.length} messages
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Connected as:</span>
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                {ensName || (address ? formatSender(address) : '')}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={scrollToBottom}
            disabled={isAtBottom}
          >
            <ChevronDown className={cn(
              "w-5 h-5 transition-transform",
              isAtBottom ? "opacity-50" : "animate-bounce"
            )} />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No messages yet</h3>
            <p className="text-slate-500 dark:text-slate-400">Be the first to send a message!</p>
          </div>
        ) : (
          <>
            {!hasMore && !isLoadingMore && (
              <div className="text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Beginning of conversation
                </span>
              </div>
            )}
            
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
            
            <div ref={loadMoreRef} className="h-1" />
            
            {groupedMessages.map((group, groupIndex) => (
              <div key={group.date} className="space-y-4">
                <div className="sticky top-2 z-10">
                  <div className="mx-auto w-fit px-3 py-1 bg-white dark:bg-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    {formatDateHeader(group.date)}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {group.messages.map((message, index) => {
                    const isUser = message.sender.toLowerCase() === address?.toLowerCase();
                    const showAvatar = !isUser && !isSameSender(message, group.messages[index + 1]);
                    const showTime = !isSameSender(message, group.messages[index + 1]);
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start group",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isUser && (
                          <div className="flex-shrink-0 mr-2 mt-1">
                            {showAvatar ? (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${message.sender}`} />
                                <AvatarFallback>
                                  {message.sender.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8" />
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          "max-w-[85%] md:max-w-[70%] space-y-1",
                          isUser && "flex flex-col items-end"
                        )}>
                          <div
                            className={cn(
                              "px-4 py-2 rounded-2xl",
                              isUser
                                ? "bg-blue-500 text-white rounded-br-none"
                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-700"
                            )}
                          >
                            {!isUser && showAvatar && (
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {formatSender(message.sender)}
                                </span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          
                          {showTime && (
                            <div className="flex items-center space-x-2 px-1">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {isUser && (
                                <span className={cn(
                                  "text-xs",
                                  isUser ? "text-blue-400" : "text-slate-400"
                                )}>
                                  {isUser ? 'Sent' : 'Delivered'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {isUser && (
                          <div className="flex-shrink-0 ml-2 mt-1">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} />
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
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
          
          <Button
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
