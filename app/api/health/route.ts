export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

/**
 * Health check endpoint to verify the application and database are working
 * 
 * Returns:
 * - status: "ok" if everything is working
 * - database: true if database is connected
 * - timestamp: current server time
 * - version: application version from package.json
 */
export async function GET() {
  try {
    // Try to connect to the database with timeout
    const dbConnectionPromise = prisma.$queryRaw`SELECT 1 as result`;
    
    // Set a timeout for the database connection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000);
    });
    
    // Race the connection against the timeout
    const dbConnection = await Promise.race([dbConnectionPromise, timeoutPromise]);
    
    // Get database connection info
    const dbUrl = process.env.DATABASE_URL || '';
    const dbProvider = dbUrl.includes('neon.tech') ? 'neon' : 
                       dbUrl.includes('railway') ? 'railway' : 'unknown';
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: !!dbConnection,
        provider: dbProvider,
        // Only show host in non-production environments for security
        host: process.env.NODE_ENV === 'production' 
          ? '(hidden in production)' 
          : dbUrl.match(/\@([^:]+):/)?.[1] || 'unknown'
      }
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    // Get database connection info for error reporting
    const dbUrl = process.env.DATABASE_URL || '';
    const dbProvider = dbUrl.includes('neon.tech') ? 'neon' : 
                       dbUrl.includes('railway') ? 'railway' : 'unknown';
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: false,
        provider: dbProvider,
        // Only show host in non-production environments for security
        host: process.env.NODE_ENV === 'production' 
          ? '(hidden in production)' 
          : dbUrl.match(/\@([^:]+):/)?.[1] || 'unknown'
      },
      error: {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      }
    }, { status: 500 });
  }
} 