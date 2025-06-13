import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.trade.deleteMany();
  
  // Sample trade data
  const trades = [
    // May trades
    {
      symbol: 'RELIANCE',
      type: 'LONG',
      entryPrice: 2750,
      exitPrice: 2820,
      quantity: 8,
      entryDate: new Date('2025-05-05T10:30:00Z'),
      exitDate: new Date('2025-05-05T15:00:00Z'),
      profitLoss: 560,
      notes: 'Support bounce',
    },
    {
      symbol: 'HDFC',
      type: 'LONG',
      entryPrice: 1650,
      exitPrice: 1700,
      quantity: 12,
      entryDate: new Date('2025-05-08T09:45:00Z'),
      exitDate: new Date('2025-05-08T14:30:00Z'),
      profitLoss: 600,
      notes: 'Breakout trade',
    },
    {
      symbol: 'TCS',
      type: 'SHORT',
      entryPrice: 3600,
      exitPrice: 3550,
      quantity: 6,
      entryDate: new Date('2025-05-12T11:00:00Z'),
      exitDate: new Date('2025-05-12T15:15:00Z'),
      profitLoss: 300,
      notes: 'Resistance rejection',
    },
    {
      symbol: 'INFY',
      type: 'LONG',
      entryPrice: 1480,
      exitPrice: 1460,
      quantity: 15,
      entryDate: new Date('2025-05-18T10:15:00Z'),
      exitDate: new Date('2025-05-18T14:45:00Z'),
      profitLoss: -300,
      notes: 'Failed breakout',
    },
    {
      symbol: 'SBIN',
      type: 'LONG',
      entryPrice: 720,
      exitPrice: 740,
      quantity: 20,
      entryDate: new Date('2025-05-22T09:30:00Z'),
      exitDate: new Date('2025-05-22T15:30:00Z'),
      profitLoss: 400,
      notes: 'Trend continuation',
    },
    {
      symbol: 'BHARTIARTL',
      type: 'SHORT',
      entryPrice: 1200,
      exitPrice: 1180,
      quantity: 10,
      entryDate: new Date('2025-05-25T11:30:00Z'),
      exitDate: new Date('2025-05-25T15:00:00Z'),
      profitLoss: 200,
      notes: 'Overbought condition',
    },
    {
      symbol: 'RELIANCE',
      type: 'SHORT',
      entryPrice: 2900,
      exitPrice: 2950,
      quantity: 5,
      entryDate: new Date('2025-05-30T10:00:00Z'),
      exitDate: new Date('2025-05-30T14:00:00Z'),
      profitLoss: -250,
      notes: 'Failed resistance test',
    },
    // June trades (existing)
    {
      symbol: 'RELIANCE',
      type: 'LONG',
      entryPrice: 2850,
      exitPrice: 2950,
      quantity: 10,
      entryDate: new Date('2025-06-01T10:00:00Z'),
      exitDate: new Date('2025-06-01T14:30:00Z'),
      profitLoss: 1000,
      notes: 'Breakout trade',
    },
    {
      symbol: 'TCS',
      type: 'SHORT',
      entryPrice: 3700,
      exitPrice: 3650,
      quantity: 5,
      entryDate: new Date('2025-06-03T11:30:00Z'),
      exitDate: new Date('2025-06-03T15:45:00Z'),
      profitLoss: 250,
      notes: 'Earnings play',
    },
    {
      symbol: 'INFY',
      type: 'LONG',
      entryPrice: 1500,
      exitPrice: 1480,
      quantity: 20,
      entryDate: new Date('2025-06-05T09:45:00Z'),
      exitDate: new Date('2025-06-05T14:15:00Z'),
      profitLoss: -400,
      notes: 'Support bounce failed',
    },
    {
      symbol: 'RELIANCE',
      type: 'LONG',
      entryPrice: 2800,
      exitPrice: 2900,
      quantity: 15,
      entryDate: new Date('2025-06-10T10:15:00Z'),
      exitDate: new Date('2025-06-10T15:30:00Z'),
      profitLoss: 1500,
      notes: 'Trend following',
    },
    {
      symbol: 'TCS',
      type: 'SHORT',
      entryPrice: 3750,
      exitPrice: 3800,
      quantity: 8,
      entryDate: new Date('2025-06-15T11:00:00Z'),
      exitDate: new Date('2025-06-15T15:30:00Z'),
      profitLoss: -400,
      notes: 'Resistance test',
    },
    {
      symbol: 'INFY',
      type: 'LONG',
      entryPrice: 1520,
      exitPrice: 1560,
      quantity: 25,
      entryDate: new Date('2025-06-20T10:30:00Z'),
      exitDate: new Date('2025-06-20T14:45:00Z'),
      profitLoss: 1000,
      notes: 'Oversold bounce',
    },
    {
      symbol: 'RELIANCE',
      type: 'SHORT',
      entryPrice: 2950,
      exitPrice: 2900,
      quantity: 12,
      entryDate: new Date('2025-06-20T11:15:00Z'),
      exitDate: new Date('2025-06-20T15:00:00Z'),
      profitLoss: 600,
      notes: 'Overbought reversal',
    },
  ];
  
  console.log('Seeding database with sample trades...');
  
  for (const trade of trades) {
    await prisma.trade.create({
      data: trade,
    });
  }
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 