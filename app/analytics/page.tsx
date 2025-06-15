'use client';

import { useState, useEffect, Suspense } from 'react';
import { getTrades } from '../actions/trade';
import { Trade } from '../types/Trade';
import ErrorBoundary from '../components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [strategies, setStrategies] = useState<string[]>([]);
  
  useEffect(() => {
    async function loadTrades() {
      try {
        setIsLoading(true);
        const tradesData = await getTrades();
        const formattedTrades = tradesData.map((trade: any) => ({
          ...trade,
          entryDate: trade.entryDate.toISOString(),
          exitDate: trade.exitDate?.toISOString() || null,
        }));
        setTrades(formattedTrades);
        
        // Extract unique strategies
        const uniqueStrategies = Array.from(
          new Set(
            formattedTrades
              .filter(trade => trade.strategy)
              .map(trade => trade.strategy)
          )
        ) as string[];
        setStrategies(uniqueStrategies);
        
      } catch (err) {
        console.error('Error loading trades:', err);
        setError('Failed to load trades. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTrades();
  }, []);
  
  // Filter trades based on selected filter and strategy
  const filteredTrades = trades.filter(trade => {
    if (selectedFilter === 'all') {
      return selectedStrategy === 'all' || trade.strategy === selectedStrategy;
    } else if (selectedFilter === 'profitable') {
      return (trade.profitLoss && trade.profitLoss > 0) && 
        (selectedStrategy === 'all' || trade.strategy === selectedStrategy);
    } else if (selectedFilter === 'losing') {
      return (trade.profitLoss && trade.profitLoss < 0) && 
        (selectedStrategy === 'all' || trade.strategy === selectedStrategy);
    }
    return true;
  });
  
  // Calculate strategy performance metrics
  const strategyPerformance = strategies.map(strategy => {
    const strategyTrades = trades.filter(trade => trade.strategy === strategy);
    const profitableTrades = strategyTrades.filter(trade => trade.profitLoss && trade.profitLoss > 0);
    const losingTrades = strategyTrades.filter(trade => trade.profitLoss && trade.profitLoss < 0);
    
    const totalProfit = profitableTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
    
    const winRate = strategyTrades.length > 0 ? 
      (profitableTrades.length / strategyTrades.length) * 100 : 0;
      
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const averageProfit = profitableTrades.length > 0 ?
      totalProfit / profitableTrades.length : 0;
      
    const averageLoss = losingTrades.length > 0 ?
      totalLoss / losingTrades.length : 0;
      
    return {
      strategy,
      totalTrades: strategyTrades.length,
      profitableTrades: profitableTrades.length,
      losingTrades: losingTrades.length,
      winRate: winRate.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      averageProfit,
      averageLoss,
    };
  });
  
  // Calculate drawdown analysis
  const calculateDrawdown = () => {
    if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0, currentDrawdown: 0 };
    
    // Sort trades by date
    const sortedTrades = [...trades]
      .filter(trade => trade.profitLoss !== null)
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    
    let peak = 0;
    let maxDrawdown = 0;
    let currentEquity = 0;
    let maxEquity = 0;
    
    for (const trade of sortedTrades) {
      currentEquity += trade.profitLoss || 0;
      
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity;
        peak = maxEquity;
      }
      
      const drawdown = peak - currentEquity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    const maxDrawdownPercent = maxEquity > 0 ? (maxDrawdown / maxEquity) * 100 : 0;
    const currentDrawdown = maxEquity > 0 ? ((maxEquity - currentEquity) / maxEquity) * 100 : 0;
    
    return {
      maxDrawdown,
      maxDrawdownPercent,
      currentDrawdown,
    };
  };
  
  const drawdownMetrics = calculateDrawdown();
  
  // Calculate trading patterns
  const calculateTradingPatterns = () => {
    if (trades.length === 0) return { 
      bestDay: null, 
      worstDay: null,
      bestHour: null,
      worstHour: null,
      consecutiveWins: 0,
      consecutiveLosses: 0
    };
    
    const dayProfits: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0,
    };
    
    const dayCount: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0,
    };
    
    const hourProfits: Record<number, number> = {};
    const hourCount: Record<number, number> = {};
    
    for (let i = 0; i < 24; i++) {
      hourProfits[i] = 0;
      hourCount[i] = 0;
    }
    
    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    
    // Sort trades by date
    const sortedTrades = [...trades]
      .filter(trade => trade.profitLoss !== null)
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    
    for (const trade of sortedTrades) {
      if (!trade.entryDate) continue;
      
      const date = new Date(trade.entryDate);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      
      if (trade.profitLoss) {
        dayProfits[day] = (dayProfits[day] || 0) + trade.profitLoss;
        dayCount[day] = (dayCount[day] || 0) + 1;
        
        hourProfits[hour] = (hourProfits[hour] || 0) + trade.profitLoss;
        hourCount[hour] = (hourCount[hour] || 0) + 1;
        
        // Track consecutive wins/losses
        if (trade.profitLoss > 0) {
          currentConsecutiveWins++;
          currentConsecutiveLosses = 0;
          if (currentConsecutiveWins > maxConsecutiveWins) {
            maxConsecutiveWins = currentConsecutiveWins;
          }
        } else if (trade.profitLoss < 0) {
          currentConsecutiveLosses++;
          currentConsecutiveWins = 0;
          if (currentConsecutiveLosses > maxConsecutiveLosses) {
            maxConsecutiveLosses = currentConsecutiveLosses;
          }
        }
      }
    }
    
    // Calculate average profit per day
    const dayAvgProfits: Record<string, number> = {};
    for (const day in dayProfits) {
      dayAvgProfits[day] = dayCount[day] > 0 ? dayProfits[day] / dayCount[day] : 0;
    }
    
    // Calculate average profit per hour
    const hourAvgProfits: Record<number, number> = {};
    for (const hour in hourProfits) {
      hourAvgProfits[Number(hour)] = hourCount[Number(hour)] > 0 ? 
        hourProfits[Number(hour)] / hourCount[Number(hour)] : 0;
    }
    
    // Find best and worst days
    let bestDay = null;
    let worstDay = null;
    let bestDayAvg = -Infinity;
    let worstDayAvg = Infinity;
    
    for (const day in dayAvgProfits) {
      if (dayCount[day] > 0) {
        if (dayAvgProfits[day] > bestDayAvg) {
          bestDayAvg = dayAvgProfits[day];
          bestDay = day;
        }
        if (dayAvgProfits[day] < worstDayAvg) {
          worstDayAvg = dayAvgProfits[day];
          worstDay = day;
        }
      }
    }
    
    // Find best and worst hours
    let bestHour = null;
    let worstHour = null;
    let bestHourAvg = -Infinity;
    let worstHourAvg = Infinity;
    
    for (const hour in hourAvgProfits) {
      if (hourCount[Number(hour)] > 0) {
        if (hourAvgProfits[Number(hour)] > bestHourAvg) {
          bestHourAvg = hourAvgProfits[Number(hour)];
          bestHour = Number(hour);
        }
        if (hourAvgProfits[Number(hour)] < worstHourAvg) {
          worstHourAvg = hourAvgProfits[Number(hour)];
          worstHour = Number(hour);
        }
      }
    }
    
    return {
      bestDay,
      worstDay,
      bestHour,
      worstHour,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      dayProfits,
      dayCount,
      hourProfits,
      hourCount,
    };
  };
  
  const tradingPatterns = calculateTradingPatterns();
  
  // Format hour to 12-hour format with AM/PM
  const formatHour = (hour: number | null) => {
    if (hour === null) return 'N/A';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };
  
  try {
    return (
      <ErrorBoundary fallback={<div className="p-4 bg-red-100 text-red-700 rounded-md">
        An error occurred loading analytics. Please check console logs for details.
      </div>}>
        <Suspense fallback={<div>Loading analytics data...</div>}>
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Trading Analytics</h2>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">Loading analytics...</div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="bg-white shadow rounded-xl p-6 mb-6">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Filter Trades
                      </label>
                      <select
                        id="filter"
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="all">All Trades</option>
                        <option value="profitable">Profitable Trades</option>
                        <option value="losing">Losing Trades</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Strategy
                      </label>
                      <select
                        id="strategy"
                        value={selectedStrategy}
                        onChange={(e) => setSelectedStrategy(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="all">All Strategies</option>
                        {strategies.map((strategy) => (
                          <option key={strategy} value={strategy}>
                            {strategy}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Strategy Performance */}
                <div className="bg-white shadow rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Performance</h3>
                  
                  {strategies.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No strategies found. Add strategy tags to your trades to see performance metrics.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Strategy
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Win Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Profit Factor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Net Profit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Avg. Profit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Avg. Loss
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Total Trades
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {strategyPerformance.map((strategy) => (
                            <tr key={strategy.strategy}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {strategy.strategy}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {strategy.winRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {strategy.profitFactor}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                strategy.netProfit > 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {strategy.netProfit > 0 ? '+' : ''}₹{strategy.netProfit.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                                ₹{strategy.averageProfit.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                                ₹{strategy.averageLoss.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {strategy.totalTrades}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Drawdown Analysis */}
                <div className="bg-white shadow rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawdown Analysis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Maximum Drawdown</h4>
                      <p className="text-2xl font-bold text-red-600">
                        ₹{drawdownMetrics.maxDrawdown.toLocaleString('en-IN')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Maximum Drawdown %</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {drawdownMetrics.maxDrawdownPercent.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Current Drawdown %</h4>
                      <p className="text-2xl font-bold text-amber-600">
                        {drawdownMetrics.currentDrawdown.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Trading Pattern Recognition */}
                <div className="bg-white shadow rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Pattern Recognition</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Best Trading Day</h4>
                      <p className="text-xl font-bold text-green-600">
                        {tradingPatterns.bestDay || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Worst Trading Day</h4>
                      <p className="text-xl font-bold text-red-600">
                        {tradingPatterns.worstDay || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Consecutive Stats</h4>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Max Consecutive Wins</p>
                          <p className="text-lg font-bold text-green-600">{tradingPatterns.consecutiveWins}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Max Consecutive Losses</p>
                          <p className="text-lg font-bold text-red-600">{tradingPatterns.consecutiveLosses}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Best Trading Hour</h4>
                      <p className="text-xl font-bold text-green-600">
                        {tradingPatterns.bestHour !== null ? formatHour(tradingPatterns.bestHour) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Worst Trading Hour</h4>
                      <p className="text-xl font-bold text-red-600">
                        {tradingPatterns.worstHour !== null ? formatHour(tradingPatterns.worstHour) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Analytics render error:", error);
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        Failed to load analytics. Error has been logged.
      </div>
    );
  }
} 