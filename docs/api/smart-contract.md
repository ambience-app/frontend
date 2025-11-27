# Smart Contract API Documentation

## Overview

The Ambience Chat smart contract provides the core chat functionality on the Base blockchain. This contract handles:

- **Room Management**: Create, join, and manage chat rooms
- **Message Storage**: On-chain message storage with pagination
- **User Profiles**: Username management and user profiles  
- **Member Management**: Room membership control
- **Rate Limiting**: Built-in message cooldown mechanism

## Contract Information

- **Network**: Base (Mainnet: 8453, Sepolia: 84532)
- **Contract Address**: `0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e`
- **ABI**: Available in [ambienceChat.json](../../contracts/ambienceChat.json)

## Core Functions

### 1. Room Management

#### `createRoom(string name, bool isPrivate) -> uint256`

Creates a new chat room and returns the room ID.

**Parameters:**
- `name` (string): Room name (max 100 characters)
- `isPrivate` (bool): Whether room is private

**Returns:**
- `uint256`: New room ID

**Gas Estimate**: ~150,000 gas

**Events Emitted:**
- `RoomCreated(roomId, name, owner, isPrivate, createdAt)`

**Example:**
```javascript
const txHash = await contract.write.createRoom("General Chat", false);
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
```

#### `getRoom(uint256 roomId) -> (string, address, bool, uint256, uint256)`

Retrieves room information.

**Parameters:**
- `roomId` (uint256): Room ID to query

**Returns:**
- `name` (string): Room name
- `owner` (address): Room owner address
- `isPrivate` (bool): Whether room is private
- `createdAt` (uint256): Room creation timestamp
- `messageCount` (uint256): Number of messages in room

**Gas Estimate**: ~30,000 gas (read)

#### `getTotalRooms() -> uint256`

Returns total number of rooms created.

**Returns:**
- `uint256`: Total room count

#### `addRoomMember(uint256 roomId, address member)`

Adds a member to a room (room owner only).

**Parameters:**
- `roomId` (uint256): Room ID
- `member` (address): Address to add

**Gas Estimate**: ~80,000 gas

**Events Emitted:**
- `MemberAdded(roomId, member, addedBy)`

#### `removeRoomMember(uint256 roomId, address member)`

Removes a member from a room (room owner only).

**Parameters:**
- `roomId` (uint256): Room ID
- `member` (address): Address to remove

**Gas Estimate**: ~80,000 gas

**Events Emitted:**
- `MemberRemoved(roomId, member, removedBy)`

### 2. Message Operations

#### `sendMessage(uint256 roomId, string content) -> uint256`

Sends a message to a room with built-in rate limiting.

**Parameters:**
- `roomId` (uint256): Target room ID
- `content` (string): Message content (max 1000 characters)

**Returns:**
- `uint256`: New message ID

**Gas Estimate**: ~120,000 gas

**Rate Limiting:** MESSAGE_COOLDOWN (default: 30 seconds)

**Events Emitted:**
- `MessageSent(messageId, roomId, sender, content, timestamp)`

#### `getMessage(uint256 messageId) -> Message`

Retrieves a specific message by ID.

**Parameters:**
- `messageId` (uint256): Message ID to retrieve

**Returns:**
- `sender` (address): Message sender
- `content` (string): Message content
- `timestamp` (uint256): Message timestamp
- `roomId` (uint256): Room ID

#### `getRoomMessages(uint256 roomId, uint256 offset, uint256 limit) -> Message[]`

Gets paginated messages for a room.

**Parameters:**
- `roomId` (uint256): Room ID
- `offset` (uint256): Starting position (0 = newest first)
- `limit` (uint256): Number of messages (max 100)

**Returns:**
- `Message[]`: Array of messages

#### `getRoomMessageCount(uint256 roomId) -> uint256`

Gets total message count for a room.

**Parameters:**
- `roomId` (uint256): Room ID

**Returns:**
- `uint256`: Message count

#### `getTotalMessages() -> uint256`

Returns total messages across all rooms.

**Returns:**
- `uint256`: Total message count

### 3. User Management

#### `setUsername(string username)`

Sets or updates user username.

**Parameters:**
- `username` (string): New username (alphanumeric + underscore, 3-50 chars)

**Gas Estimate**: ~100,000 gas

**Events Emitted:**
- `UserProfileUpdated(user, username)`

#### `getUsername(address user) -> string`

Gets username for an address.

**Parameters:**
- `user` (address): User address

**Returns:**
- `string`: Username or empty string if not set

#### `getUserProfile(address user) -> (string, bool)`

Gets complete user profile.

**Parameters:**
- `user` (address): User address

**Returns:**
- `username` (string): User's username
- `isRegistered` (bool): Whether profile exists

#### `usernameTaken(string username) -> bool`

Checks if username is already taken.

**Parameters:**
- `username` (string): Username to check

**Returns:**
- `bool`: true if username exists

### 4. Membership Queries

#### `isMember(uint256 roomId, address user) -> bool`

Checks if user is member of a room.

**Parameters:**
- `roomId` (uint256): Room ID
- `user` (address): User address

**Returns:**
- `bool`: true if user is member

## Events

### Room Events

#### `RoomCreated`
Emitted when a new room is created.

```solidity
event RoomCreated(
    uint256 indexed roomId,
    string name,
    address indexed owner,
    bool isPrivate,
    uint256 createdAt
);
```

#### `MemberAdded`
Emitted when a user is added to a room.

```solidity
event MemberAdded(
    uint256 indexed roomId,
    address indexed member,
    address indexed addedBy
);
```

#### `MemberRemoved`
Emitted when a user is removed from a room.

```solidity
event MemberRemoved(
    uint256 indexed roomId,
    address indexed member,
    address indexed removedBy
);
```

### Message Events

#### `MessageSent`
Emitted when a message is sent.

```solidity
event MessageSent(
    uint256 indexed messageId,
    uint256 indexed roomId,
    address indexed sender,
    string content,
    uint256 timestamp
);
```

### User Events

#### `UserProfileUpdated`
Emitted when user profile is updated.

```solidity
event UserProfileUpdated(
    address indexed user,
    string username
);
```

## Constants

#### `MESSAGE_COOLDOWN`
Time in seconds between messages from the same address.

**Value**: 30 seconds (configurable)

#### `lastMessageTime[address]`
Mapping to track last message time per address for rate limiting.

## Error Handling

### Common Errors

1. **Rate Limit Exceeded**
   - Error when user tries to send message too frequently
   - Wait for MESSAGE_COOLDOWN period

2. **Unauthorized**
   - Error when non-owner tries to add/remove room members
   - Error when trying to send message to private room without membership

3. **Invalid Parameters**
   - Invalid room ID
   - Invalid username format
   - Content too long
   - Room doesn't exist

### Error Codes

```solidity
string constant ERROR_RATE_LIMITED = "Rate limit exceeded";
string constant ERROR_UNAUTHORIZED = "Unauthorized";
string constant ERROR_INVALID_ROOM = "Invalid room";
string constant ERROR_INVALID_USERNAME = "Invalid username";
string constant ERROR_USERNAME_TAKEN = "Username taken";
```

## Security Considerations

1. **Rate Limiting**: Built-in MESSAGE_COOLDOWN prevents spam
2. **Room Privacy**: Private rooms restrict who can join
3. **Owner权限**: Room owners have special permissions for member management
4. **Input Validation**: All inputs are validated for proper format and length
5. **Event Logging**: All important actions emit events for transparency

## Integration Examples

### Send Message
```javascript
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY'),
})

const txHash = await publicClient.writeContract({
  address: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
  abi: contractABI,
  functionName: 'sendMessage',
  args: [1n, 'Hello, World!'],
})
```

### Get Room Messages
```javascript
const messages = await publicClient.readContract({
  address: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
  abi: contractABI,
  functionName: 'getRoomMessages',
  args: [1n, 0n, 20n],
})
```

### Set Username
```javascript
const txHash = await publicClient.writeContract({
  address: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
  abi: contractABI,
  functionName: 'setUsername',
  args: ['john_doe'],
})
```

## Best Practices

1. **Transaction Waiting**: Always wait for transaction confirmation
2. **Error Handling**: Handle all possible error cases
3. **Gas Estimation**: Estimate gas before sending transactions
4. **Rate Limiting**: Respect MESSAGE_COOLDOWN to avoid failed transactions
5. **Event Listening**: Subscribe to events for real-time updates
6. **Pagination**: Use offset/limit for efficient message retrieval