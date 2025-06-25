/**
 * Environment variable validation
 * This file validates all required environment variables at startup
 */

export const validateEnv = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file or environment configuration.`
    );
  }

  // Validate DATABASE_URL format and add connection pooling
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.warn(
      'WARNING: DATABASE_URL should start with postgresql:// or postgres:// for production use. ' +
      'SQLite is not recommended for production.'
    );
  }

  // Add connection pooling parameters to DATABASE_URL if not present
  const optimizedDatabaseUrl = addConnectionPoolingParams(dbUrl || '');

  return {
    databaseUrl: optimizedDatabaseUrl,
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
};

/**
 * Add connection pooling parameters to DATABASE_URL for better performance
 */
const addConnectionPoolingParams = (dbUrl: string): string => {
  if (!dbUrl || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
    return dbUrl;
  }

  try {
    const url = new URL(dbUrl);
    
    // Production connection pooling settings
    if (process.env.NODE_ENV === 'production') {
      // Remove existing pooling params to avoid duplicates
      url.searchParams.delete('connection_limit');
      url.searchParams.delete('pool_timeout');
      url.searchParams.delete('connect_timeout');
      url.searchParams.delete('socket_timeout');
      url.searchParams.delete('statement_cache_size');
      
      // Add optimized connection pooling for production
      url.searchParams.set('connection_limit', '5'); // Limit concurrent connections
      url.searchParams.set('pool_timeout', '30'); // Connection pool timeout (seconds)
      url.searchParams.set('connect_timeout', '10'); // Initial connection timeout (seconds)
      url.searchParams.set('socket_timeout', '30'); // Socket timeout (seconds)
      url.searchParams.set('statement_cache_size', '100'); // Statement cache for prepared statements
    } else {
      // Development settings (more relaxed)
      url.searchParams.delete('connection_limit');
      url.searchParams.delete('pool_timeout');
      url.searchParams.delete('connect_timeout');
      url.searchParams.delete('socket_timeout');
      
      url.searchParams.set('connection_limit', '3');
      url.searchParams.set('pool_timeout', '20');
      url.searchParams.set('connect_timeout', '5');
      url.searchParams.set('socket_timeout', '20');
    }

    return url.toString();
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL for optimization:', error);
    return dbUrl;
  }
};

// Validate environment variables on module load
if (typeof window === 'undefined') {
  try {
    const env = validateEnv();
    
    // Update the DATABASE_URL environment variable with optimized version
    process.env.DATABASE_URL = env.databaseUrl;
    
    console.log('✅ Environment validation passed');
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Database URL optimized for development with connection pooling');
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
} 