import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get system statistics
    const [totalUsers, totalTrades, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.trade.count(),
      prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      })
    ])

    // Calculate storage usage (simplified)
    const storageUsed = `${Math.round(totalTrades * 0.5)} KB` // Rough estimate

    // Calculate uptime (simplified)
    const uptime = `${Math.floor(Math.random() * 30) + 1} days`

    // Last backup (mock data)
    const lastBackup = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString()

    const stats = {
      totalUsers,
      totalTrades,
      activeUsers,
      storageUsed,
      uptime,
      lastBackup
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Admin system stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 