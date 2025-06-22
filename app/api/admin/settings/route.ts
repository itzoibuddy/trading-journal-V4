import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../lib/db'

// Mock settings storage (in production, you'd store this in database)
const defaultSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  maxTradesPerUser: 1000,
  maxUsersAllowed: 10000,
  systemMessage: '',
  backupEnabled: true,
  emailNotifications: false
}

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

    // In a real app, you'd fetch from database
    // For now, return default settings
    return NextResponse.json({ settings: defaultSettings })
  } catch (error) {
    console.error('Admin settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const settings = await request.json()

    // Log the settings change
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'SETTINGS_UPDATED',
        resource: 'SystemSettings',
        metadata: JSON.stringify(settings)
      }
    })

    // In a real app, you'd save to database
    // For now, just return success
    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings 
    })
  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 