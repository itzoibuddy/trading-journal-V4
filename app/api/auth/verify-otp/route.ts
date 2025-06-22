import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const verifyOTPSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mobile, otp, purpose } = verifyOTPSchema.parse(body)

    // TODO: Implement OTP verification logic
    // const result = await verifyOTP(mobile, otp, purpose)
    
    // For now, return a placeholder response
    console.log(`OTP verification for ${mobile}: ${otp} (${purpose})`)
    
    return NextResponse.json({
      success: true,
      message: 'OTP verification functionality will be implemented soon.',
      verified: true,
      mobile: mobile,
      purpose: purpose
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
} 