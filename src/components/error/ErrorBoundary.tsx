import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '@/lib/errors/AppError';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use the provided fallback render function if available
      if (fallback) {
        return fallback(error, this.resetErrorBoundary);
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mb-4">
                {error.message || 'An unexpected error occurred.'}
              </AlertDescription>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.resetErrorBoundary}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            </Alert>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-muted/50 rounded-md text-sm overflow-auto max-h-60">
                <summary className="font-medium mb-2 cursor-pointer">Error Details</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {error.stack || error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Default export with default props
export default ErrorBoundary;
