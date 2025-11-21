/**
 * Secure Error Handling System
 * Sanitizes errors to prevent information disclosure while maintaining debugging capabilities
 */

import * as Sentry from '@sentry/nextjs';

// Error categories for different types of errors
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  CONTRACT = 'contract',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

// Safe error interface - only contains user-safe information
export interface SafeError {
  success: false;
  message: string;
  category: ErrorCategory;
  code?: string;
  retryable?: boolean;
  userMessage: string;
}

// Success response interface
export interface SafeResponse<T = any> {
  success: true;
  data?: T;
}

// Union type for all safe responses
export type ApiResponse<T = any> = SafeResponse<T> | SafeError;

// Error mapping - converts technical errors to user-friendly messages
const ERROR_MESSAGES: Record<string, { userMessage: string; category: ErrorCategory; retryable?: boolean }> = {
  // Validation errors
  'Invalid username': { userMessage: 'Username format is invalid', category: ErrorCategory.VALIDATION },
  'Username must be at least 3 characters': { userMessage: 'Username is too short', category: ErrorCategory.VALIDATION },
  'Username must be less than 20 characters': { userMessage: 'Username is too long', category: ErrorCategory.VALIDATION },
  'Bio must be less than 500 characters': { userMessage: 'Bio is too long', category: ErrorCategory.VALIDATION },
  'Room name is required': { userMessage: 'Room name is missing', category: ErrorCategory.VALIDATION },
  'Message contains potentially dangerous content': { userMessage: 'Message contains invalid content', category: ErrorCategory.VALIDATION },
  'Invalid Ethereum address': { userMessage: 'Invalid wallet address', category: ErrorCategory.VALIDATION },

  // Network errors
  'Network Error': { userMessage: 'Network connection failed', category: ErrorCategory.NETWORK, retryable: true },
  'Failed to fetch': { userMessage: 'Request failed', category: ErrorCategory.NETWORK, retryable: true },
  'timeout': { userMessage: 'Request timed out', category: ErrorCategory.NETWORK, retryable: true },

  // Contract errors (Web3 specific)
  'execution reverted': { userMessage: 'Transaction failed', category: ErrorCategory.CONTRACT, retryable: true },
  'insufficient funds': { userMessage: 'Insufficient funds for transaction', category: ErrorCategory.CONTRACT },
  'gas estimation failed': { userMessage: 'Transaction cannot be completed', category: ErrorCategory.CONTRACT },
  'user rejected transaction': { userMessage: 'Transaction was cancelled', category: ErrorCategory.CONTRACT },

  // Authentication/Authorization errors
  'Unauthorized': { userMessage: 'You are not authorized', category: ErrorCategory.AUTHORIZATION },
  'Access denied': { userMessage: 'Access denied', category: ErrorCategory.AUTHORIZATION },
  'Authentication failed': { userMessage: 'Authentication failed', category: ErrorCategory.AUTHENTICATION },

  // Rate limiting
  'Rate limit exceeded': { userMessage: 'Too many requests. Please wait and try again.', category: ErrorCategory.RATE_LIMIT, retryable: true },
  'Rate limit exceeded:': { userMessage: 'Too many requests. Please wait and try again.', category: ErrorCategory.RATE_LIMIT, retryable: true },

  // Generic fallbacks
  'Something went wrong': { userMessage: 'Something went wrong. Please try again.', category: ErrorCategory.UNKNOWN, retryable: true },
  'Unknown error': { userMessage: 'An unexpected error occurred', category: ErrorCategory.UNKNOWN, retryable: true }
};

// Common error patterns for more sophisticated detection
const ERROR_PATTERNS = [
  {
    pattern: /(rate limit|too many requests|exceeded)/i,
    message: 'Too many requests. Please wait and try again.',
    category: ErrorCategory.RATE_LIMIT,
    retryable: true
  },
  {
    pattern: /(network|connection|timeout|fetch)/i,
    message: 'Network connection failed',
    category: ErrorCategory.NETWORK,
    retryable: true
  },
  {
    pattern: /(revert|execution|contract|gas|estimate)/i,
    message: 'Transaction failed',
    category: ErrorCategory.CONTRACT,
    retryable: true
  },
  {
    pattern: /(unauthorized|forbidden|access denied|permission)/i,
    message: 'You are not authorized',
    category: ErrorCategory.AUTHORIZATION
  },
  {
    pattern: /(validation|invalid|format|type)/i,
    message: 'Invalid input provided',
    category: ErrorCategory.VALIDATION
  }
];

/**
 * Sanitize and classify an error into a safe error format
 */
export function createSafeError(error: unknown, context?: string): SafeError {
  const errorString = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : new Error(errorString);
  
  // Log original error for debugging (server-side only)
  Sentry.captureException(originalError, {
    tags: {
      component: context || 'unknown',
      errorCategory: 'security_audit'
    },
    extra: {
      sanitized: true,
      context
    }
  });

  // Try to match exact error message first
  for (const [key, config] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.includes(key)) {
      return {
        success: false,
        message: config.userMessage,
        category: config.category,
        retryable: config.retryable,
        userMessage: config.userMessage,
        code: key
      };
    }
  }

  // Try to match error patterns
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(errorString)) {
      return {
        success: false,
        message: pattern.message,
        category: pattern.category,
        retryable: pattern.retryable,
        userMessage: pattern.message
      };
    }
  }

  // Fallback to generic error
  return {
    success: false,
    message: 'Something went wrong. Please try again.',
    category: ErrorCategory.UNKNOWN,
    retryable: true,
    userMessage: 'Something went wrong. Please try again.'
  };
}

/**
 * Wrap async functions to handle errors safely
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<ApiResponse<T>> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    return createSafeError(error, context);
  }
}

/**
 * Safe error handler for React components
 */
export function handleComponentError(error: unknown, context?: string): SafeError {
  console.error(`Component error in ${context}:`, error);
  return createSafeError(error, context);
}

/**
 * Specialized error handler for Web3/contract interactions
 */
export function handleContractError(error: unknown, context?: string): SafeError {
  const errorString = error instanceof Error ? error.message : String(error);
  
  // Common Web3 error patterns
  if (errorString.includes('user rejected') || errorString.includes('User denied')) {
    return {
      success: false,
      message: 'Transaction was cancelled',
      category: ErrorCategory.CONTRACT,
      userMessage: 'Transaction was cancelled'
    };
  }
  
  if (errorString.includes('insufficient funds')) {
    return {
      success: false,
      message: 'Insufficient funds for transaction',
      category: ErrorCategory.CONTRACT,
      userMessage: 'Insufficient funds for this transaction'
    };
  }

  if (errorString.includes('execution reverted')) {
    return {
      success: false,
      message: 'Transaction failed',
      category: ErrorCategory.CONTRACT,
      userMessage: 'Transaction could not be completed'
    };
  }

  // Log contract error for debugging
  Sentry.captureException(error instanceof Error ? error : new Error(errorString), {
    tags: {
      component: context || 'contract',
      errorCategory: 'web3_contract'
    }
  });

  return createSafeError(error, context);
}

/**
 * Error boundary component wrapper
 */
export class SecureErrorBoundary {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  handleError(error: unknown): SafeError {
    // Log error securely
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: {
        component: this.context,
        errorCategory: 'error_boundary'
      }
    });

    return createSafeError(error, this.context);
  }
}

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: any): SafeError {
  const errorMessages = Array.isArray(errors) ? errors : [errors];
  const userMessage = errorMessages.length === 1 
    ? errorMessages[0] 
    : 'Multiple validation errors occurred';
  
  return {
    success: false,
    message: userMessage,
    category: ErrorCategory.VALIDATION,
    userMessage,
    retryable: false
  };
}

/**
 * WebSocket error handler
 */
export function handleWebSocketError(error: unknown, context?: string): SafeError {
  const errorString = error instanceof Error ? error.message : String(error);
  
  if (errorString.includes('connection') || errorString.includes('network')) {
    return {
      success: false,
      message: 'Connection lost. Reconnecting...',
      category: ErrorCategory.NETWORK,
      userMessage: 'Connection lost. Please wait while we reconnect.',
      retryable: true
    };
  }

  return createSafeError(error, context);
}

/**
 * Rate limit error handler
 */
export function handleRateLimitError(retryAfter?: number): SafeError {
  const waitTime = retryAfter ? Math.ceil(retryAfter / 1000) : 60;
  
  return {
    success: false,
    message: `Rate limit exceeded. Try again in ${waitTime} seconds.`,
    category: ErrorCategory.RATE_LIMIT,
    userMessage: `Too many requests. Please wait ${waitTime} seconds and try again.`,
    retryable: true,
    code: 'RATE_LIMIT'
  };
}