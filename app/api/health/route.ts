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
  let databaseConnected = false;
  
  try {
    // Try to connect to the database
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  // Get package version
  const packageJson = require('../../../package.json');
  
  return NextResponse.json({
    status: databaseConnected ? 'ok' : 'degraded',
    database: databaseConnected,
    timestamp: new Date().toISOString(),
    version: packageJson.version,
  }, {
    status: databaseConnected ? 200 : 503,
  });
} 