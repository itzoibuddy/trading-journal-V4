import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { performanceMonitor, getPerformanceHealth } from '../../lib/performance';
import { checkDatabaseConnection, getDatabaseStats } from '../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin access to performance data
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const timeWindow = parseInt(searchParams.get('timeWindow') || '300000'); // 5 minutes default

    switch (type) {
      case 'overview':
        const health = getPerformanceHealth();
        const dbConnected = await checkDatabaseConnection();
        const dbStats = await getDatabaseStats();
        
                 return NextResponse.json({
           health: health.status,
           issues: health.issues,
           database: {
             connected: dbConnected,
             users: dbStats.users,
             trades: dbStats.trades,
             error: dbStats.error
           },
           performance: health.stats,
           timestamp: new Date().toISOString()
         });

      case 'stats':
        const stats = performanceMonitor.getStats(timeWindow);
        return NextResponse.json({
          stats,
          timestamp: new Date().toISOString()
        });

      case 'slowest':
        const limit = parseInt(searchParams.get('limit') || '10');
        const slowest = performanceMonitor.getSlowestOperations(limit);
        return NextResponse.json({
          slowestOperations: slowest,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const healthCheck = getPerformanceHealth();
        return NextResponse.json({
          status: healthCheck.status,
          issues: healthCheck.issues,
          recommendations: generateRecommendations(healthCheck),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: overview, stats, slowest, or health' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to get performance data' },
      { status: 500 }
    );
  }
}

function generateRecommendations(healthCheck: any): string[] {
  const recommendations: string[] = [];

  if (healthCheck.stats.averageDuration > 1000) {
    recommendations.push('🚨 Critical: Average response time > 1s. Check database indexes and query optimization.');
  } else if (healthCheck.stats.averageDuration > 500) {
    recommendations.push('⚠️ Warning: Average response time > 500ms. Consider database optimization.');
  }

  if (healthCheck.stats.slowOperations > healthCheck.stats.totalOperations * 0.2) {
    recommendations.push('🔍 High percentage of slow operations. Review database connection pooling.');
  }

  if (healthCheck.stats.totalOperations === 0) {
    recommendations.push('ℹ️ No operations recorded. Performance monitoring is active but no data yet.');
  }

  const dbOps = Object.keys(healthCheck.stats.operationsByType).filter(op => op.startsWith('DB_'));
  const slowDbOps = dbOps.filter(op => healthCheck.stats.operationsByType[op].avgDuration > 500);
  
  if (slowDbOps.length > 0) {
    recommendations.push(`🗄️ Slow database operations detected: ${slowDbOps.join(', ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Performance looks good! Keep monitoring.');
  }

  return recommendations;
}

export const dynamic = 'force-dynamic'; 