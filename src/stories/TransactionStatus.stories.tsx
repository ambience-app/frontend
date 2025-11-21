import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useTransactionStatus } from '@/hooks';
import type { Hash } from 'viem';

// Demo component to showcase the hook
function TransactionStatusDemo() {
  const {
    trackTransaction,
    getStatus,
    getTransaction,
    transactions,
    history,
    getPendingTransactions,
    clearHistory,
    clearAllTransactions,
  } = useTransactionStatus({
    confirmations: 2,
    onStatusChange: (hash, status) => {
      console.log(`Transaction ${hash} changed to ${status}`);
    },
    onSuccess: (hash, receipt) => {
      console.log('Transaction successful!', { hash, receipt });
    },
    onError: (hash, error) => {
      console.error('Transaction failed!', { hash, error });
    },
  });

  const [mockHash, setMockHash] = useState<Hash | null>(null);

  const simulateTransaction = async () => {
    // Generate a mock transaction hash
    const hash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}` as Hash;
    setMockHash(hash);

    await trackTransaction(hash, {
      description: 'Mock Transfer Transaction',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: BigInt('1000000000000000000'), // 1 ETH
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
          Transaction Status Hook Demo
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          This demo showcases the useTransactionStatus hook functionality.
          Note: This is a mock demo and doesn't interact with real blockchain.
        </p>

        <div className="space-y-4">
          <button
            onClick={simulateTransaction}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Simulate Transaction
          </button>

          {mockHash && (
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Current Transaction
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Hash:</span>{' '}
                  <code className="bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                    {mockHash.slice(0, 10)}...{mockHash.slice(-8)}
                  </code>
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`px-2 py-1 rounded ${
                      getStatus(mockHash) === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : getStatus(mockHash) === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {getStatus(mockHash)}
                  </span>
                </p>
                {getTransaction(mockHash)?.description && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Description:</span>{' '}
                    {getTransaction(mockHash)?.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Active Transactions ({transactions.length})
          </h3>
          <button
            onClick={clearAllTransactions}
            className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Clear All
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No active transactions
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
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
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
          Pending Transactions ({getPendingTransactions().length})
        </h3>

        {getPendingTransactions().length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No pending transactions
          </p>
        ) : (
          <div className="space-y-2">
            {getPendingTransactions().map((tx) => (
              <div
                key={tx.hash}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
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
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Transaction History ({history.length})
          </h3>
          <button
            onClick={clearHistory}
            className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Clear History
          </button>
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
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof TransactionStatusDemo> = {
  title: 'Hooks/useTransactionStatus',
  component: TransactionStatusDemo,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TransactionStatusDemo>;

export const Default: Story = {};