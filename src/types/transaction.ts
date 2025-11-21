/**
 * src/types/transaction.ts
 */
import type { Address } from './index';
import type { Hash, TransactionReceipt } from 'viem';

export type TransactionStatus =
  | 'idle'
  | 'pending'
  | 'confirming'
  | 'success'
  | 'error'
  | 'reverted';

export interface TransactionError {
  code?: string | number;
  message: string;
  details?: unknown;
  timestamp: number;
}

export interface TransactionData {
  hash: Hash;
  from?: Address;
  to?: Address;
  value?: bigint;
  data?: string;
  chainId?: number;
  timestamp: number;
  status: TransactionStatus;
  receipt?: TransactionReceipt;
  error?: TransactionError;
  confirmations?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionHistoryItem extends TransactionData {
  id: string;
}

export interface UseTransactionStatusOptions {
  /**
   * Number of confirmations to wait before marking transaction as success
   * @default 1
   */
  confirmations?: number;

  /**
   * Enable local storage persistence for transaction history
   * @default true
   */
  persist?: boolean;

  /**
   * Maximum number of transactions to keep in history
   * @default 50
   */
  maxHistorySize?: number;

  /**
   * Callback when transaction status changes
   */
  onStatusChange?: (hash: Hash, status: TransactionStatus) => void;

  /**
   * Callback when transaction is confirmed
   */
  onSuccess?: (hash: Hash, receipt: TransactionReceipt) => void;

  /**
   * Callback when transaction fails
   */
  onError?: (hash: Hash, error: TransactionError) => void;
}