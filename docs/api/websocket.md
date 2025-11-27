# WebSocket API Documentation

## Overview

The Ambience Chat WebSocket API provides real-time messaging, presence updates, and room management notifications. The WebSocket service enables instant communication between clients and provides live updates for all chat activities.

## Connection

### WebSocket URL
- **Production**: `wss://your-domain.com/ws`
- **Development**: `ws://localhost:3000/ws`

### Connection Headers
```javascript
const ws = new WebSocket('wss://your-domain.com/ws', {
  headers: {
    'Authorization': 'Bearer your-jwt-token', // Optional
  }
});
```

### Connection Flow

1. **Establish Connection**: Connect to WebSocket endpoint
2. **Authentication**: Send authentication message (if required)
3. **Subscribe**: Subscribe to room updates
4. **Listen**: Listen for events
5. **Disconnect**: Clean disconnection

## Protocol

### Message Format

All WebSocket messages follow this JSON structure:

```json
{
  "type": "event_type",
  "payload": {
    // Event-specific data
  },
  "timestamp": 1634567890,
  "id": "unique_message_id"
}
```

### Base Message Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Event type identifier |
| `payload` | object | Yes | Event-specific data |
| `timestamp` | number | Yes | Unix timestamp in seconds |
| `id` | string | Yes | Unique message identifier |

## Event Types

### 1. Connection Events

#### `connection_init`
Client sends to initialize connection.

**Client → Server:**
```json
{
  "type": "connection_init",
  "payload": {
    "userId": "0x1234567890abcdef...",
    "roomIds": [1, 2, 3],
    "clientInfo": {
      "version": "1.0.0",
      "platform": "web"
    }
  },
  "timestamp": 1634567890,
  "id": "init_001"
}
```

#### `connection_ack`
Server responds with connection confirmation.

**Server → Client:**
```json
{
  "type": "connection_ack",
  "payload": {
    "connectionId": "conn_abc123",
    "subscribedRooms": [1, 2],
    "serverTime": 1634567890,
    "rateLimits": {
      "messages": 30,
      "interval": 60000
    }
  },
  "timestamp": 1634567890,
  "id": "ack_001"
}
```

### 2. Message Events

#### `message_sent`
Sent when a new message is added to a room.

**Server → Client:**
```json
{
  "type": "message_sent",
  "payload": {
    "messageId": 12345,
    "roomId": 1,
    "sender": "0x1234567890abcdef...",
    "username": "john_doe",
    "content": "Hello everyone!",
    "timestamp": 1634567890,
    "transactionHash": "0xabcdef123456..."
  },
  "timestamp": 1634567890,
  "id": "msg_001"
}
```

#### `message_read`
Sent when a message is marked as read (future feature).

**Server → Client:**
```json
{
  "type": "message_read",
  "payload": {
    "messageId": 12345,
    "roomId": 1,
    "readBy": "0x1234567890abcdef...",
    "timestamp": 1634567890
  },
  "timestamp": 1634567890,
  "id": "read_001"
}
```

### 3. Room Events

#### `room_created`
Sent when a new room is created.

**Server → Client:**
```json
{
  "type": "room_created",
  "payload": {
    "roomId": 4,
    "name": "New Room",
    "owner": "0x1234567890abcdef...",
    "isPrivate": false,
    "createdAt": 1634567890,
    "messageCount": 0
  },
  "timestamp": 1634567890,
  "id": "room_001"
}
```

#### `room_member_added`
Sent when a member is added to a room.

**Server → Client:**
```json
{
  "type": "room_member_added",
  "payload": {
    "roomId": 1,
    "member": "0x1234567890abcdef...",
    "addedBy": "0xabcdef123456...",
    "username": "jane_doe",
    "timestamp": 1634567890
  },
  "timestamp": 1634567890,
  "id": "member_001"
}
```

#### `room_member_removed`
Sent when a member is removed from a room.

**Server → Client:**
```json
{
  "type": "room_member_removed",
  "payload": {
    "roomId": 1,
    "member": "0x1234567890abcdef...",
    "removedBy": "0xabcdef123456...",
    "reason": "owner_kick", // owner_kick, left_voluntarily
    "timestamp": 1634567890
  },
  "timestamp": 1634567890,
  "id": "remove_001"
}
```

### 4. Presence Events

#### `user_joined`
Sent when a user connects to the WebSocket.

**Server → Client:**
```json
{
  "type": "user_joined",
  "payload": {
    "userId": "0x1234567890abcdef...",
    "username": "john_doe",
    "rooms": [1, 2],
    "timestamp": 1634567890
  },
  "timestamp": 1634567890,
  "id": "join_001"
}
```

#### `user_left`
Sent when a user disconnects from the WebSocket.

**Server → Client:**
```json
{
  "type": "user_left",
  "payload": {
    "userId": "0x1234567890abcdef...",
    "username": "john_doe",
    "reason": "disconnect", // disconnect, timeout, kicked
    "timestamp": 1634567890
  },
  "timestamp": 1634567890,
  "id": "leave_001"
}
```

#### `user_typing`
Sent when a user is typing a message.

**Client → Server:**
```json
{
  "type": "user_typing",
  "payload": {
    "roomId": 1,
    "userId": "0x1234567890abcdef...",
    "username": "john_doe",
    "isTyping": true
  },
  "timestamp": 1634567890,
  "id": "typing_001"
}
```

**Server → Client:**
```json
{
  "type": "user_typing",
  "payload": {
    "roomId": 1,
    "userId": "0x1234567890abcdef...",
    "username": "john_doe",
    "isTyping": true
  },
  "timestamp": 1634567890,
  "id": "typing_002"
}
```

### 5. Subscription Events

#### `subscribe_room`
Subscribe to room updates.

**Client → Server:**
```json
{
  "type": "subscribe_room",
  "payload": {
    "roomId": 1
  },
  "timestamp": 1634567890,
  "id": "sub_001"
}
```

#### `unsubscribe_room`
Unsubscribe from room updates.

**Client → Server:**
```json
{
  "type": "unsubscribe_room",
  "payload": {
    "roomId": 1
  },
  "timestamp": 1634567890,
  "id": "unsub_001"
}
```

### 6. Error Events

#### `error`
Generic error event.

**Server → Client:**
```json
{
  "type": "error",
  "payload": {
    "code": "RATE_LIMITED",
    "message": "Too many messages sent",
    "details": {
      "limit": 30,
      "resetTime": 1634567950
    }
  },
  "timestamp": 1634567890,
  "id": "error_001"
}
```

#### `rate_limit_exceeded`
Rate limit exceeded event.

**Server → Client:**
```json
{
  "type": "rate_limit_exceeded",
  "payload": {
    "limit": 30,
    "current": 31,
    "resetTime": 1634567950,
    "retryAfter": 60
  },
  "timestamp": 1634567890,
  "id": "rate_001"
}
```

## Rate Limiting

### Message Limits
- **Limit**: 30 messages per minute per connection
- **Reset**: Every 60 seconds
- **Penalty**: Temporary disconnection if exceeded

### Rate Limit Headers
```json
{
  "rateLimitLimit": 30,
  "rateLimitRemaining": 25,
  "rateLimitReset": 1634567950
}
```

### Rate Limit Example

```javascript
// Send typing indicator with rate limiting check
function sendTypingIndicator(roomId, isTyping) {
  if (lastTypingTime && Date.now() - lastTypingTime < 5000) {
    console.log('Rate limited: typing indicator');
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'user_typing',
    payload: {
      roomId,
      userId: currentUserAddress,
      username: currentUsername,
      isTyping
    },
    timestamp: Math.floor(Date.now() / 1000),
    id: `typing_${Date.now()}`
  }));
  
  lastTypingTime = Date.now();
}
```

## Authentication

### JWT Token (Optional)
If authentication is enabled:

```javascript
const ws = new WebSocket('wss://your-domain.com/ws', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'X-User-Address': '0x1234567890abcdef...'
  }
});
```

### Address Verification
```javascript
// Verify wallet ownership
const message = `WebSocket authentication for ${timestamp}`;
const signature = await walletClient.signMessage({ message });
const address = await recoverMessageAddress({ message, signature });

// Send verification
ws.send(JSON.stringify({
  type: 'auth_verify',
  payload: {
    address,
    signature,
    timestamp
  },
  timestamp,
  id: 'auth_001'
}));
```

## Error Handling

### Connection Errors

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Handle specific error types
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  
  // Auto-reconnect logic
  if (event.code === 1006) {
    setTimeout(() => {
      connectWebSocket();
    }, 5000);
  }
};
```

### Message Validation

```javascript
function validateMessage(message) {
  const schema = {
    type: 'string',
    payload: 'object',
    timestamp: 'number',
    id: 'string'
  };
  
  for (const [key, expectedType] of Object.entries(schema)) {
    if (typeof message[key] !== expectedType) {
      throw new Error(`Invalid message format: ${key} must be ${expectedType}`);
    }
  }
}

// Usage
try {
  validateMessage(receivedMessage);
  handleMessage(receivedMessage);
} catch (error) {
  console.error('Invalid message received:', error);
  // Optionally report to server
}
```

## Heartbeat

### Ping/Pong
```javascript
// Client ping every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: Math.floor(Date.now() / 1000),
      id: `ping_${Date.now()}`
    }));
  }
}, 30000);

// Handle pong
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'pong') {
    console.log('Received pong');
    lastPongTime = Date.now();
  } else {
    handleMessage(message);
  }
};
```

## Implementation Example

### Complete WebSocket Client

```javascript
class ChatWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.subscribedRooms = new Set();
    
    this.setupEventHandlers();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.sendConnectionInit();
    };
    
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code);
      this.connected = false;
      this.handleReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  sendConnectionInit() {
    this.send('connection_init', {
      userId: this.options.userId,
      roomIds: Array.from(this.subscribedRooms),
      clientInfo: {
        version: '1.0.0',
        platform: 'web'
      }
    });
  }
  
  subscribeToRoom(roomId) {
    this.subscribedRooms.add(roomId);
    this.send('subscribe_room', { roomId });
  }
  
  unsubscribeFromRoom(roomId) {
    this.subscribedRooms.delete(roomId);
    this.send('unsubscribe_room', { roomId });
  }
  
  sendTyping(roomId, isTyping) {
    this.send('user_typing', {
      roomId,
      userId: this.options.userId,
      username: this.options.username,
      isTyping
    });
  }
  
  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
        timestamp: Math.floor(Date.now() / 1000),
        id: `${type}_${Date.now()}`
      };
      
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued:', { type, payload });
    }
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'connection_ack':
        console.log('Connection established:', message.payload.connectionId);
        break;
        
      case 'message_sent':
        this.handleNewMessage(message.payload);
        break;
        
      case 'room_created':
        this.handleRoomCreated(message.payload);
        break;
        
      case 'user_joined':
        this.handleUserJoined(message.payload);
        break;
        
      case 'error':
        console.error('WebSocket error:', message.payload);
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  }
  
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

// Usage
const chatWS = new ChatWebSocket('wss://your-domain.com/ws', {
  userId: '0x1234567890abcdef...',
  username: 'john_doe'
});

chatWS.connect();
chatWS.subscribeToRoom(1);

// Send typing indicator
chatWS.sendTyping(1, true);
```

## Testing

### Connection Test
```javascript
// Test WebSocket connection
async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection successful');
      ws.close();
      resolve();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket connection failed:', error);
      reject(error);
    };
  });
}
```

### Event Testing
```javascript
// Test specific events
async function testMessageEvents() {
  const ws = new WebSocket('ws://localhost:3000/ws');
  
  ws.onopen = () => {
    // Test subscription
    ws.send(JSON.stringify({
      type: 'subscribe_room',
      payload: { roomId: 1 },
      timestamp: Math.floor(Date.now() / 1000),
      id: 'test_sub'
    }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'message_sent') {
      console.log('✅ Message event received:', message.payload);
    }
  };
}