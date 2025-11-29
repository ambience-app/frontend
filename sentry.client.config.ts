import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  
  // Session Replay
  integrations: [
    new Sentry.Replay({
      maskAllText: false, // Mask all text content for privacy
      blockAllMedia: true, // Block all media elements (prevents loading of images, videos, etc.)
    }),
  ],
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Filter out common browser extension errors
  beforeSend(event, hint) {
    const error = hint?.originalException;
    
    // Ignore specific errors
    if (error && error instanceof Error) {
      // Ignore ResizeObserver errors
      if (error.message.includes('ResizeObserver')) {
        return null;
      }
      
      // Ignore common extension-related errors
      if (
        error.message.includes('chrome-extension') ||
        error.message.includes('moz-extension') ||
        error.message.includes('safari-extension')
      ) {
        return null;
      }
    }
    
    return event;
  },
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
});

// Add user context when available
if (typeof window !== 'undefined') {
  // This will be updated when the user logs in
  Sentry.setUser({ 
    ip_address: '{{auto}}' 
  });
}
