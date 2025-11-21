# useTransactionStatus Hook

A comprehensive React hook for managing blockchain transaction states, receipts, and history in Web3 applications.

## Features

- ✅ **Transaction Status Tracking**: Monitor transaction states (pending, confirming, success, error, reverted)
- ✅ **Receipt Handling**: Automatically fetch and manage transaction receipts
- ✅ **Error Management**: Comprehensive error handling with detailed error information
- ✅ **Transaction History**: Persistent transaction history with localStorage support
- ✅ **Confirmation Tracking**: Configurable confirmation requirements
- ✅ **Callbacks**: Status change, success, and error callbacks
- ✅ **TypeScript**: Full TypeScript support with comprehensive types

## Installation

The hook is already included in this project. It uses:
- `wagmi` for Web3 interactions
- `viem` for Ethereum types
- React hooks for state management

## Basic Usage

```tsx
import { useTransactionStatus } from '@/hooks';

function MyComponent() {
  const { trackTransaction, getStatus, getReceipt } = useTransactionStatus();

  const handleSendTransaction = async () => {
    // Send your transaction using wagmi or viem
    const hash = await sendTransaction(...);
    
    // Start tracking the transaction
    await trackTransaction(hash, {
      description: 'Transfer 1 ETH',
      from: '0x...',
      to: '0x...',
      value: parseEther('1'),
    });
  };

  return (
    <div>
      <button onClick={handleSendTransaction}>Send Transaction</button>
    </div>
  );
}
```

## Advanced Usage

### With Callbacks

```tsx
const { trackTransaction } = useTransactionStatus({
  confirmations: 3, // Wait for 3 confirmations
  onStatusChange: (hash, status) => {
    console.log(`Transaction ${hash} status: ${status}`);
  },
  onSuccess: (hash, receipt) => {
    console.log('Transaction confirmed!', receipt);
    // Show success notification
  },
  onError: (hash, error) => {
    console.error('Transaction failed:', error);
    // Show error notification
  },
});
```

### Monitoring Multiple Transactions

```tsx
function TransactionList() {
  const { 
    transactions, 
    history, 
    getPendingTransactions,
    hasPendingTransactions 
  } = useTransactionStatus();

  return (
    <div>
      <h2>Pending Transactions</h2>
      {getPendingTransactions().map(tx => (
        <div key={tx.hash}>
          <p>Hash: {tx.hash}</p>
          <p>Status: {tx.status}</p>
          <p>Confirmations: {tx.confirmations || 0}</p>
        </div>
      ))}

      <h2>Transaction History</h2>
      {history.map(tx => (
        <div key={tx.id}>
          <p>{tx.description}</p>
          <p>Status: {tx.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Custom Confirmation Requirements

```tsx
// Wait for 12 confirmations (more secure for high-value transactions)
const { trackTransaction } = useTransactionStatus({
  confirmations: 12,
  onSuccess: (hash, receipt) => {
    console.log('Transaction fully confirmed with 12 blocks');
  },
});
```

### Disable Persistence

```tsx
// Don't save to localStorage
const { trackTransaction } = useTransactionStatus({
  persist: false,
});
```

### Limit History Size

```tsx
// Keep only the last 20 transactions
const { trackTransaction } = useTransactionStatus({
  maxHistorySize: 20,
});
```

## API Reference

### Hook Options

```typescript
interface UseTransactionStatusOptions {
  confirmations?: number;        // Default: 1
  persist?: boolean;             // Default: true
  maxHistorySize?: number;       // Default: 50
  onStatusChange?: (hash: Hash, status: TransactionStatus) => void;
  onSuccess?: (hash: Hash, receipt: TransactionReceipt) => void;
  onError?: (hash: Hash, error: TransactionError) => void;
}
```

### Return Values

```typescript
{
  // Transaction tracking
  trackTransaction: (hash: Hash, metadata?: object) => Promise<void>;
  getTransaction: (hash: Hash) => TransactionData | undefined;
  getStatus: (hash: Hash) => TransactionStatus;
  getReceipt: (hash: Hash) => TransactionReceipt | undefined;
  getError: (hash: Hash) => TransactionError | undefined;

  // Transaction management
  clearTransaction: (hash: Hash) => void;
  clearAllTransactions: () => void;

  // History management
  history: TransactionHistoryItem[];
  clearHistory: () => void;

  // Utility functions
  getPendingTransactions: () => TransactionData[];
  hasPendingTransactions: () => boolean;

  // Current transactions
  transactions: TransactionData[];
}
```

### Transaction Status Types

```typescript
type TransactionStatus = 
  | 'idle'       // Not tracked yet
  | 'pending'    // Submitted to network
  | 'confirming' // Receipt received, waiting for confirmations
  | 'success'    // Confirmed with required confirmations
  | 'error'      // Error occurred
  | 'reverted';  // Transaction reverted
```

## Examples

### Complete Transaction Flow

```tsx
import { useTransactionStatus } from '@/hooks';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';

function SendEther() {
  const { sendTransaction } = useSendTransaction();
  const { 
    trackTransaction, 
    getStatus, 
    getReceipt,
    hasPendingTransactions 
  } = useTransactionStatus({
    confirmations: 2,
    onSuccess: (hash, receipt) => {
      alert('Transaction confirmed!');
    },
    onError: (hash, error) => {
      alert(`Transaction failed: ${error.message}`);
    },
  });

  const [txHash, setTxHash] = useState<Hash | null>(null);

  const handleSend = async () => {
    try {
      const hash = await sendTransaction({
        to: '0x...',
        value: parseEther('0.1'),
      });

      setTxHash(hash);
      
      await trackTransaction(hash, {
        description: 'Send 0.1 ETH',
        to: '0x...',
        value: parseEther('0.1'),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSend}
        disabled={hasPendingTransactions()}
      >
        Send 0.1 ETH
      </button>

      {txHash && (
        <div>
          <p>Status: {getStatus(txHash)}</p>
          {getReceipt(txHash) && (
            <p>Block: {getReceipt(txHash)?.blockNumber.toString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Transaction History Dashboard

```tsx
function TransactionDashboard() {
  const { history, clearHistory } = useTransactionStatus();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Transaction History</h2>
        <button onClick={clearHistory}>Clear History</button>
      </div>

      <div className="space-y-2">
        {history.map(tx => (
          <div 
            key={tx.id}
            className="p-4 border rounded"
          >
            <div className="flex justify-between">
              <span>{tx.description || 'Transaction'}</span>
              <span className={
                tx.status === 'success' ? 'text-green-600' :
                tx.status === 'error' ? 'text-red-600' :
                'text-yellow-600'
              }>
                {tx.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(tx.timestamp).toLocaleString()}
            </p>
            {tx.receipt && (
              <a 
                href={`https://basescan.org/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm"
              >
                View on Explorer
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing

The hook includes comprehensive tests. Run them with:

```bash
npm test src/hooks/__tests__/useTransactionStatus.test.ts
```

## Notes

- The hook automatically polls for transaction receipts every 2 seconds
- Polling stops once the transaction is confirmed or fails
- Transaction history is persisted to localStorage by default
- All intervals are cleaned up on component unmount
- The hook is SSR-safe and works with Next.js

## License

MIT