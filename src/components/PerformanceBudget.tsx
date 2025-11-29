'use client';

import { useEffect } from 'react';

// Define performance budget thresholds (in milliseconds)
const BUDGETS = {
  // Largest Contentful Paint (LCP)
  lcp: 2500,
  // First Input Delay (FID)
  fid: 100,
  // Cumulative Layout Shift (CLS)
  cls: 0.1,
  // First Contentful Paint (FCP)
  fcp: 1800,
  // Time to Interactive (TTI)
  tti: 3800,
  // Total Blocking Time (TBT)
  tbt: 200,
  // Max bundle size (in KB)
  maxBundleSize: 150,
};

export function PerformanceBudget() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check resource timing
    const checkResources = () => {
      const resources = performance.getEntriesByType('resource');
      const largeResources = resources.filter(
        (r) => r.decodedBodySize && r.decodedBodySize > 1024 * 50 // 50KB
      );

      if (largeResources.length > 0) {
        console.warn('Large resources detected:', largeResources);
        // You can send this to your analytics
      }
    };

    // Check bundle size
    const checkBundleSize = () => {
      if (window.performance && window.performance.memory) {
        const usedJSHeapSize = window.performance.memory.usedJSHeapSize;
        const totalJSHeapSize = window.performance.memory.totalJSHeapSize;
        
        if (usedJSHeapSize > BUDGETS.maxBundleSize * 1024) {
          console.warn(
            `Bundle size exceeds budget: ${(usedJSHeapSize / 1024).toFixed(2)}KB`
          );
        }
      }
    };

    // Monitor long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // 50ms threshold for long tasks
          console.warn('Long task detected:', entry);
          // You can send this to your analytics
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Initial checks
    checkResources();
    checkBundleSize();

    // Set up periodic checks
    const interval = setInterval(() => {
      checkResources();
      checkBundleSize();
    }, 30000); // Check every 30 seconds

    // Cleanup
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}

// Helper function to check if performance budget is being met
export function checkPerformanceBudget(metrics: Record<string, number>) {
  const violations: string[] = [];

  Object.entries(metrics).forEach(([key, value]) => {
    const budget = BUDGETS[key as keyof typeof BUDGETS];
    if (budget !== undefined && value > budget) {
      violations.push(
        `${key} exceeded budget: ${value}ms (budget: ${budget}ms)`
      );
    }
  });

  if (violations.length > 0) {
    console.warn('Performance budget violations:', violations);
    // You can send this to your analytics
    return {
      isWithinBudget: false,
      violations,
    };
  }

  return {
    isWithinBudget: true,
    violations: [],
  };
}
