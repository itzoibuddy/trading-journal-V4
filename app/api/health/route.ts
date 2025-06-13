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
    // Try to connect to the database
    const dbConnection = await prisma.$queryRaw`SELECT 1 as result`;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: !!dbConnection
      }
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      error: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
} 