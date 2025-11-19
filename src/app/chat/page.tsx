"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount, useEnsName } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Send, Hash, User, ChevronLeft, ChevronRight } from "lucide-react";
import { mainnet } from "wagmi/chains";

interface Message {
  id: number;
  content: string;
  sender: string;
  ensName?: string;
  timestamp: Date;
  txHash: string;
}

export default function ChatPage() {
  const router = useRouter();

  // Using REOWN AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();

  // Fallback to Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();

  // Use AppKit values first, fallback to Wagmi
  const address = appkitAddress || wagmiAddress;
  const isConnected = appkitIsConnected || wagmiIsConnected;

  // ENS resolution for current user
  const { data: ensName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  const [mounted, setMounted] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesPerPage = 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wallet gate - redirect if not connected
  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [mounted, isConnected, router]);

  // Mock messages for demonstration
  useEffect(() => {
    if (isConnected) {
      // Simulate loading messages
      const mockMessages: Message[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        content: i % 5 === 0
          ? "This is a longer message to demonstrate how the chat handles different message lengths. It should wrap nicely and maintain good readability."
          : i % 3 === 0
          ? "GM! ☀️"
          : `Message ${i + 1}`,
        sender: i % 2 === 0 ? (address as string) : `0x${Math.random().toString(16).substring(2, 42)}`,
        ensName: i % 4 === 0 ? "vitalik.eth" : undefined,
        timestamp: new Date(Date.now() - i * 1000 * 60 * 5),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      }));
      setMessages(mockMessages);
    }
  }, [isConnected, address]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time message updates simulation
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      // Simulate new message every 30 seconds
      const newMessage: Message = {
        id: messages.length + 1,
        content: "New message from the blockchain! 🚀",
        sender: `0x${Math.random().toString(16).substring(2, 42)}`,
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      };
      setMessages((prev) => [...prev, newMessage]);
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, messages.length]);

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
    return null;
  }

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Ambience
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/chat"
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                Chat
              </Link>
              <Link
                href="/profile"
                className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Interface */}
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  General
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {messages.length} messages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <User className="w-4 h-4" />
              <span>{ensName || truncateAddress(address as string)}</span>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-4">
            {paginatedMessages.map((message) => {
              const isOwnMessage = message.sender.toLowerCase() === (address as string).toLowerCase();

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {message.ensName ? message.ensName.charAt(0).toUpperCase() : message.sender.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className={`flex-1 max-w-md ${isOwnMessage ? "items-end" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${isOwnMessage ? "order-2" : ""}`}>
                        {message.ensName || truncateAddress(message.sender)}
                      </span>
                      <span className={`text-xs text-slate-500 dark:text-slate-400 ${isOwnMessage ? "order-1" : ""}`}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`p-4 rounded-2xl ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none"
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                    </div>
                    <a
                      href={`https://basescan.org/tx/${message.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block ${isOwnMessage ? "ml-auto" : ""}`}
                    >
                      View on chain
                    </a>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white dark:bg-slate-900 rounded-b-2xl border border-slate-200 dark:border-slate-800 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                {isLoading ? "Sending..." : "Send"}
              </button>
            </form>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Messages are stored permanently on Base blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
