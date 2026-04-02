// Custom error class for application-specific errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Array<{ field: string; message: string }>) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT', true);
  }
}

// 422 - Unprocessable Entity (Validation errors)
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Array<{ field: string; message: string }>) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

// 429 - Too Many Requests
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
  }
}

// 500 - Internal Server Error
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}
