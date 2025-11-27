import { handleApiError } from '@/lib/errors/errorHandler';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type FetchOptions = Omit<RequestInit, 'method' | 'body'> & {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  errorContext?: Record<string, unknown>;
};

/**
 * A wrapper around fetch with standardized error handling
 */
export async function fetchWithErrorHandling<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    headers = {},
    errorContext = {},
    ...fetchOptions
  } = options;

  // Add JSON content type for non-GET requests
  if (method !== 'GET' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add authorization header if available
  const token = localStorage.getItem('authToken');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build URL with query parameters
  const urlWithParams = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlWithParams.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(urlWithParams.toString(), {
      ...fetchOptions,
      method,
      headers: {
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text().catch(() => ({}));
      }

      const error = new Error(
        errorData?.message || `HTTP error! status: ${response.status}`
      );
      
      // Attach response data to the error
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      };

      throw error;
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    // Parse JSON response
    return response.json() as Promise<T>;
  } catch (error) {
    // Handle network errors and API errors consistently
    throw handleApiError(error, {
      ...errorContext,
      url: urlWithParams.toString(),
      method,
    });
  }
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T = unknown>(
    url: string,
    params?: FetchOptions['params'],
    options: Omit<FetchOptions, 'method' | 'params'> = {}
  ) => fetchWithErrorHandling<T>(url, { ...options, method: 'GET', params }),

  post: <T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ) => fetchWithErrorHandling<T>(url, { ...options, method: 'POST', body }),

  put: <T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ) => fetchWithErrorHandling<T>(url, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ) => fetchWithErrorHandling<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(
    url: string,
    options: Omit<FetchOptions, 'method'> = {}
  ) => fetchWithErrorHandling<T>(url, { ...options, method: 'DELETE' }),
};
