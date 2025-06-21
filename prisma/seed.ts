import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.trade.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Creating admin user...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tradingjournal.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    }
  });
  
  console.log('Creating demo user...');
  
  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@tradingjournal.com',
      name: 'Demo Trader',
      password: demoPassword,
      role: 'TRADER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      tradingExperience: 'INTERMEDIATE',
    }
  });
  
  console.log('Creating sample trades for demo user...');
  
  // Sample trades for demo user
  const trades = [
    {
      userId: demoUser.id,
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
      isDemo: false,
      tradeRating: 4,
      marketCondition: 'Bullish',
    },
    {
      userId: demoUser.id,
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
      notes: 'Overbought on RSI, perfect short setup',
      isDemo: false,
      tradeRating: 5,
      marketCondition: 'Bearish',
    },
    {
      userId: demoUser.id,
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
      notes: 'Market moved against me, cut losses early',
      isDemo: false,
      tradeRating: 2,
      lessons: 'Should have waited for better entry timing',
      marketCondition: 'Sideways',
    },
    {
      userId: demoUser.id,
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
      isDemo: false,
      tradeRating: 5,
      marketCondition: 'Bullish',
    },
    {
      userId: demoUser.id,
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
      isDemo: false,
      tradeRating: 2,
      lessons: 'Never fight the trend without strong confirmation',
      marketCondition: 'Bullish',
    },
    {
      userId: demoUser.id,
      symbol: 'RELIANCE',
      type: 'LONG',
      instrumentType: 'STOCK',
      entryPrice: 2750.00,
      exitPrice: 2820.00,
      quantity: 8,
      entryDate: new Date('2024-03-05'),
      exitDate: new Date('2024-03-05'),
      profitLoss: 560,
      strategy: 'Support Bounce',
      notes: 'Support bounce - great entry on daily support level',
      isDemo: false,
      tradeRating: 4,
      marketCondition: 'Bullish',
    },
    {
      userId: demoUser.id,
      symbol: 'TCS',
      type: 'SHORT',
      instrumentType: 'STOCK',
      entryPrice: 3600.00,
      exitPrice: 3550.00,
      quantity: 6,
      entryDate: new Date('2024-03-12'),
      exitDate: new Date('2024-03-12'),
      profitLoss: 300,
      strategy: 'Resistance Rejection',
      notes: 'Clean rejection at resistance level',
      isDemo: false,
      tradeRating: 4,
      marketCondition: 'Bearish',
    }
  ];
  
  // Create trades one by one
  for (const trade of trades) {
    await prisma.trade.create({
      data: trade,
    });
  }
  
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('Admin User:', { email: 'admin@tradingjournal.com', password: 'admin123' });
  console.log('Demo User:', { email: 'demo@tradingjournal.com', password: 'demo123' });
  console.log('');
  console.log('🚀 Start the app with: npm run dev');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 