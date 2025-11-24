"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount, useEnsName } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Hash, User, Loader2, AlertCircle } from "lucide-react";
import { mainnet } from "wagmi/chains";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "@/hooks/useChat";
import { truncateAddress } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  roomId: string;
}

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
  const { messages, isSending, isLoading, error, sendMessage } = useChat(roomId);
  
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // ENS resolution for current user
  const { data: ensName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wallet gate - redirect if not connected
  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [mounted, isConnected, router]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  const formatTimestamp = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Truncate long messages
  const truncateMessage = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !address) return;

    setIsLoading(true);

    // Simulate sending message
    const newMessage: Message = {
      id: messages.length + 1,
      content: messageInput,
      sender: address as string,
      ensName: ensName || undefined,
      timestamp: new Date(),
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput("");
      setIsLoading(false);
    }, 1000);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Pagination
  const totalPages = Math.ceil(messages.length / messagesPerPage);
  const paginatedMessages = messages.slice(
    (currentPage - 1) * messagesPerPage,
    currentPage * messagesPerPage
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Room #{roomId}
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Connected as:</span>
            <span className="font-medium text-slate-900 dark:text-slate-200">
              {ensName || (address ? truncateAddress(address) : '')}
            </span>
          </div>
          <Link
            href="/profile"
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            aria-label="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
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
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender.toLowerCase() === address?.toLowerCase() ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                  message.sender.toLowerCase() === address?.toLowerCase()
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.sender.toLowerCase() === address?.toLowerCase()
                      ? "You"
                      : truncateAddress(message.sender)}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words">{truncateMessage(message.content)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        {error && (
          <div className="flex items-center justify-center p-2 mb-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected || isSending}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || !isConnected || isSending}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          Messages are stored on the blockchain
        </p>
      </div>
    </div>
  );
}
