// AI Analytics Engine for Trading Journal
// Implements pattern recognition and predictive analytics

import { Trade } from '../types/Trade';

// Types for AI Analytics
export interface TradePattern {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  successRate: number;
  avgReturn: number;
  frequency: number;
  trades: Trade[];
  confidence: number;
}

export interface PredictiveAnalytics {
  winProbability: number;
  expectedReturn: number;
  riskScore: number;
  recommendations: string[];
  confidence: number;
}

export interface BehavioralInsight {
  type: 'strength' | 'weakness' | 'bias' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
  confidence: number;
}

export interface PerformancePrediction {
  nextTradeSuccess: number;
  weeklyPerformance: number;
  monthlyPerformance: number;
  optimalTradeSize: number;
  riskAdjustedTarget: number;
}

// Core AI Analytics Class
export class AIAnalytics {
  private trades: Trade[];
  
  constructor(trades: Trade[]) {
    this.trades = trades.filter(t => t.profitLoss !== null && t.profitLoss !== undefined);
  }

  // 1. PATTERN RECOGNITION ENGINE
  public identifyTradingPatterns(): TradePattern[] {
    const patterns: TradePattern[] = [];
    
    // Pattern 1: Time-based patterns
    patterns.push(this.analyzeTimePatterns());
    
    // Pattern 2: Strategy-based patterns
    patterns.push(...this.analyzeStrategyPatterns());
    
    // Pattern 3: Market condition patterns
    patterns.push(...this.analyzeMarketConditionPatterns());
    
    // Pattern 4: Size and risk patterns
    patterns.push(...this.analyzeSizePatterns());
    
    // Pattern 5: Emotional state patterns
    patterns.push(...this.analyzeEmotionalPatterns());
    
    return patterns.filter(p => p.frequency >= 3 && p.confidence > 0.6);
  }

  private analyzeTimePatterns(): TradePattern {
    const hourlyPerformance = new Map<number, { wins: number; total: number; pnl: number }>();
    
    this.trades.forEach(trade => {
      const hour = new Date(trade.entryDate).getHours();
      const current = hourlyPerformance.get(hour) || { wins: 0, total: 0, pnl: 0 };
      
      current.total++;
      current.pnl += trade.profitLoss!;
      if (trade.profitLoss! > 0) current.wins++;
      
      hourlyPerformance.set(hour, current);
    });

    // Find best performing hour
    let bestHour = 0;
    let bestWinRate = 0;
    
    hourlyPerformance.forEach((stats, hour) => {
      const winRate = stats.wins / stats.total;
      if (winRate > bestWinRate && stats.total >= 5) {
        bestWinRate = winRate;
        bestHour = hour;
      }
    });

    const bestHourStats = hourlyPerformance.get(bestHour)!;
    
    return {
      id: 'time-pattern',
      name: `Golden Hour Trading (${bestHour}:00)`,
      description: `You perform best when trading at ${bestHour}:00 hour`,
      indicators: [`Trading hour: ${bestHour}:00`, 'High focus period', 'Optimal market conditions'],
      successRate: (bestHourStats.wins / bestHourStats.total) * 100,
      avgReturn: bestHourStats.pnl / bestHourStats.total,
      frequency: bestHourStats.total,
      trades: this.trades.filter(t => new Date(t.entryDate).getHours() === bestHour),
      confidence: Math.min(bestHourStats.total / 10, 1) // More trades = higher confidence
    };
  }

  private analyzeStrategyPatterns(): TradePattern[] {
    const strategyMap = new Map<string, Trade[]>();
    
    this.trades.forEach(trade => {
      const strategy = trade.strategy || 'Unspecified';
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, []);
      }
      strategyMap.get(strategy)!.push(trade);
    });

    return Array.from(strategyMap.entries())
      .filter(([_, trades]) => trades.length >= 3)
      .map(([strategy, trades]) => {
        const wins = trades.filter(t => t.profitLoss! > 0).length;
        const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss!, 0);
        
        return {
          id: `strategy-${strategy.toLowerCase()}`,
          name: `${strategy} Strategy Pattern`,
          description: `Your ${strategy} strategy shows consistent patterns`,
          indicators: [
            `Strategy: ${strategy}`,
            `Sample size: ${trades.length} trades`,
          ].filter(Boolean),
          successRate: (wins / trades.length) * 100,
          avgReturn: totalPnL / trades.length,
          frequency: trades.length,
          trades,
          confidence: Math.min(trades.length / 15, 1)
        };
      });
  }

  private analyzeMarketConditionPatterns(): TradePattern[] {
    const conditionMap = new Map<string, Trade[]>();
    
    this.trades.forEach(trade => {
      const condition = trade.marketCondition || 'Unknown';
      if (!conditionMap.has(condition)) {
        conditionMap.set(condition, []);
      }
      conditionMap.get(condition)!.push(trade);
    });

    return Array.from(conditionMap.entries())
      .filter(([_, trades]) => trades.length >= 3)
      .map(([condition, trades]) => {
        const wins = trades.filter(t => t.profitLoss! > 0).length;
        const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss!, 0);
        
        return {
          id: `market-${condition.toLowerCase()}`,
          name: `${condition} Market Performance`,
          description: `Your performance in ${condition.toLowerCase()} market conditions`,
          indicators: [
            `Market condition: ${condition}`,
            `Trade frequency: ${trades.length}`,
            condition === 'Bullish' ? 'Rising market trend' : condition === 'Bearish' ? 'Falling market trend' : 'Sideways movement'
          ],
          successRate: (wins / trades.length) * 100,
          avgReturn: totalPnL / trades.length,
          frequency: trades.length,
          trades,
          confidence: Math.min(trades.length / 10, 1)
        };
      });
  }

  private analyzeSizePatterns(): TradePattern[] {
    // Analyze performance by position size
    const sortedTrades = [...this.trades].sort((a, b) => a.quantity - b.quantity);
    const quintileSize = Math.floor(sortedTrades.length / 5);
    const patterns: TradePattern[] = [];

    for (let i = 0; i < 5; i++) {
      const start = i * quintileSize;
      const end = i === 4 ? sortedTrades.length : (i + 1) * quintileSize;
      const quintileTrades = sortedTrades.slice(start, end);
      
      if (quintileTrades.length === 0) continue;
      
      const wins = quintileTrades.filter(t => t.profitLoss! > 0).length;
      const totalPnL = quintileTrades.reduce((sum, t) => sum + t.profitLoss!, 0);
      const avgSize = quintileTrades.reduce((sum, t) => sum + t.quantity, 0) / quintileTrades.length;
      
      patterns.push({
        id: `size-quintile-${i}`,
        name: `${i === 0 ? 'Small' : i === 4 ? 'Large' : 'Medium'} Position Pattern`,
        description: `Performance with ${i === 0 ? 'small' : i === 4 ? 'large' : 'medium'} position sizes (avg: ${avgSize.toFixed(0)} units)`,
        indicators: [
          `Average position size: ${avgSize.toFixed(0)}`,
          `Position range: ${quintileTrades[0].quantity} - ${quintileTrades[quintileTrades.length-1].quantity}`,
          `Sample size: ${quintileTrades.length} trades`
        ],
        successRate: (wins / quintileTrades.length) * 100,
        avgReturn: totalPnL / quintileTrades.length,
        frequency: quintileTrades.length,
        trades: quintileTrades,
        confidence: Math.min(quintileTrades.length / 8, 1)
      });
    }

    return patterns.filter(p => p.frequency >= 3);
  }

  private analyzeEmotionalPatterns(): TradePattern[] {
    const emotionMap = new Map<string, Trade[]>();
    
    this.trades.forEach(trade => {
      const emotion = trade.preTradeEmotion || 'Unknown';
      if (!emotionMap.has(emotion)) {
        emotionMap.set(emotion, []);
      }
      emotionMap.get(emotion)!.push(trade);
    });

    return Array.from(emotionMap.entries())
      .filter(([_, trades]) => trades.length >= 3)
      .map(([emotion, trades]) => {
        const wins = trades.filter(t => t.profitLoss! > 0).length;
        const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss!, 0);
        
        return {
          id: `emotion-${emotion.toLowerCase()}`,
          name: `${emotion} Emotional State Pattern`,
          description: `Your trading performance when feeling ${emotion.toLowerCase()}`,
          indicators: [
            `Pre-trade emotion: ${emotion}`,
            `Emotional frequency: ${trades.length} trades`,
            emotion === 'Calm' ? 'Composed decision making' : emotion === 'Excited' ? 'High energy state' : `${emotion} emotional state`
          ],
          successRate: (wins / trades.length) * 100,
          avgReturn: totalPnL / trades.length,
          frequency: trades.length,
          trades,
          confidence: Math.min(trades.length / 8, 1)
        };
      });
  }

  // 2. PREDICTIVE ANALYTICS FOR TRADE OUTCOMES
  public predictTradeOutcome(proposedTrade: Partial<Trade>): PredictiveAnalytics {
    // Analyze similar historical trades
    const similarTrades = this.findSimilarTrades(proposedTrade);
    
    if (similarTrades.length < 3) {
      return {
        winProbability: 50, // Default probability
        expectedReturn: 0,
        riskScore: 50,
        recommendations: ['Insufficient historical data for accurate prediction'],
        confidence: 0.3
      };
    }

    const wins = similarTrades.filter(t => t.profitLoss! > 0).length;
    const winProbability = (wins / similarTrades.length) * 100;
    const avgReturn = similarTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / similarTrades.length;
    
    // Calculate risk score based on volatility of similar trades
    const returns = similarTrades.map(t => t.profitLoss!);
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const riskScore = Math.min((Math.sqrt(variance) / Math.abs(avgReturn)) * 50, 100);
    
    const recommendations = this.generateRecommendations(proposedTrade, similarTrades, winProbability);
    
    return {
      winProbability,
      expectedReturn: avgReturn,
      riskScore,
      recommendations,
      confidence: Math.min(similarTrades.length / 10, 0.95)
    };
  }

  private findSimilarTrades(proposedTrade: Partial<Trade>): Trade[] {
    return this.trades.filter(trade => {
      let similarityScore = 0;
      let factors = 0;

      // Symbol similarity
      if (proposedTrade.symbol && trade.symbol === proposedTrade.symbol) {
        similarityScore += 30;
      }
      factors++;

      // Strategy similarity
      if (proposedTrade.strategy && trade.strategy === proposedTrade.strategy) {
        similarityScore += 25;
      }
      factors++;

      // Market condition similarity
      if (proposedTrade.marketCondition && trade.marketCondition === proposedTrade.marketCondition) {
        similarityScore += 20;
      }
      factors++;

      // Time frame similarity
      if (proposedTrade.timeFrame && trade.timeFrame === proposedTrade.timeFrame) {
        similarityScore += 15;
      }
      factors++;

      // Trade type similarity
      if (proposedTrade.type && trade.type === proposedTrade.type) {
        similarityScore += 10;
      }
      factors++;

      return (similarityScore / (factors * 20)) > 0.4; // 40% similarity threshold
    });
  }

  private generateRecommendations(
    proposedTrade: Partial<Trade>, 
    similarTrades: Trade[], 
    winProbability: number
  ): string[] {
    const recommendations: string[] = [];

    if (winProbability > 70) {
      recommendations.push("High probability setup - consider normal position size");
    } else if (winProbability < 40) {
      recommendations.push("Low probability setup - consider smaller position or skip");
    }

    // Risk-reward analysis
    const avgRR = similarTrades
      .filter(t => t.riskRewardRatio)
      .reduce((sum, t) => sum + t.riskRewardRatio!, 0) / similarTrades.length;
    
    if (avgRR > 2) {
      recommendations.push("Excellent risk-reward ratio historically");
    } else if (avgRR < 1) {
      recommendations.push("Poor risk-reward ratio - improve stop loss or target");
    }

    // Timing recommendations
    const currentHour = new Date().getHours();
    const hourPerformance = similarTrades.filter(t => 
      new Date(t.entryDate).getHours() === currentHour
    );
    
    if (hourPerformance.length > 0) {
      const hourWinRate = hourPerformance.filter(t => t.profitLoss! > 0).length / hourPerformance.length;
      if (hourWinRate > 0.6) {
        recommendations.push("Good timing - you perform well at this hour");
      } else if (hourWinRate < 0.4) {
        recommendations.push("Consider waiting - historically poor performance at this hour");
      }
    }

    return recommendations;
  }

  // 3. AUTOMATED TRADE JOURNAL INSIGHTS
  public generateAutomatedInsights(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];

    // Always generate basic insights if we have enough trades
    if (this.trades.length >= 3) {
      insights.push(...this.analyzeBasicPerformance());
    }

    // Analyze trading frequency patterns
    insights.push(...this.analyzeFrequencyPatterns());
    
    // Analyze profit distribution
    insights.push(...this.analyzeProfitDistribution());
    
    // Analyze risk management
    insights.push(...this.analyzeRiskManagement());
    
    // Analyze emotional patterns
    insights.push(...this.analyzeEmotionalBehavior());
    
    // Analyze market timing
    insights.push(...this.analyzeMarketTiming());

    // Generate position sizing insights
    insights.push(...this.analyzePositionSizing());

    // Generate strategy consistency insights
    insights.push(...this.analyzeStrategyConsistency());

    return insights.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      return impactScore[b.impact] - impactScore[a.impact];
    });
  }

  private analyzeFrequencyPatterns(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    // Overtrading analysis with lower threshold
    const avgTradesPerDay = this.calculateAverageTradesPerDay();
    if (avgTradesPerDay > 5) {
      insights.push({
        type: 'weakness',
        title: 'High Trading Frequency',
        description: `You average ${avgTradesPerDay.toFixed(1)} trades per day, which may indicate overtrading`,
        impact: avgTradesPerDay > 10 ? 'high' : 'medium',
        suggestion: 'Focus on quality over quantity. Reduce trade frequency and improve setup selection.',
        confidence: 0.8
      });
    } else if (avgTradesPerDay < 0.5 && this.trades.length >= 10) {
      insights.push({
        type: 'opportunity',
        title: 'Low Trading Frequency',
        description: `You average only ${avgTradesPerDay.toFixed(1)} trades per day, which might indicate missed opportunities`,
        impact: 'medium',
        suggestion: 'Consider if you might be too selective. Review your criteria for trade entry.',
        confidence: 0.7
      });
    }

    // Trading consistency analysis
    if (this.trades.length >= 10) {
      const tradingDays = new Set(this.trades.map(t => new Date(t.entryDate).toDateString())).size;
      const daysWithTrades = tradingDays;
      const totalDays = Math.ceil((new Date(this.trades[this.trades.length - 1].entryDate).getTime() - 
                                   new Date(this.trades[0].entryDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const tradingConsistency = daysWithTrades / Math.max(totalDays, 1);
      
      if (tradingConsistency > 0.8) {
        insights.push({
          type: 'strength',
          title: 'Consistent Trading Schedule',
          description: `You trade consistently on ${(tradingConsistency * 100).toFixed(0)}% of available days`,
          impact: 'low',
          suggestion: 'Good discipline! Maintain this consistency while focusing on quality setups.',
          confidence: 0.8
        });
      }
    }

    return insights;
  }

  private analyzeProfitDistribution(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    const profits = this.trades.filter(t => t.profitLoss! > 0).map(t => t.profitLoss!);
    const losses = this.trades.filter(t => t.profitLoss! < 0).map(t => Math.abs(t.profitLoss!));
    
    if (profits.length > 0 && losses.length > 0) {
      const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
      const avgLoss = losses.reduce((sum, l) => sum + l, 0) / losses.length;
      
      if (avgLoss > avgProfit * 2) {
        insights.push({
          type: 'weakness',
          title: 'Large Average Losses vs Profits',
          description: `Your average loss (${avgLoss.toFixed(2)}) is much larger than average profit (${avgProfit.toFixed(2)})`,
          impact: 'high',
          suggestion: 'Improve stop-loss discipline and let profits run longer.',
          confidence: 0.9
        });
      }
    }

    return insights;
  }

  private analyzeRiskManagement(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    const tradesWithStopLoss = this.trades.filter(t => t.stopLoss && t.stopLoss > 0);
    const stopLossUsage = tradesWithStopLoss.length / this.trades.length;
    
    if (stopLossUsage < 0.3) {
      insights.push({
        type: 'weakness',
        title: 'Poor Stop Loss Usage',
        description: `Only ${(stopLossUsage * 100).toFixed(0)}% of your trades have defined stop losses`,
        impact: 'high',
        suggestion: 'Always define stop losses before entering trades to manage risk effectively.',
        confidence: 0.95
      });
    } else if (stopLossUsage >= 0.8) {
      insights.push({
        type: 'strength',
        title: 'Excellent Risk Management',
        description: `${(stopLossUsage * 100).toFixed(0)}% of your trades have defined stop losses`,
        impact: 'medium',
        suggestion: 'Great discipline! Continue using stop losses and consider if they are optimally placed.',
        confidence: 0.9
      });
    } else if (stopLossUsage >= 0.5) {
      insights.push({
        type: 'opportunity',
        title: 'Good But Improvable Risk Management',
        description: `${(stopLossUsage * 100).toFixed(0)}% of your trades have stop losses - room for improvement`,
        impact: 'medium',
        suggestion: 'Try to use stop losses on all trades for better risk management.',
        confidence: 0.8
      });
    }

    // Analyze maximum loss per trade
    const losses = this.trades.filter(t => t.profitLoss! < 0).map(t => Math.abs(t.profitLoss!));
    if (losses.length > 0) {
      const maxLoss = Math.max(...losses);
      const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
      
      if (maxLoss > avgLoss * 3) {
        insights.push({
          type: 'weakness',
          title: 'Inconsistent Loss Control',
          description: `Your maximum loss (₹${maxLoss.toFixed(0)}) is much larger than your average loss (₹${avgLoss.toFixed(0)})`,
          impact: 'high',
          suggestion: 'Be more disciplined about cutting losses quickly. Large losses can wipe out many small gains.',
          confidence: 0.9
        });
      }
    }

    return insights;
  }

  private analyzeEmotionalBehavior(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    const emotionalTrades = this.trades.filter(t => t.preTradeEmotion);
    if (emotionalTrades.length > 10) {
      const emotionPerformance = new Map<string, number[]>();
      
      emotionalTrades.forEach(trade => {
        const emotion = trade.preTradeEmotion!;
        if (!emotionPerformance.has(emotion)) {
          emotionPerformance.set(emotion, []);
        }
        emotionPerformance.get(emotion)!.push(trade.profitLoss!);
      });

      emotionPerformance.forEach((pnls, emotion) => {
        const avgPnL = pnls.reduce((sum, p) => sum + p, 0) / pnls.length;
        const winRate = pnls.filter(p => p > 0).length / pnls.length;
        
        if (winRate < 0.3 && pnls.length >= 5) {
          insights.push({
            type: 'weakness',
            title: `Poor Performance When ${emotion}`,
            description: `When feeling ${emotion.toLowerCase()}, your win rate drops to ${(winRate * 100).toFixed(0)}%`,
            impact: 'medium',
            suggestion: `Avoid trading when feeling ${emotion.toLowerCase()}. Take breaks to reset emotional state.`,
            confidence: Math.min(pnls.length / 10, 0.9)
          });
        }
      });
    }

    return insights;
  }

  private analyzeMarketTiming(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    // Day of week analysis with lower threshold
    const dayPerformance = new Map<number, number[]>();
    
    this.trades.forEach(trade => {
      const dayOfWeek = new Date(trade.entryDate).getDay();
      if (!dayPerformance.has(dayOfWeek)) {
        dayPerformance.set(dayOfWeek, []);
      }
      dayPerformance.get(dayOfWeek)!.push(trade.profitLoss!);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    dayPerformance.forEach((pnls, day) => {
      if (pnls.length >= 3) { // Lowered threshold from 5 to 3
        const winRate = pnls.filter(p => p > 0).length / pnls.length;
        const avgPnL = pnls.reduce((sum, p) => sum + p, 0) / pnls.length;
        
        if (winRate > 0.6) { // Lowered threshold from 0.7 to 0.6
          insights.push({
            type: 'strength',
            title: `Strong ${dayNames[day]} Performance`,
            description: `You have a ${(winRate * 100).toFixed(0)}% win rate on ${dayNames[day]}s with average P&L of ₹${avgPnL.toFixed(0)}`,
            impact: 'medium',
            suggestion: `Consider focusing more trading activity on ${dayNames[day]}s.`,
            confidence: Math.min(pnls.length / 10, 0.8)
          });
        } else if (winRate < 0.3 && pnls.length >= 3) {
          insights.push({
            type: 'weakness',
            title: `Poor ${dayNames[day]} Performance`,
            description: `You have only a ${(winRate * 100).toFixed(0)}% win rate on ${dayNames[day]}s`,
            impact: 'medium',
            suggestion: `Consider avoiding trading on ${dayNames[day]}s or review your ${dayNames[day]} strategy.`,
            confidence: Math.min(pnls.length / 10, 0.8)
          });
        }
      }
    });

    return insights;
  }

  private analyzeBasicPerformance(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    const winningTrades = this.trades.filter(t => t.profitLoss! > 0);
    const losingTrades = this.trades.filter(t => t.profitLoss! < 0);
    const winRate = winningTrades.length / this.trades.length;
    const totalPnL = this.trades.reduce((sum, t) => sum + t.profitLoss!, 0);
    
    // Win rate analysis
    if (winRate >= 0.6) {
      insights.push({
        type: 'strength',
        title: 'Strong Win Rate',
        description: `You have a ${(winRate * 100).toFixed(1)}% win rate, which is above average`,
        impact: 'medium',
        suggestion: 'Continue following your current strategy while ensuring you maintain proper risk management.',
        confidence: 0.9
      });
    } else if (winRate < 0.4) {
      insights.push({
        type: 'weakness',
        title: 'Low Win Rate Needs Attention',
        description: `Your win rate of ${(winRate * 100).toFixed(1)}% suggests room for improvement in trade selection`,
        impact: 'high',
        suggestion: 'Focus on improving your entry criteria and wait for higher probability setups.',
        confidence: 0.9
      });
    }

    // Overall profitability
    if (totalPnL > 1000) {
      insights.push({
        type: 'strength',
        title: 'Profitable Trading Track Record',
        description: `You have generated ₹${totalPnL.toFixed(0)} in total profits from ${this.trades.length} trades`,
        impact: 'high',
        suggestion: 'Keep up the good work! Consider scaling your position sizes gradually while maintaining your edge.',
        confidence: 0.95
      });
    } else if (totalPnL < -1000) {
      insights.push({
        type: 'weakness',
        title: 'Overall Trading Losses',
        description: `You have total losses of ₹${Math.abs(totalPnL).toFixed(0)} across ${this.trades.length} trades`,
        impact: 'high',
        suggestion: 'Review your strategy fundamentally. Consider reducing position sizes and focusing on risk management.',
        confidence: 0.95
      });
    }

    // Risk-reward analysis
    if (winningTrades.length > 0 && losingTrades.length > 0) {
      const avgWin = winningTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / winningTrades.length;
      const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss!, 0) / losingTrades.length);
      const riskReward = avgWin / avgLoss;
      
      if (riskReward >= 2) {
        insights.push({
          type: 'strength',
          title: 'Excellent Risk-Reward Ratio',
          description: `Your risk-reward ratio of ${riskReward.toFixed(1)}:1 is excellent`,
          impact: 'medium',
          suggestion: 'Maintain your current profit-taking and stop-loss strategy.',
          confidence: 0.8
        });
      } else if (riskReward < 1) {
        insights.push({
          type: 'weakness',
          title: 'Poor Risk-Reward Ratio',
          description: `Your risk-reward ratio of ${riskReward.toFixed(1)}:1 means you lose more than you win on average`,
          impact: 'high',
          suggestion: 'Improve your stop-loss discipline and let profits run longer. Target at least 2:1 risk-reward.',
          confidence: 0.9
        });
      }
    }

    return insights;
  }

  private analyzePositionSizing(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    if (this.trades.length < 5) return insights;
    
    const quantities = this.trades.map(t => t.quantity);
    const maxQuantity = Math.max(...quantities);
    const minQuantity = Math.min(...quantities);
    const avgQuantity = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    
    // Check for position sizing consistency
    const sizeVariation = (maxQuantity - minQuantity) / avgQuantity;
    
    if (sizeVariation > 3) {
      insights.push({
        type: 'weakness',
        title: 'Inconsistent Position Sizing',
        description: `Your position sizes vary dramatically from ${minQuantity} to ${maxQuantity} shares`,
        impact: 'medium',
        suggestion: 'Develop a consistent position sizing strategy based on risk percentage rather than arbitrary amounts.',
        confidence: 0.8
      });
    } else if (sizeVariation < 0.5) {
      insights.push({
        type: 'strength',
        title: 'Consistent Position Sizing',
        description: `You maintain consistent position sizes around ${avgQuantity.toFixed(0)} shares`,
        impact: 'low',
        suggestion: 'Good discipline! Consider adjusting position size based on setup quality and market volatility.',
        confidence: 0.7
      });
    }

    // Large position performance analysis
    const largeTrades = this.trades.filter(t => t.quantity > avgQuantity * 1.5);
    const smallTrades = this.trades.filter(t => t.quantity < avgQuantity * 0.7);
    
    if (largeTrades.length >= 3 && smallTrades.length >= 3) {
      const largeTradeWinRate = largeTrades.filter(t => t.profitLoss! > 0).length / largeTrades.length;
      const smallTradeWinRate = smallTrades.filter(t => t.profitLoss! > 0).length / smallTrades.length;
      
      if (largeTradeWinRate < smallTradeWinRate - 0.2) {
        insights.push({
          type: 'weakness',
          title: 'Poor Performance with Large Positions',
          description: `Your win rate drops to ${(largeTradeWinRate * 100).toFixed(0)}% with larger positions vs ${(smallTradeWinRate * 100).toFixed(0)}% with smaller ones`,
          impact: 'medium',
          suggestion: 'Be more selective with larger position sizes and ensure you have higher conviction setups.',
          confidence: 0.8
        });
      }
    }

    return insights;
  }

  private analyzeStrategyConsistency(): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];
    
    const strategyCounts = new Map<string, number>();
    this.trades.forEach(trade => {
      const strategy = trade.strategy || 'Unspecified';
      strategyCounts.set(strategy, (strategyCounts.get(strategy) || 0) + 1);
    });

    const totalStrategies = strategyCounts.size;
    const unspecifiedCount = strategyCounts.get('Unspecified') || 0;
    const unspecifiedPercentage = unspecifiedCount / this.trades.length;

    // Strategy documentation
    if (unspecifiedPercentage > 0.5) {
      insights.push({
        type: 'weakness',
        title: 'Poor Strategy Documentation',
        description: `${(unspecifiedPercentage * 100).toFixed(0)}% of your trades don't have a specified strategy`,
        impact: 'medium',
        suggestion: 'Start documenting your trading strategy for each trade to track what works best.',
        confidence: 0.9
      });
    } else if (unspecifiedPercentage < 0.2) {
      insights.push({
        type: 'strength',
        title: 'Good Strategy Documentation',
        description: `You document strategies for ${((1 - unspecifiedPercentage) * 100).toFixed(0)}% of your trades`,
        impact: 'low',
        suggestion: 'Excellent record keeping! Use this data to analyze which strategies work best.',
        confidence: 0.8
      });
    }

    // Strategy diversification
    if (totalStrategies > 5) {
      insights.push({
        type: 'bias',
        title: 'Strategy Diversification May Be Excessive',
        description: `You're using ${totalStrategies} different strategies, which might indicate lack of focus`,
        impact: 'medium',
        suggestion: 'Consider focusing on your top 2-3 performing strategies for better consistency.',
        confidence: 0.7
      });
    } else if (totalStrategies >= 2 && totalStrategies <= 4) {
      insights.push({
        type: 'strength',
        title: 'Good Strategy Diversification',
        description: `You use ${totalStrategies} different strategies, showing good balance between focus and diversification`,
        impact: 'low',
        suggestion: 'Continue monitoring which strategies perform best in different market conditions.',
        confidence: 0.7
      });
    }

    return insights;
  }

  // 4. PERFORMANCE PREDICTION MODELS
  public predictPerformance(): PerformancePrediction {
    if (this.trades.length < 10) {
      return {
        nextTradeSuccess: 50,
        weeklyPerformance: 0,
        monthlyPerformance: 0,
        optimalTradeSize: 0,
        riskAdjustedTarget: 0
      };
    }

    // Recent performance trend
    const recentTrades = this.trades.slice(-20);
    const recentWinRate = recentTrades.filter(t => t.profitLoss! > 0).length / recentTrades.length;
    
    // Calculate momentum
    const last10 = this.trades.slice(-10);
    const prev10 = this.trades.slice(-20, -10);
    
    const last10Performance = last10.reduce((sum, t) => sum + t.profitLoss!, 0);
    const prev10Performance = prev10.reduce((sum, t) => sum + t.profitLoss!, 0);
    
    const momentum = prev10Performance !== 0 ? (last10Performance - prev10Performance) / Math.abs(prev10Performance) : 0;
    
    // Adjust win rate based on momentum
    const nextTradeSuccess = Math.max(0, Math.min(100, recentWinRate * 100 + (momentum * 10)));
    
    // Weekly and monthly predictions based on historical averages
    const weeklyAvg = this.calculateAverageWeeklyPnL();
    const monthlyAvg = this.calculateAverageMonthlyPnL();
    
    // Optimal trade size based on Kelly Criterion
    const optimalSize = this.calculateOptimalTradeSize();
    
    return {
      nextTradeSuccess,
      weeklyPerformance: weeklyAvg * (1 + momentum * 0.2),
      monthlyPerformance: monthlyAvg * (1 + momentum * 0.15),
      optimalTradeSize: optimalSize,
      riskAdjustedTarget: weeklyAvg * 0.8 // Conservative target
    };
  }

  // Helper methods
  private calculateAverageTradesPerDay(): number {
    if (this.trades.length === 0) return 0;
    
    const firstTrade = new Date(this.trades[this.trades.length - 1].entryDate);
    const lastTrade = new Date(this.trades[0].entryDate);
    const daysDiff = Math.ceil((lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24));
    
    return this.trades.length / daysDiff;
  }

  private calculateAverageWeeklyPnL(): number {
    // Implementation for weekly P&L calculation
    return this.trades.reduce((sum, t) => sum + t.profitLoss!, 0) / (this.trades.length / 5); // Assuming 5 trades per week
  }

  private calculateAverageMonthlyPnL(): number {
    // Implementation for monthly P&L calculation
    return this.trades.reduce((sum, t) => sum + t.profitLoss!, 0) / (this.trades.length / 20); // Assuming 20 trades per month
  }

  private calculateOptimalTradeSize(): number {
    if (this.trades.length < 10) return 0;
    
    const wins = this.trades.filter(t => t.profitLoss! > 0);
    const losses = this.trades.filter(t => t.profitLoss! < 0);
    
    if (wins.length === 0 || losses.length === 0) return 0;
    
    const winRate = wins.length / this.trades.length;
    const avgWin = wins.reduce((sum, t) => sum + t.profitLoss!, 0) / wins.length;
    const avgLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss!, 0) / losses.length);
    
    // Kelly Criterion: f = (bp - q) / b
    const b = avgWin / avgLoss; // odds
    const p = winRate; // win probability
    const q = 1 - p; // loss probability
    
    const kellyPercent = (b * p - q) / b;
    
    return Math.max(0, Math.min(0.25, kellyPercent)); // Cap at 25% of capital
  }
} 