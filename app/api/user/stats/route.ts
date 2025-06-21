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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get trade statistics
    const trades = await prisma.trade.findMany({
      where: { userId: user.id }
    })

    const totalTrades = trades.length
    const demoTrades = trades.filter(t => t.isDemo).length
    const completedTrades = trades.filter(t => t.exitDate && t.profitLoss !== null)
    const winningTrades = completedTrades.filter(t => t.profitLoss! > 0)
    const totalPnL = completedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
    const winRate = completedTrades.length > 0 
      ? (winningTrades.length / completedTrades.length) * 100 
      : 0

    return NextResponse.json({
      totalTrades,
      demoTrades,
      totalPnL,
      winRate
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 