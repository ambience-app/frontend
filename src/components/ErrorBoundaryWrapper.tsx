"use client";

import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useError } from '@/contexts/ErrorContext';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ErrorBoundaryWrapper component
 *
 * Wraps the entire application with the ErrorBoundary component,
 * ensuring that any errors in the component tree are caught and displayed
 * in a user-friendly way.
 *
 * This component integrates with the global error context to ensure
 * consistent error handling throughout the application.
 *
 * @param {{ children: React.ReactNode }} props - Nested React components.
 * @returns {JSX.Element} Application wrapped in the ErrorBoundary component.
 */
export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const { handleError } = useError();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log the error to our error tracking service
        handleError(error, {
          component: 'ErrorBoundary',
          errorInfo,
          isBoundaryError: true,
        });
      }}
      fallback={(error, resetErrorBoundary) => (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="max-w-md p-6 space-y-4 bg-card rounded-lg shadow-lg">
            <div className="flex items-center justify-center text-destructive">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
            <p className="text-muted-foreground">
              We're sorry, but we encountered an unexpected error. Our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 text-sm text-left bg-muted/20 rounded-md overflow-auto max-h-60">
                <summary className="font-medium mb-2 cursor-pointer">Error Details</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {error.message}\n\n{error.stack}
                </pre>
              </details>
            )}
            <div className="pt-4">
              <Button
                onClick={resetErrorBoundary}
                className="inline-flex items-center gap-2"
                variant="default"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

