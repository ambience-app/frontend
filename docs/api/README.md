# Ambience Chat API Documentation

Welcome to the comprehensive API documentation for Ambience Chat - a decentralized chat application built on the Base blockchain. This documentation provides everything you need to integrate with and build applications using our Web3 chat API.

## 🚀 Quick Start

### What is Ambience Chat?

Ambience Chat is a **decentralized chat application** that leverages blockchain technology to provide:
- **Immutable message storage** on-chain
- **Real-time messaging** via WebSocket connections  
- **User profiles** stored on blockchain
- **Room management** with smart contract controls
- **Cross-platform compatibility** through Web3 standards

### Core Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │    │   WebSocket API  │    │  Smart Contract │
│                 │◄──►│                  │◄──►│                 │
│  - React/Vue    │    │  - Real-time     │    │  - Base Chain   │
│  - Web3 Wallet  │    │  - Events        │    │  - Messages     │
│  - UI/UX        │    │  - Presence      │    │  - Rooms        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌──────────────────┐
                    │   External APIs  │
                    │                  │
                    │  - IPFS Storage  │
                    │  - ENS Names     │
                    │  - Gas Est.      │
                    └──────────────────┘
```

## 📚 Documentation Overview

### 🔧 Core API Documentation
- **[OpenAPI Specification](openapi.yaml)** - Complete API specification with Swagger/OpenAPI format
- **[Smart Contract API](smart-contract.md)** - Detailed blockchain function documentation
- **[WebSocket API](websocket.md)** - Real-time messaging and presence protocols
- **[Authentication & Rate Limiting](authentication.md)** - Security and access control

### 🎯 Implementation Guides
- **[Integration Guide](integration-guide.md)** - Step-by-step integration walkthrough
- **[Code Examples](code-examples.md)** - Complete code samples in multiple languages
- **[Console Configuration](console-config.json)** - Interactive API testing setup

### 🛠️ Technical Details
- **Networks**: Base Mainnet (8453), Base Sepolia Testnet (84532)
- **Contract Address**: `0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e`
- **Authentication**: Web3 wallet signatures, JWT tokens
- **Rate Limiting**: Token bucket algorithm with Redis backend

## 🏗️ API Structure

### 1. Smart Contract Functions (Primary API)

All chat operations are blockchain transactions:

```javascript
// Send Message
await contract.sendMessage(roomId, "Hello, World!")

// Create Room  
await contract.createRoom("My Room", false)

// Get Messages
const messages = await contract.getRoomMessages(roomId, 0, 20)

// Set Username
await contract.setUsername("john_doe")
```

**Key Features:**
- ✅ **Immutable Storage** - Messages permanently stored on blockchain
- ✅ **Gas Optimized** - Efficient contract design
- ✅ **Rate Limited** - Built-in MESSAGE_COOLDOWN (30 seconds)
- ✅ **Event Driven** - Automatic notifications via WebSocket

### 2. WebSocket API (Real-time)

Real-time messaging and presence updates:

```javascript
// Connect
const ws = new WebSocket('wss://your-domain.com/ws')

// Subscribe to room
ws.send({
  type: 'subscribe_room',
  payload: { roomId: 1 }
})

// Listen for messages
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

**Event Types:**
- `message_sent` - New message in subscribed room
- `room_created` - New room created
- `user_joined` - User connected to WebSocket
- `user_left` - User disconnected
- `user_typing` - Typing indicator
- `error` - Connection or protocol errors

### 3. External Integrations

#### IPFS File Storage
```javascript
// Upload file
const formData = new FormData()
formData.append("file", file)

const response = await fetch("/api/ipfs/upload", {
  method: "POST",
  body: formData,
})

const { cid } = await response.json()
```

#### ENS Name Resolution
```javascript
// Resolve ENS name
const address = await resolveENS("vitalik.eth")

// Get ENS avatar
const avatar = await getENSAvatar("vitalik.eth")
```

## 🔐 Authentication

### Web3 Wallet Authentication (Primary)

1. **Connect Wallet** using AppKit/WalletConnect
2. **Generate Challenge** with timestamp and nonce
3. **Sign Message** with wallet private key
4. **Verify Signature** on server
5. **Issue JWT Token** for session management

```javascript
// Wallet connection
const { address, isConnected } = useAppKitAccount()

if (isConnected) {
  // User is authenticated
  const userId = address
}
```

### API Key Authentication

For server-to-server communication:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "X-API-Key: YOUR_API_KEY" \
     https://api.ambience.chat/web3/contract/getRoom?roomId=1
```

## ⚡ Rate Limiting

### Limits by User Type

| User Type | API Requests | WebSocket Messages | Contract Writes |
|-----------|-------------|-------------------|-----------------|
| Anonymous | 10/min | 5/min | N/A |
| Authenticated | 100/min | 30/min | 10/min |
| Premium | 500/min | 100/min | 50/min |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
X-RateLimit-Type: authenticated
```

## 🚀 Quick Integration Examples

### JavaScript/TypeScript

```javascript
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// Initialize client
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/YOUR_KEY'),
})

// Send message
const txHash = await publicClient.writeContract({
  address: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
  abi: contractABI,
  functionName: 'sendMessage',
  args: [1n, 'Hello, World!'],
})

// Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
```

### Python

```python
from web3 import Web3

# Initialize client
w3 = Web3(Web3.HTTPProvider('https://base-mainnet.g.alchemy.com/v2/YOUR_KEY'))
contract = w3.eth.contract(
    address='0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
    abi=contract_abi
)

# Send message
tx_hash = contract.functions.sendMessage(1, 'Hello from Python!').transact({
    'from': wallet_address,
    'gas': 120000
})

# Wait for confirmation
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
```

### cURL

```bash
# Get room information
curl -X GET "https://api.ambience.chat/web3/contract/getRoom?roomId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Create room
curl -X POST "https://api.ambience.chat/web3/contract/createRoom" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Chat Room", "isPrivate": false}'
```

## 🔧 Interactive API Console

### Setup

1. **Configure Environment**
   ```json
   {
     "apiKey": "your_alchemy_key",
     "network": "base-sepolia",
     "walletAddress": "0x1234567890abcdef...",
     "contractAddress": "0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e",
     "websocketUrl": "ws://localhost:3000/ws"
   }
   ```

2. **Available Endpoints**
   - Send Message to Room
   - Create New Room  
   - Get Paginated Messages
   - Set User Username
   - WebSocket Connection
   - Get Room Information
   - Check Username Availability

3. **Test Accounts**
   - Test Account 1: `0x742d35Cc6634C0532925a3b8D3B35E0a0d0a8b10`
   - Test Account 2: `0x8ba1f109551bD432803012645Hac136c7C1A30b4`

### Usage

1. Load the console configuration in your preferred API testing tool
2. Configure your API keys and network settings
3. Test endpoints with real-time blockchain interactions
4. Monitor rate limits and gas usage

## 📊 Monitoring & Analytics

### Key Metrics

- **Transaction Success Rate**: Monitor transaction confirmations
- **Message Throughput**: Messages per minute/hour/day
- **User Activity**: Active users, room participation
- **Gas Usage**: Average gas per operation
- **Rate Limit Hits**: Users approaching/exceeding limits

### Error Tracking

- **Smart Contract Errors**: Reverts, out-of-gas, invalid calls
- **WebSocket Disconnections**: Connection stability
- **API Rate Limits**: Limit violations and user experience
- **Network Issues**: RPC endpoint availability

## 🛡️ Security Considerations

### Best Practices

1. **Private Key Security**
   - Never expose private keys in client-side code
   - Use hardware wallets for production
   - Implement proper key management

2. **Transaction Security**
   - Always validate user inputs
   - Implement proper gas estimation
   - Handle transaction failures gracefully

3. **Rate Limiting**
   - Respect API rate limits
   - Implement client-side throttling
   - Handle rate limit errors appropriately

4. **Data Validation**
   - Validate all inputs before blockchain calls
   - Sanitize user content
   - Implement proper error handling

### Common Vulnerabilities

- **Reentrancy Attacks**: Use reentrancy guards in contract interactions
- **Front-running**: Implement proper transaction ordering
- **Gas Limit Attacks**: Validate gas limits before sending
- **DoS Attacks**: Implement proper rate limiting and validation

## 🔄 Testing

### Test Networks

- **Base Sepolia**: Primary testnet for development
- **Local Development**: Hardhat local blockchain
- **Test Accounts**: Pre-funded accounts for testing

### Testing Tools

```bash
# Run contract tests
npm test

# Run API integration tests
npm run test:api

# Run WebSocket tests
npm run test:websocket

# Run full test suite
npm run test:all
```

### Manual Testing

1. **Test Smart Contract Functions**
   ```bash
   # Deploy to testnet
   npx hardhat run scripts/deploy.ts --network base-sepolia
   
   # Test contract functions
   npx hardhat run scripts/test-chat.ts --network base-sepolia
   ```

2. **Test WebSocket Connection**
   ```bash
   # Start WebSocket server
   npm run dev
   
   # Test connection
   node scripts/test-websocket.js
   ```

## 🚀 Deployment

### Production Setup

1. **Smart Contract Deployment**
   ```bash
   # Deploy to mainnet
   npx hardhat run scripts/deploy.ts --network base-mainnet
   ```

2. **API Deployment**
   ```bash
   # Deploy to Vercel
   vercel --prod
   
   # Or deploy to your preferred platform
   ```

3. **WebSocket Server**
   ```bash
   # Deploy WebSocket server
   docker build -t ambience-ws .
   docker run -p 3001:3001 ambience-ws
   ```

### Environment Configuration

```bash
# Production environment variables
NEXT_PUBLIC_ALCHEMY_API_KEY=your_mainnet_key
NEXT_PUBLIC_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
CONTRACT_ADDRESS=0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
```

## 📈 Performance Optimization

### Gas Optimization

- **Batch Operations**: Group related transactions
- **Efficient Storage**: Minimize on-chain data storage
- **Event Filtering**: Use event logs for efficient data access

### Caching Strategy

- **Message History**: Cache frequently accessed messages
- **User Profiles**: Cache username and profile data
- **Room Information**: Cache room metadata

### Network Optimization

- **Connection Pooling**: Reuse Web3 provider connections
- **Request Batching**: Combine multiple contract calls
- **Lazy Loading**: Load data on-demand

## 🆘 Support & Resources

### Getting Help

- **Documentation**: Complete API reference
- **Examples**: Code samples in multiple languages
- **Discord**: Community support and discussions
- **GitHub**: Issue reporting and feature requests

### Additional Resources

- **Base Network Docs**: [docs.base.org](https://docs.base.org)
- **Viem Library**: [viem.sh](https://viem.sh)
- **Wagmi Hooks**: [wagmi.sh](https://wagmi.sh)
- **AppKit SDK**: [walletconnect.com](https://walletconnect.com)

---

## 📄 License

This API documentation is available under the [MIT License](LICENSE).

---

**Built with ❤️ for the decentralized future of chat**

For the latest updates and announcements, follow our [Twitter](https://twitter.com/ambiencechat) and join our [Discord](https://discord.gg/ambiencechat).