/**
 * src/hooks/useTransactionStatus.ts
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient, useWatchPendingTransactions } from 'wagmi';
import type { Hash, TransactionReceipt } from 'viem';
import type {
  TransactionStatus,
  TransactionData,
  TransactionHistoryItem,
  TransactionError,
  UseTransactionStatusOptions,
} from '@/types/transaction';

const STORAGE_KEY = 'transaction_history';
const DEFAULT_CONFIRMATIONS = 1;
const DEFAULT_MAX_HISTORY = 50;

/**
 * Custom hook for managing transaction status, receipts, and history
 */
export function useTransactionStatus(options: UseTransactionStatusOptions = {}) {
  const {
    confirmations = DEFAULT_CONFIRMATIONS,
    persist = true,
    maxHistorySize = DEFAULT_MAX_HISTORY,
    onStatusChange,
    onSuccess,
    onError,
  } = options;

  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Map<Hash, TransactionData>>(
    new Map()
  );
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const intervalRefs = useRef<Map<Hash, NodeJS.Timeout>>(new Map());
  const mountedRef = useRef(true);

  // Load transaction history from localStorage on mount
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TransactionHistoryItem[];
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Failed to load transaction history:', error);
      }
    }

    // Capture the current ref value in the cleanup function
    const currentIntervalRefs = intervalRefs.current;
    return () => {
      mountedRef.current = false;
      // Clear all polling intervals on unmount
      currentIntervalRefs.forEach((interval) => clearInterval(interval));
      currentIntervalRefs.clear();
    };
  }, [persist]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (persist && typeof window !== 'undefined' && history.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save transaction history:', error);
      }
    }
  }, [history, persist]);

  // Watch for pending transactions
  useWatchPendingTransactions({
    onTransactions: (hashes) => {
      hashes.forEach((hash) => {
        if (!transactions.has(hash)) {
          trackTransaction(hash);
        }
      });
    },
  });

  /**
   * Update transaction status
   */
  const updateTransactionStatus = useCallback(
    (hash: Hash, updates: Partial<TransactionData>) => {
      if (!mountedRef.current) return;

      setTransactions((prev) => {
        const current = prev.get(hash);
        if (!current) return prev;

        const updated = { ...current, ...updates };
        const newMap = new Map(prev);
        newMap.set(hash, updated);

        // Trigger status change callback
        if (updates.status && updates.status !== current.status) {
          onStatusChange?.(hash, updates.status);
        }

        return newMap;
      });
    },
    [onStatusChange]
  );

  /**
   * Add transaction to history
   */
  const addToHistory = useCallback(
    (transaction: TransactionData) => {
      const historyItem: TransactionHistoryItem = {
        ...transaction,
        id: `${transaction.hash}-${transaction.timestamp}`,
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.hash !== transaction.hash);
        const updated = [historyItem, ...filtered].slice(0, maxHistorySize);
        return updated;
      });
    },
    [maxHistorySize]
  );

  /**
   * Poll for transaction receipt
   */
  const pollForReceipt = useCallback(
    async (hash: Hash) => {
      if (!publicClient || !mountedRef.current) return;

      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });

        if (!receipt || !mountedRef.current) return;

        const status: TransactionStatus =
          receipt.status === 'success' ? 'success' : 'reverted';

        // Get current block number for confirmations
        const currentBlock = await publicClient.getBlockNumber();
        const confirmationCount = Number(
          currentBlock - receipt.blockNumber + 1n
        );

        updateTransactionStatus(hash, {
          status:
            confirmationCount >= confirmations ? status : 'confirming',
          receipt,
          confirmations: confirmationCount,
        });

        // If we have enough confirmations, finalize the transaction
        if (confirmationCount >= confirmations) {
          const transaction = transactions.get(hash);
          if (transaction) {
            addToHistory({ ...transaction, status, receipt });

            if (status === 'success') {
              onSuccess?.(hash, receipt);
            } else {
              const error: TransactionError = {
                message: 'Transaction reverted',
                timestamp: Date.now(),
              };
              onError?.(hash, error);
            }
          }

          // Clear polling interval
          const interval = intervalRefs.current.get(hash);
          if (interval) {
            clearInterval(interval);
            intervalRefs.current.delete(hash);
          }
        }
      } catch (error) {
        // Receipt not yet available, continue polling
        if (
          error instanceof Error &&
          error.message.includes('Transaction receipt not found')
        ) {
          return;
        }

        // Handle other errors
        const txError: TransactionError = {
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
          timestamp: Date.now(),
        };

        updateTransactionStatus(hash, {
          status: 'error',
          error: txError,
        });

        onError?.(hash, txError);

        // Clear polling interval
        const interval = intervalRefs.current.get(hash);
        if (interval) {
          clearInterval(interval);
          intervalRefs.current.delete(hash);
        }
      }
    },
    [
      publicClient,
      confirmations,
      transactions,
      updateTransactionStatus,
      addToHistory,
      onSuccess,
      onError,
    ]
  );

  /**
   * Track a new transaction
   */
  const trackTransaction = useCallback(
    async (
      hash: Hash,
      metadata?: {
        description?: string;
        from?: string;
        to?: string;
        value?: bigint;
        data?: string;
        chainId?: number;
        [key: string]: unknown;
      }
    ) => {
      if (!publicClient) {
        console.error('Public client not available');
        return;
      }

      // Initialize transaction data
      const transactionData: TransactionData = {
        hash,
        timestamp: Date.now(),
        status: 'pending',
        from: metadata?.from,
        to: metadata?.to,
        value: metadata?.value,
        data: metadata?.data,
        chainId: metadata?.chainId,
        description: metadata?.description,
        metadata: metadata
          ? Object.fromEntries(
              Object.entries(metadata).filter(
                ([key]) =>
                  ![
                    'description',
                    'from',
                    'to',
                    'value',
                    'data',
                    'chainId',
                  ].includes(key)
              )
            )
          : undefined,
      };

      setTransactions((prev) => {
        const newMap = new Map(prev);
        newMap.set(hash, transactionData);
        return newMap;
      });

      // Start polling for receipt
      const interval = setInterval(() => {
        pollForReceipt(hash);
      }, 2000); // Poll every 2 seconds

      intervalRefs.current.set(hash, interval);

      // Initial poll
      pollForReceipt(hash);
    },
    [publicClient, pollForReceipt]
  );

  /**
   * Get transaction status by hash
   */
  const getTransaction = useCallback(
    (hash: Hash): TransactionData | undefined => {
      return transactions.get(hash);
    },
    [transactions]
  );

  /**
   * Get transaction status
   */
  const getStatus = useCallback(
    (hash: Hash): TransactionStatus => {
      return transactions.get(hash)?.status || 'idle';
    },
    [transactions]
  );

  /**
   * Get transaction receipt
   */
  const getReceipt = useCallback(
    (hash: Hash): TransactionReceipt | undefined => {
      return transactions.get(hash)?.receipt;
    },
    [transactions]
  );

  /**
   * Get transaction error
   */
  const getError = useCallback(
    (hash: Hash): TransactionError | undefined => {
      return transactions.get(hash)?.error;
    },
    [transactions]
  );

  /**
   * Clear a transaction from tracking
   */
  const clearTransaction = useCallback((hash: Hash) => {
    setTransactions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(hash);
      return newMap;
    });

    // Clear polling interval if exists
    const interval = intervalRefs.current.get(hash);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(hash);
    }
  }, []);

  /**
   * Clear all transactions
   */
  const clearAllTransactions = useCallback(() => {
    setTransactions(new Map());

    // Clear all polling intervals
    intervalRefs.current.forEach((interval) => clearInterval(interval));
    intervalRefs.current.clear();
  }, []);

  /**
   * Clear transaction history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (persist && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [persist]);

  /**
   * Get pending transactions
   */
  const getPendingTransactions = useCallback((): TransactionData[] => {
    return Array.from(transactions.values()).filter(
      (tx) => tx.status === 'pending' || tx.status === 'confirming'
    );
  }, [transactions]);

  /**
   * Check if any transaction is pending
   */
  const hasPendingTransactions = useCallback((): boolean => {
    return getPendingTransactions().length > 0;
  }, [getPendingTransactions]);

  return {
    // Transaction tracking
    trackTransaction,
    getTransaction,
    getStatus,
    getReceipt,
    getError,

    // Transaction management
    clearTransaction,
    clearAllTransactions,

    // History management
    history,
    clearHistory,

    // Utility functions
    getPendingTransactions,
    hasPendingTransactions,

    // Current transactions map
    transactions: Array.from(transactions.values()),
  };
}