import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../lib/db'

// Simple in-memory cache for user lookups (10 minute TTL)
const userCache = new Map<string, { user: any; expires: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function getCachedUser(email: string) {
  const cached = userCache.get(email)
  if (cached && cached.expires > Date.now()) {
    return cached.user
  }
  return null
}

function setCachedUser(email: string, user: any) {
  userCache.set(email, {
    user,
    expires: Date.now() + CACHE_TTL
  })
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [email, cached] of userCache.entries()) {
    if (cached.expires < now) {
      userCache.delete(email)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get user from cache first
    let user = getCachedUser(session.user.email)
    
    if (!user) {
      // If not in cache, fetch from database
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true } // Only select the ID we need
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Cache the user
      setCachedUser(session.user.email, user)
    }

    // Use more efficient aggregation queries
    const [
      totalTrades,
      demoTrades,
      completedTradesData
    ] = await Promise.all([
      // Total trades count
      prisma.trade.count({
        where: { userId: user.id }
      }),
      
      // Demo trades count
      prisma.trade.count({
        where: { 
          userId: user.id,
          isDemo: true 
        }
      }),
      
      // Get completed trades with P&L data in a single query
      prisma.trade.findMany({
        where: { 
          userId: user.id,
          exitDate: { not: null },
          profitLoss: { not: null }
        },
        select: {
          profitLoss: true
        }
      })
    ])

    // Calculate stats from the fetched data
    const completedTrades = completedTradesData
    const winningTrades = completedTrades.filter(t => t.profitLoss! > 0)
    const totalPnL = completedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
    const winRate = completedTrades.length > 0 
      ? (winningTrades.length / completedTrades.length) * 100 
      : 0

    return NextResponse.json({
      totalTrades,
      demoTrades,
      totalPnL,
      winRate: Math.round(winRate * 100) / 100 // Round to 2 decimal places
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 