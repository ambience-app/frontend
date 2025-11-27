import { AppError } from './AppError';

type ErrorContext = Record<string, unknown>;

/**
 * Logs an error to an external error tracking service
 * @param error The error to log
 * @param context Additional context for the error
 */
export function logErrorToService(error: unknown, context: ErrorContext = {}): void {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const errorToLog = error instanceof AppError ? error : new AppError(
    error instanceof Error ? error.message : 'Unknown error',
    500,
    false,
    {
      originalError: error,
      ...context,
    }
  );

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged to service (dev mode):', {
      error: errorToLog,
      context,
      stack: errorToLog.stack,
    });
    return;
  }

  // In production, log to the appropriate service
  try {
    // Example: Log to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        
        if (errorToLog.details) {
          scope.setExtra('details', errorToLog.details);
        }
        
        Sentry.captureException(errorToLog);
      });
      return;
    }

    // Example: Log to LogRocket if available
    if (typeof window !== 'undefined' && (window as any).LogRocket) {
      const LogRocket = (window as any).LogRocket;
      LogRocket.captureException(errorToLog, {
        extra: {
          ...context,
          details: errorToLog.details,
        },
      });
      return;
    }

    // Fallback to console if no error tracking service is available
    console.error('Error (production):', {
      name: errorToLog.name,
      message: errorToLog.message,
      statusCode: errorToLog.statusCode,
      isOperational: errorToLog.isOperational,
      details: errorToLog.details,
      context,
      stack: errorToLog.stack,
    });
  } catch (loggingError) {
    // If error logging itself fails, log to console as a last resort
    console.error('Error logging failed:', loggingError);
    console.error('Original error:', error);
  }
}

/**
 * Sets up global error handlers for uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Handle uncaught exceptions
  if (typeof window !== 'undefined') {
    const originalOnError = window.onerror;
    
    window.onerror = function(message, source, lineno, colno, error) {
      // Call any existing error handler
      if (typeof originalOnError === 'function') {
        originalOnError.call(window, message, source, lineno, colno, error);
      }
      
      // Log the error
      logErrorToService(error || new Error(String(message)), {
        source,
        lineno,
        colno,
      });
      
      // Let the default handler run
      return false;
    };
  }

  // Handle unhandled promise rejections
  if (typeof window !== 'undefined' && 'addEventListener' in window) {
    window.addEventListener('unhandledrejection', (event) => {
      // Prevent the default handler (which would log to console)
      event.preventDefault();
      
      // Log the error
      const reason = event.reason || 'Unknown error in promise';
      logErrorToService(reason, {
        type: 'unhandledrejection',
        reason: String(reason),
      });
    });
  }
}
