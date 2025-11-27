# Error Handling in Ambience

This document outlines the error handling patterns and best practices for the Ambience frontend application.

## Overview

We use a consistent approach to error handling across the application with the following components:

1. **Custom Error Classes**: Extend `AppError` for different types of errors.
2. **Error Boundary**: Catches React component tree errors.
3. **Error Context**: Manages errors globally with the `useError` hook.
4. **API Error Handling**: Standardizes API error responses.
5. **Error Logging**: Logs errors to external services in production.

## Error Types

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `AppError` | - | Base error class |
| `BadRequestError` | 400 | Invalid request |
| `UnauthorizedError` | 401 | Authentication required |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Resource conflict |
| `ValidationError` | 422 | Validation failed |
| `RateLimitError` | 429 | Too many requests |
| `InternalServerError` | 500 | Server error |
| `ServiceUnavailableError` | 503 | Service unavailable |

## Usage

### Throwing Errors

```typescript
import { NotFoundError, ValidationError } from '@/lib/errors/AppError';

// Basic usage
throw new NotFoundError('User not found');

// With details
throw new ValidationError('Invalid input', {
  fields: {
    email: 'Must be a valid email address',
    password: 'Must be at least 8 characters',
  },
});
```

### Handling API Errors

```typescript
import { handleApiError } from '@/lib/errors/errorHandler';

try {
  const response = await fetch('/api/users/123');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw handleApiError(error, { userId: 123 });
  }
  return await response.json();
} catch (error) {
  const appError = handleApiError(error, { userId: 123 });
  // Handle the error (e.g., show toast, update UI)
  throw appError;
}
```

### Using Error Boundary

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary 
      fallback={(error, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyApp />
    </ErrorBoundary>
  );
}
```

### Using Error Context

```tsx
import { useError } from '@/contexts/ErrorContext';

function MyComponent() {
  const { handleError } = useError();
  
  const fetchData = async () => {
    try {
      // API call that might fail
    } catch (error) {
      handleError(error, {
        showToast: true,
        context: { component: 'MyComponent' },
      });
    }
  };
  
  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Error Logging

Errors are automatically logged in production to the configured error tracking service (e.g., Sentry, LogRocket).

### Manual Logging

```typescript
import { logErrorToService } from '@/lib/errors/errorLogger';

try {
  // Code that might throw
} catch (error) {
  logErrorToService(error, { additional: 'context' });
  throw error;
}
```

## Best Practices

1. **Use Specific Error Types**: Always use the most specific error type available.
2. **Provide Context**: Include relevant context with errors to aid debugging.
3. **Handle Errors Gracefully**: Show user-friendly error messages.
4. **Log Errors**: Ensure all errors are logged appropriately.
5. **Test Error Cases**: Write tests for error scenarios.

## Testing

When testing components that throw errors, you can use the `ErrorBoundary` component to catch and verify errors:

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

test('shows error message when component throws', () => {
  const ErrorComponent = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ErrorComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```
