/**
 * Rate Limiting System for Client-side Actions
 * Implements token bucket algorithm to prevent spam and abuse
 */

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private defaultConfig: RateLimitConfig;

  constructor(defaultConfig: RateLimitConfig = { maxRequests: 10, timeWindow: 1000 }) {
    this.defaultConfig = defaultConfig;
  }

  /**
   * Check if action is allowed based on rate limiting
   * @param key - Unique identifier for the action (e.g., user address + action type)
   * @param config - Optional custom config for this specific action
   * @returns Object with { allowed: boolean, retryAfter?: number }
   */
  checkRateLimit(key: string, config?: RateLimitConfig): { allowed: boolean; retryAfter?: number } {
    const bucketConfig = config || this.defaultConfig;
    const now = Date.now();
    
    let bucket = this.buckets.get(key);
    
    // Initialize bucket if it doesn't exist
    if (!bucket) {
      bucket = {
        tokens: bucketConfig.maxRequests,
        lastRefill: now
      };
      this.buckets.set(key, bucket);
    }

    // Calculate tokens to add based on time elapsed
    const timeSinceLastRefill = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timeSinceLastRefill / bucketConfig.timeWindow);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucketConfig.maxRequests);
      bucket.lastRefill = now;
    }

    // Check if we have tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return { allowed: true };
    }

    // Calculate retry time
    const retryAfter = bucketConfig.timeWindow - timeSinceLastRefill;
    return { 
      allowed: false, 
      retryAfter: Math.max(0, retryAfter) 
    };
  }

  /**
   * Wrapper function to rate limit async functions
   * @param fn - Function to wrap
   * @param key - Unique identifier for the action
   * @param config - Optional custom config
   * @returns Wrapped function that returns error if rate limited
   */
  withRateLimit<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    key: string,
    config?: RateLimitConfig
  ): (...args: T) => Promise<R | { error: string; retryAfter: number }> {
    return async (...args: T): Promise<R | { error: string; retryAfter: number }> => {
      const rateLimitResult = this.checkRateLimit(key, config);
      
      if (!rateLimitResult.allowed) {
        return {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter || 1000
        };
      }

      try {
        return await fn(...args);
      } catch (error) {
        // Don't consume a token if the function fails
        this.buckets.get(key)!.tokens++;
        throw error;
      }
    };
  }

  /**
   * Clean up old buckets to prevent memory leaks
   * Should be called periodically
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  resetLimit(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Get current rate limit status for a key
   */
  getStatus(key: string, config?: RateLimitConfig): { tokens: number; maxTokens: number; resetTime: number } | null {
    const bucket = this.buckets.get(key);
    if (!bucket) return null;

    const bucketConfig = config || this.defaultConfig;
    const now = Date.now();
    const timeSinceLastRefill = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timeSinceLastRefill / bucketConfig.timeWindow);
    
    const currentTokens = Math.min(bucket.tokens + tokensToAdd, bucketConfig.maxTokens);
    const resetTime = bucketConfig.timeWindow - (timeSinceLastRefill % bucketConfig.timeWindow);

    return {
      tokens: currentTokens,
      maxTokens: bucketConfig.maxTokens,
      resetTime
    };
  }
}

// Default rate limiter instance
export const rateLimiter = new RateLimiter();

// Specific action rate limits
export const RATE_LIMITS = {
  // Profile actions
  PROFILE_UPDATE: { maxRequests: 3, timeWindow: 60000 }, // 3 requests per minute
  
  // Messaging actions
  SEND_MESSAGE: { maxRequests: 10, timeWindow: 10000 }, // 10 messages per 10 seconds
  
  // Room actions
  CREATE_ROOM: { maxRequests: 5, timeWindow: 300000 }, // 5 rooms per 5 minutes
  JOIN_ROOM: { maxRequests: 20, timeWindow: 60000 }, // 20 joins per minute
  
  // Contract interactions
  CONTRACT_CALL: { maxRequests: 30, timeWindow: 60000 }, // 30 contract calls per minute
  
  // Wallet actions
  WALLET_CONNECT: { maxRequests: 3, timeWindow: 30000 }, // 3 connections per 30 seconds
  
  // General API calls
  API_CALL: { maxRequests: 100, timeWindow: 60000 }, // 100 API calls per minute
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Create a rate-limited version of any async function
 */
export function createRateLimitedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  actionType: RateLimitAction,
  customKey?: string
): (...args: T) => Promise<R | { error: string; retryAfter: number }> {
  const config = RATE_LIMITS[actionType];
  const key = customKey || `action:${actionType}`;
  
  return rateLimiter.withRateLimit(fn, key, config);
}

/**
 * Hook for React components to check rate limit status
 */
export function useRateLimit(actionType: RateLimitAction, customKey?: string) {
  const key = customKey || `action:${actionType}`;
  
  return {
    checkLimit: (customConfig?: RateLimitConfig) => rateLimiter.checkRateLimit(key, customConfig),
    getStatus: (customConfig?: RateLimitConfig) => rateLimiter.getStatus(key, customConfig),
    reset: () => rateLimiter.resetLimit(key)
  };
}

/**
 * Debounce utility for input fields
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for frequent actions
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Start cleanup interval
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 60000); // Clean up every minute
}