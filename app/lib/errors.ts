/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, 'RATE_LIMIT_ERROR');
    if (retryAfter) {
      this.retryAfter = retryAfter;
    }
  }
  retryAfter?: number;
}

export function handleApiError(error: unknown) {
  // Log error details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', error);
  }

  // Handle known errors
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    };

    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    return {
      data: response,
      status: error.statusCode,
    };
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    if (prismaError.code === 'P2002') {
      return {
        data: {
          success: false,
          error: {
            message: 'A record with this data already exists',
            code: 'DUPLICATE_ENTRY',
          },
        },
        status: 409,
      };
    }
    
    if (prismaError.code === 'P2025') {
      return {
        data: {
          success: false,
          error: {
            message: 'Record not found',
            code: 'NOT_FOUND',
          },
        },
        status: 404,
      };
    }
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return {
    data: {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : message,
        code: 'INTERNAL_ERROR',
      },
    },
    status: 500,
  };
} 