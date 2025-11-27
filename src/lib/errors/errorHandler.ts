import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, RateLimitError, InternalServerError, ServiceUnavailableError } from './AppError';

/**
 * Handles API errors by converting them to appropriate AppError instances
 * @param error The error to handle
 * @param context Additional context for error handling
 * @returns An appropriate AppError instance
 */
export function handleApiError(error: unknown, context: Record<string, unknown> = {}): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Handle Axios errors (if using Axios)
  if (isAxiosError(error)) {
    return handleAxiosError(error, context);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      ...context,
      originalError: error,
      stack: error.stack,
    });
  }

  // Handle non-Error objects (strings, numbers, etc.)
  return new InternalServerError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    { ...context, originalError: error }
  );
}

/**
 * Type guard to check if an error is an Axios error
 */
function isAxiosError(error: unknown): error is { 
  isAxiosError: boolean;
  response?: {
    status: number;
    data?: unknown;
    statusText?: string;
  };
  request?: unknown;
  message: string;
  config?: {
    url?: string;
    method?: string;
    params?: unknown;
    data?: unknown;
  };
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError: boolean }).isAxiosError === true
  );
}

/**
 * Handles errors from Axios requests
 */
function handleAxiosError(
  error: ReturnType<typeof isAxiosError>,
  context: Record<string, unknown> = {}
): AppError {
  const { response, request, config, message } = error;
  const requestInfo = {
    url: config?.url,
    method: config?.method,
    params: config?.params,
    requestData: config?.data,
  };

  const errorContext = {
    ...context,
    request: requestInfo,
    response: response ? {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    } : undefined,
  };

  if (response) {
    // Handle HTTP error status codes
    switch (response.status) {
      case 400:
        return new BadRequestError(
          extractErrorMessage(response.data) || 'Bad Request',
          { ...errorContext, validationErrors: extractValidationErrors(response.data) }
        );
      
      case 401:
        return new UnauthorizedError(
          extractErrorMessage(response.data) || 'Unauthorized',
          errorContext
        );
      
      case 403:
        return new ForbiddenError(
          extractErrorMessage(response.data) || 'Forbidden',
          errorContext
        );
      
      case 404:
        return new NotFoundError(
          extractErrorMessage(response.data) || 'Resource not found',
          errorContext
        );
      
      case 409:
        return new ConflictError(
          extractErrorMessage(response.data) || 'Conflict',
          errorContext
        );
      
      case 422:
        return new ValidationError(
          extractErrorMessage(response.data) || 'Validation failed',
          { ...errorContext, validationErrors: extractValidationErrors(response.data) }
        );
      
      case 429:
        return new RateLimitError(
          extractErrorMessage(response.data) || 'Too many requests',
          {
            ...errorContext,
            retryAfter: getRetryAfterFromResponse(response.data) || 60,
          }
        );
      
      case 500:
        return new InternalServerError(
          extractErrorMessage(response.data) || 'Internal Server Error',
          errorContext
        );
      
      case 503:
        return new ServiceUnavailableError(
          extractErrorMessage(response.data) || 'Service Unavailable',
          {
            ...errorContext,
            retryAfter: getRetryAfterFromResponse(response.data) || 60,
          }
        );
      
      default:
        return new AppError(
          extractErrorMessage(response.data) || `HTTP Error ${response.status}`,
          response.status,
          response.status < 500, // Operational if 4xx, programming error if 5xx
          errorContext
        );
    }
  } else if (request) {
    // The request was made but no response was received
    return new ServiceUnavailableError(
      'No response received from server',
      { ...errorContext, originalMessage: message }
    );
  } else {
    // Something happened in setting up the request
    return new BadRequestError(
      'Error setting up request',
      { ...errorContext, originalMessage: message }
    );
  }
}

/**
 * Extracts a user-friendly error message from an API response
 */
function extractErrorMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'object') {
    // Handle common error response formats
    const errorObj = data as Record<string, unknown>;
    
    if (errorObj.message && typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    if (errorObj.error && typeof errorObj.error === 'string') {
      return errorObj.error;
    }
    
    if (errorObj.detail && typeof errorObj.detail === 'string') {
      return errorObj.detail;
    }
  }
  
  return undefined;
}

/**
 * Extracts validation errors from an API response
 */
function extractValidationErrors(data: unknown): Record<string, string[]> | undefined {
  if (!data || typeof data !== 'object') return undefined;
  
  const errorObj = data as Record<string, unknown>;
  
  // Handle common validation error formats
  if (errorObj.errors && Array.isArray(errorObj.errors)) {
    return { _form: errorObj.errors as string[] };
  }
  
  if (errorObj.detail && Array.isArray(errorObj.detail)) {
    const details = errorObj.detail as Array<{
      loc: (string | number)[];
      msg: string;
      type: string;
    }>;
    
    return details.reduce<Record<string, string[]>>((acc, curr) => {
      const key = curr.loc.join('.');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(curr.msg);
      return acc;
    }, {});
  }
  
  return undefined;
}

/**
 * Extracts the retry-after value from an API response
 */
function getRetryAfterFromResponse(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  
  const errorObj = data as Record<string, unknown>;
  
  if (errorObj.retryAfter && typeof errorObj.retryAfter === 'number') {
    return errorObj.retryAfter;
  }
  
  if (errorObj.retry_after && typeof errorObj.retry_after === 'number') {
    return errorObj.retry_after;
  }
  
  return undefined;
}

// Export all error types for convenience
export * from './AppError';
