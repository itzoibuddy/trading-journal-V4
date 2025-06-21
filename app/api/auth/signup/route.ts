import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'TRADER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    // Create demo trades for new user
    await createDemoTrades(user.id)

    // Log user creation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATED',
        resource: 'User',
        resourceId: user.id,
        metadata: JSON.stringify({ registrationMethod: 'email' })
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createDemoTrades(userId: string) {
  const demoTrades = [
    {
      userId,
      symbol: 'AAPL',
      type: 'LONG',
      instrumentType: 'STOCK',
      entryPrice: 150.00,
      exitPrice: 155.00,
      quantity: 10,
      entryDate: new Date('2024-01-15'),
      exitDate: new Date('2024-01-20'),
      profitLoss: 500,
      strategy: 'Breakout',
      notes: 'Clean breakout above resistance with high volume',
      isDemo: true,
      tradeRating: 4,
      marketCondition: 'Bullish',
      timeFrame: '1h',
      stopLoss: 148.00,
      targetPrice: 155.00,
    },
    {
      userId,
      symbol: 'TSLA',
      type: 'SHORT',
      instrumentType: 'STOCK',
      entryPrice: 250.00,
      exitPrice: 240.00,
      quantity: 5,
      entryDate: new Date('2024-01-22'),
      exitDate: new Date('2024-01-25'),
      profitLoss: 500,
      strategy: 'Mean Reversion',
      notes: 'Overbought on RSI, perfect short setup at resistance',
      isDemo: true,
      tradeRating: 5,
      marketCondition: 'Bearish',
      timeFrame: '15m',
      stopLoss: 255.00,
      targetPrice: 240.00,
    },
    {
      userId,
      symbol: 'SPY',
      type: 'LONG',
      instrumentType: 'OPTIONS',
      entryPrice: 2.50,
      exitPrice: 1.80,
      quantity: 2,
      strikePrice: 480,
      optionType: 'CALL',
      premium: 250,
      entryDate: new Date('2024-02-01'),
      exitDate: new Date('2024-02-05'),
      profitLoss: -140,
      strategy: 'Earnings Play',
      notes: 'Market moved against me, cut losses early as planned',
      isDemo: true,
      tradeRating: 2,
      lessons: 'Should have waited for better entry timing',
      marketCondition: 'Sideways',
      timeFrame: 'Daily',
      stopLoss: 2.00,
      targetPrice: 4.00,
    },
    {
      userId,
      symbol: 'NVDA',
      type: 'LONG',
      instrumentType: 'STOCK',
      entryPrice: 400.00,
      exitPrice: 420.00,
      quantity: 3,
      entryDate: new Date('2024-02-10'),
      exitDate: new Date('2024-02-15'),
      profitLoss: 600,
      strategy: 'Trend Following',
      notes: 'Strong uptrend with AI news catalyst',
      isDemo: true,
      tradeRating: 5,
      marketCondition: 'Bullish',
      timeFrame: '4h',
      stopLoss: 390.00,
      targetPrice: 420.00,
    },
    {
      userId,
      symbol: 'QQQ',
      type: 'SHORT',
      instrumentType: 'FUTURES',
      entryPrice: 380.00,
      exitPrice: 385.00,
      quantity: 1,
      entryDate: new Date('2024-02-20'),
      exitDate: new Date('2024-02-22'),
      profitLoss: -500,
      strategy: 'Reversal',
      notes: 'Failed reversal trade, market continued higher',
      isDemo: true,
      tradeRating: 2,
      lessons: 'Never fight the trend without strong confirmation',
      marketCondition: 'Bullish',
      timeFrame: '1h',
      stopLoss: 385.00,
      targetPrice: 370.00,
    }
  ]

  await prisma.trade.createMany({
    data: demoTrades
  })
} 