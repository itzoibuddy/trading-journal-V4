import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { ValidationError, NotFoundError, handleApiError } from '@/app/lib/errors';
import { rateLimit, corsHeaders } from '@/app/lib/middleware';

const rateLimiter = rateLimit(100, 60000);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      throw new ValidationError('Invalid trade ID');
    }

    const trade = await prisma.trade.findUnique({
      where: { id }
    });

    if (!trade) {
      throw new NotFoundError('Trade');
    }

    return NextResponse.json({
      success: true,
      data: trade
    }, {
      headers: corsHeaders(request.headers.get('origin') || undefined),
    });
  } catch (error) {
    const { data, status } = handleApiError(error);
    return NextResponse.json(data, { status });
  }
} 