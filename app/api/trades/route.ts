export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { rateLimit, corsHeaders } from '../../lib/middleware';

const rateLimiter = rateLimit(100, 60000); // 100 requests per minute

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimiter(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter || 60),
        }
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const skip = (page - 1) * limit;

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

    // Build where clause
    const where: any = {};
    if (start && end) {
      where.entryDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.trade.count({ where });
    
    // Get paginated trades
    const trades = await prisma.trade.findMany({
      where,
      orderBy: {
        entryDate: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: trades,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    }, {
      headers: corsHeaders(request.headers.get('origin') || undefined),
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