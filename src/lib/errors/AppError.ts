/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    
    // Ensure the error name is the class name
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintain proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: unknown) {
    super(message, 400, true, details);
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 401, true, details);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(message, 403, true, details);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', details?: unknown) {
    super(message, 404, true, details);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: unknown) {
    super(message, 409, true, details);
  }
}

/**
 * 422 Unprocessable Entity Error
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error', details?: unknown) {
    super(message, 422, true, details);
  }
}

/**
 * 429 Too Many Requests Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too Many Requests', details?: unknown) {
    super(message, 429, true, {
      ...(details as object),
      retryAfter: (details as { retryAfter?: number })?.retryAfter || 60, // Default 60 seconds
    });
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', details?: unknown) {
    super(message, 500, false, details);
  }
}

/**
 * 501 Not Implemented Error
 */
export class NotImplementedError extends AppError {
  constructor(message: string = 'Not Implemented', details?: unknown) {
    super(message, 501, true, details);
  }
}

/**
 * 503 Service Unavailable Error
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable', details?: unknown) {
    super(message, 503, true, {
      ...(details as object),
      retryAfter: (details as { retryAfter?: number })?.retryAfter || 60, // Default 60 seconds
    });
  }
}
