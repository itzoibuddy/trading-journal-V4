import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Delete all demo trades for the user
    const result = await prisma.trade.deleteMany({
      where: {
        userId: user.id,
        isDemo: true
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DEMO_DATA_CLEARED',
        resource: 'Trade',
        resourceId: user.id,
        metadata: JSON.stringify({ 
          deletedCount: result.count,
          timestamp: new Date().toISOString() 
        })
      }
    })

    return NextResponse.json({ 
      message: 'Demo data cleared successfully',
      deletedCount: result.count 
    })
  } catch (error) {
    console.error('Clear demo data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 