import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Room } from '@/types/room';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

// Mock API service - replace with actual API calls
const fetchRooms = async (): Promise<Room[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/rooms');
  // if (!response.ok) throw new Error('Failed to fetch rooms');
  // return response.json();
  return [];
};

const createRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'members'>): Promise<Room> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/rooms', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(roomData),
  // });
  // if (!response.ok) throw new Error('Failed to create room');
  // return response.json();
  return {
    ...roomData,
    id: Date.now().toString(),
    members: [],
    createdAt: Date.now(),
  };
};

export function useChatRooms() {
  const { address } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all chat rooms
  const {
    data: rooms = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Room[]>({
    queryKey: ['chatRooms'],
    queryFn: fetchRooms,
    enabled: !!address, // Only fetch if user is connected
  });

  // Create a new room
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (newRoom) => {
      // Update the rooms cache with the new room
      queryClient.setQueryData<Room[]>(['chatRooms'], (oldRooms = []) => [
        newRoom,
        ...oldRooms,
      ]);
      toast({
        title: 'Room created',
        description: `${newRoom.name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating room',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Join a room
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!address) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        return false;
      }

      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/rooms/${roomId}/join`, { method: 'POST' });
        
        // Optimistically update the room's members list
        queryClient.setQueryData<Room[]>(['chatRooms'], (oldRooms = []) =>
          oldRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  members: [
                    ...room.members,
                    { id: address, address, name: address.slice(0, 8) },
                  ],
                }
              : room
          )
        );
        
        toast({
          title: 'Success',
          description: 'You have joined the room',
        });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to join room',
          variant: 'destructive',
        });
        return false;
      }
    },
    [address, queryClient, toast]
  );

  // Leave a room
  const leaveRoom = useCallback(
    async (roomId: string) => {
      if (!address) return false;

      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' });
        
        // Optimistically update the room's members list
        queryClient.setQueryData<Room[]>(['chatRooms'], (oldRooms = []) =>
          oldRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  members: room.members.filter(
                    (member) => member.address.toLowerCase() !== address.toLowerCase()
                  ),
                }
              : room
          )
        );
        
        toast({
          title: 'Success',
          description: 'You have left the room',
        });
        return true;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to leave room',
          variant: 'destructive',
        });
        return false;
      }
    },
    [address, queryClient, toast]
  );

  // Check if user is a member of a room
  const isUserInRoom = useCallback(
    (room: Room): boolean => {
      if (!address) return false;
      return room.members.some(
        (member) => member.address.toLowerCase() === address.toLowerCase()
      );
    },
    [address]
  );

  return {
    // Data
    rooms,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    createRoom: createRoomMutation.mutate,
    joinRoom,
    leaveRoom,
    isUserInRoom,
    refetchRooms: refetch,
    
    // Derived state
    userRooms: rooms.filter((room) =>
      room.members.some((m) => m.address.toLowerCase() === address?.toLowerCase())
    ),
  };
}
