import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';

/**
 * Memory optimization utilities for React Query and component cleanup
 */
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private queryClient: QueryClient | null = null;
  private cleanupCallbacks: (() => void)[] = [];
  private memoryLeakDetectors: Map<string, () => void> = new Map();

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupMemoryMonitoring();
  }

  /**
   * Monitor memory usage and clean up old data
   */
  private setupMemoryMonitoring() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor memory usage every 5 minutes
      setInterval(() => {
        this.performCleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Clean up expired cached data
   */
  performCleanup() {
    if (!this.queryClient) return;

    try {
      // Clear old cache entries
      this.queryClient.clear();

      // Remove listeners and event handlers
      this.cleanupCallbacks.forEach(callback => callback());
      this.cleanupCallbacks = [];

      // Clear memory leak detectors
      this.memoryLeakDetectors.forEach(detector => detector());
      this.memoryLeakDetectors.clear();

      console.log('Memory cleanup completed');
    } catch (error) {
      console.error('Error during memory cleanup:', error);
    }
  }

  /**
   * Register cleanup callback
   */
  registerCleanup(callback: () => void) {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Register memory leak detector
   */
  registerMemoryLeakDetector(id: string, detector: () => void) {
    this.memoryLeakDetectors.set(id, detector);
  }

  /**
   * Remove memory leak detector
   */
  unregisterMemoryLeakDetector(id: string) {
    this.memoryLeakDetectors.delete(id);
  }
}

/**
 * Hook for automatic memory optimization
 */
export function useMemoryOptimizer() {
  const queryClient = useQueryClient();
  const optimizer = useRef(MemoryOptimizer.getInstance());

  useEffect(() => {
    optimizer.current.initialize(queryClient);

    // Register component cleanup
    const cleanup = () => {
      optimizer.current.performCleanup();
    };

    optimizer.current.registerCleanup(cleanup);

    return cleanup;
  }, [queryClient]);

  const cleanup = useCallback(() => {
    optimizer.current.performCleanup();
  }, []);

  const registerCleanup = useCallback((callback: () => void) => {
    optimizer.current.registerCleanup(callback);
  }, []);

  return {
    cleanup,
    registerCleanup,
  };
}

/**
 * Hook for optimizing large data structures
 */
export function useDataOptimization<T>(data: T, maxSize: number = 1000): T {
  const [optimizedData, setOptimizedData] = useState<T>(() => {
    if (Array.isArray(data) && data.length > maxSize) {
      return data.slice(-maxSize) as unknown as T;
    }
    return data;
  });

  useEffect(() => {
    if (Array.isArray(data) && data.length > maxSize) {
      // Schedule optimization in the next tick to avoid cascading renders
      const timeoutId = setTimeout(() => {
        setOptimizedData(data.slice(-maxSize) as unknown as T);
      }, 0);
      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => {
        setOptimizedData(data);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [data, maxSize]);

  return optimizedData;
}

/**
 * Hook for debounced cleanup operations
 */
export function useDebouncedCleanup(delay: number = 30000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optimizer = useRef(MemoryOptimizer.getInstance());

  const scheduleCleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      optimizer.current.performCleanup();
    }, delay);
  }, [delay]);

  const cancelCleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelCleanup();
    };
  }, [cancelCleanup]);

  return {
    scheduleCleanup,
    cancelCleanup,
  };
}

/**
 * Utility for batch cleanup operations
 */
export class BatchCleanupManager {
  private operations: (() => void)[] = [];
  private timeoutId: NodeJS.Timeout | null = null;

  addOperation(operation: () => void, delay: number = 1000) {
    this.operations.push(operation);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.executeOperations();
    }, delay);
  }

  private executeOperations() {
    this.operations.forEach(operation => {
      try {
        operation();
      } catch (error) {
        console.error('Error executing cleanup operation:', error);
      }
    });

    this.operations = [];
    this.timeoutId = null;
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.operations = [];
  }
}