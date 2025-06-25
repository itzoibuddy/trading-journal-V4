import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true } // Only select needed fields
    })

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100) // Max 100, default 25
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim()
    const userId = searchParams.get('userId')
    const tradeType = searchParams.get('type')

    // Build where clause for filtering
    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (tradeType && tradeType !== 'ALL') {
      where.type = tradeType
    }
    
    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.trade.count({ where })

    // Get paginated trades with optimized query - only select needed fields
    const trades = await prisma.trade.findMany({
      where,
      select: {
        id: true,
        symbol: true,
        type: true,
        instrumentType: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        entryDate: true,
        exitDate: true,
        profitLoss: true,
        isDemo: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        entryDate: 'desc'
      },
      skip,
      take: limit
    })

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({ 
      trades,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Admin trades error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'; 