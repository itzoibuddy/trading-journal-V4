'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { getTrades } from './actions/trade';
import LoadingSpinner from './components/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Color constants for chart
const POSITIVE_COLOR = 'rgb(22, 163, 74)'; // Green
const NEGATIVE_COLOR = 'rgb(220, 38, 38)'; // Red
const POSITIVE_BG_COLOR = 'rgba(22, 163, 74, 0.1)';
const NEGATIVE_BG_COLOR = 'rgba(220, 38, 38, 0.1)';

// Type definition for performance data
interface PerformanceData {
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageProfitLoss: number;
  profitFactor: number;
  largestProfit: number;
  largestLoss: number;
  averageWin: number;
  averageLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    totalTrades: 0,
    profitableTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfitLoss: 0,
    averageProfitLoss: 0,
    profitFactor: 0,
    largestProfit: 0,
    largestLoss: 0,
    averageWin: 0,
    averageLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
  });
  
  const [equityCurveData, setEquityCurveData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        label: 'Equity Curve',
        data: [],
        borderColor: POSITIVE_COLOR,
        backgroundColor: POSITIVE_BG_COLOR,
        tension: 0.3,
        fill: true,
      },
    ],
  });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const tradesData = await getTrades();
        setTrades(tradesData);
        
        if (tradesData.length > 0) {
          processTradeData(tradesData);
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const processTradeData = (tradesData: any[]) => {
    // Sort trades by entry date
    const sortedTrades = [...tradesData].sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    // Calculate basic metrics
    const totalTrades = sortedTrades.length;
    const profitableTrades = sortedTrades.filter(t => t.profitLoss > 0).length;
    const losingTrades = sortedTrades.filter(t => t.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    
    const totalProfitLoss = sortedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const averageProfitLoss = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;
    
    const totalProfit = sortedTrades
      .filter(t => t.profitLoss > 0)
      .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
      
    const totalLoss = Math.abs(sortedTrades
      .filter(t => t.profitLoss < 0)
      .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
      
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const largestProfit = sortedTrades.reduce((max, trade) => 
      trade.profitLoss > max ? trade.profitLoss : max, 0);
      
    const largestLoss = sortedTrades.reduce((min, trade) => 
      trade.profitLoss < min ? trade.profitLoss : min, 0);
      
    const averageWin = profitableTrades > 0 
      ? sortedTrades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0) / profitableTrades 
      : 0;
      
    const averageLoss = losingTrades > 0 
      ? sortedTrades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0) / losingTrades 
      : 0;
    
    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    
    sortedTrades.forEach(trade => {
      if (trade.profitLoss > 0) {
        currentConsecutiveWins++;
        currentConsecutiveLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentConsecutiveWins);
      } else if (trade.profitLoss < 0) {
        currentConsecutiveLosses++;
        currentConsecutiveWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
      }
    });
    
    // Generate equity curve data
    let runningTotal = 0;
    const equityPoints = sortedTrades.map(trade => {
      runningTotal += (trade.profitLoss || 0);
      return {
        date: new Date(trade.entryDate).toLocaleDateString(),
        equity: runningTotal
      };
    });
    
    // Group by date for the chart
    const equityByDate = equityPoints.reduce((acc: Record<string, number>, point) => {
      acc[point.date] = point.equity;
      return acc;
    }, {});
    
    const chartLabels = Object.keys(equityByDate);
    const chartData = Object.values(equityByDate) as number[];
    
    setPerformanceData({
      totalTrades,
      profitableTrades,
      losingTrades,
      winRate,
      totalProfitLoss,
      averageProfitLoss,
      profitFactor,
      largestProfit,
      largestLoss,
      averageWin,
      averageLoss,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
    });
    
    setEquityCurveData({
      labels: chartLabels,
      datasets: [
        {
          label: 'Equity Curve',
          data: chartData,
          segment: {
            borderColor: ctx => chartData[ctx.p1DataIndex] >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR,
            backgroundColor: ctx => chartData[ctx.p1DataIndex] >= 0 ? POSITIVE_BG_COLOR : NEGATIVE_BG_COLOR
          },
          tension: 0.3,
          fill: true,
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Trading Dashboard</h2>
      </div>
      
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total P&L</h3>
          <p className={`text-2xl font-bold ${performanceData.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{performanceData.totalProfitLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Avg: ₹{performanceData.averageProfitLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })} per trade
          </p>
        </div>
        
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Win Rate</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {performanceData.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData.profitableTrades} / {performanceData.totalTrades} trades
          </p>
        </div>
        
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Profit Factor</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {performanceData.profitFactor.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total profit / Total loss
          </p>
        </div>
        
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Trades</h3>
          <p className="text-2xl font-bold text-gray-900">
            {performanceData.totalTrades}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceData.profitableTrades} profitable / {performanceData.losingTrades} losing
          </p>
        </div>
      </div>
      
      {/* Equity Curve */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity Curve</h3>
        {trades.length > 0 ? (
          <div className="h-64">
            <Line 
              data={equityCurveData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: {
                      display: true,
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                      callback: value => '₹' + Number(value).toLocaleString('en-IN')
                    }
                  },
                  x: {
                    grid: {
                      display: false,
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: context => '₹' + context.parsed.y.toLocaleString('en-IN')
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No trade data available to display equity curve.
          </div>
        )}
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Statistics */}
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Statistics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Largest Profit</span>
              <span className="font-medium text-green-600">
                ₹{performanceData.largestProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Largest Loss</span>
              <span className="font-medium text-red-600">
                ₹{performanceData.largestLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Average Win</span>
              <span className="font-medium text-green-600">
                ₹{performanceData.averageWin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Average Loss</span>
              <span className="font-medium text-red-600">
                ₹{performanceData.averageLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Win/Loss Ratio</span>
              <span className="font-medium text-indigo-600">
                {performanceData.averageLoss !== 0 
                  ? Math.abs(performanceData.averageWin / performanceData.averageLoss).toFixed(2) 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Consistency Metrics */}
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consistency Metrics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Max Consecutive Wins</span>
              <span className="font-medium text-green-600">{performanceData.consecutiveWins}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Max Consecutive Losses</span>
              <span className="font-medium text-red-600">{performanceData.consecutiveLosses}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Profit Factor</span>
              <span className="font-medium text-indigo-600">{performanceData.profitFactor.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expectancy</span>
              <span className="font-medium text-indigo-600">
                ₹{((performanceData.winRate / 100 * performanceData.averageWin) + 
                  ((100 - performanceData.winRate) / 100 * performanceData.averageLoss)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/trades" className="bg-white shadow rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <svg className="h-12 w-12 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="font-medium text-gray-900">Manage Trades</h3>
          <p className="text-sm text-gray-500 mt-1">View, add, edit, and analyze your trades</p>
        </Link>
        
        <Link href="/analytics" className="bg-white shadow rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <svg className="h-12 w-12 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="font-medium text-gray-900">View Analytics</h3>
          <p className="text-sm text-gray-500 mt-1">Detailed performance analytics and insights</p>
        </Link>
        
        <Link href="/heatmaps" className="bg-white shadow rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <svg className="h-12 w-12 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="font-medium text-gray-900">Performance Heatmaps</h3>
          <p className="text-sm text-gray-500 mt-1">Visualize performance patterns and trends</p>
        </Link>
      </div>
    </div>
  );
}
