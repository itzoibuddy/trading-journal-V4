import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's trades from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trades = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        entryDate: {
          gte: thirtyDaysAgo
        },
        profitLoss: {
          not: null
        }
      },
      orderBy: {
        entryDate: 'desc'
      }
    });

    if (trades.length < 3) {
      return NextResponse.json({
        insights: [],
        message: 'Add more trades to get personalized insights'
      });
    }

    const insights = generateQuickInsights(trades);

    return NextResponse.json({
      insights,
      tradesAnalyzed: trades.length,
      timeframe: '30 days'
    });

  } catch (error) {
    console.error('Error generating quick insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

interface QuickInsight {
  type: string;
  title: string;
  message: string;
  action: string;
  priority: string;
}

function generateQuickInsights(trades: any[]): QuickInsight[] {
  const insights: QuickInsight[] = [];
  
  // 1. Win Rate Insight
  const winningTrades = trades.filter(t => t.profitLoss > 0);
  const winRate = (winningTrades.length / trades.length) * 100;
  
  if (winRate < 40) {
    insights.push({
      type: 'alert',
      title: 'Low Win Rate Alert',
      message: `Your win rate is ${winRate.toFixed(1)}%. Focus on better trade selection.`,
      action: 'Review entry criteria and wait for higher probability setups',
      priority: 'high'
    });
  } else if (winRate > 70) {
    insights.push({
      type: 'success',
      title: 'Excellent Win Rate',
      message: `Your win rate of ${winRate.toFixed(1)}% is outstanding!`,
      action: 'Consider slightly increasing position sizes to capitalize on this edge',
      priority: 'medium'
    });
  }

  // 2. Risk-Reward Analysis
  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) / winningTrades.length : 0;
  const losingTrades = trades.filter(t => t.profitLoss < 0);
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0) / losingTrades.length) : 0;
  
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  if (riskReward < 1.5) {
    insights.push({
      type: 'warning',
      title: 'Poor Risk-Reward Ratio',
      message: `Your risk-reward ratio is ${riskReward.toFixed(2)}:1`,
      action: 'Set wider profit targets or tighter stop losses. Aim for 2:1 minimum',
      priority: 'high'
    });
  }

  // 3. Recent Performance Trend
  const recentTrades = trades.slice(0, 5); // Last 5 trades
  const recentPnL = recentTrades.reduce((sum, t) => sum + t.profitLoss, 0);
  
  if (recentPnL < -1000) {
    insights.push({
      type: 'alert',
      title: 'Recent Losing Streak',
      message: `Your last 5 trades resulted in ₹${Math.abs(recentPnL).toFixed(0)} loss`,
      action: 'Consider reducing position size or taking a break to reset',
      priority: 'critical'
    });
  }

  // 4. Best Trading Time
  const hourlyPerformance = new Map();
  trades.forEach(trade => {
    const hour = new Date(trade.entryDate).getHours();
    const current = hourlyPerformance.get(hour) || { profit: 0, count: 0 };
    current.profit += trade.profitLoss;
    current.count += 1;
    hourlyPerformance.set(hour, current);
  });

  let bestHour = 0;
  let bestProfit = Number.NEGATIVE_INFINITY;
  hourlyPerformance.forEach((data, hour) => {
    if (data.profit > bestProfit && data.count >= 2) {
      bestProfit = data.profit;
      bestHour = hour;
    }
  });

  if (hourlyPerformance.size >= 3) {
    insights.push({
      type: 'info',
      title: 'Optimal Trading Hour',
      message: `You perform best at ${bestHour}:00 with ₹${bestProfit.toFixed(0)} total profit`,
      action: `Focus your trading activity around ${bestHour}:00`,
      priority: 'medium'
    });
  }

  // 5. Strategy Performance
  const strategyMap = new Map();
  trades.filter(t => t.strategy).forEach(trade => {
    const strategy = trade.strategy;
    const current = strategyMap.get(strategy) || { profit: 0, count: 0 };
    current.profit += trade.profitLoss;
    current.count += 1;
    strategyMap.set(strategy, current);
  });

  if (strategyMap.size > 1) {
    let bestStrategy = '';
    let bestAvg = Number.NEGATIVE_INFINITY;
    strategyMap.forEach((data, strategy) => {
      const avg = data.profit / data.count;
      if (avg > bestAvg && data.count >= 2) {
        bestAvg = avg;
        bestStrategy = strategy;
      }
    });

    if (bestStrategy) {
      insights.push({
        type: 'success',
        title: 'Top Performing Strategy',
        message: `"${bestStrategy}" is your most profitable strategy`,
        action: `Focus more capital on "${bestStrategy}" setups`,
        priority: 'medium'
      });
    }
  }

  return insights.slice(0, 5); // Return top 5 insights
}

export const dynamic = 'force-dynamic'; 