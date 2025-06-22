'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from 'react';
import { getTrades } from '../actions/trade';
import { Trade } from '../types/Trade';
import ErrorBoundary from '../components/ErrorBoundary';

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
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

  // Filter trades based on selected filters
  const filteredTrades = trades.filter(trade => {
    // Time filter
    let timeMatch = true;
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      const tradeDate = new Date(trade.entryDate);
      
      switch (selectedTimeframe) {
        case 'today':
          timeMatch = tradeDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          timeMatch = tradeDate >= weekAgo;
          break;
        case 'month':
          timeMatch = tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
          break;
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          timeMatch = tradeDate >= quarterStart;
          break;
        case 'year':
          timeMatch = tradeDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    // Strategy filter
    const strategyMatch = selectedStrategy === 'all' || trade.strategy === selectedStrategy;
    
    // Profit/Loss filter
    let profitMatch = true;
    if (selectedFilter === 'profitable') {
      profitMatch = trade.profitLoss !== null && trade.profitLoss !== undefined && trade.profitLoss > 0;
    } else if (selectedFilter === 'losing') {
      profitMatch = trade.profitLoss !== null && trade.profitLoss !== undefined && trade.profitLoss < 0;
    }

    return timeMatch && strategyMatch && profitMatch;
  });

  // Calculate comprehensive performance metrics
  const calculatePerformanceMetrics = () => {
    const completedTrades = filteredTrades.filter(trade => trade.profitLoss !== null);
    if (completedTrades.length === 0) return null;

    const winningTrades = completedTrades.filter(trade => trade.profitLoss! > 0);
    const losingTrades = completedTrades.filter(trade => trade.profitLoss! < 0);
    
    const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss!, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss!, 0));
    const netProfit = totalProfit - totalLoss;
    
    const winRate = (winningTrades.length / completedTrades.length) * 100;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const averageTrade = netProfit / completedTrades.length;
    
    const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Infinity : 0;
    
    // Calculate expectancy
    const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss);
    
    // Calculate Sharpe ratio (simplified)
    const returns = completedTrades.map(trade => trade.profitLoss!);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Largest win/loss
    const largestWin = Math.max(...winningTrades.map(trade => trade.profitLoss!), 0);
    const largestLoss = Math.min(...losingTrades.map(trade => trade.profitLoss!), 0);

    return {
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: winRate.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      totalProfit,
      totalLoss,
      netProfit,
      averageWin,
      averageLoss,
      averageTrade,
      riskRewardRatio: riskRewardRatio.toFixed(2),
      expectancy: expectancy.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      largestWin,
      largestLoss: Math.abs(largestLoss)
    };
  };

  // Calculate monthly performance
  const calculateMonthlyPerformance = () => {
    const monthlyData: { [key: string]: { profit: number, trades: number } } = {};
    
    filteredTrades.forEach(trade => {
      if (trade.profitLoss !== null) {
        const date = new Date(trade.entryDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { profit: 0, trades: 0 };
        }
        
                 monthlyData[monthKey].profit += trade.profitLoss || 0;
        monthlyData[monthKey].trades += 1;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  };

  // Calculate sector analysis
  const calculateSectorAnalysis = () => {
    const sectorData: { [key: string]: { profit: number, trades: number, winRate: number } } = {};
    
    filteredTrades.forEach(trade => {
      const sector = trade.sector || 'Unknown';
      if (!sectorData[sector]) {
        sectorData[sector] = { profit: 0, trades: 0, winRate: 0 };
      }
      
      if (trade.profitLoss !== null) {
                 sectorData[sector].profit += trade.profitLoss || 0;
        sectorData[sector].trades += 1;
      }
    });

    // Calculate win rates
    Object.keys(sectorData).forEach(sector => {
      const sectorTrades = filteredTrades.filter(trade => (trade.sector || 'Unknown') === sector && trade.profitLoss !== null);
      const winningTrades = sectorTrades.filter(trade => trade.profitLoss! > 0);
      sectorData[sector].winRate = sectorTrades.length > 0 ? (winningTrades.length / sectorTrades.length) * 100 : 0;
    });

    return Object.entries(sectorData)
      .map(([sector, data]) => ({ sector, ...data }))
      .sort((a, b) => b.profit - a.profit);
  };

  // Calculate risk metrics
  const calculateRiskMetrics = () => {
    const completedTrades = filteredTrades.filter(trade => trade.profitLoss !== null);
    if (completedTrades.length === 0) return null;

    // Sort trades by date
    const sortedTrades = [...completedTrades].sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    let runningTotal = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let drawdownPeriods = 0;
    let inDrawdown = false;

    const equityCurve = sortedTrades.map(trade => {
      runningTotal += trade.profitLoss!;
      
      if (runningTotal > peak) {
        peak = runningTotal;
        if (inDrawdown) {
          drawdownPeriods++;
          inDrawdown = false;
        }
      } else {
        inDrawdown = true;
      }

      const currentDrawdown = peak - runningTotal;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }

      return { date: trade.entryDate, equity: runningTotal, drawdown: currentDrawdown };
    });

    const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
    const calmarRatio = maxDrawdownPercent > 0 ? (runningTotal / maxDrawdownPercent) : 0;

    // Value at Risk (VaR) - 95% confidence
    const returns = sortedTrades.map(trade => trade.profitLoss!).sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    const var95 = returns[varIndex] || 0;

    return {
      maxDrawdown,
      maxDrawdownPercent: maxDrawdownPercent.toFixed(2),
      calmarRatio: calmarRatio.toFixed(2),
      var95: Math.abs(var95),
      equityCurve,
      drawdownPeriods
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();
  const monthlyPerformance = calculateMonthlyPerformance();
  const sectorAnalysis = calculateSectorAnalysis();
  const riskMetrics = calculateRiskMetrics();

  const formatHour = (hour: number | null) => {
    if (hour === null) return 'N/A';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  try {
    return (
      <ErrorBoundary fallback={<div className="p-4 bg-red-100 text-red-700 rounded-md">
        Something went wrong while loading analytics.
      </div>}>
        <Suspense fallback={<div>Loading analytics data...</div>}>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Analytics</h1>
                    <p className="text-gray-600">Comprehensive analysis of your trading performance</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading analytics...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                      </svg>
                      Analysis Filters
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-2">
                          Time Period
                        </label>
                        <select
                          id="timeframe"
                          value={selectedTimeframe}
                          onChange={(e) => setSelectedTimeframe(e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="quarter">This Quarter</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                          Trade Type
                        </label>
                        <select
                          id="filter"
                          value={selectedFilter}
                          onChange={(e) => setSelectedFilter(e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="all">All Trades</option>
                          <option value="profitable">Profitable Only</option>
                          <option value="losing">Losing Only</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 mb-2">
                          Strategy
                        </label>
                        <select
                          id="strategy"
                          value={selectedStrategy}
                          onChange={(e) => setSelectedStrategy(e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="all">All Strategies</option>
                          {strategies.map((strategy) => (
                            <option key={strategy} value={strategy}>
                              {strategy}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <div className="bg-gray-50 rounded-lg p-3 w-full text-center">
                          <p className="text-sm text-gray-600">Filtered Trades</p>
                          <p className="text-2xl font-bold text-indigo-600">{filteredTrades.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Performance Metrics */}
                  {performanceMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Net Profit</p>
                            <p className="text-2xl font-bold">₹{formatCurrency(performanceMetrics.netProfit)}</p>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-2">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Win Rate</p>
                            <p className="text-2xl font-bold">{performanceMetrics.winRate}%</p>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-2">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">Profit Factor</p>
                            <p className="text-2xl font-bold">{performanceMetrics.profitFactor}</p>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-2">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm font-medium">Risk-Reward</p>
                            <p className="text-2xl font-bold">{performanceMetrics.riskRewardRatio}</p>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-2">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Performance Metrics */}
                  {performanceMetrics && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Detailed Performance Metrics
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-600 mb-1">Total Trades</p>
                          <p className="text-xl font-bold text-gray-900">{performanceMetrics.totalTrades}</p>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-green-600 mb-1">Winning Trades</p>
                          <p className="text-xl font-bold text-green-700">{performanceMetrics.winningTrades}</p>
                        </div>
                        
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-red-600 mb-1">Losing Trades</p>
                          <p className="text-xl font-bold text-red-700">{performanceMetrics.losingTrades}</p>
                        </div>
                        
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-600 mb-1">Avg. Win</p>
                          <p className="text-lg font-bold text-blue-700">₹{formatCurrency(performanceMetrics.averageWin)}</p>
                        </div>
                        
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-orange-600 mb-1">Avg. Loss</p>
                          <p className="text-lg font-bold text-orange-700">₹{formatCurrency(performanceMetrics.averageLoss)}</p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 mb-1">Expectancy</p>
                          <p className="text-lg font-bold text-purple-700">₹{performanceMetrics.expectancy}</p>
                        </div>
                        
                        <div className="bg-indigo-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-indigo-600 mb-1">Sharpe Ratio</p>
                          <p className="text-lg font-bold text-indigo-700">{performanceMetrics.sharpeRatio}</p>
                        </div>
                        
                        <div className="bg-teal-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-teal-600 mb-1">Largest Win</p>
                          <p className="text-lg font-bold text-teal-700">₹{formatCurrency(performanceMetrics.largestWin)}</p>
                        </div>
                        
                        <div className="bg-pink-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-pink-600 mb-1">Largest Loss</p>
                          <p className="text-lg font-bold text-pink-700">₹{formatCurrency(performanceMetrics.largestLoss)}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-600 mb-1">Avg. Trade</p>
                          <p className={`text-lg font-bold ${performanceMetrics.averageTrade >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            ₹{formatCurrency(performanceMetrics.averageTrade)}
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-yellow-600 mb-1">Total Profit</p>
                          <p className="text-lg font-bold text-yellow-700">₹{formatCurrency(performanceMetrics.totalProfit)}</p>
                        </div>
                        
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-red-600 mb-1">Total Loss</p>
                          <p className="text-lg font-bold text-red-700">₹{formatCurrency(performanceMetrics.totalLoss)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Management Metrics */}
                  {riskMetrics && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Risk Management Analysis
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-red-600 mb-1">Max Drawdown</p>
                          <p className="text-xl font-bold text-red-700">₹{formatCurrency(riskMetrics.maxDrawdown)}</p>
                          <p className="text-sm text-red-500">({riskMetrics.maxDrawdownPercent}%)</p>
                        </div>
                        
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-orange-600 mb-1">Calmar Ratio</p>
                          <p className="text-xl font-bold text-orange-700">{riskMetrics.calmarRatio}</p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 mb-1">Value at Risk (95%)</p>
                          <p className="text-xl font-bold text-purple-700">₹{formatCurrency(riskMetrics.var95)}</p>
                        </div>
                        
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-600 mb-1">Drawdown Periods</p>
                          <p className="text-xl font-bold text-blue-700">{riskMetrics.drawdownPeriods}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Monthly Performance */}
                  {monthlyPerformance.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Monthly Performance (Last 12 Months)
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <div className="flex space-x-4 pb-4">
                          {monthlyPerformance.map((month) => (
                            <div key={month.month} className={`flex-shrink-0 w-32 rounded-lg p-4 text-center ${
                              month.profit > 0 ? 'bg-green-50' : month.profit < 0 ? 'bg-red-50' : 'bg-gray-50'
                            }`}>
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </p>
                              <p className={`text-lg font-bold mb-1 ${
                                month.profit > 0 ? 'text-green-700' : month.profit < 0 ? 'text-red-700' : 'text-gray-700'
                              }`}>
                                {month.profit > 0 ? '+' : ''}₹{formatCurrency(Math.abs(month.profit))}
                              </p>
                              <p className="text-xs text-gray-500">{month.trades} trades</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sector Analysis */}
                  {sectorAnalysis.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Sector Performance Analysis
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sectorAnalysis.map((sector) => (
                              <tr key={sector.sector}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {sector.sector}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                  sector.profit > 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {sector.profit > 0 ? '+' : ''}₹{formatCurrency(Math.abs(sector.profit))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {sector.winRate.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {sector.trades}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Strategy Performance */}
                  {strategies.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Strategy Performance Breakdown
                      </h3>
                      
                      <div className="space-y-4">
                        {strategies.map((strategy) => {
                          const strategyTrades = filteredTrades.filter(trade => trade.strategy === strategy);
                          const profitableTrades = strategyTrades.filter(trade => trade.profitLoss && trade.profitLoss > 0);
                          const totalProfit = strategyTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
                          const winRate = strategyTrades.length > 0 ? (profitableTrades.length / strategyTrades.length) * 100 : 0;
                          
                          return (
                            <div key={strategy} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{strategy}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  totalProfit > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {totalProfit > 0 ? '+' : ''}₹{formatCurrency(Math.abs(totalProfit))}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Win Rate</p>
                                  <p className="font-semibold">{winRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Total Trades</p>
                                  <p className="font-semibold">{strategyTrades.length}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Avg. Trade</p>
                                  <p className="font-semibold">
                                    ₹{strategyTrades.length > 0 ? formatCurrency(totalProfit / strategyTrades.length) : '0'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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

function SectorAnalysis({ data }: { data: any[] }) {
  if (!data || data.length === 0) return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200/80">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Sector Analysis</h3>
      <p className="text-gray-500">No sector data available for the selected period.</p>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200/80">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Sector Analysis</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Sector</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Net P/L</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Trades</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Win Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(item => (
              <tr key={item.sector}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{item.sector}</td>
                <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(item.profit)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{item.trades}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{item.winRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskMetrics({ metrics }: { metrics: any }) {
  if (!metrics) return null;
  // ... existing code ...
} 