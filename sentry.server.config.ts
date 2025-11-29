import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Filter out common errors
  beforeSend(event, hint) {
    const error = hint?.originalException;
    
    // Ignore specific errors
    if (error && error instanceof Error) {
      // Ignore common database connection errors that might be temporary
      if (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')
      ) {
        return null;
      }
    }
    
    return event;
  },
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Disable automatic session tracking in serverless environments
  autoSessionTracking: false,
  
  // Disable tracing on health check endpoints
  ignoreTransactions: ['/api/health', '/health']
});

// Add server-side specific context
Sentry.setTag('runtime', 'server');
