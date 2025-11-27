/**
 * src/hooks/examples/TransactionExample.tsx
 * 
 * Example component demonstrating how to use the useTransactionStatus hook
 */
'use client';

import { useState } from 'react';
import { useTransactionStatus } from '@/hooks';
import { useSendTransaction, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import type { Hash } from 'viem';

export function TransactionExample() {
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currentTxHash, setCurrentTxHash] = useState<Hash | null>(null);

  const {
    trackTransaction,
    getStatus,
    getTransaction,
    getReceipt,
    getError,
    transactions,
    history,
    getPendingTransactions,
    hasPendingTransactions,
    clearHistory,
  } = useTransactionStatus({
    confirmations: 2,
    persist: true,
    maxHistorySize: 50,
    onStatusChange: (hash, status) => {
      console.log(`Transaction ${hash} status changed to: ${status}`);
    },
    onSuccess: (hash, receipt) => {
      console.log('Transaction successful!', {
        hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      });
      alert('Transaction confirmed successfully!');
    },
    onError: (hash, error) => {
      console.error('Transaction failed:', error);
      alert(`Transaction failed: ${error.message}`);
    },
  });

  const handleSendTransaction = async () => {
    if (!recipient || !amount) {
      alert('Please enter recipient address and amount');
      return;
    }

    try {
      const hash = await sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      });

      if (hash) {
        setCurrentTxHash(hash);

        // Track the transaction
        await trackTransaction(hash, {
          description: `Send ${amount} ETH to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
          from: address,
          to: recipient,
          value: parseEther(amount),
        });
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Send Transaction Form */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
          Send Transaction
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              step="0.01"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            onClick={handleSendTransaction}
            disabled={!address || hasPendingTransactions()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {hasPendingTransactions()
              ? 'Transaction Pending...'
              : 'Send Transaction'}
          </button>
        </div>

        {/* Current Transaction Status */}
        {currentTxHash && (
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Current Transaction
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Hash:
                </span>
                <code className="bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-slate-900 dark:text-slate-100">
                  {currentTxHash.slice(0, 10)}...{currentTxHash.slice(-8)}
                </code>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Status:
                </span>
                <span
                  className={`px-2 py-1 rounded font-medium ${
                    getStatus(currentTxHash) === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : getStatus(currentTxHash) === 'error' ||
                          getStatus(currentTxHash) === 'reverted'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {getStatus(currentTxHash)}
                </span>
              </div>

              {getTransaction(currentTxHash)?.confirmations !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Confirmations:
                  </span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {getTransaction(currentTxHash)?.confirmations}
                  </span>
                </div>
              )}

              {getReceipt(currentTxHash) && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Block:
                  </span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {getReceipt(currentTxHash)?.blockNumber.toString()}
                  </span>
                </div>
              )}

              {getError(currentTxHash) && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-red-800 dark:text-red-200 text-xs">
                    {getError(currentTxHash)?.message}
                  </p>
                </div>
              )}

              {getReceipt(currentTxHash) && (
                <a
                  href={`https://basescan.org/tx/${currentTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
          Active Transactions ({transactions.length})
        </h3>

        {transactions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No active transactions
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {tx.description || 'Transaction'}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      tx.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : tx.status === 'error' || tx.status === 'reverted'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </p>
                {tx.confirmations !== undefined && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Confirmations: {tx.confirmations}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Transactions */}
      {getPendingTransactions().length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-900 dark:text-yellow-100">
            ⏳ Pending Transactions ({getPendingTransactions().length})
          </h3>

          <div className="space-y-2">
            {getPendingTransactions().map((tx) => (
              <div
                key={tx.hash}
                className="p-3 bg-white dark:bg-yellow-900/30 rounded"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {tx.description || 'Pending Transaction'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Transaction History ({history.length})
          </h3>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No transaction history
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {tx.description || 'Transaction'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      tx.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </p>
                {tx.receipt && (
                  <a
                    href={`https://basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2 inline-block"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}