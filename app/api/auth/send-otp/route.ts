import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sendOTPSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mobile, purpose } = sendOTPSchema.parse(body)

    // TODO: Implement OTP sending logic
    // const result = await createOTPVerification(mobile, purpose)
    
    // For now, return a placeholder response
    console.log(`OTP request for ${mobile} (${purpose})`)
    
    return NextResponse.json({
      success: true,
      message: 'OTP functionality will be implemented soon. For now, account creation works without OTP verification.',
      mobile: mobile,
      purpose: purpose
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
} 