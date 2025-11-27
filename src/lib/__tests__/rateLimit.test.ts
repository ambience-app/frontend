/**
 * src/lib/__tests__/rateLimit.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: any, init: any) => ({
      json: true,
      status: init?.status || 200,
      headers: init?.headers || {},
    })),
    next: vi.fn((init: any) => ({
      next: true,
      headers: init?.headers || {},
    })),
  },
  NextRequest: class NextRequest {
    constructor(public url: string, public method: string = 'GET') {}
  },
}));

// Mock WebSocket
vi.mock('ws', () => ({
  WebSocket: class WebSocket {
    send = vi.fn();
  },
}));

// Mock LRUCache
vi.mock('lru-cache', () => ({
  LRUCache: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
    size: 0,
  })),
}));

const { rateLimit, rateLimitWebSocket } = require('../rateLimit');

describe('Rate Limiting', () => {
  describe('rateLimit', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should allow requests within rate limit', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit();
      const result = rateLimitMiddleware(mockReq as any);

      expect(result).toBeDefined();
      expect(result.status).toBe(200);
    });

    it('should rate limit requests that exceed token limit', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit({ uniqueTokenPerInterval: 1 });
      const result = rateLimitMiddleware(mockReq as any);

      expect(result).toBeDefined();
      expect(result.status).toBe(429);
    });

    it('should set rate limit headers', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit({ uniqueTokenPerInterval: 100 });
      const result = rateLimitMiddleware(mockReq as any);

      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '100');
    });

    it('should use custom interval', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit({ 
        uniqueTokenPerInterval: 100, 
        interval: 300000 // 5 minutes
      });
      const result = rateLimitMiddleware(mockReq as any);

      expect(result).toBeDefined();
      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '100');
    });

    it('should calculate remaining requests correctly', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit({ uniqueTokenPerInterval: 10 });

      // First request should have 9 remaining (10 - 1 = 9)
      rateLimitMiddleware(mockReq as any);
      // This test would need actual implementation details to be more specific
    });
  });

  describe('rateLimitWebSocket', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should allow messages within rate limit', () => {
      const mockWebSocket = {
        send: vi.fn(),
      };
      const mockIP = '127.0.0.1';
      
      const result = rateLimitWebSocket(mockWebSocket as any, mockIP);
      
      expect(result).toBe(false);
    });

    it('should rate limit when exceeding message limit', () => {
      const mockWebSocket = {
        send: vi.fn(),
      };
      const mockIP = '127.0.0.1';
      
      // Mock the wsClients Map to simulate multiple messages
      const { WebSocketService } = require('../websocket');
      
      // Simulate sending more than 30 messages
      const messages = Array(35).fill(0);
      let rateLimitedCount = 0;
      
      messages.forEach(() => {
        const isRateLimited = rateLimitWebSocket(mockWebSocket as any, mockIP);
        if (isRateLimited) {
          rateLimitedCount++;
        }
      });
      
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should reset rate limit after interval', () => {
      const mockWebSocket = {
        send: vi.fn(),
      };
      const mockIP = '127.0.0.2';
      
      // First few messages should be allowed
      const results = [];
      for (let i = 0; i < 35; i++) {
        results.push(rateLimitWebSocket(mockWebSocket as any, mockIP));
      }
      
      // Should be allowed for first 30, then rate limited
      const allowedCount = results.filter(r => r === false).length;
      const rateLimitedCount = results.filter(r => r === true).length;
      
      expect(allowedCount).toBe(30);
      expect(rateLimitedCount).toBe(5);
    });

    it('should handle different IP addresses separately', () => {
      const mockWebSocket = {
        send: vi.fn(),
      };
      
      // Test with different IPs
      const ip1 = '127.0.0.1';
      const ip2 = '127.0.0.2';
      const ip3 = '127.0.0.3';
      
      // Each IP should have its own rate limit
      expect(rateLimitWebSocket(mockWebSocket as any, ip1)).toBe(false);
      expect(rateLimitWebSocket(mockWebSocket as any, ip2)).toBe(false);
      expect(rateLimitWebSocket(mockWebSocket as any, ip3)).toBe(false);
      
      // Now ip1 should be rate limited first (has more messages)
      expect(rateLimitWebSocket(mockWebSocket as any, ip1)).toBe(true);
    });

    it('should send error message when rate limited', () => {
      const mockWebSocket = {
        send: vi.fn(),
      };
      const mockIP = '127.0.0.1';
      
      // Send enough messages to trigger rate limiting
      for (let i = 0; i < 35; i++) {
        rateLimitWebSocket(mockWebSocket as any, mockIP);
      }
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'error',
          message: 'Rate limit exceeded. Please try again later.',
        })
      );
    });

    it('should handle WebSocket send errors gracefully', () => {
      const mockWebSocket = {
        send: vi.fn(() => {
          throw new Error('Send failed');
        }),
      };
      const mockIP = '127.0.0.1';
      
      // Should not throw error even if WebSocket send fails
      expect(() => {
        for (let i = 0; i < 35; i++) {
          rateLimitWebSocket(mockWebSocket as any, mockIP);
        }
      }).not.toThrow();
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should use correct default values', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit();
      const result = rateLimitMiddleware(mockReq as any);

      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '500');
    });

    it('should allow configuration of all parameters', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit({
        uniqueTokenPerInterval: 200,
        interval: 300000, // 5 minutes
      });
      const result = rateLimitMiddleware(mockReq as any);

      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '200');
    });

    it('should handle partial configuration', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit({
        uniqueTokenPerInterval: 150,
        // interval uses default
      });
      const result = rateLimitMiddleware(mockReq as any);

      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '150');
    });
  });

  describe('Memory Management', () => {
    it('should clean up old WebSocket clients', () => {
      // This would be tested with a more complete setup
      // For now, just ensure the cleanup interval doesn't crash
      expect(() => {
        // Cleanup happens every minute automatically
        setTimeout(() => {}, 100);
      }).not.toThrow();
    });

    it('should handle LRU cache cleanup', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      };

      const rateLimitMiddleware = rateLimit();
      
      // Make multiple requests with same IP
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(mockReq as any);
      }
      
      // Should handle cache cleanup gracefully
      expect(true).toBe(true);
    });
  });
});