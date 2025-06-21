import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { prisma } from '../../../../../lib/db'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['TRADER', 'ADMIN', 'SUPER_ADMIN'])
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    // Check if trying to set SUPER_ADMIN without being one
    if (role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can create other super admins' }, { status: 403 })
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent demoting super admin unless you are one
    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot modify super admin role' }, { status: 403 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'USER_ROLE_CHANGED',
        resource: 'User',
        resourceId: params.id,
        metadata: JSON.stringify({ 
          oldRole: targetUser.role,
          newRole: role,
          targetUser: targetUser.email
        })
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update role error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 