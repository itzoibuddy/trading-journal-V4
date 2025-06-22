import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      throw new ValidationError('Invalid trade ID');
    }

    // CRITICAL: Find trade that belongs to the authenticated user only
    const trade = await prisma.trade.findFirst({
      where: { 
        id,
        userId: user.id // Ensure the trade belongs to the authenticated user
      }
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