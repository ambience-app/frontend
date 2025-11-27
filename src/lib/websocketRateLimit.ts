// Simple in-memory store for WebSocket rate limiting
const wsRateLimits = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const WS_RATE_LIMIT = 30; // 30 messages
const WS_RATE_WINDOW = 60 * 1000; // 1 minute

// Clean up old rate limit records every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [ip, data] of wsRateLimits.entries()) {
    if (now - data.resetAt > timeout) {
      wsRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Clean up the interval when the process exits
if (typeof process !== 'undefined') {
  process.on('exit', () => clearInterval(cleanupInterval));
  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    process.exit(0);
  });
}

export function checkWebSocketRateLimit(ip: string): { allowed: boolean; headers: Record<string, string> } {
  const now = Date.now();
  const rateLimit = wsRateLimits.get(ip) || { count: 0, resetAt: now + WS_RATE_WINDOW };
  
  // Reset the counter if the window has passed
  if (now > rateLimit.resetAt) {
    rateLimit.count = 0;
    rateLimit.resetAt = now + WS_RATE_WINDOW;
  }

  // Check if rate limit is exceeded
  const remaining = Math.max(0, WS_RATE_LIMIT - rateLimit.count - 1);
  const reset = Math.ceil(rateLimit.resetAt / 1000);
  
  // Set rate limit headers
  const headers = {
    'X-RateLimit-Limit': WS_RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };

  // If rate limit is not exceeded, increment the counter
  if (rateLimit.count < WS_RATE_LIMIT) {
    rateLimit.count += 1;
    wsRateLimits.set(ip, rateLimit);
    return { allowed: true, headers };
  }

  return { 
    allowed: false, 
    headers: {
      ...headers,
      'Retry-After': Math.ceil((rateLimit.resetAt - now) / 1000).toString()
    }
  };
}

// Example usage with a WebSocket server:
/*
import { WebSocketServer } from 'ws';
import { checkWebSocketRateLimit } from './websocketRateLimit';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress || 'unknown';
  
  ws.on('message', (message) => {
    const { allowed, headers } = checkWebSocketRateLimit(ip);
    
    if (!allowed) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: headers['Retry-After']
      }));
      return;
    }
    
    // Process the message
    // ...
  });
});
*/
