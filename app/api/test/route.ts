export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

export async function GET() {
  try {
    // Test database connection without exposing user data
    const userCount = await prisma.user.count();
    const tradeCount = await prisma.trade.count();
    
    return NextResponse.json({ 
      status: 'ok', 
      db: 'connected', 
      stats: {
        totalUsers: userCount,
        totalTrades: tradeCount
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      db: 'not connected', 
      error: error instanceof Error ? error.message : error 
    }, { status: 500 });
  }
} 