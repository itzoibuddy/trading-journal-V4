import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma client with production optimizations
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    // Add connection pooling and timeout configurations
    ...(process.env.NODE_ENV === 'production' && {
      // Production optimizations
      transactionOptions: {
        maxWait: 5000, // default: 2000
        timeout: 10000, // default: 5000
      },
    }),
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const maxRetries = 3;
        let lastError: any;

        // Retry logic for database operations
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await query(args);
            
            // Log successful retry if it's not the first attempt
            if (attempt > 1) {
              console.log(`Database operation ${model}.${operation} succeeded on attempt ${attempt}`);
            }
            
            return result;
          } catch (error: any) {
            lastError = error;
            
            // Only retry on connection/timeout errors
            const isRetryableError = 
              error.code === 'P1001' || // Can't reach database server
              error.code === 'P1008' || // Operations timed out
              error.code === 'P1017' || // Server has closed the connection
              error.message?.includes('Connection') ||
              error.message?.includes('timeout') ||
              error.message?.includes('ECONNRESET');

            if (attempt < maxRetries && isRetryableError) {
              console.warn(`Database operation ${model}.${operation} failed on attempt ${attempt}, retrying...`);
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              continue;
            }
            
            // Don't retry, throw the error
            break;
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
        }

        // Log the final error details
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Database error in ${model}.${operation}:`, lastError.message);
        }
        
        // Re-throw the error for proper error handling
        throw new Error(`Database operation failed: ${model}.${operation} - ${lastError.message}`);
      },
    },
  });
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Fix memory leak: Only add listeners once
let listenersAdded = false;

// Graceful shutdown handling
if (typeof window === 'undefined' && !listenersAdded) {
  // Set max listeners to prevent warning
  process.setMaxListeners(15);
  
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing database connections...`);
    try {
      await prisma.$disconnect();
      console.log('Database connections closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  listenersAdded = true;
}

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Export a function to get database stats for monitoring
export const getDatabaseStats = async () => {
  try {
    const [userCount, tradeCount] = await Promise.all([
      prisma.user.count(),
      prisma.trade.count()
    ]);
    
    return {
      users: userCount,
      trades: tradeCount,
      connected: true
    };
  } catch (error) {
    return {
      users: 0,
      trades: 0,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 