import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppError } from '@/lib/errors/AppError';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';

type ErrorContextType = {
  error: AppError | null;
  handleError: (error: unknown, options?: ErrorHandlerOptions) => void;
  clearError: () => void;
};

type ErrorHandlerOptions = {
  showToast?: boolean;
  toastDuration?: number;
  logToConsole?: boolean;
  logToService?: boolean;
  context?: Record<string, unknown>;
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

type ErrorProviderProps = {
  children: ReactNode;
  onError?: (error: AppError, context?: Record<string, unknown>) => void;
};

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  onError 
}) => {
  const [error, setError] = useState<AppError | null>(null);
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const {
      showToast = true,
      toastDuration = 5000,
      logToConsole = true,
      logToService = true,
      context = {},
    } = options;

    // Convert to AppError if it's not already
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error instanceof Error ? error.message : 'An unexpected error occurred',
          500,
          false,
          {
            originalError: error,
            ...context,
          }
        );

    // Update the error state
    setError(appError);

    // Log to console if enabled
    if (logToConsole) {
      console.error('Error handled by ErrorContext:', {
        error: appError,
        context,
        stack: appError.stack,
      });
    }

    // Log to error tracking service if enabled
    if (logToService && process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
      // logErrorToService(appError, context);
    }

    // Show toast notification if enabled
    if (showToast) {
      toast({
        title: appError.name,
        description: appError.message,
        variant: 'destructive',
        duration: toastDuration,
        icon: <AlertCircle className="h-5 w-5" />,
      });
    }

    // Call the onError callback if provided
    if (onError) {
      onError(appError, context);
    }

    return appError;
  }, [onError, toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, handleError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Helper hook for components to easily handle errors
export const useErrorHandler = () => {
  const { handleError } = useError();
  
  return useCallback((error: unknown, options?: ErrorHandlerOptions) => {
    return handleError(error, options);
  }, [handleError]);
};
