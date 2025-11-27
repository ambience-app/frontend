"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Hash,
  Lock,
  Globe,
  Users,
  MessageSquare,
  Search,
  Plus,
  X,
  UserPlus,
  UserMinus,
  TrendingUp,
  Clock,
  ArrowRight,
  PlusCircle,
  Shield,
  Hash as HashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

interface Room {
  id: number;
  name: string;
  description: string;
  isPrivate: boolean;
  memberCount: number;
  messageCount: number;
  isJoined: boolean;
  createdAt: Date;
  lastActive: string;
  trending?: boolean;
}

// Mock data - replace with real API calls
const mockRooms: Room[] = [
  {
    id: 1,
    name: 'general',
    description: 'General discussions about everything',
    isPrivate: false,
    memberCount: 1245,
    messageCount: 12543,
    isJoined: true,
    createdAt: new Date('2023-01-15'),
    lastActive: '2m ago',
    trending: true
  },
  {
    id: 2,
    name: 'trading',
    description: 'Crypto trading discussions and signals',
    isPrivate: false,
    memberCount: 845,
    messageCount: 9876,
    isJoined: false,
    createdAt: new Date('2023-02-20'),
    lastActive: '15m ago'
  },
  {
    id: 3,
    name: 'dev',
    description: 'Development discussions and help',
    isPrivate: true,
    memberCount: 342,
    messageCount: 5678,
    isJoined: true,
    createdAt: new Date('2023-03-10'),
    lastActive: '1h ago'
  },
];

// Room Card Component
const RoomCard = ({ room, onJoin, onLeave }: { room: Room; onJoin: (roomId: number) => void; onLeave: (roomId: number) => void }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-full bg-primary/10">
            <HashIcon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">#{room.name}</CardTitle>
          {room.isPrivate && <Shield className="h-4 w-4 text-muted-foreground" />}
        </div>
        {room.trending && <Badge variant="outline" className="text-xs">Trending</Badge>}
      </div>
      <CardDescription className="line-clamp-2">{room.description}</CardDescription>
    </CardHeader>
    <CardContent className="pb-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{room.memberCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{room.messageCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{room.lastActive}</span>
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="border-t px-6 py-3">
      <div className="flex w-full justify-between items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/chat?room=${room.id}`} className="flex items-center">
            Enter Room <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        {room.isJoined ? (
          <Button variant="outline" size="sm" onClick={() => onLeave(room.id)}>
            <UserMinus className="h-4 w-4 mr-2" /> Leave
          </Button>
        ) : (
          <Button size="sm" onClick={() => onJoin(room.id)}>
            <UserPlus className="h-4 w-4 mr-2" /> Join
          </Button>
        )}
      </div>
    </CardFooter>
  </Card>
);

// Create Room Form Component
const CreateRoomForm = ({ onClose, onCreate }: { onClose: () => void; onCreate: (room: Omit<Room, 'id' | 'isJoined' | 'lastActive' | 'createdAt' | 'messageCount' | 'memberCount'>) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Room name is required');
      return;
    }
    onCreate({
      ...formData,
      name: formData.name.toLowerCase().replace(/\s+/g, '-'),
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Room</CardTitle>
        <CardDescription>Set up a new chat room for your community</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Room Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HashIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="name"
                placeholder="general"
                className="pl-10"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none">
              Description (Optional)
            </label>
            <Input
              id="description"
              placeholder="What's this room about?"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isPrivate" className="text-sm font-medium leading-none">
              Private Room (Requires approval to join)
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <PlusCircle className="h-4 w-4 mr-2" /> Create Room
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default function RoomsPage() {
  const router = useRouter();

  // Using REOWN AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();

  // Fallback to Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();

  // Use AppKit values first, fallback to Wagmi
  const isConnected = appkitIsConnected || wagmiIsConnected;
  const address = appkitAddress || wagmiAddress;

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wallet gate - redirect if not connected
  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [mounted, isConnected, router]);

  // Mock rooms data
  useEffect(() => {
    if (isConnected) {
      const mockRooms: Room[] = [
        {
          id: 1,
          name: "General",
          description: "General discussion about Ambience and decentralized chat",
          isPrivate: false,
          memberCount: 1234,
          messageCount: 15678,
          isJoined: true,
          createdAt: new Date("2024-01-01"),
          lastActive: "2 min ago",
          trending: true,
        },
        {
          id: 2,
          name: "Tech Talk",
          description: "Discuss Web3 development, smart contracts, and blockchain tech",
          isPrivate: false,
          memberCount: 567,
          messageCount: 8943,
          isJoined: true,
          createdAt: new Date("2024-01-15"),
          lastActive: "5 min ago",
        },
        {
          id: 3,
          name: "Trading",
          description: "Real-time crypto trading discussions and market analysis",
          isPrivate: false,
          memberCount: 2341,
          messageCount: 32456,
          isJoined: false,
          createdAt: new Date("2024-02-01"),
          lastActive: "Just now",
          trending: true,
        },
        {
          id: 4,
          name: "NFT Collectors",
          description: "Share and discuss your favorite NFT collections",
          isPrivate: false,
          memberCount: 890,
          messageCount: 5234,
          isJoined: false,
          createdAt: new Date("2024-02-15"),
          lastActive: "10 min ago",
        },
        {
          id: 5,
          name: "VIP Lounge",
          description: "Exclusive room for verified members",
          isPrivate: true,
          memberCount: 45,
          messageCount: 1234,
          isJoined: false,
          createdAt: new Date("2024-03-01"),
          lastActive: "1 hour ago",
        },
        {
          id: 6,
          name: "Developers",
          description: "Private room for core contributors and developers",
          isPrivate: true,
          memberCount: 23,
          messageCount: 987,
          isJoined: true,
          createdAt: new Date("2024-03-10"),
          lastActive: "30 min ago",
        },
        {
          id: 7,
          name: "Gaming",
          description: "Discuss blockchain gaming and play-to-earn",
          isPrivate: false,
          memberCount: 1567,
          messageCount: 12345,
          isJoined: false,
          createdAt: new Date("2024-03-15"),
          lastActive: "15 min ago",
        },
        {
          id: 8,
          name: "DeFi",
          description: "Decentralized finance strategies and protocols",
          isPrivate: false,
          memberCount: 2103,
          messageCount: 18976,
          isJoined: true,
          createdAt: new Date("2024-03-20"),
          lastActive: "3 min ago",
          trending: true,
        },
      ];
      setRooms(mockRooms);
    }
  }, [isConnected]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const newRoom: Room = {
      id: rooms.length + 1,
      name: newRoomName,
      description: newRoomDescription,
      isPrivate: newRoomIsPrivate,
      memberCount: 1,
      messageCount: 0,
      isJoined: true,
      createdAt: new Date(),
      lastActive: "Just now",
    };

    setRooms([...rooms, newRoom]);
    setNewRoomName("");
    setNewRoomDescription("");
    setNewRoomIsPrivate(false);
    setShowCreateModal(false);
  };

  const handleToggleJoin = (roomId: number) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              isJoined: !room.isJoined,
              memberCount: room.isJoined ? room.memberCount - 1 : room.memberCount + 1,
            }
          : room
      )
    );
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "all") return matchesSearch;
    if (filterType === "public") return matchesSearch && !room.isPrivate;
    if (filterType === "private") return matchesSearch && room.isPrivate;
    if (filterType === "joined") return matchesSearch && room.isJoined;

    return matchesSearch;
  });

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
                href="/rooms"
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                Rooms
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

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Chat Rooms
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Discover and join rooms to connect with the community
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("public")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "public"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Public
                </button>
                <button
                  onClick={() => setFilterType("private")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "private"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Private
                </button>
                <button
                  onClick={() => setFilterType("joined")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "joined"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Joined
                </button>
              </div>

              {/* Create Room Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Room
              </button>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all p-6"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      room.isPrivate
                        ? "bg-gradient-to-br from-purple-500 to-pink-600"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}>
                      {room.isPrivate ? (
                        <Lock className="w-6 h-6 text-white" />
                      ) : (
                        <Hash className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          #{room.name}
                        </h3>
                        {room.trending && (
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {room.isPrivate ? (
                          <><Lock className="w-3 h-3" /> Private</>
                        ) : (
                          <><Globe className="w-3 h-3" /> Public</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {room.description}
                </p>

                {/* Room Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{room.memberCount.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{room.messageCount.toLocaleString()} messages</span>
                  </div>
                </div>

                {/* Last Active */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <Clock className="w-3 h-3" />
                  <span>Last active: {room.lastActive}</span>
                </div>

                {/* Join/Leave Button */}
                <button
                  onClick={() => handleToggleJoin(room.id)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    room.isJoined
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
                  }`}
                >
                  {room.isJoined ? (
                    <>
                      <UserMinus className="w-5 h-5" />
                      Leave Room
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Join Room
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <Hash className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No rooms found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Create New Room
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g., Web3 Builders"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Room Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Describe your room..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  {newRoomIsPrivate ? (
                    <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      {newRoomIsPrivate ? "Private Room" : "Public Room"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {newRoomIsPrivate
                        ? "Only invited members can join"
                        : "Anyone can join this room"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewRoomIsPrivate(!newRoomIsPrivate)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    newRoomIsPrivate
                      ? "bg-purple-500"
                      : "bg-blue-500"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      newRoomIsPrivate ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Create Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
