# API Integration Guide

## Quick Start

This guide will help you quickly integrate with the Ambience Chat API to build chat applications on the Base blockchain.

## Prerequisites

- **Node.js** 16+ or **Python** 3.8+
- **Web3 Wallet** (MetaMask, Coinbase Wallet, etc.)
- **Alchemy API Key** (for Base network access)
- **Basic knowledge** of blockchain/Web3 concepts

## 5-Minute Setup

### 1. Install Dependencies

```bash
# JavaScript/TypeScript
npm install viem wagmi @reown/appkit

# Python
pip install web3

# Rust
cargo add ethers
```

### 2. Configure Environment

```bash
# .env file
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
```

### 3. Basic Chat Implementation

```javascript
import { createAppKit } from '@reown/appkit/react'
import { base } from 'viem/chains'

// Initialize AppKit
const appKit = createAppKit({
  projectId: 'your-project-id',
  networks: [base],
  walletConnectVersion: 2,
  features: {
    email: false,
    socials: []
  }
})

// Connect wallet
const { address, isConnected } = useAppKitAccount()

if (isConnected) {
  // Start using the API
  await sendMessage(1, 'Hello, World!')
}
```

## Core Concepts

### 1. Smart Contract Interaction

The Ambience Chat API is primarily based on smart contract interactions. Every operation (sending messages, creating rooms, etc.) is a blockchain transaction.

```javascript
// Send message = blockchain transaction
const txHash = await publicClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'sendMessage',
  args: [roomId, content],
})

// Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
```

### 2. Real-time Updates

WebSocket connections provide real-time messaging and presence updates.

```javascript
const ws = new WebSocket('wss://your-domain.com/ws')

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  switch (message.type) {
    case 'message_sent':
      // Handle new message
      break
    case 'user_joined':
      // Handle user presence
      break
  }
}
```

### 3. User Identity

Users are identified by their wallet addresses. Usernames are optional profile data stored on-chain.

```javascript
// Check if user has username
const username = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getUsername',
  args: [userAddress],
})

// Set username
const txHash = await publicClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'setUsername',
  args: ['john_doe'],
})
```

## Implementation Patterns

### 1. Message History

Implement efficient message loading with pagination:

```javascript
async function loadMessageHistory(roomId) {
  const messages = []
  let offset = 0
  const limit = 20
  
  while (true) {
    const batch = await getRoomMessages(roomId, offset, limit)
    
    if (batch.length === 0) break
    
    messages.push(...batch)
    
    if (batch.length < limit) break
    
    offset += limit
  }
  
  return messages.reverse() // Oldest first
}
```

### 2. Real-time Message Sending

Combine blockchain transactions with WebSocket updates:

```javascript
async function sendMessageWithConfirmation(roomId, content) {
  // Send blockchain transaction
  const txHash = await sendMessage(roomId, content)
  
  // Wait for confirmation
  const receipt = await waitForTransaction(txHash)
  
  if (receipt.success) {
    // Refresh message history
    await refreshMessages(roomId)
    
    // Show success
    showSuccessMessage('Message sent!')
  }
}
```

### 3. User Presence

Track user online status through WebSocket connections:

```javascript
class PresenceManager {
  constructor() {
    this.onlineUsers = new Set()
    this.ws = new WebSocket('wss://your-domain.com/ws')
    
    this.setupEventHandlers()
  }
  
  setupEventHandlers() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'user_joined':
          this.onlineUsers.add(message.payload.userId)
          this.updatePresenceUI()
          break
          
        case 'user_left':
          this.onlineUsers.delete(message.payload.userId)
          this.updatePresenceUI()
          break
      }
    }
  }
  
  updatePresenceUI() {
    // Update UI to show online users
    renderOnlineUsers(Array.from(this.onlineUsers))
  }
}
```

## Best Practices

### 1. Error Handling

Implement comprehensive error handling:

```javascript
async function robustSendMessage(roomId, content) {
  try {
    // Validate inputs
    if (!roomId || !content.trim()) {
      throw new Error('Invalid parameters')
    }
    
    // Check rate limits
    if (isRateLimited()) {
      throw new Error('Please wait before sending another message')
    }
    
    // Send transaction
    const txHash = await sendMessage(roomId, content)
    
    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      waitForTransaction(txHash),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), 60000)
      )
    ])
    
    if (!receipt.success) {
      throw new Error('Transaction failed')
    }
    
    return receipt
    
  } catch (error) {
    console.error('Send message failed:', error)
    
    // Show user-friendly error
    showError(getErrorMessage(error))
    
    throw error
  }
}
```

### 2. Gas Optimization

Optimize gas usage for better user experience:

```javascript
const gasConfig = {
  gasLimit: 120000,     // Set appropriate gas limit
  gasPrice: 'auto',     // Let wallet estimate gas price
  maxFeePerGas: null,   // Use EIP-1559 if supported
  maxPriorityFeePerGas: null,
}

// Batch operations where possible
async function batchCreateRooms(rooms) {
  // Note: This is just an example - actual batching would require
  // a different contract design
  
  const results = []
  for (const room of rooms) {
    try {
      const result = await createRoom(room.name, room.isPrivate)
      results.push(result)
    } catch (error) {
      console.error(`Failed to create room ${room.name}:`, error)
    }
  }
  
  return results
}
```

### 3. Caching Strategy

Implement efficient caching for better performance:

```javascript
class MessageCache {
  constructor() {
    this.cache = new Map()
    this.maxSize = 1000
    this.maxAge = 5 * 60 * 1000 // 5 minutes
  }
  
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}

const messageCache = new MessageCache()

async function getCachedMessages(roomId, offset, limit) {
  const cacheKey = `${roomId}-${offset}-${limit}`
  
  let messages = messageCache.get(cacheKey)
  
  if (!messages) {
    messages = await getRoomMessages(roomId, offset, limit)
    messageCache.set(cacheKey, messages)
  }
  
  return messages
}
```

## Common Integration Scenarios

### 1. Chat Widget Integration

```javascript
class AmbienceChatWidget {
  constructor(container, options = {}) {
    this.container = container
    this.options = {
      roomId: options.roomId || 1,
      theme: options.theme || 'light',
      showUsername: options.showUsername !== false,
      ...options
    }
    
    this.init()
  }
  
  async init() {
    // Render basic structure
    this.renderContainer()
    
    // Initialize AppKit
    this.appKit = createAppKit({
      projectId: this.options.projectId,
      networks: [base],
    })
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Load initial messages
    await this.loadMessages()
  }
  
  renderContainer() {
    this.container.innerHTML = `
      <div class="ambience-chat-widget">
        <div class="chat-header">
          <h3>Chat Room #${this.options.roomId}</h3>
          <button class="connect-btn">Connect Wallet</button>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type a message..." />
          <button class="send-btn">Send</button>
        </div>
      </div>
    `
  }
  
  async loadMessages() {
    const messages = await getRoomMessages(this.options.roomId, 0, 20)
    this.renderMessages(messages)
  }
  
  renderMessages(messages) {
    const messagesContainer = this.container.querySelector('.chat-messages')
    messagesContainer.innerHTML = messages
      .map(msg => this.renderMessage(msg))
      .join('')
  }
  
  renderMessage(msg) {
    return `
      <div class="message">
        <span class="sender">${msg.sender}</span>
        <span class="content">${msg.content}</span>
        <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
    `
  }
}

// Usage
const chatWidget = new AmbienceChatWidget(
  document.getElementById('chat-container'),
  {
    projectId: 'your-project-id',
    roomId: 1,
    theme: 'dark'
  }
)
```

### 2. Discord Bot Integration

```javascript
const { Client, GatewayIntentBits } = require('discord.js')

class AmbienceBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    })
    
    this.setupEventHandlers()
  }
  
  setupEventHandlers() {
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return
      
      // Forward message to Ambience Chat
      await this.forwardToAmbience(message)
    })
  }
  
  async forwardToAmbience(discordMessage) {
    try {
      // Check if this channel is linked to a room
      const roomId = this.getLinkedRoom(discordMessage.channel.id)
      
      if (roomId) {
        await sendMessage(roomId, `Discord: ${discordMessage.author.username}: ${discordMessage.content}`)
      }
      
    } catch (error) {
      console.error('Failed to forward message:', error)
    }
  }
  
  getLinkedRoom(discordChannelId) {
    // Implementation to link Discord channels to chat rooms
    return discordChannelMappings[discordChannelId]
  }
  
  async start() {
    await this.client.login('YOUR_DISCORD_BOT_TOKEN')
  }
}

// Usage
const bot = new AmbienceBot()
bot.start()
```

### 3. Mobile App Integration

```typescript
import { useState, useEffect } from 'react'
import { useWalletConnect } from '@walletconnect/react-native'

export function useAmbienceChat(roomId: string) {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const { address, connect, disconnect } = useWalletConnect()
  
  const sendMessage = async (content: string) => {
    try {
      // Implementation for mobile
      const txHash = await sendMessageTransaction(roomId, content)
      const receipt = await waitForTransaction(txHash)
      
      if (receipt.success) {
        await refreshMessages()
      }
      
    } catch (error) {
      console.error('Send message failed:', error)
    }
  }
  
  return {
    messages,
    isConnected,
    connect,
    disconnect,
    sendMessage
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Transaction Failed with "Out of Gas"

**Cause**: Insufficient gas limit for transaction.

**Solution**: 
```javascript
// Increase gas limit
const txHash = await publicClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'sendMessage',
  args: [roomId, content],
  gas: 200000n, // Increase gas limit
})
```

#### 2. Rate Limit Exceeded

**Cause**: Sending messages too quickly.

**Solution**: 
```javascript
// Implement rate limiting
const lastMessageTime = 0

async function rateLimitedSendMessage(roomId, content) {
  const now = Date.now()
  
  if (now - lastMessageTime < 30000) { // 30 second cooldown
    throw new Error('Please wait before sending another message')
  }
  
  await sendMessage(roomId, content)
  lastMessageTime = now
}
```

#### 3. WebSocket Connection Issues

**Cause**: Network connectivity or server issues.

**Solution**:
```javascript
// Implement reconnection logic
class WebSocketManager {
  constructor() {
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }
  
  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onclose = () => {
      this.handleReconnect()
    }
  }
  
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      
      setTimeout(() => {
        this.connect()
      }, delay)
    }
  }
}
```

### Debugging Tips

1. **Check Transaction Status**: Always wait for transaction confirmation
2. **Monitor Gas Usage**: Use tools like Etherscan to monitor gas consumption
3. **Test on Sepolia**: Use testnet for development and testing
4. **Enable Logging**: Add comprehensive logging for troubleshooting

### Getting Help

- **Documentation**: Check the full API documentation
- **Examples**: Review code examples in different languages
- **Community**: Join our Discord for support
- **Issues**: Report bugs on GitHub

## Performance Optimization

### 1. Batching Requests

```javascript
// Instead of sending individual requests
for (const message of messages) {
  await sendMessage(message.roomId, message.content)
}

// Batch operations where possible
// (Note: actual batching depends on contract design)
```

### 2. Caching Strategies

- Cache message history locally
- Implement smart cache invalidation
- Use localStorage for user preferences

### 3. UI Optimization

- Virtual scrolling for large message lists
- Lazy loading for message content
- Progressive message loading

This integration guide provides the foundation for building robust applications with the Ambience Chat API. For detailed API specifications, refer to the other documentation files.