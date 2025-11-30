# Error Handling & Troubleshooting Guide

## Overview

This guide provides comprehensive error handling patterns and troubleshooting solutions for the Ambience Chat API. Understanding and properly handling errors is crucial for building robust applications with blockchain integrations.

## Error Categories

### 1. Blockchain Transaction Errors

#### Transaction Reverted

**Error Code**: `TRANSACTION_REVERTED`

**Causes**:
- Smart contract function reverted
- Gas limit exceeded
- Invalid function parameters
- Insufficient funds

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_REVERTED",
    "message": "VM Exception while processing transaction: revert",
    "details": {
      "reason": "Rate limit exceeded",
      "transactionHash": "0x1234567890abcdef...",
      "gasUsed": "120000",
      "network": "base-sepolia"
    },
    "meta": {
      "requestId": "req_abc123",
      "timestamp": 1634567890
    }
  }
}
```

**Handling**:
```javascript
try {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  
  if (receipt.status === 'reverted') {
    throw new APIError(
      'Transaction reverted by smart contract',
      'TRANSACTION_REVERTED',
      400,
      { 
        transactionHash: receipt.transactionHash,
        reason: 'Check contract conditions'
      }
    );
  }
} catch (error) {
  if (error.code === 'TRANSACTION_REVERTED') {
    // User-friendly error handling
    showError('Message not sent. Please try again.');
  }
}
```

#### Gas Estimation Failed

**Error Code**: `GAS_ESTIMATION_FAILED`

**Causes**:
- Network congestion
- Contract state changes
- Gas price spikes

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "GAS_ESTIMATION_FAILED",
    "message": "Gas estimation failed",
    "details": {
      "suggestedGasLimit": 120000,
      "currentGasPrice": "20000000000",
      "network": "base-mainnet"
    }
  }
}
```

**Handling**:
```javascript
async function estimateGasWithFallback(contractFunction) {
  try {
    return await contractFunction.estimateGas();
  } catch (error) {
    // Fallback to manual gas limit
    if (error.code === 'GAS_ESTIMATION_FAILED') {
      return {
        gasLimit: 200000, // Higher than estimated
        gasPrice: 'auto'
      };
    }
    throw error;
  }
}
```

#### Insufficient Funds

**Error Code**: `INSUFFICIENT_FUNDS`

**Causes**:
- User wallet has insufficient balance
- Gas price too high
- Network fees increased

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient funds for transaction",
    "details": {
      "required": "0.001 ETH",
      "available": "0.0005 ETH",
      "gasEstimate": "0.0003 ETH",
      "network": "base-mainnet"
    }
  }
}
```

**Handling**:
```javascript
try {
  const tx = await sendTransaction();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    const required = error.details.required;
    const available = error.details.available;
    
    showError(`Insufficient funds. Required: ${required}, Available: ${available}`);
    
    // Suggest funding wallet
    const faucetUrl = getNetworkFaucetUrl();
    window.open(faucetUrl, '_blank');
  }
}
```

### 2. Rate Limiting Errors

#### Rate Limit Exceeded

**Error Code**: `RATE_LIMIT_EXCEEDED`

**Causes**:
- Too many requests in time window
- User authentication required
- Premium tier exceeded

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for this endpoint",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": 1634567950,
      "retryAfter": 60,
      "limitType": "authenticated"
    },
    "meta": {
      "requestId": "req_abc123",
      "timestamp": 1634567890
    }
  }
}
```

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1634567950
X-RateLimit-Window: 60
X-RateLimit-Type: authenticated
```

**Handling with Retry Logic**:
```javascript
class RateLimitHandler {
  constructor() {
    this.retryQueue = new Map();
  }
  
  async handleRequest(requestFn, options = {}) {
    const { maxRetries = 3, baseDelay = 1000 } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (error.code === 'RATE_LIMIT_EXCEEDED' && attempt < maxRetries) {
          const delay = this.calculateExponentialBackoff(attempt, baseDelay);
          const resetTime = error.details.resetTime;
          const waitTime = Math.max(delay, resetTime - Date.now());
          
          await this.delay(waitTime);
          continue;
        }
        throw error;
      }
    }
  }
  
  calculateExponentialBackoff(attempt, baseDelay) {
    return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const rateLimitHandler = new RateLimitHandler();

// Usage
try {
  const result = await rateLimitHandler.handleRequest(async () => {
    return await sendMessage(roomId, content);
  });
} catch (error) {
  console.error('Request failed after retries:', error);
}
```

#### Message Cooldown

**Error Code**: `MESSAGE_COOLDOWN`

**Causes**:
- Built-in smart contract cooldown (30 seconds)
- Rapid message sending

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "MESSAGE_COOLDOWN",
    "message": "Please wait before sending another message",
    "details": {
      "cooldownPeriod": 30,
      "timeRemaining": 15,
      "lastMessageTime": 1634567890,
      "network": "base-sepolia"
    }
  }
}
```

**Handling**:
```javascript
async function sendMessageWithCooldown(roomId, content) {
  try {
    return await sendMessage(roomId, content);
  } catch (error) {
    if (error.code === 'MESSAGE_COOLDOWN') {
      const timeRemaining = error.details.timeRemaining;
      
      // Show countdown to user
      showMessageCooldown(timeRemaining);
      
      // Queue message for later
      await queueMessage(roomId, content, timeRemaining * 1000);
    }
    throw error;
  }
}

function showMessageCooldown(seconds) {
  const message = `Please wait ${seconds} seconds before sending another message`;
  showToast(message, 'warning');
}
```

### 3. Network & Connectivity Errors

#### RPC Provider Unavailable

**Error Code**: `RPC_PROVIDER_UNAVAILABLE`

**Causes**:
- RPC endpoint down
- Network congestion
- API key issues

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "RPC_PROVIDER_UNAVAILABLE",
    "message": "RPC provider is temporarily unavailable",
    "details": {
      "provider": "alchemy",
      "network": "base-mainnet",
      "retryAfter": 30
    }
  }
}
```

**Handling with Provider Fallback**:
```javascript
class RPCHandler {
  constructor() {
    this.providers = [
      'https://base-mainnet.g.alchemy.com/v2/KEY1',
      'https://base-mainnet.g.alchemy.com/v2/KEY2',
      'https://base-mainnet.g.alchemy.com/v2/KEY3'
    ];
    this.currentProvider = 0;
  }
  
  async makeRequest(method, params) {
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      try {
        return await this.makeRPCCall(this.currentProvider, method, params);
      } catch (error) {
        if (error.code === 'RPC_PROVIDER_UNAVAILABLE') {
          this.currentProvider = (this.currentProvider + 1) % this.providers.length;
          continue;
        }
        throw error;
      }
    }
    throw new Error('All RPC providers failed');
  }
}
```

#### WebSocket Connection Failed

**Error Code**: `WEBSOCKET_CONNECTION_FAILED`

**Causes**:
- Server offline
- Proxy/firewall blocking
- Network issues

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "WEBSOCKET_CONNECTION_FAILED",
    "message": "Failed to establish WebSocket connection",
    "details": {
      "url": "wss://api.ambience.chat/ws",
      "reason": "connection timeout",
      "retryAfter": 5
    }
  }
}
```

**Handling with Reconnection**:
```javascript
class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve(this.ws);
      };
      
      this.ws.onerror = (error) => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new APIError(
            'WebSocket connection failed after multiple attempts',
            'WEBSOCKET_CONNECTION_FAILED',
            503
          ));
        }
      };
      
      this.ws.onclose = () => {
        this.handleReconnect();
      };
    });
  }
  
  async handleReconnect() {
    this.reconnectAttempts++;
    await this.delay(this.reconnectInterval * this.reconnectAttempts);
    
    try {
      await this.connect();
    } catch (error) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.showOfflineMessage();
      }
    }
  }
}
```

### 4. Validation Errors

#### Invalid Parameters

**Error Code**: `INVALID_PARAMETERS`

**Causes**:
- Malformed request data
- Missing required fields
- Data type mismatches

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "roomId",
          "message": "Room ID must be a positive integer",
          "received": "abc"
        },
        {
          "field": "content",
          "message": "Content is required and must be less than 1000 characters",
          "received": ""
        }
      ]
    }
  }
}
```

**Handling**:
```javascript
function handleValidationErrors(error) {
  if (error.code === 'INVALID_PARAMETERS') {
    const fieldErrors = error.details.errors;
    
    // Display field-specific errors
    fieldErrors.forEach(fieldError => {
      const fieldElement = document.getElementById(fieldError.field);
      if (fieldElement) {
        fieldElement.classList.add('error');
        fieldElement.nextElementSibling.textContent = fieldError.message;
      }
    });
    
    // Focus on first error field
    if (fieldErrors.length > 0) {
      const firstErrorField = document.getElementById(fieldErrors[0].field);
      if (firstErrorField) {
        firstErrorField.focus();
      }
    }
  }
}
```

#### Authentication Errors

**Error Code**: `AUTHENTICATION_FAILED`

**Causes**:
- Invalid API key
- Expired JWT token
- Missing authentication headers

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Authentication required",
    "details": {
      "authType": "jwt",
      "reason": "token expired",
      "expiresAt": 1634567890
    }
  }
}
```

**Handling**:
```javascript
async function handleAuthentication(error) {
  if (error.code === 'AUTHENTICATION_FAILED') {
    // Try to refresh token
    if (error.details.authType === 'jwt' && error.details.reason === 'token expired') {
      try {
        await refreshJWTToken();
        // Retry original request
        return await retryRequest();
      } catch (refreshError) {
        // Redirect to login
        redirectToLogin();
      }
    } else {
      // Show authentication prompt
      showAuthenticationModal();
    }
  }
}
```

## Debugging Tools

### 1. Error Logging

```javascript
// lib/errorLogger.js
import winston from 'winston';

class ErrorLogger {
  constructor() {
    this.logger = winston.createLogger({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'errors.log' })
      ]
    });
  }
  
  log(error, context = {}) {
    const errorInfo = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.logger.error('API Error', errorInfo);
    
    // Send to monitoring service
    this.sendToMonitoring(errorInfo);
  }
  
  sendToMonitoring(errorInfo) {
    // Send to Sentry, LogRocket, or similar service
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }
}

export const errorLogger = new ErrorLogger();
```

### 2. Network Debugging

```javascript
// Debug network requests
const debugNetwork = () => {
  // Log all fetch requests
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = Date.now();
    console.log('🌐 Request:', args);
    
    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Response: ${response.status} (${duration}ms)`);
      
      // Log rate limit headers
      const rateLimitHeaders = {
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset')
      };
      console.log('📊 Rate Limits:', rateLimitHeaders);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Error: ${error.message} (${duration}ms)`);
      throw error;
    }
  };
};

// Enable in development
if (process.env.NODE_ENV === 'development') {
  debugNetwork();
}
```

### 3. Blockchain Transaction Debugging

```javascript
// Debug blockchain transactions
class TransactionDebugger {
  constructor() {
    this.transactions = new Map();
  }
  
  startTracking(txHash) {
    this.transactions.set(txHash, {
      startTime: Date.now(),
      status: 'pending',
      events: []
    });
  }
  
  addEvent(txHash, event) {
    const tx = this.transactions.get(txHash);
    if (tx) {
      tx.events.push({
        timestamp: Date.now(),
        event
      });
    }
  }
  
  getTransactionReport(txHash) {
    const tx = this.transactions.get(txHash);
    if (!tx) return null;
    
    return {
      hash: txHash,
      duration: Date.now() - tx.startTime,
      status: tx.status,
      events: tx.events,
      eventsCount: tx.events.length
    };
  }
  
  formatReport(txHash) {
    const report = this.getTransactionReport(txHash);
    if (!report) return 'Transaction not found';
    
    return `
Transaction: ${report.hash}
Duration: ${report.duration}ms
Status: ${report.status}
Events: ${report.eventsCount}
Timeline:
${report.events.map(e => `${e.timestamp}: ${e.event}`).join('\n')}
    `;
  }
}

export const txDebugger = new TransactionDebugger();

// Usage
try {
  const txHash = await sendTransaction();
  txDebugger.startTracking(txHash);
  
  const receipt = await waitForTransactionReceipt(txHash);
  txDebugger.addEvent(txHash, 'Transaction mined');
  txDebugger.addEvent(txHash, `Status: ${receipt.status}`);
  
  console.log(txDebugger.formatReport(txHash));
} catch (error) {
  txDebugger.addEvent(txHash, `Error: ${error.message}`);
}
```

## Testing Error Scenarios

### 1. Error Simulation

```javascript
// Mock errors for testing
const createMockError = (code, message, details = {}) => ({
  code,
  message,
  details,
  timestamp: Date.now()
});

const testScenarios = [
  {
    name: 'Rate Limit Exceeded',
    error: createMockError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', {
      limit: 100,
      remaining: 0,
      resetTime: Date.now() + 60000
    })
  },
  {
    name: 'Transaction Reverted',
    error: createMockError('TRANSACTION_REVERTED', 'Transaction reverted', {
      reason: 'Rate limit exceeded'
    })
  },
  {
    name: 'Authentication Failed',
    error: createMockError('AUTHENTICATION_FAILED', 'Invalid token', {
      authType: 'jwt',
      reason: 'token expired'
    })
  }
];

// Test error handling
testScenarios.forEach(scenario => {
  console.log(`Testing: ${scenario.name}`);
  
  try {
    handleAPIError(scenario.error);
  } catch (error) {
    console.error(`Unhandled error in ${scenario.name}:`, error);
  }
});
```

### 2. Network Conditions Testing

```javascript
// Test different network conditions
const networkSimulator = {
  slow: () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      return originalFetch(...args);
    };
  },
  
  offline: () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      throw new Error('Network Error');
    };
  },
  
  unstable: () => {
    const originalFetch = window.fetch;
    let attempt = 0;
    window.fetch = async (...args) => {
      attempt++;
      if (attempt % 3 === 0) { // Fail every 3rd request
        throw new Error('Connection unstable');
      }
      return originalFetch(...args);
    };
  },
  
  restore: () => {
    // Restore original fetch
    window.fetch = originalFetch;
  }
};

// Test error handling under different conditions
describe('Error Handling Tests', () => {
  beforeEach(() => {
    networkSimulator.slow();
  });
  
  afterEach(() => {
    networkSimulator.restore();
  });
  
  test('handles slow network gracefully', async () => {
    const startTime = Date.now();
    
    try {
      await sendMessage(1, 'Test');
    } catch (error) {
      expect(error.code).toBe('NETWORK_TIMEOUT');
      expect(Date.now() - startTime).toBeGreaterThan(2000);
    }
  });
});
```

## Best Practices

### 1. Error Message Guidelines

- **Be Specific**: Provide clear error codes and messages
- **User-Friendly**: Translate technical errors to user-friendly messages
- **Actionable**: Include suggestions for resolution
- **Consistent**: Use consistent error format across all endpoints

### 2. Recovery Strategies

- **Automatic Retry**: Implement exponential backoff for transient errors
- **Graceful Degradation**: Provide alternative functionality when services are unavailable
- **User Communication**: Keep users informed about system status
- **Fallback Systems**: Implement backup systems for critical functions

### 3. Monitoring & Alerting

- **Error Rates**: Monitor error rates by endpoint and user
- **Response Times**: Track response times for performance issues
- **User Impact**: Measure how errors affect user experience
- **Proactive Alerts**: Set up alerts for critical error patterns

This comprehensive error handling guide ensures robust error management across all aspects of the Ambience Chat API, from blockchain interactions to user interface feedback.