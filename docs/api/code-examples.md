# API Code Examples

## JavaScript/TypeScript Examples

### Send Message to Room

```javascript
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// Initialize client
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY'),
})

// Send message function
async function sendMessage(roomId, content) {
  try {
    // Send message transaction
    const txHash = await publicClient.writeContract({
      address: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
      abi: contractABI,
      functionName: 'sendMessage',
      args: [BigInt(roomId), content],
    })

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash 
    })

    console.log('Message sent:', receipt.transactionHash)
    return receipt.transactionHash
  } catch (error) {
    console.error('Failed to send message:', error)
    throw error
  }
}

// Usage
await sendMessage(1, 'Hello, World!')
```

### Get Room Messages with Pagination

```javascript
async function getRoomMessages(roomId, offset = 0, limit = 20) {
  try {
    const messages = await publicClient.readContract({
      address: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
      abi: contractABI,
      functionName: 'getRoomMessages',
      args: [BigInt(roomId), BigInt(offset), BigInt(limit)],
    })

    return messages.map((msg, index) => ({
      id: (offset + index).toString(),
      sender: msg.sender,
      content: msg.content,
      timestamp: Number(msg.timestamp) * 1000, // Convert to milliseconds
      roomId: Number(msg.roomId)
    }))
  } catch (error) {
    console.error('Failed to get messages:', error)
    throw error
  }
}

// Usage
const messages = await getRoomMessages(1, 0, 20)
console.log('Messages:', messages)
```

### WebSocket Real-time Connection

```javascript
class ChatWebSocket {
  constructor(url, options = {}) {
    this.url = url
    this.options = options
    this.ws = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.subscribedRooms = new Set()
    this.messageHandlers = new Map()
  }

  connect() {
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.connected = true
      this.reconnectAttempts = 0
      this.sendConnectionInit()
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code)
      this.connected = false
      this.handleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  sendConnectionInit() {
    this.send('connection_init', {
      userId: this.options.userId,
      roomIds: Array.from(this.subscribedRooms),
      clientInfo: {
        version: '1.0.0',
        platform: 'web'
      }
    })
  }

  subscribeToRoom(roomId) {
    this.subscribedRooms.add(roomId)
    this.send('subscribe_room', { roomId })
  }

  sendTyping(roomId, isTyping) {
    this.send('user_typing', {
      roomId,
      userId: this.options.userId,
      username: this.options.username,
      isTyping
    })
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
        timestamp: Math.floor(Date.now() / 1000),
        id: `${type}_${Date.now()}`
      }
      
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected')
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler)
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message.payload)
    }

    // Default message handlers
    switch (message.type) {
      case 'message_sent':
        console.log('New message:', message.payload)
        break
      case 'room_created':
        console.log('New room created:', message.payload)
        break
      case 'user_joined':
        console.log('User joined:', message.payload)
        break
      case 'error':
        console.error('WebSocket error:', message.payload)
        break
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      setTimeout(() => this.connect(), delay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }
}

// Usage
const chatWS = new ChatWebSocket('ws://localhost:3000/ws', {
  userId: '0x1234567890abcdef...',
  username: 'john_doe'
})

chatWS.onMessage('message_sent', (payload) => {
  console.log('Received message:', payload)
})

chatWS.connect()
chatWS.subscribeToRoom(1)
```

### Complete React Integration

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: number
  roomId: string
}

interface UseChatOptions {
  roomId: string
}

export function useChat({ roomId }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { address: wagmiAddress } = useAccount()
  const { address: appkitAddress } = useAppKitAccount()
  const address = appkitAddress || wagmiAddress

  const fetchMessages = useCallback(async () => {
    if (!address || !roomId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Implementation here...
      const roomMessages = await getRoomMessages(parseInt(roomId), 0, 20)
      setMessages(roomMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setIsLoading(false)
    }
  }, [address, roomId])

  const sendMessage = useCallback(async (content: string) => {
    if (!address || !content.trim()) return

    try {
      await sendMessageToRoom(parseInt(roomId), content)
      // Refresh messages after sending
      await fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }, [address, roomId, fetchMessages])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages
  }
}
```

## Python Examples

### Send Message

```python
from web3 import Web3
import time

def send_message(room_id, content, wallet_address, private_key, api_key):
    # Initialize Web3 client
    w3 = Web3(Web3.HTTPProvider(f'https://base-mainnet.g.alchemy.com/v2/{api_key}'))
    
    # Contract ABI (simplified)
    contract_abi = [
        {
            "inputs": [
                {"name": "roomId", "type": "uint256"},
                {"name": "content", "type": "string"}
            ],
            "name": "sendMessage",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
    
    # Contract instance
    contract = w3.eth.contract(
        address='0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
        abi=contract_abi
    )
    
    try:
        # Build transaction
        transaction = contract.functions.sendMessage(room_id, content).build_transaction({
            'from': wallet_address,
            'gas': 120000,
            'gasPrice': w3.to_wei('20', 'gwei'),
            'nonce': w3.eth.get_transaction_count(wallet_address),
        })
        
        # Sign transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for confirmation
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f'Message sent successfully: {tx_receipt.transactionHash.hex()}')
        return tx_receipt.transactionHash.hex()
        
    except Exception as e:
        print(f'Error sending message: {e}')
        raise

# Usage
tx_hash = send_message(
    room_id=1,
    content="Hello from Python!",
    wallet_address="0x742d35Cc6634C0532925a3b8D3B35E0a0d0a8b10",
    private_key="your_private_key_here",
    api_key="your_alchemy_api_key"
)
```

### Get Room Messages

```python
def get_room_messages(room_id, offset=0, limit=20, api_key='demo'):
    w3 = Web3(Web3.HTTPProvider(f'https://base-mainnet.g.alchemy.com/v2/{api_key}'))
    
    contract_abi = [
        {
            "inputs": [
                {"name": "roomId", "type": "uint256"},
                {"name": "offset", "type": "uint256"},
                {"name": "limit", "type": "uint256"}
            ],
            "name": "getRoomMessages",
            "outputs": [
                {
                    "components": [
                        {"name": "sender", "type": "address"},
                        {"name": "content", "type": "string"},
                        {"name": "timestamp", "type": "uint256"},
                        {"name": "roomId", "type": "uint256"}
                    ],
                    "internalType": "struct AmbienceChat.Message[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
    
    contract = w3.eth.contract(
        address='0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
        abi=contract_abi
    )
    
    try:
        messages = contract.functions.getRoomMessages(room_id, offset, limit).call()
        
        formatted_messages = []
        for i, msg in enumerate(messages):
            formatted_messages.append({
                'id': str(offset + i),
                'sender': msg[0],
                'content': msg[1],
                'timestamp': int(msg[2]) * 1000,  # Convert to milliseconds
                'room_id': int(msg[3])
            })
        
        return formatted_messages
        
    except Exception as e:
        print(f'Error fetching messages: {e}')
        raise

# Usage
messages = get_room_messages(room_id=1, offset=0, limit=20)
for msg in messages:
    print(f"Message {msg['id']}: {msg['content']} from {msg['sender']}")
```

## cURL Examples

### Get Room Information

```bash
curl -X GET "https://api.ambience.chat/web3/contract/getRoom?roomId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Username Availability

```bash
curl -X GET "https://api.ambience.chat/web3/contract/usernameTaken?username=john_doe" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Rate Limit Status

```bash
curl -X GET "https://api.ambience.chat/rate-limit" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Create Room

```bash
curl -X POST "https://api.ambience.chat/web3/contract/createRoom" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Room",
    "isPrivate": false
  }'
```

### Set Username

```bash
curl -X POST "https://api.ambience.chat/web3/contract/setUsername" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe"
  }'
```

## Rust Examples

### Send Message

```rust
use ethers::prelude::*;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize provider
    let provider = Provider::<Http>::try_from(
        "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
    )?;
    
    // Initialize wallet (never commit private keys!)
    let wallet: LocalWallet = "your_private_key"
        .parse::<LocalWallet>()?
        .with_chain_id(8453u64);
    
    let client = SignerMiddleware::new(provider, wallet);
    
    // Contract ABI
    let contract = Contract::new(
        "0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e".parse()?,
        json!([
            {
                "inputs": [
                    {"internalType": "uint256", "name": "roomId", "type": "uint256"},
                    {"internalType": "string", "name": "content", "type": "string"}
                ],
                "name": "sendMessage",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ])
        .into(),
        client,
    );
    
    // Send message
    let receipt = contract
        .method("sendMessage", (1u64, "Hello from Rust!"))?
        .send()
        .await?
        .await?;
    
    println!("Message sent: {:?}", receipt);
    
    Ok(())
}
```

## Go Examples

### Send Message

```go
package main

import (
    "context"
    "crypto/ecdsa"
    "fmt"
    "log"
    "math/big"

    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/ethereum/go-ethereum/ethclient"
)

// Contract ABI (simplified)
const contractABI = `[
    {
        "inputs": [
            {"name": "roomId", "type": "uint256"},
            {"name": "content", "type": "string"}
        ],
        "name": "sendMessage",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]`

func sendMessage(roomId *big.Int, content string) error {
    // Initialize client
    client, err := ethclient.Dial("https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY")
    if err != nil {
        return err
    }
    
    // Load private key
    privateKey, err := crypto.HexToECDSA("your_private_key_here")
    if err != nil {
        return err
    }
    
    // Get public key
    publicKey := privateKey.Public()
    publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
    if !ok {
        return fmt.Errorf("error casting public key to ECDSA")
    }
    
    // Get address
    fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
    
    // Create auth transactor
    auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(8453))
    if err != nil {
        return err
    }
    auth.Value = big.NewInt(0)
    auth.GasLimit = uint64(120000)
    
    // Create contract instance
    instance, err := NewContractCaller(
        common.HexToAddress("0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e"),
        client,
    )
    if err != nil {
        return err
    }
    
    // Send transaction
    tx, err := instance.SendMessage(auth, roomId, content)
    if err != nil {
        return err
    }
    
    fmt.Printf("Transaction sent: %s\n", tx.Hash().Hex())
    
    // Wait for confirmation
    _, err = bind.WaitMined(context.Background(), client, tx)
    if err != nil {
        return err
    }
    
    fmt.Println("Message sent successfully!")
    return nil
}

func main() {
    roomId := big.NewInt(1)
    content := "Hello from Go!"
    
    err := sendMessage(roomId, content)
    if err != nil {
        log.Fatal(err)
    }
}
```

## Error Handling Examples

### Generic Error Handler

```javascript
class APIError extends Error {
  constructor(message, code, status, details = {}) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.status = status
    this.details = details
  }
}

async function handleAPIRequest(requestFn) {
  try {
    return await requestFn()
  } catch (error) {
    // Handle different types of errors
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      throw new APIError(
        'Rate limit exceeded. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        429,
        { retryAfter: error.details.retryAfter }
      )
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new APIError(
        'Insufficient funds for transaction.',
        'INSUFFICIENT_FUNDS',
        400
      )
    }
    
    if (error.code === 'INVALID_ROOM') {
      throw new APIError(
        'The specified room does not exist.',
        'INVALID_ROOM',
        404
      )
    }
    
    // Generic error
    throw new APIError(
      error.message || 'An unexpected error occurred.',
      'UNKNOWN_ERROR',
      500
    )
  }
}

// Usage
try {
  const result = await handleAPIRequest(() => sendMessage(1, 'Hello!'))
  console.log('Success:', result)
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error (${error.status}):`, error.message)
    
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log(`Retry after: ${error.details.retryAfter} seconds`)
    }
  } else {
    console.error('Unexpected error:', error)
  }
}
```

These examples provide comprehensive code samples for integrating with the Ambience Chat API across multiple programming languages and use cases.