# TypeScript Types Directory

This directory contains all TypeScript type definitions used throughout the Ambiance Chat application. These types provide type safety and better development experience across the entire codebase.

## Directory Structure

```
src/types/
├── README.md    # This file
├── api.ts       # API-related type definitions
├── contract.ts  # Smart contract interface types
├── index.ts     # Centralized type exports
├── message.ts   # Message and chat-related types
├── room.ts      # Room and channel types
└── user.ts      # User and profile types
```

## Type Categories

### Core Domain Types
- **User Types** (`user.ts`): User profiles, wallet addresses, authentication
- **Message Types** (`message.ts`): Chat messages, reactions, threading
- **Room Types** (`room.ts`): Chat rooms, channels, membership

### System Types
- **API Types** (`api.ts`): HTTP responses, request/response shapes
- **Contract Types** (`contract.ts`): Blockchain contract interfaces and ABIs

### Utility Types
- **Index** (`index.ts`): Central re-export point for all types

## Type Definitions

### User Types (`user.ts`)
```typescript
// User profile information
export interface User {
  id: string;
  username: string;
  bio?: string;
  avatar?: string; // IPFS CID or URL
  address: Address;
  ensName?: string;
  createdAt: number;
  updatedAt: number;
}

// User permission levels
export enum UserRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

// Profile update data
export interface ProfileUpdateData {
  username?: string;
  bio?: string;
  avatarFile?: File;
}
```

### Message Types (`message.ts`)
```typescript
// Core message structure
export interface Message {
  id: string;
  sender: Address | User;
  content: string;
  timestamp: number;
  roomId: string;
  edited?: boolean;
  deleted?: boolean;
  meta?: Record<string, unknown>;
}

// Message reaction
export interface MessageReaction {
  emoji: string;
  users: Address[];
  count: number;
}

// Message search filters
export interface MessageSearchFilters {
  query?: string;
  sender?: Address;
  roomId?: string;
  fromDate?: Date;
  toDate?: Date;
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
}
```

### Room Types (`room.ts`)
```typescript
// Chat room definition
export interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  isJoined: boolean;
  memberCount: number;
  messageCount: number;
  lastActive: number;
  createdBy: Address;
  createdAt: number;
  updatedAt: number;
}

// Room creation data
export interface CreateRoomData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  password?: string;
}

// Room search filters
export interface RoomSearchFilters {
  query?: string;
  isPrivate?: boolean;
  minMembers?: number;
}
```

### Contract Types (`contract.ts`)
```typescript
// Smart contract addresses by network
export interface ContractAddresses {
  [networkId: number]: {
    messaging: Address;
    profile: Address;
    moderation: Address;
  };
}

// Contract function calls
export interface ContractCall {
  address: Address;
  abi: Abi;
  functionName: string;
  args: any[];
  value?: bigint;
  gasLimit?: bigint;
}

// Contract event types
export interface ContractEvent {
  address: Address;
  eventName: string;
  data: any;
  blockNumber: number;
  transactionHash: string;
}
```

### API Types (`api.ts`)
```typescript
// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

## Usage Examples

### Importing Types
```typescript
// Import specific types
import { User, UserRole } from '@/types/user';
import { Message, MessageReaction } from '@/types/message';
import { Room, CreateRoomData } from '@/types/room';

// Import from index for convenience
import { 
  User, 
  Message, 
  Room, 
  ApiResponse,
  Address 
} from '@/types';
```

### Type Safety in Components
```tsx
import { User, Message } from '@/types';

interface UserProfileProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
}

function UserProfile({ user, onUpdate }: UserProfileProps) {
  // Type-safe access to user properties
  return (
    <div>
      <h2>{user.username}</h2>
      <p>{user.bio}</p>
      {user.avatar && (
        <img src={`https://ipfs.io/ipfs/${user.avatar}`} alt="Avatar" />
      )}
    </div>
  );
}
```

### Type Safety in Hooks
```typescript
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types';

interface UseUserProfileResult {
  user: User | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useUserProfile(address: Address): UseUserProfileResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', address],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!address,
  });

  return { user: data, isLoading, error };
}
```

### API Type Safety
```typescript
import { ApiResponse, PaginatedResponse } from '@/types';

async function fetchMessages(
  roomId: string, 
  page: number = 1
): Promise<ApiResponse<PaginatedResponse<Message>>> {
  try {
    const response = await fetch(`/api/messages/${roomId}?page=${page}`);
    const data = await response.json();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

## Type Guards and Utilities

### Custom Type Guards
```typescript
// Type guard for User type
export function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.address === 'string'
  );
}

// Type guard for Message type
export function isMessage(obj: any): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.roomId === 'string'
  );
}
```

### Utility Types
```typescript
// Optional fields made required
type RequiredProfile = Required<User>;

// Partial user update
type UserUpdate = Partial<Pick<User, 'username' | 'bio'>>;

// Array of room IDs
type RoomIdList = Array<Room['id']>;

// Message with reactions
type MessageWithReactions = Message & {
  reactions: Record<string, MessageReaction>;
};
```

## Best Practices

### Naming Conventions
- Use PascalCase for interface and type names
- Use camelCase for property names
- Use descriptive names that convey purpose
- Prefix interfaces with a meaningful context (e.g., `UserProfile`, `RoomSettings`)

### Type Organization
- Group related types in the same file
- Use barrel exports in `index.ts` for clean imports
- Keep domain types separate from utility types
- Document complex types with JSDoc

### Extensibility
- Use optional properties (`?`) for backwards compatibility
- Use `Record<string, unknown>` for extensible metadata
- Consider future extensibility when designing types
- Use union types for finite sets of options

### Performance
- Avoid complex mapped types in hot paths
- Use `const` assertions for literal types
- Consider type inference to reduce explicit annotations
- Use built-in utility types when possible

## Development Guidelines

### Adding New Types
1. Determine the appropriate category file
2. Follow the established naming conventions
3. Include JSDoc documentation for complex types
4. Add example usage in comments
5. Export from `index.ts` for easy importing
6. Update this README if adding new categories

### Maintaining Types
- Review types when adding new features
- Keep types in sync with API changes
- Remove unused types periodically
- Document breaking changes

### Testing Type Safety
- Use TypeScript strict mode
- Test complex type relationships
- Verify runtime compatibility
- Use type guards for runtime checks

## Dependencies
- TypeScript 4.5+
- React 18+ (for JSX types)
- Various third-party library type definitions

## Contributing
When adding or modifying types:
1. Follow the established conventions
2. Include comprehensive documentation
3. Consider backward compatibility
4. Test type safety in real usage
5. Update import statements in index.ts