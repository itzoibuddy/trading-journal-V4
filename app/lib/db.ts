import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma client with connection retry logic
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        try {
          return await query(args);
        } catch (error: any) {
          console.error(`Database error in ${model}.${operation}:`, error.message);
          throw error;
        } finally {
          const end = performance.now();
          const time = end - start;
          if (time > 100) {
            console.warn(`Slow query detected: ${model}.${operation} took ${time.toFixed(2)}ms`);
          }
        }
      },
    },
  });
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 