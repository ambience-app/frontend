# useTransactionStatus Hook Implementation

## Overview

This document describes the implementation of the `useTransactionStatus` hook for issue #106.

## ✅ Acceptance Criteria Met

### 1. Transaction Status Tracking
- ✅ Tracks transaction states: `idle`, `pending`, `confirming`, `success`, `error`, `reverted`
- ✅ Real-time status updates via polling mechanism
- ✅ Automatic detection of pending transactions
- ✅ Configurable confirmation requirements

### 2. Receipt Handling
- ✅ Automatic receipt fetching and caching
- ✅ Block number and confirmation tracking
- ✅ Gas usage and transaction details
- ✅ Receipt validation and error handling

### 3. Error Handling
- ✅ Comprehensive error catching and reporting
- ✅ Detailed error messages with timestamps
- ✅ Error callbacks for custom handling
- ✅ Graceful handling of network failures

### 4. Transaction History Management
- ✅ Persistent storage using localStorage
- ✅ Configurable history size limits
- ✅ Clear and manage history operations
- ✅ Automatic cleanup on unmount

## Files Created

### 1. Type Definitions
- **`src/types/transaction.ts`**: Complete TypeScript types for transactions
  - `TransactionStatus` enum
  - `TransactionData` interface
  - `TransactionHistoryItem` interface
  - `TransactionError` interface
  - `UseTransactionStatusOptions` interface

### 2. Hook Implementation
- **`src/hooks/useTransactionStatus.ts`**: Main hook implementation (400+ lines)
  - Transaction tracking and monitoring
  - Receipt polling mechanism
  - Status management
  - History persistence
  - Error handling
  - Cleanup on unmount

### 3. Exports
- **`src/hooks/index.ts`**: Centralized exports
- **`src/types/index.ts`**: Updated to include transaction types

### 4. Documentation
- **`src/hooks/README.md`**: Comprehensive documentation
  - Features overview
  - Installation instructions
  - Basic and advanced usage examples
  - Complete API reference
  - Real-world examples

### 5. Tests
- **`src/hooks/__tests__/useTransactionStatus.test.ts`**: Full test suite
  - 12+ test cases covering all functionality
  - Mock wagmi and viem dependencies
  - Status tracking tests
  - Receipt handling tests
  - Error handling tests
  - History management tests
  - Confirmation tracking tests

### 6. Examples
- **`src/hooks/examples/TransactionExample.tsx`**: Complete working example
  - Send transaction form
  - Real-time status display
  - Active transactions list
  - Pending transactions monitor
  - Transaction history viewer

### 7. Storybook
- **`src/stories/TransactionStatus.stories.tsx`**: Interactive demo
  - Visual demonstration of all features
  - Mock transaction simulation
  - Real-time status updates

## Key Features

### 1. Automatic Polling
- Polls for transaction receipts every 2 seconds
- Stops polling when transaction is confirmed or fails
- Efficient cleanup of polling intervals

### 2. Confirmation Tracking
- Configurable confirmation requirements (default: 1)
- Real-time confirmation count updates
- Status changes from `confirming` to `success` when threshold met

### 3. Callbacks
- `onStatusChange`: Triggered on any status change
- `onSuccess`: Triggered when transaction is confirmed
- `onError`: Triggered on transaction failure

### 4. Persistence
- Automatic localStorage persistence (configurable)
- Loads history on mount
- Saves history on changes
- Configurable max history size

### 5. Utility Functions
- `trackTransaction`: Start tracking a new transaction
- `getTransaction`: Get full transaction data
- `getStatus`: Get current status
- `getReceipt`: Get transaction receipt
- `getError`: Get error details
- `getPendingTransactions`: Get all pending transactions
- `hasPendingTransactions`: Check if any pending
- `clearTransaction`: Remove from tracking
- `clearAllTransactions`: Clear all active
- `clearHistory`: Clear transaction history

## Usage Example

```typescript
import { useTransactionStatus } from '@/hooks';
import { useSendTransaction } from 'wagmi';

function MyComponent() {
  const { sendTransaction } = useSendTransaction();
  const { 
    trackTransaction, 
    getStatus, 
    hasPendingTransactions 
  } = useTransactionStatus({
    confirmations: 2,
    onSuccess: (hash, receipt) => {
      console.log('Transaction confirmed!', receipt);
    },
    onError: (hash, error) => {
      console.error('Transaction failed:', error);
    },
  });

  const handleSend = async () => {
    const hash = await sendTransaction({ to: '0x...', value: 1n });
    await trackTransaction(hash, {
      description: 'Send 1 ETH',
    });
  };

  return (
    <button 
      onClick={handleSend}
      disabled={hasPendingTransactions()}
    >
      Send Transaction
    </button>
  );
}
```

## Testing

Run tests with:
```bash
npm test src/hooks/__tests__/useTransactionStatus.test.ts
```

## Integration

The hook integrates seamlessly with:
- **wagmi**: For Web3 interactions
- **viem**: For Ethereum types
- **Next.js**: SSR-safe implementation
- **React Query**: Compatible with data fetching patterns

## Performance Considerations

1. **Polling Efficiency**: 2-second intervals balance responsiveness and network load
2. **Memory Management**: Automatic cleanup of intervals on unmount
3. **Storage Limits**: Configurable max history size prevents unbounded growth
4. **Type Safety**: Full TypeScript support prevents runtime errors

## Future Enhancements

Potential improvements for future iterations:
- WebSocket support for real-time updates
- Multi-chain support with chain-specific configurations
- Transaction grouping and batching
- Advanced filtering and search in history
- Export/import transaction history
- Analytics and statistics dashboard

## Conclusion

The `useTransactionStatus` hook provides a robust, production-ready solution for managing blockchain transaction states in React applications. It meets all acceptance criteria and includes comprehensive documentation, tests, and examples.