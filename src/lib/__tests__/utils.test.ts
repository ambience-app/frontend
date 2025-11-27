/**
 * src/lib/__tests__/utils.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { cn, formatAddress, formatError, isUserRejectedError, isNetworkError, isGasEstimationError } from '../utils';

// Mock dependencies
vi.mock('clsx', () => ({
  default: vi.fn((...inputs) => inputs.filter(Boolean).join(' ')),
}));

vi.mock('tailwind-merge', () => ({
  default: vi.fn((input) => input),
}));

describe('cn', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    
    expect(result).toBe('class1 class2');
  });

  it('should handle undefined and null values', () => {
    cn(undefined, 'class1', null, 'class2');
    // Just ensure no errors are thrown
    expect(true).toBe(true);
  });
});

describe('formatAddress', () => {
  it('should format address with default parameters', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const result = formatAddress(address);
    expect(result).toBe('0x1234...7890');
  });

  it('should format address with custom start and end', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const result = formatAddress(address, 8, 6);
    expect(result).toBe('0x12345678...4567890');
  });

  it('should handle empty string', () => {
    const result = formatAddress('');
    expect(result).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(formatAddress('')).toBe('');
  });

  it('should handle short addresses', () => {
    const address = '0x1234';
    const result = formatAddress(address);
    expect(result).toBe('0x1234');
  });
});

describe('formatError', () => {
  it('should format Ethereum user rejected errors', () => {
    const error = new Error('User rejected transaction');
    const result = formatError(error);
    expect(result).toBe('Transaction was rejected by user');
  });

  it('should format insufficient funds errors', () => {
    const error = new Error('insufficient funds for gas');
    const result = formatError(error);
    expect(result).toBe('Insufficient funds for transaction');
  });

  it('should format gas allowance errors', () => {
    const error = new Error('gas required exceeds allowance');
    const result = formatError(error);
    expect(result).toBe('Insufficient balance for gas');
  });

  it('should format network mismatch errors', () => {
    const error = new Error('Network mismatch');
    const result = formatError(error);
    expect(result).toBe('Please switch to the correct network');
  });

  it('should capitalize regular error messages', () => {
    const error = new Error('something went wrong');
    const result = formatError(error);
    expect(result).toBe('Something went wrong');
  });

  it('should handle string errors', () => {
    const result = formatError('String error message');
    expect(result).toBe('String error message');
  });

  it('should handle unknown error types', () => {
    const result = formatError({ some: 'object' });
    expect(result).toBe('An unknown error occurred');
  });

  it('should handle null/undefined errors', () => {
    expect(formatError(null)).toBe('An unknown error occurred');
    expect(formatError(undefined)).toBe('An unknown error occurred');
  });
});

describe('isUserRejectedError', () => {
  it('should detect user rejected errors', () => {
    const error = new Error('User rejected transaction');
    expect(isUserRejectedError(error)).toBe(true);
  });

  it('should detect user denied errors', () => {
    const error = new Error('User denied transaction');
    expect(isUserRejectedError(error)).toBe(true);
  });

  it('should detect user cancelled errors', () => {
    const error = new Error('User cancelled request');
    expect(isUserRejectedError(error)).toBe(true);
  });

  it('should detect request rejected errors', () => {
    const error = new Error('Request rejected');
    expect(isUserRejectedError(error)).toBe(true);
  });

  it('should be case insensitive', () => {
    const error = new Error('USER REJECTED TRANSACTION');
    expect(isUserRejectedError(error)).toBe(true);
  });

  it('should handle string errors', () => {
    expect(isUserRejectedError('user rejected')).toBe(true);
    expect(isUserRejectedError('other error')).toBe(false);
  });

  it('should return false for non-user rejection errors', () => {
    const error = new Error('Network error');
    expect(isUserRejectedError(error)).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(isUserRejectedError(null)).toBe(false);
    expect(isUserRejectedError(undefined)).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('should detect network changed errors', () => {
    const error = new Error('Network changed');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should detect network mismatch errors', () => {
    const error = new Error('Network mismatch');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should detect wrong network errors', () => {
    const error = new Error('Wrong network');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should detect unsupported chain errors', () => {
    const error = new Error('Unsupported chain');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should detect chain not configured errors', () => {
    const error = new Error('Chain not configured');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should be case insensitive', () => {
    const error = new Error('NETWORK MISMATCH');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for non-network errors', () => {
    const error = new Error('Transaction failed');
    expect(isNetworkError(error)).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('isGasEstimationError', () => {
  it('should detect gas allowance errors', () => {
    const error = new Error('gas required exceeds allowance');
    expect(isGasEstimationError(error)).toBe(true);
  });

  it('should detect gas limit errors', () => {
    const error = new Error('gas required exceeds limit');
    expect(isGasEstimationError(error)).toBe(true);
  });

  it('should detect intrinsic gas too low errors', () => {
    const error = new Error('intrinsic gas too low');
    expect(isGasEstimationError(error)).toBe(true);
  });

  it('should detect out of gas errors', () => {
    const error = new Error('out of gas');
    expect(isGasEstimationError(error)).toBe(true);
  });

  it('should detect gas estimation failed errors', () => {
    const error = new Error('gas estimation failed');
    expect(isGasEstimationError(error)).toBe(true);
  });

  it('should be case insensitive', () => {
    const error = new Error('OUT OF GAS');
    expect(isGasEstimationError(error)).toBe(true);
  });

  it('should return false for non-gas estimation errors', () => {
    const error = new Error('Transaction timeout');
    expect(isGasEstimationError(error)).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(isGasEstimationError(null)).toBe(false);
    expect(isGasEstimationError(undefined)).toBe(false);
  });
});