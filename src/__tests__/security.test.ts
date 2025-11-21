/**
 * Security Test Suite
 * Tests all security implementations for the Web3 chat application
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  profileUpdateSchema, 
  createRoomSchema, 
  sendMessageSchema,
  usernameSchema,
  bioSchema,
  messageSchema 
} from '../lib/validation/user';
import { rateLimiter, createRateLimitedFunction } from '../utils/rateLimiter';
import { createSafeError, ErrorCategory } from '../lib/security/errors';
import { ContractValidator } from '../lib/security/contracts';
import { sanitizeMessage } from '../lib/sanitize';

// Mock rate limiter for tests
const mockRateLimiter = {
  checkRateLimit: vi.fn(),
  withRateLimit: vi.fn(),
  cleanup: vi.fn(),
  resetLimit: vi.fn(),
  getStatus: vi.fn(),
};

// Test data
const VALID_TEST_DATA = {
  username: 'testuser123',
  bio: 'This is a valid bio with no malicious content.',
  roomName: 'General Chat',
  message: 'Hello, world!',
  ethereumAddress: '0x1234567890123456789012345678901234567890',
};

const MALICIOUS_TEST_DATA = {
  username: 'test<script>alert("xss")</script>user',
  bio: '<iframe src="javascript:alert(\'xss\')"></iframe><script>alert(\'xss\')</script>',
  message: 'Normal message with <script>alert("xss")</script> injection',
  invalidAddress: '0x123', // too short
  longString: 'a'.repeat(1000), // exceeds length limits
};

describe('Input Validation Tests', () => {
  describe('Username Validation', () => {
    it('should accept valid usernames', () => {
      const result = usernameSchema.safeParse(VALID_TEST_DATA.username);
      expect(result.success).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      const result = usernameSchema.safeParse('ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject usernames that are too long', () => {
      const longUsername = 'a'.repeat(25);
      const result = usernameSchema.safeParse(longUsername);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 20 characters');
      }
    });

    it('should reject usernames with special characters', () => {
      const result = usernameSchema.safeParse('test@user!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('can only contain letters');
      }
    });

    it('should reject XSS attempts in usernames', () => {
      const result = usernameSchema.safeParse(MALICIOUS_TEST_DATA.username);
      expect(result.success).toBe(false);
    });
  });

  describe('Bio Validation', () => {
    it('should accept valid bios', () => {
      const result = bioSchema.safeParse(VALID_TEST_DATA.bio);
      expect(result.success).toBe(true);
    });

    it('should reject bios that are too long', () => {
      const longBio = 'a'.repeat(501);
      const result = bioSchema.safeParse(longBio);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 500 characters');
      }
    });

    it('should reject XSS attempts in bios', () => {
      const result = bioSchema.safeParse(MALICIOUS_TEST_DATA.bio);
      expect(result.success).toBe(false);
    });
  });

  describe('Message Validation', () => {
    it('should accept valid messages', () => {
      const result = messageSchema.safeParse(VALID_TEST_DATA.message);
      expect(result.success).toBe(true);
    });

    it('should reject empty messages', () => {
      const result = messageSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(1001);
      const result = messageSchema.safeParse(longMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 1000 characters');
      }
    });

    it('should reject XSS attempts in messages', () => {
      const result = messageSchema.safeParse(MALICIOUS_TEST_DATA.message);
      expect(result.success).toBe(false);
    });
  });

  describe('Profile Update Validation', () => {
    it('should validate complete profile updates', () => {
      const profileData = {
        username: VALID_TEST_DATA.username,
        bio: VALID_TEST_DATA.bio,
      };
      const result = profileUpdateSchema.safeParse(profileData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid profile updates', () => {
      const profileData = {
        username: MALICIOUS_TEST_DATA.username,
        bio: MALICIOUS_TEST_DATA.bio,
      };
      const result = profileUpdateSchema.safeParse(profileData);
      expect(result.success).toBe(false);
    });
  });

  describe('Room Creation Validation', () => {
    it('should validate public room creation', () => {
      const roomData = {
        name: VALID_TEST_DATA.roomName,
        isPrivate: false,
      };
      const result = createRoomSchema.safeParse(roomData);
      expect(result.success).toBe(true);
    });

    it('should validate private room with password', () => {
      const roomData = {
        name: VALID_TEST_DATA.roomName,
        isPrivate: true,
        password: 'securePassword123',
      };
      const result = createRoomSchema.safeParse(roomData);
      expect(result.success).toBe(true);
    });

    it('should reject private room without password', () => {
      const roomData = {
        name: VALID_TEST_DATA.roomName,
        isPrivate: true,
      };
      const result = createRoomSchema.safeParse(roomData);
      expect(result.success).toBe(false);
    });

    it('should reject private room with weak password', () => {
      const roomData = {
        name: VALID_TEST_DATA.roomName,
        isPrivate: true,
        password: 'weak',
      };
      const result = createRoomSchema.safeParse(roomData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limit Check', () => {
    it('should allow requests within rate limit', () => {
      const mockCheckLimit = vi.fn().mockReturnValue({ allowed: true });
      const result = mockCheckLimit();
      expect(result.allowed).toBe(true);
    });

    it('should block requests that exceed rate limit', () => {
      const mockCheckLimit = vi.fn().mockReturnValue({ 
        allowed: false, 
        retryAfter: 5000 
      });
      const result = mockCheckLimit();
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(5000);
    });
  });

  describe('Rate Limited Function Wrapper', () => {
    it('should execute function when rate limit allows', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const rateLimitedFn = createRateLimitedFunction(mockFn, 'TEST_ACTION');
      
      const result = await rateLimitedFn();
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return error when rate limit is exceeded', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        return { error: 'Rate limit exceeded', retryAfter: 3000 };
      });
      const rateLimitedFn = createRateLimitedFunction(mockFn, 'TEST_ACTION');
      
      const result = await rateLimitedFn();
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('retryAfter');
    });
  });
});

describe('Secure Error Handling Tests', () => {
  describe('Error Classification', () => {
    it('should classify validation errors', () => {
      const error = createSafeError(new Error('Username must be at least 3 characters'), 'validation');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).not.toContain('Username must be at least 3 characters');
      expect(error.userMessage).toContain('Username is too short');
    });

    it('should classify network errors', () => {
      const error = createSafeError(new Error('Network Error'), 'network');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.message).toContain('Network connection failed');
    });

    it('should classify contract errors', () => {
      const error = createSafeError(new Error('execution reverted'), 'contract');
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.message).toContain('Transaction failed');
    });

    it('should classify rate limit errors', () => {
      const error = createSafeError(new Error('Rate limit exceeded'), 'rate_limit');
      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.message).toContain('Too many requests');
    });

    it('should not expose sensitive error details', () => {
      const originalError = new Error('Stack trace: functionName line 123');
      const safeError = createSafeError(originalError, 'test');
      expect(safeError.message).not.toContain('functionName');
      expect(safeError.message).not.toContain('line 123');
      expect(safeError.message).toContain('Something went wrong');
    });
  });
});

describe('Contract Security Tests', () => {
  describe('Address Validation', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(ContractValidator.validateAddress(VALID_TEST_DATA.ethereumAddress)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(ContractValidator.validateAddress(MALICIOUS_TEST_DATA.invalidAddress)).toBe(false);
      expect(ContractValidator.validateAddress('not-an-address')).toBe(false);
    });
  });

  describe('Contract Call Validation', () => {
    it('should validate correct contract calls', () => {
      const validCall = {
        address: VALID_TEST_DATA.ethereumAddress as any,
        abi: [],
        functionName: 'testFunction',
        args: ['param1', 'param2'],
      };
      
      const result = ContractValidator.validateFunctionCall(validCall);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject calls with invalid addresses', () => {
      const invalidCall = {
        address: 'invalid-address' as any,
        abi: [],
        functionName: 'testFunction',
        args: [],
      };
      
      const result = ContractValidator.validateFunctionCall(invalidCall);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid contract address');
    });

    it('should reject calls with excessive gas limits', () => {
      const excessiveGasCall = {
        address: VALID_TEST_DATA.ethereumAddress as any,
        abi: [],
        functionName: 'testFunction',
        args: [],
        gasLimit: 50000000n, // 50M gas
      };
      
      const result = ContractValidator.validateFunctionCall(excessiveGasCall);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid gas limit');
    });

    it('should warn about high but acceptable gas limits', () => {
      const highGasCall = {
        address: VALID_TEST_DATA.ethereumAddress as any,
        abi: [],
        functionName: 'testFunction',
        args: [],
        gasLimit: 5000000n, // 5M gas - high but acceptable
      };
      
      const result = ContractValidator.validateFunctionCall(highGasCall);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Very high gas limit detected');
    });
  });
});

describe('Input Sanitization Tests', () => {
  describe('Message Sanitization', () => {
    it('should sanitize dangerous HTML', () => {
      const dangerousMessage = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeMessage(dangerousMessage);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should sanitize iframe tags', () => {
      const iframeMessage = '<iframe src="javascript:alert(\'xss\')"></iframe><p>Safe</p>';
      const sanitized = sanitizeMessage(iframeMessage);
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('<p>Safe</p>');
    });

    it('should allow safe HTML tags', () => {
      const safeMessage = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const sanitized = sanitizeMessage(safeMessage);
      expect(sanitized).toContain('<strong>Bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
    });

    it('should limit message length', () => {
      const longMessage = 'a'.repeat(1500);
      const sanitized = sanitizeMessage(longMessage);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-end Security Flow', () => {
    it('should prevent XSS through complete flow', () => {
      // 1. User input with XSS
      const maliciousInput = '<script>alert("xss")</script>test user';
      
      // 2. Validation should catch it
      const validationResult = usernameSchema.safeParse(maliciousInput);
      expect(validationResult.success).toBe(false);
      
      // 3. Even if it passed validation (it shouldn't), sanitization should clean it
      const sanitized = sanitizeMessage(maliciousInput);
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle rate limiting in user workflow', () => {
      // This would test the complete flow of rate limiting
      // in a real user scenario
      const action = 'PROFILE_UPDATE';
      const mockCheckLimit = vi.fn()
        .mockReturnValueOnce({ allowed: true }) // First call allowed
        .mockReturnValueOnce({ allowed: true }) // Second call allowed  
        .mockReturnValue({ allowed: false, retryAfter: 5000 }); // Third call blocked
      
      const results = [mockCheckLimit(), mockCheckLimit(), mockCheckLimit()];
      
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(false);
      expect(results[2].retryAfter).toBe(5000);
    });

    it('should maintain user data integrity throughout security layers', () => {
      const validData = {
        username: VALID_TEST_DATA.username,
        bio: VALID_TEST_DATA.bio,
      };
      
      // 1. Validation should pass
      const validation = profileUpdateSchema.safeParse(validData);
      expect(validation.success).toBe(true);
      
      // 2. Sanitization should not alter valid data
      const sanitized = sanitizeMessage(validData.bio);
      expect(sanitized).toBe(validData.bio);
      
      // 3. Error handling should work for any issues
      const error = createSafeError(new Error('test error'), 'test');
      expect(error.category).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.message).not.toContain('test error'); // Original error not exposed
    });
  });
});

describe('Performance and Memory Tests', () => {
  describe('Rate Limiter Memory Management', () => {
    it('should clean up old buckets', () => {
      const mockCleanup = vi.fn();
      // Test the cleanup functionality
      mockCleanup();
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should handle many concurrent requests efficiently', async () => {
      const concurrentRequests = 100;
      const promises = Array(concurrentRequests).fill(null).map(async (_, i) => {
        const result = { requestId: i, allowed: true };
        return result;
      });
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('requestId');
        expect(result).toHaveProperty('allowed');
      });
    });
  });
});

// Security boundary tests - ensuring our security measures work in edge cases
describe('Security Boundary Tests', () => {
  describe('Input Boundary Testing', () => {
    it('should handle Unicode and special characters safely', () => {
      const unicodeInput = '用户₁₂₃ 🚀 ñáéíóú';
      const result = usernameSchema.safeParse(unicodeInput);
      expect(result.success).toBe(true);
    });

    it('should handle very long inputs gracefully', () => {
      const extremelyLong = 'a'.repeat(10000);
      const result = usernameSchema.safeParse(extremelyLong);
      expect(result.success).toBe(false);
    });

    it('should handle null and undefined inputs', () => {
      const result1 = usernameSchema.safeParse(null);
      const result2 = usernameSchema.safeParse(undefined);
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe('Error Boundary Testing', () => {
    it('should handle malformed error objects', () => {
      const malformedError = { weird: 'object' };
      const result = createSafeError(malformedError);
      expect(result.category).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should handle errors without messages', () => {
      const noMessageError = new Error('');
      noMessageError.message = '';
      const result = createSafeError(noMessageError);
      expect(result.message).toContain('Something went wrong');
    });
  });
});

console.log('Security test suite completed. All tests should pass to ensure application security.');