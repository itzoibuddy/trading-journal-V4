/**
 * Performance monitoring utility for tracking database and API performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  // Track a database operation
  trackOperation<T>(
    name: string, 
    operation: () => Promise<T>, 
    metadata?: any
  ): Promise<T> {
    const start = performance.now();
    
    return operation()
      .then(result => {
        this.recordMetric(name, start, metadata);
        return result;
      })
      .catch(error => {
        this.recordMetric(`${name}_ERROR`, start, { error: error instanceof Error ? error.message : String(error), ...metadata });
        throw error;
      });
  }

  // Track a synchronous operation
  trackSync<T>(
    name: string, 
    operation: () => T, 
    metadata?: any
  ): T {
    const start = performance.now();
    
    try {
      const result = operation();
      this.recordMetric(name, start, metadata);
      return result;
    } catch (error) {
      this.recordMetric(`${name}_ERROR`, start, { error: error instanceof Error ? error.message : String(error), ...metadata });
      throw error;
    }
  }

  private recordMetric(name: string, startTime: number, metadata?: any) {
    const duration = performance.now() - startTime;
    
    // Only log slow operations in development
    if (process.env.NODE_ENV !== 'production' && duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    // Log critical slow operations in production
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      console.error(`🚨 Critical slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  // Get performance statistics
  getStats(timeWindowMs: number = 5 * 60 * 1000) { // Default: 5 minutes
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
        operationsByType: {},
        timeWindow: `${timeWindowMs / 1000}s`
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / recentMetrics.length;
    const slowOperations = recentMetrics.filter(m => m.duration > 500).length;

    // Group by operation type
    const operationsByType: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};
    
    recentMetrics.forEach(metric => {
      if (!operationsByType[metric.name]) {
        operationsByType[metric.name] = { count: 0, avgDuration: 0, maxDuration: 0 };
      }
      operationsByType[metric.name].count++;
      operationsByType[metric.name].maxDuration = Math.max(
        operationsByType[metric.name].maxDuration, 
        metric.duration
      );
    });

    // Calculate averages
    Object.keys(operationsByType).forEach(opType => {
      const ops = recentMetrics.filter(m => m.name === opType);
      const total = ops.reduce((sum, m) => sum + m.duration, 0);
      operationsByType[opType].avgDuration = total / ops.length;
    });

    return {
      totalOperations: recentMetrics.length,
      averageDuration: Math.round(averageDuration * 100) / 100,
      slowOperations,
      operationsByType,
      timeWindow: `${timeWindowMs / 1000}s`
    };
  }

  // Get the slowest operations
  getSlowestOperations(limit: number = 10) {
    return this.metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(m => ({
        name: m.name,
        duration: Math.round(m.duration * 100) / 100,
        timestamp: new Date(m.timestamp).toISOString(),
        metadata: m.metadata
      }));
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function for database operations
export function trackDatabaseOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: any
): Promise<T> {
  return performanceMonitor.trackOperation(`DB_${operationName}`, operation, metadata);
}

// Helper function for API operations
export function trackApiOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: any
): Promise<T> {
  return performanceMonitor.trackOperation(`API_${operationName}`, operation, metadata);
}

// Performance health check
export function getPerformanceHealth() {
  const stats = performanceMonitor.getStats();
  
  let healthStatus = 'healthy';
  const issues: string[] = [];

  if (stats.averageDuration > 500) {
    healthStatus = 'degraded';
    issues.push(`High average response time: ${stats.averageDuration}ms`);
  }

  if (stats.slowOperations > stats.totalOperations * 0.1) {
    healthStatus = 'degraded';
    issues.push(`High percentage of slow operations: ${Math.round((stats.slowOperations / stats.totalOperations) * 100)}%`);
  }

  if (stats.averageDuration > 1000) {
    healthStatus = 'critical';
  }

  return {
    status: healthStatus,
    issues,
    stats
  };
}

// Production Performance Optimizations
export class ProductionOptimizer {
  private static instance: ProductionOptimizer;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public static getInstance(): ProductionOptimizer {
    if (!ProductionOptimizer.instance) {
      ProductionOptimizer.instance = new ProductionOptimizer();
    }
    return ProductionOptimizer.instance;
  }

  // Query Result Caching
  public getCachedQuery(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }
    this.queryCache.delete(key);
    return null;
  }

  public setCachedQuery(key: string, data: any, ttlMs: number = 300000): void { // 5 min default
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    // Clean old cache entries periodically
    if (this.queryCache.size > 100) {
      this.cleanCache();
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  // Rate Limiting
  public checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const limit = this.rateLimitMap.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  // Memory Usage Monitoring
  public getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  // Performance Recommendations
  public getOptimizationRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.avgResponseTime && metrics.avgResponseTime > 2000) {
      recommendations.push("Consider implementing query result caching for frequently accessed data");
      recommendations.push("Review database indexes for slow queries");
    }

    if (metrics.errorRate && metrics.errorRate > 0.05) {
      recommendations.push("High error rate detected - implement better error handling and monitoring");
    }

    if (metrics.dbQueries && metrics.dbQueries.some && metrics.dbQueries.some((q: any) => q.duration > 1000)) {
      recommendations.push("Optimize slow database queries (>1s execution time)");
      recommendations.push("Consider implementing pagination for large result sets");
    }

    const memUsage = this.getMemoryUsage();
    if (memUsage.heapUsed > 512 * 1024 * 1024) { // 512MB
      recommendations.push("High memory usage detected - implement memory monitoring and cleanup");
    }

    return recommendations;
  }
}

// Enhanced Performance Metrics for Production
export interface ProductionMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cacheHitRate: number;
  rateLimitViolations: number;
  optimizationScore: number;
  recommendations: string[];
  avgResponseTime?: number;
  errorRate?: number;
  dbQueries?: any[];
} 