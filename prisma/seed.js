const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.trade.deleteMany();
  
  // Sample trade data
  const trades = [
    {
      symbol: 'RELIANCE',
      type: 'LONG',
      entryPrice: 2850,
      exitPrice: 2950,
      quantity: 10,
      entryDate: new Date('2024-06-01T10:00:00Z'),
      exitDate: new Date('2024-06-01T14:30:00Z'),
      profitLoss: 1000,
      notes: 'Breakout trade',
    },
    {
      symbol: 'TCS',
      type: 'SHORT',
      entryPrice: 3700,
      exitPrice: 3650,
      quantity: 5,
      entryDate: new Date('2024-06-03T11:30:00Z'),
      exitDate: new Date('2024-06-03T15:45:00Z'),
      profitLoss: 250,
      notes: 'Earnings play',
    },
    {
      symbol: 'INFY',
      type: 'LONG',
      entryPrice: 1500,
      exitPrice: 1480,
      quantity: 20,
      entryDate: new Date('2024-06-05T09:45:00Z'),
      exitDate: new Date('2024-06-05T14:15:00Z'),
      profitLoss: -400,
      notes: 'Support bounce failed',
    },
    {
      symbol: 'RELIANCE',
      type: 'LONG',
      entryPrice: 2800,
      exitPrice: 2900,
      quantity: 15,
      entryDate: new Date('2024-06-10T10:15:00Z'),
      exitDate: new Date('2024-06-10T15:30:00Z'),
      profitLoss: 1500,
      notes: 'Trend following',
    },
    {
      symbol: 'TCS',
      type: 'SHORT',
      entryPrice: 3750,
      exitPrice: 3800,
      quantity: 8,
      entryDate: new Date('2024-06-15T11:00:00Z'),
      exitDate: new Date('2024-06-15T15:30:00Z'),
      profitLoss: -400,
      notes: 'Resistance test',
    },
    {
      symbol: 'INFY',
      type: 'LONG',
      entryPrice: 1520,
      exitPrice: 1560,
      quantity: 25,
      entryDate: new Date('2024-06-20T10:30:00Z'),
      exitDate: new Date('2024-06-20T14:45:00Z'),
      profitLoss: 1000,
      notes: 'Oversold bounce',
    },
    {
      symbol: 'RELIANCE',
      type: 'SHORT',
      entryPrice: 2950,
      exitPrice: 2900,
      quantity: 12,
      entryDate: new Date('2024-06-20T11:15:00Z'),
      exitDate: new Date('2024-06-20T15:00:00Z'),
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