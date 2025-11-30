import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkCalls: number;
  cacheHitRate: number;
  componentMountTime: number;
  transactionLatency: number;
}

interface PerformanceThresholds {
  maxRenderTime: number; // ms
  maxMemoryUsage: number; // MB
  maxNetworkCalls: number;
  minCacheHitRate: number; // percentage
  maxTransactionLatency: number; // ms
}

/**
 * Performance monitoring hook for tracking optimization improvements
 */
export function usePerformanceMonitoring(componentName: string, thresholds?: Partial<PerformanceThresholds>) {
  const startTime = useRef<number>(0);
  const metrics = useRef<Partial<PerformanceMetrics>>({});
  const queryClient = useQueryClient();

  const defaultThresholds: PerformanceThresholds = {
    maxRenderTime: 16, // 60fps target
    maxMemoryUsage: 50, // 50MB
    maxNetworkCalls: 10, // per minute
    minCacheHitRate: 80, // 80%
    maxTransactionLatency: 2000, // 2 seconds
  };

  const performanceThresholds = { ...defaultThresholds, ...thresholds };

  // Start performance monitoring
  useEffect(() => {
    startTime.current = performance.now();
    metrics.current.componentMountTime = startTime.current;

    // Monitor memory usage
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      metrics.current.memoryUsage = memoryInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }

    return () => {
      // Cleanup and log performance metrics
      const endTime = performance.now();
      metrics.current.renderTime = endTime - startTime.current;

      // Log performance metrics
      console.group(`🚀 Performance Metrics - ${componentName}`);
      console.log('Render Time:', `${metrics.current.renderTime?.toFixed(2)}ms`);
      console.log('Memory Usage:', `${metrics.current.memoryUsage?.toFixed(2)}MB`);
      console.log('Network Calls:', metrics.current.networkCalls || 0);
      console.log('Cache Hit Rate:', `${metrics.current.cacheHitRate?.toFixed(1)}%`);
      console.log('Component Mount Time:', `${metrics.current.componentMountTime?.toFixed(2)}ms`);
      console.log('Transaction Latency:', `${metrics.current.transactionLatency?.toFixed(2)}ms`);
      console.groupEnd();

      // Check thresholds
      checkPerformanceThresholds(metrics.current, performanceThresholds);
    };
  }, [componentName, performanceThresholds]);

  // Track network calls
  const trackNetworkCall = useCallback(() => {
    metrics.current.networkCalls = (metrics.current.networkCalls || 0) + 1;
  }, []);

  // Track cache hits
  const trackCacheHit = useCallback(() => {
    const totalCalls = metrics.current.networkCalls || 0;
    const cacheHits = (metrics.current as any).cacheHits || 0;
    metrics.current.cacheHitRate = totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0;
    (metrics.current as any).cacheHits = cacheHits + 1;
  }, []);

  // Track transaction latency
  const trackTransactionLatency = useCallback((latency: number) => {
    metrics.current.transactionLatency = latency;
  }, []);

  // Get current metrics (must be called outside of render)
  const getCurrentMetrics = useCallback(() => {
    return metrics.current;
  }, []);

  return {
    trackNetworkCall,
    trackCacheHit,
    trackTransactionLatency,
    getCurrentMetrics,
  };
}

/**
 * Check if performance metrics meet thresholds
 */
function checkPerformanceThresholds(metrics: Partial<PerformanceMetrics>, thresholds: PerformanceThresholds) {
  const warnings: string[] = [];

  if (metrics.renderTime && metrics.renderTime > thresholds.maxRenderTime) {
    warnings.push(`Render time (${metrics.renderTime.toFixed(2)}ms) exceeds threshold (${thresholds.maxRenderTime}ms)`);
  }

  if (metrics.memoryUsage && metrics.memoryUsage > thresholds.maxMemoryUsage) {
    warnings.push(`Memory usage (${metrics.memoryUsage.toFixed(2)}MB) exceeds threshold (${thresholds.maxMemoryUsage}MB)`);
  }

  if (metrics.networkCalls && metrics.networkCalls > thresholds.maxNetworkCalls) {
    warnings.push(`Network calls (${metrics.networkCalls}) exceeds threshold (${thresholds.maxNetworkCalls})`);
  }

  if (metrics.cacheHitRate && metrics.cacheHitRate < thresholds.minCacheHitRate) {
    warnings.push(`Cache hit rate (${metrics.cacheHitRate.toFixed(1)}%) below threshold (${thresholds.minCacheHitRate}%)`);
  }

  if (metrics.transactionLatency && metrics.transactionLatency > thresholds.maxTransactionLatency) {
    warnings.push(`Transaction latency (${metrics.transactionLatency.toFixed(2)}ms) exceeds threshold (${thresholds.maxTransactionLatency}ms)`);
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Performance warnings for component:`, warnings);
  } else {
    console.log('✅ All performance metrics within acceptable thresholds');
  }
}

/**
 * Performance comparison utility
 */
export class PerformanceComparator {
  private baselineMetrics: Map<string, Partial<PerformanceMetrics>> = new Map();
  private currentMetrics: Map<string, Partial<PerformanceMetrics>> = new Map();

  setBaseline(componentName: string, metrics: Partial<PerformanceMetrics>) {
    this.baselineMetrics.set(componentName, metrics);
  }

  recordMetrics(componentName: string, metrics: Partial<PerformanceMetrics>) {
    this.currentMetrics.set(componentName, metrics);
  }

  generateReport(): string {
    let report = '# Performance Optimization Report\n\n';
    
    for (const [componentName, current] of this.currentMetrics) {
      const baseline = this.baselineMetrics.get(componentName);
      if (!baseline) continue;

      report += `## ${componentName}\n\n`;
      
      // Compare render time
      if (baseline.renderTime && current.renderTime) {
        const improvement = ((baseline.renderTime - current.renderTime) / baseline.renderTime) * 100;
        report += `- **Render Time**: ${improvement >= 0 ? '✅' : '❌'} ${improvement >= 0 ? 'Improved' : 'Degraded'} by ${Math.abs(improvement).toFixed(1)}%\n`;
        report += `  - Baseline: ${baseline.renderTime.toFixed(2)}ms\n`;
        report += `  - Current: ${current.renderTime.toFixed(2)}ms\n\n`;
      }

      // Compare memory usage
      if (baseline.memoryUsage && current.memoryUsage) {
        const improvement = ((baseline.memoryUsage - current.memoryUsage) / baseline.memoryUsage) * 100;
        report += `- **Memory Usage**: ${improvement >= 0 ? '✅' : '❌'} ${improvement >= 0 ? 'Improved' : 'Degraded'} by ${Math.abs(improvement).toFixed(1)}%\n`;
        report += `  - Baseline: ${baseline.memoryUsage.toFixed(2)}MB\n`;
        report += `  - Current: ${current.memoryUsage.toFixed(2)}MB\n\n`;
      }

      // Compare cache hit rate
      if (baseline.cacheHitRate && current.cacheHitRate) {
        const improvement = current.cacheHitRate - baseline.cacheHitRate;
        report += `- **Cache Hit Rate**: ${improvement >= 0 ? '✅' : '❌'} ${improvement >= 0 ? 'Improved' : 'Degraded'} by ${Math.abs(improvement).toFixed(1)}%\n`;
        report += `  - Baseline: ${baseline.cacheHitRate.toFixed(1)}%\n`;
        report += `  - Current: ${current.cacheHitRate.toFixed(1)}%\n\n`;
      }

      // Compare network calls
      if (baseline.networkCalls && current.networkCalls) {
        const improvement = ((baseline.networkCalls - current.networkCalls) / baseline.networkCalls) * 100;
        report += `- **Network Calls**: ${improvement >= 0 ? '✅' : '❌'} ${improvement >= 0 ? 'Reduced' : 'Increased'} by ${Math.abs(improvement).toFixed(1)}%\n`;
        report += `  - Baseline: ${baseline.networkCalls}\n`;
        report += `  - Current: ${current.networkCalls}\n\n`;
      }

      report += '---\n\n';
    }

    return report;
  }

  exportReport(format: 'markdown' | 'json' = 'markdown'): string {
    if (format === 'json') {
      return JSON.stringify({
        baseline: Object.fromEntries(this.baselineMetrics),
        current: Object.fromEntries(this.currentMetrics),
        report: this.generateReport(),
      }, null, 2);
    }

    return this.generateReport();
  }
}

/**
 * Create a global performance comparator instance
 */
export const globalPerformanceComparator = new PerformanceComparator();