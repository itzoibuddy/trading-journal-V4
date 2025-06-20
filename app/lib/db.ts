import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma client with production optimizations
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        try {
          return await query(args);
        } catch (error: any) {
          // Only log errors, not warnings in production
          if (process.env.NODE_ENV !== 'production') {
            console.error(`Database error in ${model}.${operation}:`, error.message);
          }
          
          // Re-throw the error for proper error handling
          throw new Error(`Database operation failed: ${model}.${operation}`);
        } finally {
          const end = performance.now();
          const time = end - start;
          
          // Only warn about slow queries in development
          if (process.env.NODE_ENV !== 'production' && time > 100) {
            console.warn(`Slow query detected: ${model}.${operation} took ${time.toFixed(2)}ms`);
          }
          
          // Log critical slow queries in production (>1000ms)
          if (process.env.NODE_ENV === 'production' && time > 1000) {
            console.error(`Critical slow query: ${model}.${operation} took ${time.toFixed(2)}ms`);
          }
        }
      },
    },
  });
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown handling
if (typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
} 