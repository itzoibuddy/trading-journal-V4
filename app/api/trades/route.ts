export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Validate date parameters if provided
    if (start && isNaN(Date.parse(start))) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400 }
      );
    }
    
    if (end && isNaN(Date.parse(end))) {
      return NextResponse.json(
        { error: 'Invalid end date format' },
        { status: 400 }
      );
    }

    let trades;
    
    if (start && end) {
      // If dates are provided, filter by date range
      trades = await prisma.trade.findMany({
        where: {
          entryDate: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        orderBy: {
          entryDate: 'desc',
        },
        // Limit results for performance
        take: 1000,
      });
    } else {
      // If no dates are provided, return recent trades (limited for performance)
      trades = await prisma.trade.findMany({
        orderBy: {
          entryDate: 'desc',
        },
        take: 500, // Limit to recent 500 trades
      });
    }

    return NextResponse.json({
      success: true,
      data: trades,
      count: trades.length
    });
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching trades:', error);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch trades',
        message: 'An internal server error occurred'
      },
      { status: 500 }
    );
  }
} 