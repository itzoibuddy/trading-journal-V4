export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

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
      });
    } else {
      // If no dates are provided, return all trades
      trades = await prisma.trade.findMany({
        orderBy: {
          entryDate: 'desc',
        },
      });
    }

    return NextResponse.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
} 