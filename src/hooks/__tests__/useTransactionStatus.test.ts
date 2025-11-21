/**
 * src/hooks/__tests__/useTransactionStatus.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTransactionStatus } from '../useTransactionStatus';
import type { Hash, TransactionReceipt } from 'viem';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  usePublicClient: vi.fn(),
  useWatchPendingTransactions: vi.fn(),
}));

const mockHash: Hash =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

const mockReceipt: TransactionReceipt = {
  blockHash:
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hash,
  blockNumber: 1000n,
  contractAddress: null,
  cumulativeGasUsed: 21000n,
  effectiveGasPrice: 1000000000n,
  from: '0x1234567890123456789012345678901234567890',
  gasUsed: 21000n,
  logs: [],
  logsBloom: '0x00' as `0x${string}`,
  status: 'success' as const,
  to: '0x0987654321098765432109876543210987654321',
  transactionHash: mockHash,
  transactionIndex: 0,
  type: 'legacy' as const,
};

describe('useTransactionStatus', () => {
  let mockPublicClient: {
    getTransactionReceipt: ReturnType<typeof vi.fn>;
    getBlockNumber: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Setup mock public client
    mockPublicClient = {
      getTransactionReceipt: vi.fn(),
      getBlockNumber: vi.fn().mockResolvedValue(1001n),
    };

    const { usePublicClient } = require('wagmi');
    usePublicClient.mockReturnValue(mockPublicClient);

    // Clear all timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTransactionStatus());

    expect(result.current.transactions).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.hasPendingTransactions()).toBe(false);
  });

  it('should track a new transaction', async () => {
    mockPublicClient.getTransactionReceipt.mockRejectedValue(
      new Error('Transaction receipt not found')
    );

    const { result } = renderHook(() => useTransactionStatus());

    await act(async () => {
      await result.current.trackTransaction(mockHash, {
        description: 'Test transaction',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
      });
    });

    await waitFor(() => {
      expect(result.current.getStatus(mockHash)).toBe('pending');
    });

    const transaction = result.current.getTransaction(mockHash);
    expect(transaction).toBeDefined();
    expect(transaction?.hash).toBe(mockHash);
    expect(transaction?.description).toBe('Test transaction');
  });

  it('should update transaction status to success when receipt is available', async () => {
    mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useTransactionStatus({ onSuccess, confirmations: 1 })
    );

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    // Fast-forward timers to trigger polling
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(
      () => {
        expect(result.current.getStatus(mockHash)).toBe('success');
      },
      { timeout: 5000 }
    );

    expect(onSuccess).toHaveBeenCalledWith(mockHash, mockReceipt);
    expect(result.current.getReceipt(mockHash)).toEqual(mockReceipt);
  });

  it('should handle reverted transactions', async () => {
    const revertedReceipt = { ...mockReceipt, status: 'reverted' as const };
    mockPublicClient.getTransactionReceipt.mockResolvedValue(revertedReceipt);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useTransactionStatus({ onError, confirmations: 1 })
    );

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.getStatus(mockHash)).toBe('reverted');
    });

    expect(onError).toHaveBeenCalled();
  });

  it('should wait for confirmations before marking as success', async () => {
    mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);
    mockPublicClient.getBlockNumber.mockResolvedValue(1000n); // Same block as receipt

    const { result } = renderHook(() =>
      useTransactionStatus({ confirmations: 3 })
    );

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.getStatus(mockHash)).toBe('confirming');
    });

    // Advance block number
    mockPublicClient.getBlockNumber.mockResolvedValue(1003n);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.getStatus(mockHash)).toBe('success');
    });
  });

  it('should handle transaction errors', async () => {
    mockPublicClient.getTransactionReceipt.mockRejectedValue(
      new Error('Network error')
    );

    const onError = vi.fn();
    const { result } = renderHook(() => useTransactionStatus({ onError }));

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      const error = result.current.getError(mockHash);
      expect(error).toBeDefined();
      expect(error?.message).toContain('Network error');
    });
  });

  it('should manage transaction history', async () => {
    mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

    const { result } = renderHook(() =>
      useTransactionStatus({ persist: false, confirmations: 1 })
    );

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.history.length).toBeGreaterThan(0);
    });

    const historyItem = result.current.history[0];
    expect(historyItem.hash).toBe(mockHash);
    expect(historyItem.status).toBe('success');
  });

  it('should clear transaction', async () => {
    mockPublicClient.getTransactionReceipt.mockRejectedValue(
      new Error('Transaction receipt not found')
    );

    const { result } = renderHook(() => useTransactionStatus());

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await waitFor(() => {
      expect(result.current.getTransaction(mockHash)).toBeDefined();
    });

    act(() => {
      result.current.clearTransaction(mockHash);
    });

    expect(result.current.getTransaction(mockHash)).toBeUndefined();
  });

  it('should clear all transactions', async () => {
    mockPublicClient.getTransactionReceipt.mockRejectedValue(
      new Error('Transaction receipt not found')
    );

    const { result } = renderHook(() => useTransactionStatus());

    const hash2: Hash =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    await act(async () => {
      await result.current.trackTransaction(mockHash);
      await result.current.trackTransaction(hash2);
    });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(2);
    });

    act(() => {
      result.current.clearAllTransactions();
    });

    expect(result.current.transactions).toEqual([]);
  });

  it('should persist history to localStorage', async () => {
    mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

    const { result } = renderHook(() =>
      useTransactionStatus({ persist: true, confirmations: 1 })
    );

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.history.length).toBeGreaterThan(0);
    });

    const stored = localStorage.getItem('transaction_history');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].hash).toBe(mockHash);
  });

  it('should get pending transactions', async () => {
    mockPublicClient.getTransactionReceipt.mockRejectedValue(
      new Error('Transaction receipt not found')
    );

    const { result } = renderHook(() => useTransactionStatus());

    await act(async () => {
      await result.current.trackTransaction(mockHash);
    });

    await waitFor(() => {
      expect(result.current.hasPendingTransactions()).toBe(true);
    });

    const pending = result.current.getPendingTransactions();
    expect(pending).toHaveLength(1);
    expect(pending[0].hash).toBe(mockHash);
  });

  it('should respect maxHistorySize option', async () => {
    mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

    const { result } = renderHook(() =>
      useTransactionStatus({ maxHistorySize: 2, confirmations: 1 })
    );

    const hashes: Hash[] = [
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333333333333333333333333333',
    ];

    for (const hash of hashes) {
      await act(async () => {
        await result.current.trackTransaction(hash);
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
    }

    await waitFor(() => {
      expect(result.current.history.length).toBeLessThanOrEqual(2);
    });
  });
});