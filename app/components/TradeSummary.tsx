'use client';

import { useState } from 'react';
import { Trade } from '../types/Trade';

interface TradeSummaryProps {
  trades: Trade[];
}

export default function TradeSummary({ trades }: TradeSummaryProps) {
  const [timeFrame, setTimeFrame] = useState<'all' | 'week' | 'month' | 'year'>('month');
  
  // Helper function to filter trades by time frame
  const filterTradesByTimeFrame = (trades: Trade[], timeFrame: 'all' | 'week' | 'month' | 'year') => {
    if (timeFrame === 'all') return trades;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeFrame === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeFrame === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeFrame === 'year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }
    
    return trades.filter(trade => new Date(trade.entryDate) >= cutoffDate);
  };
  
  // Filter trades based on selected time frame
  const filteredTrades = filterTradesByTimeFrame(trades, timeFrame);
  
  // Calculate analytics
  const totalTrades = filteredTrades.length;
  const closedTrades = filteredTrades.filter(trade => trade.exitPrice !== null && trade.exitPrice !== undefined).length;
  const openTrades = totalTrades - closedTrades;
  
  // Calculate P&L stats
  const totalPL = filteredTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const winningTrades = filteredTrades.filter(trade => (trade.profitLoss || 0) > 0).length;
  const losingTrades = filteredTrades.filter(trade => (trade.profitLoss || 0) < 0).length;
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
  
  // Calculate average P&L
  const avgPL = closedTrades > 0 ? totalPL / closedTrades : 0;
  const avgWinAmount = winningTrades > 0 
    ? filteredTrades.filter(trade => (trade.profitLoss || 0) > 0).reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / winningTrades 
    : 0;
  const avgLossAmount = losingTrades > 0 
    ? Math.abs(filteredTrades.filter(trade => (trade.profitLoss || 0) < 0).reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / losingTrades)
    : 0;
  
  // Calculate profit factor
  const grossProfit = filteredTrades.filter(trade => (trade.profitLoss || 0) > 0).reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const grossLoss = Math.abs(filteredTrades.filter(trade => (trade.profitLoss || 0) < 0).reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  // Calculate success by instrument type
  const stockTrades = filteredTrades.filter(trade => trade.instrumentType === 'STOCK');
  const futuresTrades = filteredTrades.filter(trade => trade.instrumentType === 'FUTURES');
  const optionsTrades = filteredTrades.filter(trade => trade.instrumentType === 'OPTIONS');
  
  const stockPL = stockTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const futuresPL = futuresTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const optionsPL = optionsTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  
  // Calculate success by trade type (LONG/SHORT)
  const longTrades = filteredTrades.filter(trade => trade.type === 'LONG');
  const shortTrades = filteredTrades.filter(trade => trade.type === 'SHORT');
  
  const longPL = longTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const shortPL = shortTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  
  // Helper function to format currency with 2 decimal places
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Trading Performance</h2>
        
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'week' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTimeFrame('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'month' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTimeFrame('month')}
          >
            Month
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'year' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTimeFrame('year')}
          >
            Year
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'all' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTimeFrame('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total P&L */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Total P&L</p>
          <p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPL >= 0 ? '+' : ''}₹{formatCurrency(totalPL)}
          </p>
        </div>
        
        {/* Win Rate */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Win Rate</p>
          <p className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
            {winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {winningTrades} wins, {losingTrades} losses
          </p>
        </div>
        
        {/* Profit Factor */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Profit Factor</p>
          <p className={`text-2xl font-bold ${profitFactor >= 1.5 ? 'text-green-600' : profitFactor >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
            {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Win ₹{formatCurrency(avgWinAmount)} / Loss ₹{formatCurrency(avgLossAmount)}
          </p>
        </div>
        
        {/* Total Trades */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-gray-800">{totalTrades}</p>
          <p className="text-xs text-gray-500 mt-1">
            {openTrades} open, {closedTrades} closed
          </p>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instrument Type Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Instrument Performance</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm">Stocks ({stockTrades.length})</p>
                <p className={`text-sm font-medium ${stockPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockPL >= 0 ? '+' : ''}₹{formatCurrency(stockPL)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${stockPL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(stockPL) / (Math.abs(stockPL) + Math.abs(futuresPL) + Math.abs(optionsPL)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm">Futures ({futuresTrades.length})</p>
                <p className={`text-sm font-medium ${futuresPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {futuresPL >= 0 ? '+' : ''}₹{formatCurrency(futuresPL)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${futuresPL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(futuresPL) / (Math.abs(stockPL) + Math.abs(futuresPL) + Math.abs(optionsPL)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm">Options ({optionsTrades.length})</p>
                <p className={`text-sm font-medium ${optionsPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {optionsPL >= 0 ? '+' : ''}₹{formatCurrency(optionsPL)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${optionsPL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(optionsPL) / (Math.abs(stockPL) + Math.abs(futuresPL) + Math.abs(optionsPL)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Long vs Short Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Long vs Short</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm">Long ({longTrades.length})</p>
                <p className={`text-sm font-medium ${longPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {longPL >= 0 ? '+' : ''}₹{formatCurrency(longPL)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${longPL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(longPL) / (Math.abs(longPL) + Math.abs(shortPL)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm">Short ({shortTrades.length})</p>
                <p className={`text-sm font-medium ${shortPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {shortPL >= 0 ? '+' : ''}₹{formatCurrency(shortPL)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${shortPL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(shortPL) / (Math.abs(longPL) + Math.abs(shortPL)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Average Trade */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Average Trade</h4>
              <p className={`text-xl font-bold ${avgPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgPL >= 0 ? '+' : ''}₹{formatCurrency(avgPL)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per completed trade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 