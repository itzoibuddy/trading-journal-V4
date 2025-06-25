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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    // Build where clause
    const where: {
      action?: string;
      userId?: string;
    } = {}
    if (action) where.action = action
    if (userId) where.userId = userId

    // Get audit logs with pagination
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    // Get user details for audit logs
    const userIds = [...new Set(auditLogs.map(log => log.userId).filter((id): id is string => id !== null))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    const userMap = new Map(users.map(user => [user.id, user]))

    // Enrich audit logs with user information
    const enrichedLogs = auditLogs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) : null
    }))

    return NextResponse.json({
      auditLogs: enrichedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Admin audit logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 