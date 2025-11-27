# Authentication & Rate Limiting Documentation

## Overview

This document outlines the authentication mechanisms and rate limiting policies for the Ambience Chat API. The application uses Web3 wallet authentication for blockchain interactions and implements comprehensive rate limiting across all API endpoints.

## Authentication

### Web3 Wallet Authentication (Primary)

The primary authentication method uses Web3 wallet signatures to verify user identity.

#### Supported Wallets
- **MetaMask**
- **Coinbase Wallet**
- **WalletConnect**
- **Trust Wallet**
- ** Rainbow Wallet**
- **Phantom** (for future cross-chain support)

#### Authentication Flow

##### 1. Wallet Connection
```javascript
import { createAppKit } from '@reown/appkit/react'

// Initialize AppKit
const appKit = createAppKit({
  projectId: 'your-project-id',
  networks: [base, baseSepolia],
  walletConnectVersion: 2,
  features: {
    email: false,
    socials: []
  }
})

// Connect wallet
const { address, isConnected } = useAppKitAccount()
```

##### 2. Signature Challenge
```javascript
const generateAuthChallenge = async (address: string) => {
  const timestamp = Math.floor(Date.now() / 1000)
  const message = `Ambience Chat Authentication\n\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${generateNonce()}`
  
  return {
    message,
    timestamp,
    nonce: generateNonce()
  }
}

const signChallenge = async (message: string) => {
  const signature = await walletClient.signMessage({ message })
  return signature
}
```

##### 3. Signature Verification
```javascript
const verifySignature = async (address: string, message: string, signature: string) => {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature
    })
    
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}
```

##### 4. Session Management
```javascript
const createSession = (address: string, signature: string) => {
  const sessionData = {
    address,
    signature,
    timestamp: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }
  
  // Store in secure storage
  localStorage.setItem('ambience_session', JSON.stringify(sessionData))
  
  return generateJWT(sessionData)
}
```

#### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "0x1234567890abcdef...",
    "iat": 1634567890,
    "exp": 1634654290,
    "aud": "ambience-chat",
    "iss": "ambience-chat-api",
    "wallet_type": "web3"
  },
  "signature": "..."
}
```

### API Key Authentication

For server-to-server communication and monitoring tools:

#### Header Format
```
Authorization: Bearer your-api-key
X-API-Key: your-api-key
```

#### API Key Scopes
- `read:messages` - Read messages
- `write:messages` - Send messages  
- `read:rooms` - Read room data
- `write:rooms` - Create/modify rooms
- `admin` - Administrative functions
- `monitoring` - System monitoring

## Session Management

### Token Refresh
```javascript
const refreshToken = async () => {
  const session = getStoredSession()
  
  if (!session) {
    throw new Error('No active session')
  }
  
  // Check if token is close to expiry
  const timeUntilExpiry = session.expiresAt - Date.now()
  if (timeUntilExpiry > 5 * 60 * 1000) { // 5 minutes
    return session
  }
  
  // Refresh token
  const newChallenge = await generateAuthChallenge(session.address)
  const newSignature = await signChallenge(newChallenge.message)
  
  return createSession(session.address, newSignature)
}
```

### Token Validation Middleware
```javascript
const validateJWT = (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('Token expired')
    }
    
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

## Rate Limiting

### Overview

Rate limiting is implemented at multiple levels to ensure fair usage and prevent abuse:

1. **Global Rate Limiting** - Overall API protection
2. **Endpoint-Specific Limits** - Targeted restrictions
3. **User-Based Limits** - Per-user restrictions
4. **IP-Based Limits** - Connection-level restrictions

### Rate Limit Tiers

#### Anonymous Users
- **API Requests**: 10 requests/minute
- **WebSocket Messages**: 5 messages/minute
- **Contract Reads**: 20 requests/minute

#### Authenticated Users
- **API Requests**: 100 requests/minute
- **WebSocket Messages**: 30 messages/minute
- **Contract Reads**: 100 requests/minute
- **Contract Writes**: 10 requests/minute

#### Premium Users (Future)
- **API Requests**: 500 requests/minute
- **WebSocket Messages**: 100 messages/minute
- **Contract Reads**: 500 requests/minute
- **Contract Writes**: 50 requests/minute

### Rate Limit Headers

All responses include rate limiting information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
X-RateLimit-Window: 60
X-RateLimit-Type: authenticated
```

### Rate Limit Implementation

#### Token Bucket Algorithm
```javascript
class RateLimiter {
  constructor(options) {
    this.capacity = options.capacity
    this.refillRate = options.refillRate / 1000 // Convert to per second
    this.tokens = options.capacity
    this.lastRefill = Date.now()
  }
  
  consume(clientId, tokens = 1) {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return { allowed: true, remaining: this.tokens }
    }
    
    return {
      allowed: false,
      remaining: this.tokens,
      retryAfter: this.calculateRetryTime(tokens)
    }
  }
  
  refill() {
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    const tokensToAdd = timePassed * this.refillRate
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}
```

#### Redis-Based Distributed Rate Limiting
```javascript
import Redis from 'ioredis'

class DistributedRateLimiter {
  constructor(redisClient) {
    this.redis = redisClient
    this.scriptSha = null
  }
  
  async checkRateLimit(key, limit, window) {
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local current = redis.call('GET', key)
      
      if current == false then
        redis.call('SETEX', key, window, 1)
        return {limit, limit - 1, 1}
      end
      
      current = tonumber(current)
      if current >= limit then
        local ttl = redis.call('TTL', key)
        return {limit, 0, ttl}
      end
      
      redis.call('INCR', key)
      return {limit, limit - current - 1, redis.call('TTL', key)}
    `
    
    if (!this.scriptSha) {
      this.scriptSha = await this.redis.script('LOAD', luaScript)
    }
    
    const result = await this.redis.evalsha(
      this.scriptSha, 1, key, limit.toString(), window.toString()
    )
    
    return {
      allowed: result[2] > 0,
      limit: result[0],
      remaining: result[1],
      resetTime: Date.now() + (result[2] * 1000)
    }
  }
}
```

### Endpoint-Specific Limits

#### Contract Write Operations
```javascript
const CONTRACT_WRITE_LIMIT = {
  window: 60000, // 1 minute
  limit: 10, // 10 transactions per minute
  burst: 3   // Allow 3 burst requests
}
```

#### WebSocket Messages
```javascript
const WEBSOCKET_MESSAGE_LIMIT = {
  window: 60000, // 1 minute
  limit: 30,     // 30 messages per minute
  burst: 5       // Allow 5 burst messages
}
```

#### File Uploads
```javascript
const FILE_UPLOAD_LIMIT = {
  window: 300000, // 5 minutes
  limit: 5,       // 5 files per 5 minutes
  maxSize: 10485760 // 10MB max file size
}
```

### Rate Limit Response Examples

#### Rate Limit Exceeded (429)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for this endpoint",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": 1634567950,
      "retryAfter": 60,
      "limitType": "authenticated"
    }
  },
  "success": false,
  "meta": {
    "requestId": "req_abc123",
    "timestamp": 1634567890
  }
}
```

#### Rate Limit Warning (Approaching Limit)
```json
{
  "warning": {
    "code": "RATE_LIMIT_WARNING",
    "message": "Approaching rate limit",
    "details": {
      "limit": 100,
      "remaining": 10,
      "resetTime": 1634567950,
      "percentageUsed": 90
    }
  }
}
```

### Rate Limit Enforcement

#### Middleware Implementation
```javascript
const rateLimitMiddleware = (options) => {
  return async (req, res, next) => {
    const clientId = getClientId(req) // IP + User Agent + User ID
    const userType = getUserType(req) // anonymous, authenticated, premium
    
    const limiter = getRateLimiter(userType, req.path)
    const result = await limiter.checkRateLimit(
      clientId, 
      options.limit, 
      options.window
    )
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime,
      'X-RateLimit-Type': userType
    })
    
    if (!result.allowed) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          details: {
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }
        }
      })
    }
    
    next()
  }
}
```

### Bypass Rules

#### Emergency Bypass
- **Admin Endpoints**: Skip rate limiting for admin operations
- **Health Checks**: No rate limiting on `/health` endpoints
- **Documentation**: No rate limiting on API docs

#### Whitelisted Clients
```javascript
const WHITELISTED_CLIENTS = [
  '127.0.0.1', // Local development
  '10.0.0.0/8', // Internal networks
  '172.16.0.0/12' // Docker networks
]

const isWhitelisted = (clientIP) => {
  return WHITELISTED_CLIENTS.some(cidr => {
    if (cidr.includes('/')) {
      return IP.cidrSubnet(cidr).contains(clientIP)
    }
    return clientIP === cidr
  })
}
```

## Monitoring & Analytics

### Rate Limit Metrics
```javascript
const rateLimitMetrics = {
  totalRequests: 0,
  blockedRequests: 0,
  rateLimitHits: 0,
  topClients: new Map(),
  endpointStats: new Map()
}

const trackRateLimit = (clientId, endpoint, allowed, limit) => {
  rateLimitMetrics.totalRequests++
  
  if (!allowed) {
    rateLimitMetrics.blockedRequests++
  }
  
  // Update client statistics
  const clientStats = rateLimitMetrics.topClients.get(clientId) || {
    requests: 0,
    blocked: 0,
    endpoints: new Set()
  }
  
  clientStats.requests++
  if (!allowed) clientStats.blocked++
  clientStats.endpoints.add(endpoint)
  
  rateLimitMetrics.topClients.set(clientId, clientStats)
}
```

### Dashboard Integration
```javascript
// Prometheus metrics
const rateLimitMetrics = {
  rate_limit_requests_total: new Counter({
    name: 'rate_limit_requests_total',
    help: 'Total number of requests',
    labelNames: ['endpoint', 'client_type', 'result']
  }),
  
  rate_limit_requests_in_flight: new Gauge({
    name: 'rate_limit_requests_in_flight',
    help: 'Current number of requests in flight',
    labelNames: ['endpoint']
  }),
  
  rate_limit_tokens_available: new Gauge({
    name: 'rate_limit_tokens_available',
    help: 'Available tokens in rate limiter',
    labelNames: ['client_type']
  })
}
```

## Security Considerations

### Rate Limit Evasion Prevention
- **IP Rotation Detection**: Monitor for rapid IP changes
- **User Agent Validation**: Check for suspicious user agents
- **Behavioral Analysis**: Detect unusual access patterns
- **Device Fingerprinting**: Track devices across sessions

### DDoS Protection
- **Connection Limits**: Max connections per IP
- **Bandwidth Limits**: Request size limits
- **Geographic Filtering**: Block suspicious regions
- **Challenge-Response**: CAPTCHA for suspected bots

### Best Practices

1. **Graceful Degradation**: Return meaningful error messages
2. **Retry Logic**: Implement exponential backoff
3. **Monitoring**: Track rate limit effectiveness
4. **Regular Updates**: Adjust limits based on usage patterns
5. **User Communication**: Inform users about rate limits

## Client Implementation

### React Hook for Rate Limiting
```javascript
const useRateLimit = (options) => {
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remaining: options.limit,
    resetTime: Date.now() + options.window,
    isLimited: false
  })
  
  const checkRateLimit = useCallback(async (endpoint) => {
    try {
      const response = await fetch(endpoint, { method: 'HEAD' })
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'))
      const resetTime = parseInt(response.headers.get('X-RateLimit-Reset')) * 1000
      
      setRateLimitInfo({
        remaining,
        resetTime,
        isLimited: remaining <= 0
      })
      
      return remaining > 0
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return true // Assume allowed on error
    }
  }, [])
  
  return { rateLimitInfo, checkRateLimit }
}
```

### Automatic Retry with Backoff
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const retryAfter = error.headers.get('Retry-After') || Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        continue
      }
      throw error
    }
  }
}