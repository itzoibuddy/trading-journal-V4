import React from 'react';
import { Trade } from '../types/Trade';

export interface DailyInsight {
  type: 'alert' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Helper function to format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Generate daily actionable insights
export const generateDailyInsights = (trades: Trade[]): DailyInsight[] => {
  const completedTrades = trades.filter(t => t.profitLoss !== null && t.profitLoss !== undefined);
  if (completedTrades.length < 3) return [];

  const insights: DailyInsight[] = [];
  
  // 1. Performance Alert
  const recentTrades = completedTrades.slice(-5);
  const recentPnL = recentTrades.reduce((sum, t) => sum + t.profitLoss!, 0);
  
  if (recentPnL < -1000) {
    insights.push({
      type: 'alert',
      title: '🚨 Recent Performance Alert',
      message: `Your last 5 trades resulted in ₹${Math.abs(recentPnL).toFixed(0)} loss`,
      action: 'Consider reducing position size or taking a break to reset your mindset',
      priority: 'critical'
    });
  } else if (recentPnL > 1000) {
    insights.push({
      type: 'success',
      title: '🎉 Strong Recent Performance',
      message: `Your last 5 trades generated ₹${recentPnL.toFixed(0)} profit`,
      action: 'Great momentum! Stay disciplined and stick to your proven strategy',
      priority: 'medium'
    });
  }

  // 2. Win Rate Analysis
  const winningTrades = completedTrades.filter(t => t.profitLoss! > 0);
  const winRate = (winningTrades.length / completedTrades.length) * 100;
  
  if (winRate < 40) {
    insights.push({
      type: 'warning',
      title: '⚠️ Low Win Rate Alert',
      message: `Your win rate is ${winRate.toFixed(1)}%, which is below optimal levels`,
      action: 'Focus on improving trade selection criteria and wait for higher probability setups',
      priority: 'high'
    });
  }

  // 3. Risk-Reward Analysis
  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / winningTrades.length : 0;
  const losingTrades = completedTrades.filter(t => t.profitLoss! < 0);
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / losingTrades.length) : 0;
  
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  if (riskReward < 1.5) {
    insights.push({
      type: 'warning',
      title: '📉 Poor Risk-Reward Ratio',
      message: `Your risk-reward ratio is ${riskReward.toFixed(2)}:1, which is too low`,
      action: 'Set wider profit targets or tighter stop losses. Aim for at least 2:1 risk-reward',
      priority: 'high'
    });
  }

  // 4. Best Trading Time
  const hourlyPerformance = new Map<number, number>();
  completedTrades.forEach(trade => {
    const hour = new Date(trade.entryDate).getHours();
    const current = hourlyPerformance.get(hour) || 0;
    hourlyPerformance.set(hour, current + trade.profitLoss!);
  });

  let bestHour = 0;
  let bestPnL = Number.NEGATIVE_INFINITY;
  hourlyPerformance.forEach((pnl, hour) => {
    if (pnl > bestPnL) {
      bestPnL = pnl;
      bestHour = hour;
    }
  });

  if (hourlyPerformance.size >= 3) {
    insights.push({
      type: 'info',
      title: '⏰ Optimal Trading Hour',
      message: `You perform best at ${bestHour}:00 with ₹${bestPnL.toFixed(0)} total profit`,
      action: `Focus your trading activity around ${bestHour}:00 and avoid trading during poor-performing hours`,
      priority: 'medium'
    });
  }

  // 5. Strategy Performance
  const strategyPerformance = new Map<string, { total: number, count: number }>();
  completedTrades.filter(t => t.strategy).forEach(trade => {
    const strategy = trade.strategy!;
    const current = strategyPerformance.get(strategy) || { total: 0, count: 0 };
    current.total += trade.profitLoss!;
    current.count += 1;
    strategyPerformance.set(strategy, current);
  });

  if (strategyPerformance.size > 1) {
    let bestStrategy = '';
    let bestAvg = Number.NEGATIVE_INFINITY;
    strategyPerformance.forEach((data, strategy) => {
      const avg = data.total / data.count;
      if (avg > bestAvg && data.count >= 2) {
        bestAvg = avg;
        bestStrategy = strategy;
      }
    });

    if (bestStrategy) {
      insights.push({
        type: 'success',
        title: '🚀 Top Performing Strategy',
        message: `Your "${bestStrategy}" strategy is generating the best average returns`,
        action: `Consider allocating more capital to "${bestStrategy}" trades and study what makes them successful`,
        priority: 'medium'
      });
    }
  }

  return insights.slice(0, 6); // Return top 6 insights
};

// Utility functions for styling
export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600 bg-green-100';
  if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getInsightIcon = (type: string): React.ReactElement | null => {
  switch (type) {
    case 'strength':
      return (
        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'weakness':
      return (
        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'bias':
      return (
        <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'opportunity':
      return (
        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return null;
  }
}; 