import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address, Abi } from "viem";

import CONTRACT_ABI from "@/contracts/ambienceChat.json";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";
import type { Message } from "@/types/message";

// Constants
const MESSAGES_PER_PAGE = 20;
const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes

// Get current contract address (you might want to get this from config/env)
const getContractAddress = (): Address => {
  return CONTRACT_ADDRESSES.localhost.AMBIENCE_CHAT as Address;
};

interface BatchTransaction {
  id: string;
  functionName: string;
  args: readonly unknown[];
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

interface UseContractReturn {
  // State
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  pendingBatches: number;

  // Write operations
  createRoom: (roomName: string, isPrivate?: boolean) => Promise<any>;
  joinRoom: (roomId: number) => Promise<any>;
  sendMessage: (roomId: number, content: string) => Promise<any>;

  // Batch operations
  batchTransactions: (transactions: Omit<BatchTransaction, 'id'>[]) => void;
  clearPendingBatches: () => void;

  // Utility functions
  invalidateMessages: (roomId?: string) => void;
}

/**
 * Hook for reading messages with pagination
 */
export function useMessages(roomId: string, page: number = 1) {
  const { isConnected } = useAccount();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useReadContract({
    address: getContractAddress(),
    abi: CONTRACT_ABI.abi as Abi,
    functionName: "getRoomMessages",
    args: [BigInt(roomId), BigInt((page - 1) * MESSAGES_PER_PAGE), BigInt(MESSAGES_PER_PAGE)],
    query: {
      enabled: isConnected && !!roomId,
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    },
  });

  // Transform the result to match our Message type
  const messages: Message[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((msg, index) => ({
      id: `${roomId}-${(page - 1) * MESSAGES_PER_PAGE + index}`,
      sender: msg[0], // sender address
      content: msg[1], // content
      timestamp: Number(msg[2]) * 1000, // Convert to milliseconds
      roomId,
    }));
  }, [data, roomId, page]);

  // Calculate pagination metadata
  const hasNextPage = messages.length === MESSAGES_PER_PAGE;
  
  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isLoading) {
      queryClient.fetchQuery({
        queryKey: ['messages', roomId, page + 1],
        staleTime: STALE_TIME,
      });
    }
  }, [hasNextPage, isLoading, roomId, page, queryClient]);

  return {
    data: messages,
    isLoading,
    error: error ? new Error(error.message) : null,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage: isLoading && page > 1,
    refetch,
  };
}

/**
 * Optimized useContract hook with pagination, caching, and batching
 */
export function useContract(): UseContractReturn {
  const { address: userAddress, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingBatches, setPendingBatches] = useState(0);

  // Refs for cleanup
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const transactionBatchRef = useRef<BatchTransaction[]>([]);

  // Optimized wagmi hooks
  const { writeContractAsync } = useWriteContract();

  // Memoized contract config
  const contractConfig = useMemo(() => ({
    address: getContractAddress(),
    abi: CONTRACT_ABI.abi as Abi,
  }), []);

  // Optimized createRoom with error handling and cache invalidation
  const createRoomMutation = useMutation({
    mutationFn: async ({ roomName, isPrivate = false }: { roomName: string; isPrivate?: boolean }) => {
      setLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          ...contractConfig,
          functionName: "createRoom",
          args: [roomName, isPrivate],
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        
        return hash;
      } catch (err) {
        const error = new Error(err instanceof Error ? err.message : "Create room failed");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    retry: 1,
  });

  // Optimized joinRoom with cache invalidation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      setLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          ...contractConfig,
          functionName: "addRoomMember",
          args: [BigInt(roomId), userAddress!],
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
        queryClient.invalidateQueries({ queryKey: ['user-rooms'] });
        
        return hash;
      } catch (err) {
        const error = new Error(err instanceof Error ? err.message : "Join room failed");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    retry: 1,
  });

  // Optimized sendMessage with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, content }: { roomId: number; content: string }) => {
      setLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          ...contractConfig,
          functionName: "sendMessage",
          args: [BigInt(roomId), content],
        });
        
        // Optimistically update the cache
        queryClient.setQueryData(['messages', roomId, 1], (old: Message[] = []) => {
          const newMessage: Message = {
            id: hash || Date.now().toString(),
            sender: userAddress!,
            content,
            timestamp: Date.now(),
            roomId: roomId.toString(),
          };
          return [newMessage, ...old];
        });
        
        // Invalidate to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
        
        return hash;
      } catch (err) {
        const error = new Error(err instanceof Error ? err.message : "Send message failed");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    retry: 1,
  });

  // Transaction batching system
  const processBatch = useCallback(async (transactions: BatchTransaction[]) => {
    if (transactions.length === 0) return;

    setLoading(true);
    setPendingBatches(transactions.length);

    try {
      // Group transactions by gas estimation
      const results = await Promise.allSettled(
        transactions.map(async (tx) => {
          try {
            const hash = await writeContractAsync({
              ...contractConfig,
              functionName: tx.functionName,
              args: tx.args,
            });
            
            tx.onSuccess?.(hash);
            return { success: true, hash };
          } catch (err) {
            const error = new Error(err instanceof Error ? err.message : `${tx.functionName} failed`);
            tx.onError?.(error);
            return { success: false, error };
          }
        })
      );

      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-memberships'] });

    } catch (err) {
      console.error('Batch transaction error:', err);
    } finally {
      setLoading(false);
      setPendingBatches(0);
      transactionBatchRef.current = [];
    }
  }, [contractConfig, writeContractAsync, queryClient]);

  // Batch transactions with debouncing
  const batchTransactions = useCallback((transactions: Omit<BatchTransaction, 'id'>[]) => {
    const newTransactions: BatchTransaction[] = transactions.map((tx, index) => ({
      ...tx,
      id: `batch-${Date.now()}-${index}`,
    }));

    transactionBatchRef.current.push(...newTransactions);

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout to process batch
    batchTimeoutRef.current = setTimeout(() => {
      const batch = transactionBatchRef.current.splice(0);
      processBatch(batch);
    }, 1000); // 1 second debounce
  }, [processBatch]);

  // Clear pending batches
  const clearPendingBatches = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    transactionBatchRef.current = [];
    setPendingBatches(0);
  }, []);

  // Invalidate messages cache
  const invalidateMessages = useCallback((roomId?: string) => {
    if (roomId) {
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  }, [queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    loading: loading || createRoomMutation.isPending || joinRoomMutation.isPending || sendMessageMutation.isPending,
    error: error || createRoomMutation.error || joinRoomMutation.error || sendMessageMutation.error,
    isConnected,
    pendingBatches,

    // Write operations
    createRoom: (roomName: string, isPrivate = false) => createRoomMutation.mutateAsync({ roomName, isPrivate }),
    joinRoom: joinRoomMutation.mutateAsync,
    sendMessage: (roomId: number, content: string) => sendMessageMutation.mutateAsync({ roomId, content }),

    // Batch operations
    batchTransactions,
    clearPendingBatches,

    // Utility functions
    invalidateMessages,
  };
}