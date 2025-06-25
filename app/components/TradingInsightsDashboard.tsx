'use client';

import { useState, useEffect } from 'react';
import { Trade } from '../types/Trade';

interface InsightCard {
  id: string;
  title: string;
  insight: string;
  action: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  priority: 'high' | 'medium' | 'low';
}

interface TradingInsightsDashboardProps {
  trades: Trade[];
}

export default function TradingInsightsDashboard({ trades }: TradingInsightsDashboardProps) {
  const [insights, setInsights] = useState<InsightCard[]>([]);

  useEffect(() => {
    if (trades && trades.length > 0) {
      const generatedInsights = generatePracticalInsights(trades);
      setInsights(generatedInsights);
    }
  }, [trades]);

  const generatePracticalInsights = (trades: Trade[]): InsightCard[] => {
    const completedTrades = trades.filter(t => t.profitLoss !== null && t.profitLoss !== undefined);
    if (completedTrades.length < 3) return [];

    const insights: InsightCard[] = [];

    // 1. Win Rate Analysis
    const winningTrades = completedTrades.filter(t => t.profitLoss! > 0);
    const winRate = (winningTrades.length / completedTrades.length) * 100;
    
    if (winRate < 40) {
      insights.push({
        id: 'low-win-rate',
        title: '⚠️ Low Win Rate Alert',
        insight: `Your win rate is ${winRate.toFixed(1)}%, which is below optimal levels.`,
        action: 'Focus on improving trade selection criteria and wait for higher probability setups.',
        type: 'danger',
        priority: 'high'
      });
    } else if (winRate > 70) {
      insights.push({
        id: 'high-win-rate',
        title: '🎯 Excellent Win Rate',
        insight: `Your win rate of ${winRate.toFixed(1)}% is excellent!`,
        action: 'Consider increasing position sizes slightly to maximize this edge.',
        type: 'success',
        priority: 'medium'
      });
    }

    // 2. Risk-Reward Analysis
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / winningTrades.length : 0;
    const losingTrades = completedTrades.filter(t => t.profitLoss! < 0);
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / losingTrades.length) : 0;
    
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    if (riskReward < 1.5) {
      insights.push({
        id: 'poor-risk-reward',
        title: '📉 Poor Risk-Reward Ratio',
        insight: `Your risk-reward ratio is ${riskReward.toFixed(2)}:1, which is too low.`,
        action: 'Set wider profit targets or tighter stop losses. Aim for at least 2:1 risk-reward.',
        type: 'warning',
        priority: 'high'
      });
    }

    // 3. Time-based Performance
    const hourlyPerformance = new Map<number, number>();
    completedTrades.forEach(trade => {
      const hour = new Date(trade.entryDate).getHours();
      const current = hourlyPerformance.get(hour) || 0;
      hourlyPerformance.set(hour, current + trade.profitLoss!);
    });

    let bestHour = 0;
    let bestPnL = Number.NEGATIVE_INFINITY;
    let worstHour = 0;
    let worstPnL = Number.POSITIVE_INFINITY;

    hourlyPerformance.forEach((pnl, hour) => {
      if (pnl > bestPnL) {
        bestPnL = pnl;
        bestHour = hour;
      }
      if (pnl < worstPnL) {
        worstPnL = pnl;
        worstHour = hour;
      }
    });

    if (hourlyPerformance.size >= 3) {
      insights.push({
        id: 'time-performance',
        title: '⏰ Optimal Trading Hours',
        insight: `You perform best at ${bestHour}:00 (₹${bestPnL.toFixed(0)} total) and worst at ${worstHour}:00.`,
        action: `Focus your trading activity around ${bestHour}:00 and avoid trading at ${worstHour}:00.`,
        type: 'info',
        priority: 'medium'
      });
    }

    // 4. Strategy Performance
    const strategyPerformance = new Map<string, { total: number, trades: number }>();
    completedTrades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      const current = strategyPerformance.get(strategy) || { total: 0, trades: 0 };
      current.total += trade.profitLoss!;
      current.trades += 1;
      strategyPerformance.set(strategy, current);
    });

    if (strategyPerformance.size > 1) {
      let bestStrategy = '';
      let bestAvg = Number.NEGATIVE_INFINITY;
      strategyPerformance.forEach((data, strategy) => {
        const avg = data.total / data.trades;
        if (avg > bestAvg && data.trades >= 2) {
          bestAvg = avg;
          bestStrategy = strategy;
        }
      });

      if (bestStrategy) {
        insights.push({
          id: 'best-strategy',
          title: '🚀 Top Performing Strategy',
          insight: `Your "${bestStrategy}" strategy is generating the best average returns.`,
          action: `Consider allocating more capital to "${bestStrategy}" trades and study what makes them successful.`,
          type: 'success',
          priority: 'medium'
        });
      }
    }

    // 5. Emotional State Analysis
    const emotionalTrades = completedTrades.filter(t => t.preTradeEmotion);
    if (emotionalTrades.length >= 5) {
      const emotionPerformance = new Map<string, number[]>();
      emotionalTrades.forEach(trade => {
        const emotion = trade.preTradeEmotion!;
        if (!emotionPerformance.has(emotion)) {
          emotionPerformance.set(emotion, []);
        }
        emotionPerformance.get(emotion)!.push(trade.profitLoss!);
      });

      let bestEmotion = '';
      let bestEmotionAvg = Number.NEGATIVE_INFINITY;
      emotionPerformance.forEach((pnls, emotion) => {
        const avg = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length;
        if (avg > bestEmotionAvg && pnls.length >= 2) {
          bestEmotionAvg = avg;
          bestEmotion = emotion;
        }
      });

      if (bestEmotion) {
        insights.push({
          id: 'emotional-state',
          title: '🧠 Emotional State Impact',
          insight: `You trade best when feeling "${bestEmotion}" (avg: ₹${bestEmotionAvg.toFixed(0)} per trade).`,
          action: `Monitor your emotional state before trading. Only trade when you feel "${bestEmotion}" or similar.`,
          type: 'info',
          priority: 'low'
        });
      }
    }

    // 6. Recent Performance Trend
    const recentTrades = completedTrades.slice(-10);
    const recentPnL = recentTrades.reduce((sum, t) => sum + t.profitLoss!, 0);
    
    if (recentTrades.length >= 5) {
      if (recentPnL < 0) {
        insights.push({
          id: 'negative-streak',
          title: '📉 Recent Losing Streak',
          insight: `Your last 10 trades resulted in ₹${recentPnL.toFixed(0)} loss.`,
          action: 'Consider reducing position size, reviewing your strategy, or taking a short break to reset.',
          type: 'danger',
          priority: 'high'
        });
      } else if (recentPnL > 0) {
        insights.push({
          id: 'positive-streak',
          title: '📈 Recent Winning Streak',
          insight: `Your last 10 trades generated ₹${recentPnL.toFixed(0)} profit.`,
          action: 'Great momentum! Stay disciplined and stick to your proven strategy.',
          type: 'success',
          priority: 'low'
        });
      }
    }

    // 7. Position Sizing Analysis
    const avgPositionSize = completedTrades.reduce((sum, t) => sum + (t.quantity * t.entryPrice), 0) / completedTrades.length;
    const largeTrades = completedTrades.filter(t => (t.quantity * t.entryPrice) > avgPositionSize * 1.5);
    const largeTradesPnL = largeTrades.reduce((sum, t) => sum + t.profitLoss!, 0);
    
    if (largeTrades.length >= 3) {
      if (largeTradesPnL < 0) {
        insights.push({
          id: 'position-sizing',
          title: '⚠️ Large Position Risk',
          insight: `Your larger positions (above ₹${avgPositionSize.toFixed(0)}) are losing money.`,
          action: 'Reduce position sizes until you improve your accuracy. Risk management is key.',
          type: 'warning',
          priority: 'high'
        });
      }
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'danger':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'info':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">LOW</span>;
      default:
        return null;
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Trading Insights</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="mt-2 text-lg font-medium text-gray-900">Generate Insights</h4>
          <p className="mt-1 text-sm text-gray-500">
            Add at least 3 completed trades to get personalized trading insights and recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">📊 Today's Trading Insights</h3>
        <span className="text-sm text-gray-500">{insights.length} insights found</span>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg ${getInsightStyle(insight.type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              {getPriorityBadge(insight.priority)}
            </div>
            <p className="text-gray-700 mb-3">{insight.insight}</p>
            <div className="bg-white bg-opacity-50 rounded-md p-3">
              <h5 className="text-sm font-medium text-gray-900 mb-1">💡 Recommended Action:</h5>
              <p className="text-sm text-gray-700">{insight.action}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Insights update automatically as you add new trades. Focus on high-priority recommendations first.
        </p>
      </div>
    </div>
  );
} 