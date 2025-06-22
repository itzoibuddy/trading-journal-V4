import { prisma } from './db'

export interface OTPResult {
  success: boolean
  message: string
  otpId?: string
}

export interface OTPVerificationResult {
  success: boolean
  message: string
  verified?: boolean
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store OTP in database
export async function createOTPVerification(
  mobile: string,
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'
): Promise<OTPResult> {
  try {
    // Clean up expired OTPs for this mobile
    await prisma.oTPVerification.deleteMany({
      where: {
        mobile,
        expiresAt: {
          lt: new Date()
        }
      }
    })

    // Check if there's an active OTP for this mobile and purpose
    const existingOTP = await prisma.oTPVerification.findFirst({
      where: {
        mobile,
        purpose,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingOTP) {
      return {
        success: false,
        message: 'An OTP is already active for this mobile number. Please wait before requesting a new one.'
      }
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    const otpVerification = await prisma.oTPVerification.create({
      data: {
        mobile,
        otp,
        purpose,
        expiresAt
      }
    })

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${mobile}: ${otp}`) // For development only

    return {
      success: true,
      message: 'OTP sent successfully',
      otpId: otpVerification.id
    }
  } catch (error) {
    console.error('Error creating OTP verification:', error)
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.'
    }
  }
}

// Verify OTP
export async function verifyOTP(
  mobile: string,
  otp: string,
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'
): Promise<OTPVerificationResult> {
  try {
    const otpVerification = await prisma.oTPVerification.findFirst({
      where: {
        mobile,
        otp,
        purpose,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!otpVerification) {
      // Increment failed attempts for all active OTPs for this mobile
      await prisma.oTPVerification.updateMany({
        where: {
          mobile,
          purpose,
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        },
        data: {
          attempts: {
            increment: 1
          }
        }
      })

      return {
        success: false,
        message: 'Invalid or expired OTP'
      }
    }

    // Check if too many attempts
    if (otpVerification.attempts >= 3) {
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      }
    }

    // Mark OTP as verified
    await prisma.oTPVerification.update({
      where: {
        id: otpVerification.id
      },
      data: {
        verified: true
      }
    })

    // If this is for registration, mark user's mobile as verified
    if (purpose === 'REGISTRATION') {
      await prisma.user.updateMany({
        where: {
          mobile
        },
        data: {
          mobileVerified: new Date()
        }
      })
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      verified: true
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    }
  }
}

// Clean up expired OTPs
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.oTPVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error)
  }
}

// Send OTP via SMS (placeholder for future implementation)
export async function sendSMS(mobile: string, message: string): Promise<boolean> {
  // TODO: Implement SMS sending using services like:
  // - Twilio
  // - AWS SNS
  // - Firebase Cloud Messaging
  // - Indian SMS gateways like MSG91, TextLocal, etc.
  
  console.log(`SMS to ${mobile}: ${message}`)
  return true
}

// Format mobile number for SMS sending
export function formatMobileForSMS(mobile: string): string {
  // Remove any formatting and add country code
  const digits = mobile.replace(/\D/g, '')
  return `+91${digits}`
} 