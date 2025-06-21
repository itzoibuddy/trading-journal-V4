import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../lib/db'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    // Log profile update
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'PROFILE_UPDATED',
        resource: 'User',
        resourceId: updatedUser.id,
        metadata: JSON.stringify({ updatedFields: ['name'] })
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 