import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types/message';
import { useContract, useMessages } from '@/hooks/useContract';

const MESSAGES_PER_PAGE = 20;

export function useChat(roomId: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const contract = useContract();

  // Use the optimized message pagination
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
  } = useMessages(roomId, 1);

  const isSending = useMemo(() => contract.loading, [contract.loading]);
  const sendError = useMemo(() => contract.error, [contract.error]);

  const sendMessage = useCallback(async (content: string) => {
    if (!address) return;

    try {
      await contract.sendMessage(parseInt(roomId), content);
      // The optimistic update and cache invalidation are handled by the contract hook
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [address, roomId, contract]);

  const createRoom = useCallback(async (roomName: string, isPrivate = false) => {
    if (!address) return;

    try {
      await contract.createRoom(roomName, isPrivate);
      // Cache invalidation is handled by the contract hook
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }, [address, contract]);

  const joinRoom = useCallback(async (roomId: number) => {
    if (!address) return;

    try {
      await contract.joinRoom(roomId);
      // Cache invalidation is handled by the contract hook
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }, [address, contract]);

  const invalidateMessages = useCallback(() => {
    contract.invalidateMessages(roomId);
  }, [contract, roomId]);

  // Batch multiple operations
  const batchOperations = useCallback((operations: Array<{
    type: 'sendMessage' | 'joinRoom' | 'createRoom';
    data: { content?: string; roomId?: number; roomName?: string; isPrivate?: boolean };
  }>) => {
    const transactions = operations.map(op => {
      switch (op.type) {
        case 'sendMessage':
          return {
            functionName: 'sendMessage',
            args: [BigInt(roomId), op.data.content || ''],
          };
        case 'joinRoom':
          return {
            functionName: 'addRoomMember',
            args: [BigInt(op.data.roomId || 0), address],
          };
        case 'createRoom':
          return {
            functionName: 'createRoom',
            args: [op.data.roomName || '', op.data.isPrivate || false],
          };
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    });

    contract.batchTransactions(transactions);
  }, [address, roomId, contract]);

  return {
    // State
    messages: messages || [],
    isLoading: isLoadingMessages,
    isSending,
    sendError,
    messagesError,
    isConnected: contract.isConnected,
    pendingBatches: contract.pendingBatches,

    // Actions
    sendMessage,
    createRoom,
    joinRoom,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
    invalidateMessages,

    // Advanced operations
    batchOperations,
    clearPendingBatches: contract.clearPendingBatches,
  };
}
