'use client';

import { useState, useEffect } from 'react';
import { Trade } from '../types/Trade';

interface Recommendation {
  id: string;
  category: 'timing' | 'risk' | 'strategy' | 'psychology' | 'technical';
  title: string;
  description: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  basedOn: string[];
}

interface SmartTradingRecommendationsProps {
  trades: Trade[];
}

export default function SmartTradingRecommendations({ trades }: SmartTradingRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (trades && trades.length > 0) {
      const smartRecommendations = generateSmartRecommendations(trades);
      setRecommendations(smartRecommendations);
    }
  }, [trades]);

  const generateSmartRecommendations = (trades: Trade[]): Recommendation[] => {
    const completedTrades = trades.filter(t => t.profitLoss !== null && t.profitLoss !== undefined);
    if (completedTrades.length < 5) return [];

    const recommendations: Recommendation[] = [];

    // 1. Timing Analysis
    const timingRecommendations = analyzeTimingPatterns(completedTrades);
    recommendations.push(...timingRecommendations);

    // 2. Risk Management Analysis
    const riskRecommendations = analyzeRiskManagement(completedTrades);
    recommendations.push(...riskRecommendations);

    // 3. Strategy Optimization
    const strategyRecommendations = analyzeStrategyPerformance(completedTrades);
    recommendations.push(...strategyRecommendations);

    // 4. Psychological Patterns
    const psychologyRecommendations = analyzePsychologicalPatterns(completedTrades);
    recommendations.push(...psychologyRecommendations);

    // 5. Technical Analysis
    const technicalRecommendations = analyzeTechnicalPatterns(completedTrades);
    recommendations.push(...technicalRecommendations);

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const analyzeTimingPatterns = (trades: Trade[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Day of week analysis
    const dayPerformance = new Map<number, { profit: number, count: number }>();
    trades.forEach(trade => {
      const day = new Date(trade.entryDate).getDay();
      const current = dayPerformance.get(day) || { profit: 0, count: 0 };
      current.profit += trade.profitLoss!;
      current.count += 1;
      dayPerformance.set(day, current);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = 0;
    let worstDay = 0;
    let bestAvg = Number.NEGATIVE_INFINITY;
    let worstAvg = Number.POSITIVE_INFINITY;

    dayPerformance.forEach((data, day) => {
      const avg = data.profit / data.count;
      if (avg > bestAvg && data.count >= 2) {
        bestAvg = avg;
        bestDay = day;
      }
      if (avg < worstAvg && data.count >= 2) {
        worstAvg = avg;
        worstDay = day;
      }
    });

    if (dayPerformance.size >= 3) {
      recommendations.push({
        id: 'best-trading-day',
        category: 'timing',
        title: `🗓️ Optimal Trading Day: ${dayNames[bestDay]}`,
        description: `You perform best on ${dayNames[bestDay]}s with an average return of ₹${bestAvg.toFixed(0)} per trade.`,
        action: `Schedule your most important trades for ${dayNames[bestDay]}s. Increase position sizes on this day.`,
        priority: 'medium',
        impact: 'Increase profitability by 15-25%',
        basedOn: [`${dayPerformance.get(bestDay)?.count} trades analyzed`, 'Day-of-week performance pattern']
      });

      if (worstAvg < -500) {
        recommendations.push({
          id: 'avoid-trading-day',
          category: 'timing',
          title: `⚠️ Avoid Trading on ${dayNames[worstDay]}s`,
          description: `${dayNames[worstDay]}s show poor performance with average loss of ₹${Math.abs(worstAvg).toFixed(0)} per trade.`,
          action: `Consider avoiding new positions on ${dayNames[worstDay]}s or reduce position sizes significantly.`,
          priority: 'high',
          impact: 'Reduce losses by 20-30%',
          basedOn: [`${dayPerformance.get(worstDay)?.count} trades analyzed`, 'Consistent underperformance pattern']
        });
      }
    }

    return recommendations;
  };

  const analyzeRiskManagement = (trades: Trade[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Position sizing analysis
    const positionSizes = trades.map(t => t.quantity * t.entryPrice);
    const avgPosition = positionSizes.reduce((sum, pos) => sum + pos, 0) / positionSizes.length;
    const maxPosition = Math.max(...positionSizes);
    const minPosition = Math.min(...positionSizes);

    if (maxPosition > avgPosition * 3) {
      recommendations.push({
        id: 'position-sizing-warning',
        category: 'risk',
        title: '⚠️ Inconsistent Position Sizing',
        description: `Your largest position (₹${maxPosition.toFixed(0)}) is ${(maxPosition/avgPosition).toFixed(1)}x your average size.`,
        action: 'Implement a consistent position sizing rule. Risk no more than 2-3% of capital per trade.',
        priority: 'critical',
        impact: 'Reduce portfolio volatility by 40%',
        basedOn: ['Position size variance analysis', 'Risk management best practices']
      });
    }

    // Stop loss analysis
    const tradesWithStopLoss = trades.filter(t => t.stopLoss !== null && t.stopLoss !== undefined);
    const stopLossUsage = (tradesWithStopLoss.length / trades.length) * 100;

    if (stopLossUsage < 50) {
      recommendations.push({
        id: 'stop-loss-usage',
        category: 'risk',
        title: '🛑 Increase Stop Loss Usage',
        description: `Only ${stopLossUsage.toFixed(0)}% of your trades have defined stop losses.`,
        action: 'Set stop losses for ALL trades before entry. Use 2-3% risk per trade as a guideline.',
        priority: 'critical',
        impact: 'Reduce maximum drawdown by 50%',
        basedOn: [`${tradesWithStopLoss.length} out of ${trades.length} trades with stop loss`]
      });
    }

    return recommendations;
  };

  const analyzeStrategyPerformance = (trades: Trade[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    const strategyPerformance = new Map<string, { trades: Trade[], totalPnL: number, winRate: number }>();
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      if (!strategyPerformance.has(strategy)) {
        strategyPerformance.set(strategy, { trades: [], totalPnL: 0, winRate: 0 });
      }
      const data = strategyPerformance.get(strategy)!;
      data.trades.push(trade);
      data.totalPnL += trade.profitLoss!;
    });

    // Calculate win rates
    strategyPerformance.forEach((data, strategy) => {
      const winningTrades = data.trades.filter(t => t.profitLoss! > 0).length;
      data.winRate = (winningTrades / data.trades.length) * 100;
    });

    let bestStrategy = '';
    let worstStrategy = '';
    let bestPerformance = Number.NEGATIVE_INFINITY;
    let worstPerformance = Number.POSITIVE_INFINITY;

    strategyPerformance.forEach((data, strategy) => {
      if (data.trades.length >= 3) {
        const avgReturn = data.totalPnL / data.trades.length;
        if (avgReturn > bestPerformance) {
          bestPerformance = avgReturn;
          bestStrategy = strategy;
        }
        if (avgReturn < worstPerformance) {
          worstPerformance = avgReturn;
          worstStrategy = strategy;
        }
      }
    });

    if (bestStrategy && strategyPerformance.size > 1) {
      const bestData = strategyPerformance.get(bestStrategy)!;
      recommendations.push({
        id: 'focus-best-strategy',
        category: 'strategy',
        title: `🚀 Focus on "${bestStrategy}" Strategy`,
        description: `Your "${bestStrategy}" strategy shows the best performance with ₹${bestPerformance.toFixed(0)} average return and ${bestData.winRate.toFixed(0)}% win rate.`,
        action: `Allocate 60-70% of your trading capital to "${bestStrategy}" setups. Study what makes these trades successful.`,
        priority: 'high',
        impact: 'Increase overall profitability by 30%',
        basedOn: [`${bestData.trades.length} trades analyzed`, 'Comparative strategy performance']
      });
    }

    if (worstStrategy && worstPerformance < -200) {
      const worstData = strategyPerformance.get(worstStrategy)!;
      recommendations.push({
        id: 'avoid-worst-strategy',
        category: 'strategy',
        title: `⛔ Reconsider "${worstStrategy}" Strategy`,
        description: `"${worstStrategy}" shows poor performance with ₹${Math.abs(worstPerformance).toFixed(0)} average loss.`,
        action: `Either completely avoid "${worstStrategy}" trades or significantly reduce position sizes until you can improve the approach.`,
        priority: 'high',
        impact: 'Eliminate major loss source',
        basedOn: [`${worstData.trades.length} trades analyzed`, 'Consistent underperformance']
      });
    }

    return recommendations;
  };

  const analyzePsychologicalPatterns = (trades: Trade[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Consecutive losses analysis
    let maxConsecutiveLosses = 0;
    let currentStreak = 0;
    
    trades.forEach(trade => {
      if (trade.profitLoss! < 0) {
        currentStreak++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    if (maxConsecutiveLosses >= 5) {
      recommendations.push({
        id: 'consecutive-losses',
        category: 'psychology',
        title: '🧠 Manage Losing Streaks',
        description: `You experienced ${maxConsecutiveLosses} consecutive losses, indicating potential emotional trading.`,
        action: 'After 3 consecutive losses, take a 24-48 hour break. Review your strategy before resuming.',
        priority: 'high',
        impact: 'Prevent emotional spirals and larger losses',
        basedOn: ['Losing streak analysis', 'Behavioral trading patterns']
      });
    }

    // Emotional state correlation (if available)
    const emotionalTrades = trades.filter(t => t.preTradeEmotion);
    if (emotionalTrades.length >= 5) {
      const emotionPerformance = new Map<string, number[]>();
      emotionalTrades.forEach(trade => {
        const emotion = trade.preTradeEmotion!;
        if (!emotionPerformance.has(emotion)) {
          emotionPerformance.set(emotion, []);
        }
        emotionPerformance.get(emotion)!.push(trade.profitLoss!);
      });

      let worstEmotion = '';
      let worstEmotionAvg = Number.POSITIVE_INFINITY;
      emotionPerformance.forEach((pnls, emotion) => {
        const avg = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length;
        if (avg < worstEmotionAvg && pnls.length >= 2) {
          worstEmotionAvg = avg;
          worstEmotion = emotion;
        }
      });

      if (worstEmotion && worstEmotionAvg < -200) {
        recommendations.push({
          id: 'emotional-state-warning',
          category: 'psychology',
          title: `😰 Avoid Trading When "${worstEmotion}"`,
          description: `Trading when feeling "${worstEmotion}" results in average loss of ₹${Math.abs(worstEmotionAvg).toFixed(0)}.`,
          action: `Implement a "no trading" rule when feeling "${worstEmotion}". Wait for a better emotional state.`,
          priority: 'medium',
          impact: 'Eliminate emotional loss triggers',
          basedOn: [`Emotional state vs. performance correlation`, `${emotionPerformance.get(worstEmotion)?.length} trades analyzed`]
        });
      }
    }

    return recommendations;
  };

  const analyzeTechnicalPatterns = (trades: Trade[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Market condition analysis
    const conditionPerformance = new Map<string, { profit: number, count: number }>();
    trades.filter(t => t.marketCondition).forEach(trade => {
      const condition = trade.marketCondition!;
      const current = conditionPerformance.get(condition) || { profit: 0, count: 0 };
      current.profit += trade.profitLoss!;
      current.count += 1;
      conditionPerformance.set(condition, current);
    });

    if (conditionPerformance.size >= 2) {
      let bestCondition = '';
      let bestAvg = Number.NEGATIVE_INFINITY;
      conditionPerformance.forEach((data, condition) => {
        const avg = data.profit / data.count;
        if (avg > bestAvg && data.count >= 2) {
          bestAvg = avg;
          bestCondition = condition;
        }
      });

      if (bestCondition) {
        recommendations.push({
          id: 'optimal-market-condition',
          category: 'technical',
          title: `📈 Trade More in ${bestCondition} Markets`,
          description: `${bestCondition} market conditions show best results with ₹${bestAvg.toFixed(0)} average return.`,
          action: `Increase position sizes and frequency during ${bestCondition} market conditions. Be more selective in other conditions.`,
          priority: 'medium',
          impact: 'Optimize market timing',
          basedOn: [`Market condition analysis`, `${conditionPerformance.get(bestCondition)?.count} trades in ${bestCondition} conditions`]
        });
      }
    }

    return recommendations;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'timing': return '⏰';
      case 'risk': return '🛡️';
      case 'strategy': return '🎯';
      case 'psychology': return '🧠';
      case 'technical': return '📊';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Smart Recommendations</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h4 className="mt-2 text-lg font-medium text-gray-900">Need More Data</h4>
          <p className="mt-1 text-sm text-gray-500">
            Add at least 5 completed trades to get smart recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🎯 Smart Trading Recommendations</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="timing">⏰ Timing</option>
            <option value="risk">🛡️ Risk Management</option>
            <option value="strategy">🎯 Strategy</option>
            <option value="psychology">🧠 Psychology</option>
            <option value="technical">📊 Technical</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRecommendations.map((rec, index) => (
          <div
            key={rec.id}
            className={`border-l-4 rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">{getCategoryIcon(rec.category)}</span>
                {rec.title}
              </h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {rec.priority.toUpperCase()}
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">{rec.description}</p>
            
            <div className="bg-white bg-opacity-50 rounded-md p-3 mb-3">
              <h5 className="text-sm font-medium text-gray-900 mb-1">💡 Action Plan:</h5>
              <p className="text-sm text-gray-700">{rec.action}</p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-green-600">Expected Impact: {rec.impact}</span>
              <span>Based on: {rec.basedOn.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && selectedCategory !== 'all' && (
        <div className="text-center py-8">
          <p className="text-gray-500">No recommendations in this category yet.</p>
        </div>
      )}
    </div>
  );
} 