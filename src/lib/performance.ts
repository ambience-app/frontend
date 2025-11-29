import { ReportHandler } from 'web-vitals';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Core Web Vitals
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getLCP(onPerfEntry);
    
    // Additional metrics
    getFCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
};

// Performance metrics collection
type Metric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

const vitalsUrl = process.env.NEXT_PUBLIC_VITALS_ENDPOINT || '/api/vitals';

const sendToAnalytics = (metric: Metric) => {
  const analytics = (window as any).analytics;
  
  // Send to your analytics service (e.g., Google Analytics, Sentry, etc.)
  if (analytics && typeof analytics.track === 'function') {
    analytics.track('web_vitals', metric);
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to your API endpoint if needed
  if (vitalsUrl) {
    const body = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      id: metric.id,
      page: window.location.pathname,
      href: window.location.href,
      event_name: metric.name,
      value: metric.value.toString(),
      speed: getConnectionSpeed(),
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, JSON.stringify(body));
    } else {
      fetch(vitalsUrl, {
        body: JSON.stringify(body),
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
      });
    }
  }
};

// Helper to get connection speed
const getConnectionSpeed = (): string => {
  return 'connection' in navigator &&
    navigator['connection'] &&
    'effectiveType' in (navigator['connection'] as any)
    ? (navigator['connection'] as any).effectiveType
    : '';
};

// Track page load times
export const trackPageLoad = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const timing = window.performance.timing;
    const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    const domReadyTime = timing.domComplete - timing.domLoading;
    const networkLatency = timing.responseEnd - timing.fetchStart;

    const metrics = {
      name: 'Page Load',
      value: pageLoadTime,
      rating: getPerformanceRating(pageLoadTime, [2000, 4000]),
      delta: 0,
      id: 'page-load-time',
      details: {
        domReadyTime,
        networkLatency,
        pageLoadTime,
      },
    };

    sendToAnalytics(metrics);
  }
};

// Helper to get performance rating
const getPerformanceRating = (
  value: number,
  thresholds: [number, number]
): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs-improvement';
  return 'poor';
};

export { reportWebVitals, sendToAnalytics };
