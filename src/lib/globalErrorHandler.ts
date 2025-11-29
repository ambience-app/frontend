import { reportError } from './errorReporting';

/**
 * Initialize global error handlers for uncaught exceptions and unhandled rejections
 */
export function initGlobalErrorHandlers() {
  if (typeof window === 'undefined') {
    // Server-side error handling
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      reportError(error, {
        tags: { error_type: 'uncaught_exception' },
        source: 'server',
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      console.error('Unhandled Rejection at:', promise, 'reason:', error);
      reportError(error, {
        tags: { error_type: 'unhandled_rejection' },
        source: 'server',
        promise: promise.toString(),
      });
    });
  } else {
    // Client-side error handling
    window.addEventListener('error', (event) => {
      // Don't report if preventDefault() was called (e.g., by another error handler)
      if (event.defaultPrevented) return;
      
      const { message, filename, lineno, colno, error } = event;
      
      reportError(error || new Error(message), {
        tags: { error_type: 'global_error' },
        source: 'browser',
        filename,
        lineno,
        colno,
      });
      
      // Let the default handler run as well
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason || 'Unknown reason';
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      reportError(error, {
        tags: { error_type: 'unhandled_rejection' },
        source: 'browser',
        reason: String(reason),
      });
      
      // Let the default handler run as well
    });
  }
}

/**
 * Initialize error tracking and global error handlers
 */
export function initErrorTracking() {
  // Initialize global error handlers
  initGlobalErrorHandlers();
  
  // Log page views and other analytics
  if (typeof window !== 'undefined') {
    // Track page views
    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function(...args) {
        const result = originalPushState.apply(this, args);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };

      window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
      });

      // Track initial page view
      window.addEventListener('load', () => {
        trackPageView();
      });

      // Track subsequent page views
      window.addEventListener('locationchange', () => {
        trackPageView();
      });
    }
  }
}

/**
 * Track a page view in Sentry
 */
function trackPageView() {
  if (typeof window === 'undefined') return;
  
  const { pathname, search, hash } = window.location;
  const url = `${pathname}${search}${hash}`;
  
  // You can add more context here if needed
  const context = {
    url,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  };
  
  // Add breadcrumb for page view
  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${url}`,
      level: 'info',
      data: context,
    });
  }
}

// Initialize error tracking when this module is imported
if (typeof window !== 'undefined') {
  initErrorTracking();
}
