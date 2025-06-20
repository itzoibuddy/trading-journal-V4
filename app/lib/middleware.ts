import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const now = Date.now();
    const userLimit = rateLimitStore.get(ip);

    if (!userLimit || userLimit.resetTime < now) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return { success: true };
    }

    if (userLimit.count >= maxRequests) {
      return { 
        success: false, 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      };
    }

    userLimit.count++;
    return { success: true };
  };
}

// CORS configuration
export function corsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const headers = new Headers();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  
  return headers;
}

// Request validation middleware
export function validateRequest(schema: any) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid request data' 
      };
    }
  };
}

// Cleanup old rate limit entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, limit] of rateLimitStore.entries()) {
      if (limit.resetTime < now) {
        rateLimitStore.delete(ip);
      }
    }
  }, 60000); // Clean up every minute
} 