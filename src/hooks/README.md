# Custom Hooks Directory

This directory contains custom React hooks that provide reusable stateful logic throughout the Ambiance Chat application. Each hook is designed to encapsulate specific functionality and follows React best practices.

## Directory Structure

```
src/hooks/
├── README.md                    # This file
├── useBlockchainSync.ts         # Blockchain state synchronization
├── useContract.ts               # Smart contract interaction wrapper
├── useContractEvents.ts         # Real-time contract event listening
├── useENS.ts                    # Ethereum Name Service resolution
├── useGasEstimation.ts          # Gas price and limit estimation
├── useMessageReactions.ts       # Message reaction management
├── useMessageSearch.ts          # Message search and filtering
├── useNotifications.ts          # Browser notification management
├── useProfile.ts                # User profile data management
├── useRealtimeMessages.ts       # Real-time messaging functionality
├── useRoomPermissions.ts        # Room access control logic
└── useUserProfile.ts            # Current user profile management
```

## Hook Categories

### Blockchain & Web3
- **useContract**: Simplified smart contract interactions with loading states
- **useContractEvents**: Real-time blockchain event subscriptions
- **useGasEstimation**: Gas price and limit estimation with network detection
- **useBlockchainSync**: Blockchain state synchronization utilities

### ENS & Identity
- **useENS**: Comprehensive ENS resolution with caching support
- **useProfile**: User profile data fetching and management
- **useUserProfile**: Current user's profile state management

### Messaging & Communication
- **useRealtimeMessages**: WebSocket-based real-time messaging
- **useMessageSearch**: Advanced message search with pagination
- **useMessageReactions**: Message reaction functionality with optimistic updates

### Room Management
- **useRoomPermissions**: Room access control and permission checking

### System Features
- **useNotifications**: Browser notification management with preferences

## Hook Documentation Standards

Each hook includes comprehensive JSDoc documentation:

### Hook Header
```typescript
/**
 * useHookName hook
 *
 * Brief description of what the hook does and its main purpose.
 *
 * Features:
 * - Feature 1 with brief explanation
 * - Feature 2 with brief explanation
 * - Feature 3 with brief explanation
 *
 * @example
 * ```tsx
 * // Basic usage example
 * const { data, loading, error } = useHookName();
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with options
 * const result = useHookName(options, { enabled: true });
 * ```
 *
 * @returns {HookReturnType} Description of returned object with properties
 */
```

### Function Documentation
```typescript
/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @param {Type} [optionalParam] - Optional parameter description
 * @returns {ReturnType} What the function returns
 */
```

## Usage Examples

### Basic Hook Usage
```tsx
import { useENS } from '@/hooks/useENS';
import { useNotifications } from '@/hooks/useNotifications';

function UserProfile() {
  const { resolveName, isLoading } = useENS();
  const { notifications } = useNotifications();
  
  // Use hook functionality
}
```

### Advanced Hook with Options
```tsx
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { Message } from '@/types/message';

function MessageSearch({ messages }: { messages: Message[] }) {
  const searchOptions = {
    query: 'blockchain',
    caseSensitive: false,
    matchWholeWord: false
  };
  
  const {
    messages: results,
    isSearching,
    nextPage,
    previousPage
  } = useMessageSearch(messages, searchOptions, 20);
  
  return (
    <div>
      {isSearching && <div>Searching...</div>}
      {results.map(message => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
```

### Error Handling Pattern
```tsx
import { useContract } from '@/hooks/useContract';

function ContractInteraction() {
  const { sendMessage, loading, error } = useContract();
  
  const handleSend = async () => {
    try {
      const result = await sendMessage(roomId, content);
      if (result.error) {
        console.error('Contract error:', result.error);
        return;
      }
      // Handle success
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? 'Sending...' : 'Send Message'}
    </button>
  );
}
```

## Development Guidelines

### Creating New Hooks
1. Follow React hooks rules (only call at top level)
2. Use TypeScript for all parameters and return types
3. Include comprehensive JSDoc documentation
4. Implement proper cleanup in useEffect
5. Handle loading and error states
6. Consider memoization for expensive operations

### Error Handling
- Always handle potential errors gracefully
- Provide meaningful error messages
- Consider retry mechanisms for network requests
- Log errors appropriately for debugging

### Performance Considerations
- Use useCallback for functions passed to child components
- Use useMemo for expensive computations
- Implement proper dependency arrays
- Consider data virtualization for large datasets

### Testing Hooks
- Test all possible states (loading, success, error)
- Verify cleanup functions work correctly
- Test with different input parameters
- Mock external dependencies appropriately

## Common Patterns

### Data Fetching Pattern
```typescript
export function useDataFetching<T>(url: string, options?: Options) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetch(url);
        if (!cancelled) {
          setData(await result.json());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [url]);
  
  return { data, loading, error };
}
```

### WebSocket Pattern
```typescript
export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [url]);
  
  const send = (message: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    }
  };
  
  return { socket, connected, send };
}
```

## Dependencies
- React 18+
- wagmi (for blockchain interactions)
- ethers.js / viem (for Ethereum operations)
- @tanstack/react-query (for data fetching)
- Various UI and utility libraries

## Contributing
When creating new hooks:
1. Follow the established documentation patterns
2. Include comprehensive examples
3. Test all possible states and edge cases
4. Consider performance implications
5. Update this README if adding new categories
6. Follow React best practices and hooks rules
