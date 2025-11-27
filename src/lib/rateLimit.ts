import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { WebSocket } from 'ws';
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

// In-memory store for rate limiting
// In production, consider using a distributed store like Redis
const tokenCache = new LRUCache<string, number[]>({
  max: 500, // Max 500 unique IPs per interval
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Rate limiting for API routes
export const rateLimit = (options?: Options) => {
  const token = options?.uniqueTokenPerInterval || 500;
  const interval = options?.interval || 60000; // 1 minute by default

  return (req: NextRequest) => {
    const tokenCount = tokenCache.get('token') || [0];
    if (tokenCount[0] === 0) {
      tokenCache.set('token', [1], { ttl: interval });
    } else {
      tokenCount[0] += 1;
      tokenCache.set('token', tokenCount, { ttl: interval });
    }

    const currentUsage = tokenCount[0];
    const isRateLimited = currentUsage >= token;

    const headers = {
      'X-RateLimit-Limit': `${token}`,
      'X-RateLimit-Remaining': isRateLimited ? '0' : `${token - currentUsage}`,
    };

    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return NextResponse.next({
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
      },
    });
  };
};

// Rate limiting for WebSocket connections
const wsClients = new Map<string, { count: number; lastSeen: number }>();
const WS_RATE_LIMIT = 30; // Max 30 messages per minute per connection
const WS_RATE_INTERVAL = 60000; // 1 minute

export const rateLimitWebSocket = (ws: WebSocket, ip: string): boolean => {
  const now = Date.now();
  const client = wsClients.get(ip) || { count: 0, lastSeen: now };
  
  // Reset count if interval has passed
  if (now - client.lastSeen > WS_RATE_INTERVAL) {
    client.count = 0;
    client.lastSeen = now;
  }

  // Increment count and check limit
  client.count += 1;
  wsClients.set(ip, client);

  if (client.count > WS_RATE_LIMIT) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Rate limit exceeded. Please try again later.'
    }));
    return true;
  }

  return false;
};

// Clean up old WebSocket clients
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [ip, client] of wsClients.entries()) {
    if (now - client.lastSeen > timeout) {
      wsClients.delete(ip);
    }
  }
}, 60 * 1000); // Run every minute
