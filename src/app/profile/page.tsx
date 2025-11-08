"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount, useEnsName, useEnsAvatar } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Wallet,
  MessageSquare,
  Users,
  Settings,
  Bell,
  Palette,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Clock,
  Hash
} from "lucide-react";
import { useState, useEffect } from "react";
import { mainnet } from "wagmi/chains";

export default function ProfilePage() {
  const router = useRouter();

  // Using REOWN AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();

  // Fallback to Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();

  // Use AppKit values first, fallback to Wagmi
  const address = appkitAddress || wagmiAddress;
  const isConnected = appkitIsConnected || wagmiIsConnected;

  // ENS resolution
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: mainnet.id,
  });

  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("blue");

  useEffect(() => {
    setMounted(true);
    // Check system dark mode preference
    if (typeof window !== "undefined") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(isDark);
    }
  }, []);

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [mounted, isConnected, router]);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  };

  // Mock data for demonstration
  const mockMessages = [
    { id: 1, room: "General", content: "Hello everyone!", timestamp: "2 hours ago", txHash: "0x1234...5678" },
    { id: 2, room: "Tech Talk", content: "What's everyone working on?", timestamp: "5 hours ago", txHash: "0xabcd...ef01" },
    { id: 3, room: "Random", content: "GM! ☀️", timestamp: "1 day ago", txHash: "0x9876...5432" },
  ];

  const mockRooms = [
    { id: 1, name: "General", members: 1234, joined: "2 weeks ago", lastActive: "2 hours ago" },
    { id: 2, name: "Tech Talk", members: 567, joined: "1 week ago", lastActive: "5 hours ago" },
    { id: 3, name: "Random", members: 890, joined: "3 days ago", lastActive: "1 day ago" },
    { id: 4, name: "Web3 Dev", members: 432, joined: "1 week ago", lastActive: "3 hours ago" },
  ];

  const themes = [
    { name: "Blue", value: "blue", gradient: "from-blue-600 to-indigo-600" },
    { name: "Purple", value: "purple", gradient: "from-purple-600 to-pink-600" },
    { name: "Green", value: "green", gradient: "from-green-600 to-teal-600" },
    { name: "Orange", value: "orange", gradient: "from-orange-600 to-red-600" },
  ];

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
                className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Chat
              </Link>
              <Link
                href="/profile"
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {ensAvatar ? (
                  <img
                    src={ensAvatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-blue-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-blue-500">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>

              {/* Wallet Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {ensName || "Unnamed User"}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
                    <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                      {truncateAddress(address as string)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <a
                    href={`https://basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on Explorer
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                {ensName && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    ENS Name: {ensName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Message History */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Message History
                  </h2>
                </div>
                <div className="space-y-3">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {message.room}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3" />
                          {message.timestamp}
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-2">
                        {message.content}
                      </p>
                      <a
                        href={`https://basescan.org/tx/${message.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span className="font-mono">{message.txHash}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms Joined */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Rooms Joined
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          #{room.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>{room.members} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Joined {room.joined}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          Last active: {room.lastActive}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Profile Customization */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Customize Profile
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Theme Color
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {themes.map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setSelectedTheme(theme.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedTheme === theme.value
                              ? "border-slate-900 dark:border-slate-100"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className={`w-full h-8 rounded bg-gradient-to-r ${theme.gradient} mb-2`}></div>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {theme.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Settings
                  </h2>
                </div>
                <div className="space-y-4">
                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          Notifications
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Receive message alerts
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationsEnabled
                          ? "bg-green-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notificationsEnabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      ></div>
                    </button>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          Dark Mode
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Toggle dark theme
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleThemeToggle}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        darkMode
                          ? "bg-indigo-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          darkMode ? "translate-x-6" : "translate-x-0"
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
