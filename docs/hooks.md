# Custom Hooks API Documentation

This document provides comprehensive documentation for all custom hooks used in the Ambience Chat dApp. Each hook includes its purpose, TypeScript signatures, usage examples, and edge cases to consider.

---

## Table of Contents

1. [useContract](#usecontract)
2. [useMessages](#usemessages)
3. [useProfile](#useprofile)
4. [useRooms](#userooms)
5. [useWalletConnection](#usewalletconnection)
6. [Third-Party Hooks Reference](#third-party-hooks-reference)

---

## useContract

Hook for interacting with the messaging smart contract on Base blockchain.

### Purpose

Provides a simplified interface for reading from and writing to the chat smart contract, handling transaction states, and managing contract interactions.

### TypeScript Signature

```typescript
interface UseContractReturn {
  // Write operations
  sendMessage: (roomId: string, content: string) => Promise<string>;
  createRoom: (name: string, description?: string) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  
  // Read operations
  getRoom: (roomId: string) => Promise<Room | null>;
  getMessage: (messageId: string) => Promise<Message | null>;
  getRoomMessages: (roomId: string, limit?: number, offset?: number) => Promise<Message[]>;
  
  // State
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  txHash: string | null;
  
  // Contract info
  contractAddress: string;
  chainId: number;
}

function useContract(): UseContractReturn;
```

### Parameters

This hook takes no parameters.

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `sendMessage` | `(roomId: string, content: string) => Promise<string>` | Sends a message to a room. Returns transaction hash. |
| `createRoom` | `(name: string, description?: string) => Promise<string>` | Creates a new chat room. Returns room ID. |
| `joinRoom` | `(roomId: string) => Promise<void>` | Joins an existing room. |
| `leaveRoom` | `(roomId: string) => Promise<void>` | Leaves a room. |
| `getRoom` | `(roomId: string) => Promise<Room \| null>` | Fetches room details. |
| `getMessage` | `(messageId: string) => Promise<Message \| null>` | Fetches a specific message. |
| `getRoomMessages` | `(roomId: string, limit?: number, offset?: number) => Promise<Message[]>` | Fetches messages from a room with pagination. |
| `isLoading` | `boolean` | True when a transaction is pending. |
| `isSuccess` | `boolean` | True when the last transaction succeeded. |
| `isError` | `boolean` | True when the last transaction failed. |
| `error` | `Error \| null` | Error object if transaction failed. |
| `txHash` | `string \| null` | Transaction hash of the last transaction. |
| `contractAddress` | `string` | Address of the deployed contract. |
| `chainId` | `number` | Chain ID of the network. |

### Usage Example

```typescript
import { useContract } from '@/hooks/useContract';
import { useState } from 'react';

function ChatRoom({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('');
  const { sendMessage, isLoading, isSuccess, error } = useContract();

  const handleSend = async () => {
    try {
      const txHash = await sendMessage(roomId, message);
      console.log('Message sent! Transaction:', txHash);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading}
      />
      <button onClick={handleSend} disabled={isLoading || !message}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {isSuccess && <p>Message sent successfully!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Edge Cases

- **Wallet Not Connected**: Hook should throw an error or return null operations if wallet is not connected.
- **Network Mismatch**: Should detect if user is on wrong network and prompt to switch.
- **Insufficient Gas**: Transaction will fail if user doesn't have enough ETH for gas.
- **Content Sanitization**: Message content should be sanitized before sending to prevent XSS attacks.
- **Rate Limiting**: Contract may have rate limits to prevent spam.
- **Transaction Reverts**: Handle contract-level rejections (e.g., room doesn't exist, user not a member).

---

## useMessages

Hook for managing message state, real-time updates, and message history.

### Purpose

Provides message fetching, caching, real-time updates via blockchain events, and pagination for chat messages.

### TypeScript Signature

```typescript
interface UseMessagesOptions {
  roomId: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  optimisticAdd: (message: Omit<Message, 'id' | 'timestamp' | 'txHash'>) => void;
  
  // Metadata
  totalMessages: number;
  lastUpdated: Date | null;
}

function useMessages(options: UseMessagesOptions): UseMessagesReturn;
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `roomId` | `string` | Yes | - | The ID of the room to fetch messages from. |
| `limit` | `number` | No | `50` | Number of messages to fetch per page. |
| `autoRefresh` | `boolean` | No | `true` | Whether to automatically refresh messages. |
| `refreshInterval` | `number` | No | `10000` | Interval in ms for auto-refresh. |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `Message[]` | Array of messages sorted by timestamp (newest first). |
| `isLoading` | `boolean` | True when initially loading or refreshing. |
| `isError` | `boolean` | True if an error occurred. |
| `error` | `Error \| null` | Error object if fetch failed. |
| `hasMore` | `boolean` | True if more messages are available. |
| `loadMore` | `() => Promise<void>` | Loads the next page of messages. |
| `refresh` | `() => Promise<void>` | Manually refreshes messages. |
| `optimisticAdd` | `(message) => void` | Optimistically adds a message before blockchain confirmation. |
| `totalMessages` | `number` | Total number of messages in the room. |
| `lastUpdated` | `Date \| null` | Timestamp of last successful fetch. |

### Usage Example

```typescript
import { useMessages } from '@/hooks/useMessages';
import { useEffect } from 'react';

function MessageList({ roomId }: { roomId: string }) {
  const {
    messages,
    isLoading,
    hasMore,
    loadMore,
    optimisticAdd,
  } = useMessages({
    roomId,
    limit: 20,
    autoRefresh: true,
  });

  const handleSendMessage = async (content: string) => {
    // Optimistically add message
    optimisticAdd({
      content,
      sender: currentUserAddress,
      roomId,
    });
    
    // Actual send happens via useContract
    await sendMessage(roomId, content);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.sender}</strong>: {msg.content}
        </div>
      ))}
      {isLoading && <p>Loading...</p>}
      {hasMore && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

### Edge Cases

- **Empty Room**: Should handle rooms with no messages gracefully.
- **Deleted Messages**: If contract supports message deletion, handle missing messages.
- **Optimistic Updates**: Optimistically added messages should be replaced/removed when blockchain confirms or rejects.
- **Concurrent Updates**: Handle race conditions when multiple users send messages simultaneously.
- **Memory Leaks**: Ensure event listeners are cleaned up on unmount.
- **Network Delays**: Handle slow blockchain responses and show appropriate loading states.

---

## useProfile

Hook for managing user profile data, ENS/Basename resolution, and profile customization.

### Purpose

Fetches and manages user profile information including wallet address, ENS name, avatar, and user preferences.

### TypeScript Signature

```typescript
interface UseProfileOptions {
  address?: string;
  includeENS?: boolean;
  includeStats?: boolean;
}

interface UseProfileReturn {
  // Profile data
  address: string | null;
  ensName: string | null;
  ensAvatar: string | null;
  basename: string | null;
  
  // User stats
  messageCount: number;
  roomsJoined: string[];
  joinedAt: Date | null;
  
  // State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
  
  // Preferences
  preferences: UserPreferences | null;
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  displayName?: string;
  bio?: string;
}

function useProfile(options?: UseProfileOptions): UseProfileReturn;
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | `string` | No | Connected wallet | Address to fetch profile for. |
| `includeENS` | `boolean` | No | `true` | Whether to resolve ENS/Basename. |
| `includeStats` | `boolean` | No | `true` | Whether to fetch user statistics. |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `address` | `string \| null` | User's wallet address. |
| `ensName` | `string \| null` | Resolved ENS name. |
| `ensAvatar` | `string \| null` | ENS avatar URL. |
| `basename` | `string \| null` | Resolved Basename (Base's ENS equivalent). |
| `messageCount` | `number` | Total messages sent by user. |
| `roomsJoined` | `string[]` | Array of room IDs user has joined. |
| `joinedAt` | `Date \| null` | Date when user first interacted with the contract. |
| `isLoading` | `boolean` | True when fetching profile data. |
| `isError` | `boolean` | True if fetch failed. |
| `error` | `Error \| null` | Error object if fetch failed. |
| `refresh` | `() => Promise<void>` | Manually refreshes profile data. |
| `updatePreferences` | `(prefs) => Promise<void>` | Updates user preferences (stored locally or onchain). |
| `preferences` | `UserPreferences \| null` | User's saved preferences. |

### Usage Example

```typescript
import { useProfile } from '@/hooks/useProfile';
import { useAccount } from 'wagmi';

function ProfilePage() {
  const { address } = useAccount();
  const {
    ensName,
    ensAvatar,
    messageCount,
    roomsJoined,
    preferences,
    updatePreferences,
    isLoading,
  } = useProfile({ address });

  const handleToggleNotifications = async () => {
    await updatePreferences({
      ...preferences,
      notifications: !preferences?.notifications,
    });
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <div>
      <img src={ensAvatar || '/default-avatar.png'} alt="Avatar" />
      <h1>{ensName || address}</h1>
      <p>Messages sent: {messageCount}</p>
      <p>Rooms joined: {roomsJoined.length}</p>
      <button onClick={handleToggleNotifications}>
        {preferences?.notifications ? 'Disable' : 'Enable'} Notifications
      </button>
    </div>
  );
}
```

### Edge Cases

- **No ENS Name**: Should gracefully handle addresses without ENS names.
- **ENS Resolution Failure**: Network issues may prevent ENS lookup.
- **Stale Data**: Profile data should be refreshed when wallet changes.
- **Privacy**: Consider what data should be public vs. private.
- **Cross-Chain ENS**: Handle ENS names that may not resolve on Base.
- **Basename vs ENS**: Prioritize Basename on Base network.

---

## useRooms

Hook for managing chat rooms, including listing, creating, and joining rooms.

### Purpose

Provides room discovery, creation, and membership management functionality.

### TypeScript Signature

```typescript
interface UseRoomsOptions {
  filter?: 'all' | 'joined' | 'popular' | 'recent';
  limit?: number;
  sortBy?: 'members' | 'activity' | 'created';
}

interface UseRoomsReturn {
  rooms: Room[];
  joinedRooms: Room[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  createRoom: (name: string, description?: string) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  refresh: () => Promise<void>;
  
  // Helpers
  isUserInRoom: (roomId: string) => boolean;
  getRoomById: (roomId: string) => Room | undefined;
}

function useRooms(options?: UseRoomsOptions): UseRoomsReturn;
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filter` | `'all' \| 'joined' \| 'popular' \| 'recent'` | No | `'all'` | Filter rooms by criteria. |
| `limit` | `number` | No | `100` | Maximum number of rooms to fetch. |
| `sortBy` | `'members' \| 'activity' \| 'created'` | No | `'activity'` | Sort order for rooms. |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `rooms` | `Room[]` | Array of all rooms (filtered and sorted). |
| `joinedRooms` | `Room[]` | Rooms the current user has joined. |
| `isLoading` | `boolean` | True when fetching rooms. |
| `isError` | `boolean` | True if fetch failed. |
| `error` | `Error \| null` | Error object if fetch failed. |
| `createRoom` | `(name, description?) => Promise<string>` | Creates a new room. Returns room ID. |
| `joinRoom` | `(roomId) => Promise<void>` | Joins a room. |
| `leaveRoom` | `(roomId) => Promise<void>` | Leaves a room. |
| `refresh` | `() => Promise<void>` | Manually refreshes room list. |
| `isUserInRoom` | `(roomId) => boolean` | Checks if user is in a room. |
| `getRoomById` | `(roomId) => Room \| undefined` | Gets room by ID. |

### Usage Example

```typescript
import { useRooms } from '@/hooks/useRooms';
import { useState } from 'react';

function RoomList() {
  const [newRoomName, setNewRoomName] = useState('');
  const {
    rooms,
    joinedRooms,
    createRoom,
    joinRoom,
    isUserInRoom,
    isLoading,
  } = useRooms({
    filter: 'all',
    sortBy: 'members',
  });

  const handleCreateRoom = async () => {
    const roomId = await createRoom(newRoomName);
    console.log('Room created:', roomId);
    setNewRoomName('');
  };

  return (
    <div>
      <div>
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New room name"
        />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>

      <h2>All Rooms</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        rooms.map((room) => (
          <div key={room.id}>
            <h3>{room.name}</h3>
            <p>{room.memberCount} members</p>
            {isUserInRoom(room.id) ? (
              <span>Joined ✓</span>
            ) : (
              <button onClick={() => joinRoom(room.id)}>Join</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
```

### Edge Cases

- **Duplicate Room Names**: Contract may or may not allow duplicate names.
- **Room Limits**: User may have a maximum number of rooms they can join.
- **Deleted Rooms**: Handle rooms that have been deleted or are inactive.
- **Permission Checks**: Some rooms may be private or require permissions.
- **Concurrent Joins**: Handle race conditions when joining/leaving rooms.
- **Empty Rooms**: Display appropriate UI for rooms with no members.

---

## useWalletConnection

Hook for managing wallet connection state and handling wallet-related operations.

### Purpose

Provides a unified interface for wallet connection status, account changes, and network switching.

### TypeScript Signature

```typescript
interface UseWalletConnectionReturn {
  // Connection state
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  
  // Wallet info
  connector: Connector | null;
  walletName: string | null;
  walletIcon: string | null;
  
  // Network info
  chainId: number | null;
  isCorrectNetwork: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  
  // Utilities
  truncateAddress: (address: string) => string;
  copyAddress: () => Promise<void>;
  isCopied: boolean;
}

function useWalletConnection(): UseWalletConnectionReturn;
```

### Parameters

This hook takes no parameters.

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `address` | `string \| null` | Connected wallet address. |
| `isConnected` | `boolean` | True if wallet is connected. |
| `isConnecting` | `boolean` | True during connection attempt. |
| `isReconnecting` | `boolean` | True when reconnecting on page load. |
| `connector` | `Connector \| null` | Current wallet connector. |
| `walletName` | `string \| null` | Name of connected wallet. |
| `walletIcon` | `string \| null` | Icon URL of connected wallet. |
| `chainId` | `number \| null` | Current chain ID. |
| `isCorrectNetwork` | `boolean` | True if on Base network. |
| `connect` | `() => Promise<void>` | Opens wallet connection modal. |
| `disconnect` | `() => Promise<void>` | Disconnects wallet. |
| `switchNetwork` | `(chainId) => Promise<void>` | Switches to specified network. |
| `truncateAddress` | `(address) => string` | Formats address as `0x1234...5678`. |
| `copyAddress` | `() => Promise<void>` | Copies address to clipboard. |
| `isCopied` | `boolean` | True for 2s after copying address. |

### Usage Example

```typescript
import { useWalletConnection } from '@/hooks/useWalletConnection';

function WalletButton() {
  const {
    address,
    isConnected,
    isConnecting,
    walletName,
    connect,
    disconnect,
    truncateAddress,
    copyAddress,
    isCopied,
    isCorrectNetwork,
    switchNetwork,
  } = useWalletConnection();

  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div>
      {!isCorrectNetwork && (
        <button onClick={() => switchNetwork(8453)}>
          Switch to Base
        </button>
      )}
      <div>
        <span>{walletName}</span>
        <span>{truncateAddress(address!)}</span>
        <button onClick={copyAddress}>
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    </div>
  );
}
```

### Edge Cases

- **Multiple Wallets**: Handle users with multiple wallet extensions installed.
- **Wallet Locked**: Detect when wallet is locked and prompt user to unlock.
- **Network Rejection**: User may reject network switch request.
- **Account Changes**: Handle when user switches accounts in wallet.
- **Wallet Disconnection**: Handle when user disconnects from wallet extension.
- **Mobile Wallets**: Different behavior on mobile vs. desktop wallets.

---

## Third-Party Hooks Reference

This project uses several third-party hooks from external libraries. Here's a quick reference:

### wagmi Hooks

```typescript
import {
  useAccount,        // Get connected account info
  useConnect,        // Connect wallet
  useDisconnect,     // Disconnect wallet
  useEnsName,        // Resolve ENS name
  useEnsAvatar,      // Resolve ENS avatar
  useNetwork,        // Get current network
  useSwitchNetwork,  // Switch networks
  useBalance,        // Get account balance
} from 'wagmi';
```

**Documentation**: [wagmi.sh](https://wagmi.sh)

### @reown/appkit Hooks

```typescript
import {
  useAppKit,          // Access AppKit modal
  useAppKitAccount,   // Get account from AppKit
  useWalletInfo,      // Get wallet information
  useDisconnect,      // Disconnect wallet
} from '@reown/appkit/react';
```

**Documentation**: [reown.com/appkit](https://reown.com/appkit)

### next-themes Hooks

```typescript
import { useTheme } from 'next-themes';

// Returns: { theme, setTheme, systemTheme, themes }
```

**Documentation**: [github.com/pacocoursey/next-themes](https://github.com/pacocoursey/next-themes)

### next/navigation Hooks

```typescript
import {
  useRouter,      // Navigate programmatically
  usePathname,    // Get current pathname
  useSearchParams, // Get URL search params
} from 'next/navigation';
```

**Documentation**: [nextjs.org/docs/app/api-reference/functions](https://nextjs.org/docs/app/api-reference/functions)

### @tanstack/react-query Hooks

```typescript
import {
  useQuery,        // Fetch and cache data
  useMutation,     // Mutate data
  useQueryClient,  // Access query client
} from '@tanstack/react-query';
```

**Documentation**: [tanstack.com/query](https://tanstack.com/query)

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const { sendMessage, error } = useContract();

try {
  await sendMessage(roomId, content);
} catch (err) {
  console.error('Failed to send message:', err);
  // Show user-friendly error message
}
```

### 2. Loading States

Provide feedback during async operations:

```typescript
const { isLoading } = useMessages({ roomId });

if (isLoading) {
  return <Spinner />;
}
```

### 3. Cleanup

Clean up subscriptions and listeners:

```typescript
useEffect(() => {
  const unsubscribe = subscribeToMessages(roomId, handleNewMessage);
  return () => unsubscribe();
}, [roomId]);
```

### 4. Memoization

Memoize expensive computations:

```typescript
const sortedMessages = useMemo(
  () => messages.sort((a, b) => b.timestamp - a.timestamp),
  [messages]
);
```

### 5. Type Safety

Always use TypeScript types:

```typescript
const { messages }: { messages: Message[] } = useMessages({ roomId });
```

---

## Contributing

When adding new hooks:

1. Follow the established naming convention (`use*`)
2. Include comprehensive TypeScript types
3. Document all parameters and return values
4. Provide usage examples
5. List edge cases and how they're handled
6. Add unit tests for the hook
7. Update this documentation

---

## Related Documentation

- [Smart Contract ABI](./contract-abi.md)
- [Type Definitions](../src/types/README.md)
- [Component Documentation](./components.md)
- [Testing Guide](./testing.md)

---

**Last Updated**: December 2024  
**Version**: 1.0.0