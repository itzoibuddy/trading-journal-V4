import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  handleApiError,
} from '../errors';

describe('Error Classes', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create AuthenticationError with correct properties', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Authentication required');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should create NotFoundError with correct properties', () => {
    const error = new NotFoundError('User');
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should create RateLimitError with retry after', () => {
    const error = new RateLimitError(60);
    expect(error.message).toBe('Too many requests');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
  });
});

describe('handleApiError', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle AppError correctly', () => {
    const error = new ValidationError('Invalid data');
    const result = handleApiError(error);
    
    expect(result.status).toBe(400);
    expect(result.data.success).toBe(false);
    expect(result.data.error.message).toBe('Invalid data');
    expect(result.data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle Prisma P2002 error', () => {
    const prismaError = { code: 'P2002' };
    const result = handleApiError(prismaError);
    
    expect(result.status).toBe(409);
    expect(result.data.error.message).toBe('A record with this data already exists');
    expect(result.data.error.code).toBe('DUPLICATE_ENTRY');
  });

  it('should handle generic errors in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Database connection failed');
    const result = handleApiError(error);
    
    expect(result.status).toBe(500);
    expect(result.data.error.message).toBe('Internal server error');
    expect(result.data.error.code).toBe('INTERNAL_ERROR');
  });

  it('should expose error details in development', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Database connection failed');
    const result = handleApiError(error);
    
    expect(result.status).toBe(500);
    expect(result.data.error.message).toBe('Database connection failed');
  });
}); 