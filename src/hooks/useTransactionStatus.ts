/**
 * src/hooks/useTransactionStatus.ts
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient, useWatchPendingTransactions, useAccount } from 'wagmi';
import type { Hash, TransactionReceipt, Chain } from 'viem';
import type {
  TransactionStatus,
  TransactionData,
  TransactionHistoryItem,
  TransactionError,
  UseTransactionStatusOptions,
} from '@/types/transaction';
import { handleContractError } from '@/lib/security/errors';

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
  const [networkChanged, setNetworkChanged] = useState(false);
  const intervalRefs = useRef<Map<Hash, { interval: NodeJS.Timeout; startTime: number }>>(new Map());
  const mountedRef = useRef(true);
  const { chain } = useAccount();
  const lastChainId = useRef<number | undefined>();

  // Watch for network changes
  useEffect(() => {
    if (chain?.id && lastChainId.current && chain.id !== lastChainId.current) {
      setNetworkChanged(true);
      // Update all pending transactions to show network change
      setTransactions(prev => {
        const newMap = new Map(prev);
        newMap.forEach((tx, hash) => {
          if (tx.status === 'pending' || tx.status === 'confirming') {
            newMap.set(hash, {
              ...tx,
              status: 'error',
              error: {
                message: 'Network changed',
                code: 'NETWORK_CHANGED',
                timestamp: Date.now(),
                details: `Changed from chain ${lastChainId.current} to ${chain.id}`
              }
            });
          }
        });
        return newMap;
      });
    }
    lastChainId.current = chain?.id;
  }, [chain?.id]);

  // Load transaction history from localStorage on mount
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TransactionHistoryItem[];
          // Filter out any transactions older than 7 days
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const filtered = parsed.filter(tx => 
            tx.timestamp > oneWeekAgo && 
            (!tx.metadata?.expiresAt || tx.metadata.expiresAt > Date.now())
          );
          setHistory(filtered);
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
      currentIntervalRefs.forEach(({ interval }) => clearInterval(interval));
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

        // Check if the transaction was reverted
        let status: TransactionStatus = receipt.status === 'success' ? 'success' : 'reverted';
        let error: TransactionError | undefined;

        // If reverted, try to get the revert reason
        if (status === 'reverted') {
          try {
            const tx = await publicClient.getTransaction({ hash });
            const code = await publicClient.call({
              ...tx,
              account: tx.from,
            });
            
            error = {
              message: 'Transaction reverted',
              code: 'REVERTED',
              timestamp: Date.now(),
              details: code.errorMessage || 'Transaction was reverted by the EVM',
            };
          } catch (revertError) {
            error = {
              message: 'Transaction reverted',
              code: 'REVERTED',
              timestamp: Date.now(),
              details: 'Transaction was reverted by the EVM',
            };
          }
        }

        // Get current block number for confirmations
        const currentBlock = await publicClient.getBlockNumber();
        const confirmationCount = Number(
          currentBlock - receipt.blockNumber + 1n
        );

        updateTransactionStatus(hash, {
          status: confirmationCount >= confirmations ? status : 'confirming',
          receipt,
          confirmations: confirmationCount,
          ...(error ? { error } : {}),
        });

        // If we have enough confirmations, finalize the transaction
        if (confirmationCount >= confirmations) {
          const transaction = transactions.get(hash);
          if (transaction) {
            const finalTx = { ...transaction, status, receipt };
            if (error) {
              finalTx.error = error;
            }
            addToHistory(finalTx);

            if (status === 'success') {
              onSuccess?.(hash, receipt);
            } else if (error) {
              onError?.(hash, error);
            } else {
              const defaultError: TransactionError = {
                message: 'Transaction reverted',
                code: 'UNKNOWN_REVERT',
                timestamp: Date.now(),
              };
              onError?.(hash, defaultError);
            }
          }

          // Clear polling interval
          const intervalData = intervalRefs.current.get(hash);
          if (intervalData) {
            clearInterval(intervalData.interval);
            intervalRefs.current.delete(hash);
          }
        }
      } catch (error) {
        // Check for network change
        if (networkChanged) {
          const networkError: TransactionError = {
            message: 'Network changed',
            code: 'NETWORK_CHANGED',
            timestamp: Date.now(),
            details: 'The network was changed while the transaction was pending'
          };
          
          updateTransactionStatus(hash, {
            status: 'error',
            error: networkError,
          });
          
          onError?.(hash, networkError);
          
          // Clear polling interval
          const intervalData = intervalRefs.current.get(hash);
          if (intervalData) {
            clearInterval(intervalData.interval);
            intervalRefs.current.delete(hash);
          }
          return;
        }
        
        // Receipt not yet available, continue polling
        if (
          error instanceof Error &&
          error.message.includes('Transaction receipt not found')
        ) {
          // Check for transaction timeout (30 minutes)
          const txData = intervalRefs.current.get(hash);
          if (txData && Date.now() - txData.startTime > 30 * 60 * 1000) {
            const timeoutError: TransactionError = {
              message: 'Transaction timed out',
              code: 'TIMEOUT',
              timestamp: Date.now(),
              details: 'Transaction took too long to confirm (30+ minutes)'
            };
            
            updateTransactionStatus(hash, {
              status: 'error',
              error: timeoutError,
            });
            
            onError?.(hash, timeoutError);
            
            // Clear polling interval
            clearInterval(txData.interval);
            intervalRefs.current.delete(hash);
          }
          return;
        }

        // Handle other errors using the contract error handler
        const handledError = handleContractError(error, 'transaction_receipt');
        const txError: TransactionError = {
          message: handledError.message,
          code: handledError.code?.toString(),
          timestamp: Date.now(),
          details: handledError.details,
        };

        updateTransactionStatus(hash, {
          status: 'error',
          error: txError,
        });

        onError?.(hash, txError);

        // Clear polling interval
        const intervalData = intervalRefs.current.get(hash);
        if (intervalData) {
          clearInterval(intervalData.interval);
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

      // Start polling for receipt with exponential backoff
      let pollInterval = 2000; // Start with 2 seconds
      const maxInterval = 30000; // Max 30 seconds between polls
      
      const poll = async () => {
        await pollForReceipt(hash);
        
        // If still polling, set next interval with backoff (but don't exceed max)
        if (intervalRefs.current.has(hash)) {
          pollInterval = Math.min(pollInterval * 1.5, maxInterval);
          const intervalId = setTimeout(poll, pollInterval);
          
          // Update the interval reference
          const existing = intervalRefs.current.get(hash);
          if (existing) {
            clearTimeout(existing.interval);
            intervalRefs.current.set(hash, {
              interval: intervalId,
              startTime: existing.startTime
            });
          }
        }
      };
      
      const initialInterval = setInterval(poll, pollInterval);
      intervalRefs.current.set(hash, {
        interval: initialInterval,
        startTime: Date.now()
      });

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
    const intervalData = intervalRefs.current.get(hash);
    if (intervalData) {
      clearInterval(intervalData.interval);
      intervalRefs.current.delete(hash);
    }
  }, []);

  /**
   * Clear all transactions
   */
  const clearAllTransactions = useCallback(() => {
    setTransactions(new Map());

    // Clear all polling intervals
    intervalRefs.current.forEach(({ interval }) => clearInterval(interval));
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