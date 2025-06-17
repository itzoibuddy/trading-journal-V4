'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay, addDays, startOfWeek, isToday } from 'date-fns';

interface Trade {
  id: number;
  symbol: string;
  type: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string;
  exitDate: string | null;
  profitLoss: number | null;
  notes: string | null;
  setupImageUrl?: string | null;
  strategy?: string | null;
  timeFrame?: string | null;
  marketCondition?: string | null;
  stopLoss?: number | null;
  targetPrice?: number | null;
  riskRewardRatio?: number | null;
  preTradeEmotion?: string | null;
  postTradeEmotion?: string | null;
  tradeConfidence?: number | null;
  tradeRating?: number | null;
  lessons?: string | null;
  instrumentType?: string | null;
  strikePrice?: number | null;
  expiryDate?: string | null;
  optionType?: string | null;
}

function getDayPL(trades: Trade[]) {
  return trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
}

function getDayTradeCount(trades: Trade[]) {
  return trades.length;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Market holidays (you can customize this for your region)
const marketHolidays = [
  '2024-01-26', '2024-03-08', '2024-03-25', '2024-04-14', '2024-05-01',
  '2024-08-15', '2024-10-02', '2024-11-01', '2024-12-25'
];

// Helper functions
function formatDateForComparison(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'yyyy-MM-dd');
}

function isSameDay(dateA: Date | string, dateB: Date | string) {
  return formatDateForComparison(dateA) === formatDateForComparison(dateB);
}

function getPLIntensity(pl: number, maxPL: number) {
  if (maxPL === 0) return 0;
  return Math.min(Math.abs(pl) / maxPL, 1);
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [dayTrades, setDayTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    totalPL: 0,
    tradingDays: 0,
    winningDays: 0,
    losingDays: 0,
    totalTrades: 0,
    winStreak: 0,
    lossStreak: 0,
    bestDay: 0,
    worstDay: 0,
    avgDailyPL: 0
  });
  const [weeklyTotals, setWeeklyTotals] = useState<number[]>([0, 0, 0, 0, 0]);
  const [showTradeDetails, setShowTradeDetails] = useState<boolean>(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number | null>(null);
  const [maxPLInMonth, setMaxPLInMonth] = useState(0);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(now);
  }, []);

  const year = currentMonth ? currentMonth.getFullYear() : new Date().getFullYear();
  const month = currentMonth ? currentMonth.getMonth() : new Date().getMonth();
  const daysInMonth = currentMonth ? getDaysInMonth(currentMonth) : 30;
  const firstDayOfWeek = currentMonth ? getDay(startOfMonth(currentMonth)) : 0;

  useEffect(() => {
    if (!currentMonth) return;
    
    async function loadTradesForMonth() {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        
        const data = await response.json();
        setAllTrades(data);
        
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        const monthTrades = data.filter((trade: Trade) => {
          const tradeDate = new Date(trade.entryDate);
          return tradeDate >= monthStart && tradeDate <= monthEnd;
        });

        const tradesByDay = new Map<string, Trade[]>();
        monthTrades.forEach((trade: Trade) => {
          const dayStr = formatDateForComparison(trade.entryDate);
          if (!tradesByDay.has(dayStr)) {
            tradesByDay.set(dayStr, []);
          }
          tradesByDay.get(dayStr)!.push(trade);
        });

        let winStreak = 0;
        let lossStreak = 0;
        let currentWinStreak = 0;
        let currentLossStreak = 0;
        let winningDays = 0;
        let losingDays = 0;
        let bestDay = 0;
        let worstDay = 0;
        let maxPL = 0;

        for (const [dayStr, dayTrades] of tradesByDay) {
          const dayPL = getDayPL(dayTrades);
          maxPL = Math.max(maxPL, Math.abs(dayPL));
          
          if (dayPL > 0) {
            winningDays++;
            currentWinStreak++;
            currentLossStreak = 0;
            winStreak = Math.max(winStreak, currentWinStreak);
            bestDay = Math.max(bestDay, dayPL);
          } else if (dayPL < 0) {
            losingDays++;
            currentLossStreak++;
            currentWinStreak = 0;
            lossStreak = Math.max(lossStreak, currentLossStreak);
            worstDay = Math.min(worstDay, dayPL);
          }
        }

        setMaxPLInMonth(maxPL);

        const totalPL = monthTrades.reduce((sum: number, trade: Trade) => sum + (trade.profitLoss || 0), 0);
        const tradingDays = tradesByDay.size;
        const avgDailyPL = tradingDays > 0 ? totalPL / tradingDays : 0;

        setMonthlyStats({
          totalPL,
          tradingDays,
          winningDays,
          losingDays,
          totalTrades: monthTrades.length,
          winStreak,
          lossStreak,
          bestDay,
          worstDay,
          avgDailyPL
        });
        
        const weeklyTotals: number[] = [];
        let currentWeekStart = startOfWeek(new Date(year, month, 1));
        
        for (let weekNum = 0; weekNum < 6; weekNum++) {
          const weekStart = addDays(currentWeekStart, weekNum * 7);
          const weekEnd = addDays(weekStart, 6);
          
          const weekTrades = data.filter((trade: Trade) => {
            const tradeDate = new Date(trade.entryDate);
            return tradeDate >= weekStart && tradeDate <= weekEnd;
          });
          
          const weekTotal = weekTrades.reduce((sum: number, trade: Trade) => sum + (trade.profitLoss || 0), 0);
          weeklyTotals.push(weekTotal);
        }
        
        setWeeklyTotals(weeklyTotals);
        
        if (selectedDate) {
          updateDayTrades(selectedDate, data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading trades:', err);
        setError('Failed to load trades. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTradesForMonth();
  }, [year, month, currentMonth]);
  
  useEffect(() => {
    if (selectedDate && allTrades.length > 0) {
      updateDayTrades(selectedDate, allTrades);
    }
  }, [selectedDate, allTrades]);
  
  function updateDayTrades(date: Date, trades: Trade[]) {
    const selectedDayStr = formatDateForComparison(date);
    const filteredTrades = trades.filter(trade => 
      formatDateForComparison(trade.entryDate) === selectedDayStr
    );
    setDayTrades(filteredTrades);
  }

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewTradeDetails = (index: number) => {
    setSelectedTradeIndex(index);
    setShowTradeDetails(true);
  };
  
  const handleCloseTradeDetails = () => {
    setSelectedTradeIndex(null);
    setShowTradeDetails(false);
  };

  const navigateToPreviousMonth = () => {
    if (currentMonth) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const navigateToNextMonth = () => {
    if (currentMonth) {
      setCurrentMonth(new Date(year, month + 1, 1));
    }
  };

  if (!selectedDate || !currentMonth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  📅
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Trading Calendar</h1>
                  <p className="text-sm text-gray-600">Track your daily performance and trading patterns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  ❌
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Monthly Stats Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly P&L</p>
                <p className={`text-2xl font-bold ${monthlyStats.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyStats.totalPL >= 0 ? '+' : ''}₹{monthlyStats.totalPL.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`p-3 rounded-full ${monthlyStats.totalPL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {monthlyStats.totalPL >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trading Days</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyStats.tradingDays}</p>
                <p className="text-sm text-gray-500">{monthlyStats.winningDays}W / {monthlyStats.losingDays}L</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                📊
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Streak</p>
                <p className="text-2xl font-bold text-orange-600">{monthlyStats.winStreak}</p>
                <p className="text-sm text-gray-500">days in a row</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                🔥
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Daily P&L</p>
                <p className={`text-2xl font-bold ${monthlyStats.avgDailyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyStats.avgDailyPL >= 0 ? '+' : ''}₹{Math.round(monthlyStats.avgDailyPL).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={navigateToPreviousMonth}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Previous
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
              <p className="text-sm text-gray-600">
                {monthlyStats.totalTrades} trades • {monthlyStats.tradingDays} trading days
              </p>
            </div>
            
            <button
              onClick={navigateToNextMonth}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading calendar data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {/* Day Headers */}
              {["", "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, idx) => (
                <div key={idx} className="text-center py-2">
                  <span className="text-sm font-semibold text-gray-600">{d}</span>
                </div>
              ))}
              
              {/* Week numbers and days */}
              {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIdx) => {
                const weekStart = weekIdx * 7;
                const weekDays = days.slice(weekStart, weekStart + 7);
                
                return (
                  <div key={weekIdx} className="contents">
                    {/* Week total */}
                    <div className="flex items-center justify-center bg-blue-50 rounded-lg border border-blue-200 h-16">
                      <div className="text-center">
                        <div className="text-xs font-medium text-blue-800">W{weekIdx + 1}</div>
                        <div className={`text-sm font-bold ${
                          weeklyTotals[weekIdx] > 0 ? 'text-green-600' : 
                          weeklyTotals[weekIdx] < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ₹{Math.abs(weeklyTotals[weekIdx] || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Days in week */}
                    {weekDays.map((date, dayIdx) => {
                      if (!date) {
                        return <div key={`empty-${weekIdx}-${dayIdx}`} className="h-16" />;
                      }

                      const dayStr = formatDateForComparison(date);
                      const dayTrades = allTrades.filter(trade => 
                        formatDateForComparison(trade.entryDate) === dayStr
                      );
                      
                      const pl = getDayPL(dayTrades);
                      const count = getDayTradeCount(dayTrades);
                      const dayOfWeek = date.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isHoliday = marketHolidays.includes(dayStr);
                      const isCurrentDay = isToday(date);
                      const isSelected = selectedDate && isSameDay(date, selectedDate);
                      
                      let bgClass = 'bg-white border-gray-200';
                      let textClass = 'text-gray-700';
                      
                      if (isHoliday) {
                        bgClass = 'bg-yellow-50 border-yellow-300';
                        textClass = 'text-yellow-700';
                      } else if (isWeekend) {
                        bgClass = 'bg-gray-50 border-gray-200';
                        textClass = 'text-gray-400';
                      } else if (count > 0) {
                        const intensity = getPLIntensity(pl, maxPLInMonth);
                        if (pl > 0) {
                          const greenShade = Math.min(Math.round(intensity * 400) + 100, 500);
                          bgClass = `bg-green-${greenShade} border-green-400`;
                          textClass = 'text-green-800';
                        } else {
                          const redShade = Math.min(Math.round(intensity * 400) + 100, 500);
                          bgClass = `bg-red-${redShade} border-red-400`;
                          textClass = 'text-red-800';
                        }
                      }
                      
                      if (isSelected) {
                        bgClass += ' ring-2 ring-blue-500 ring-offset-1';
                      }
                      
                      if (isCurrentDay) {
                        bgClass += ' ring-2 ring-indigo-400';
                      }

                      return (
                        <button
                          key={dayIdx}
                          onClick={() => handleDateClick(date)}
                          className={`h-16 border rounded-lg hover:ring-2 hover:ring-blue-300 transition-all ${bgClass} flex flex-col items-center justify-center p-1`}
                        >
                          <span className={`font-bold text-sm ${textClass}`}>
                            {date.getDate()}
                          </span>
                          {!isWeekend && !isHoliday && count > 0 && (
                            <>
                              <span className={`text-xs font-medium ${textClass}`}>
                                ₹{Math.abs(pl).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {count}
                              </span>
                            </>
                          )}
                          {isHoliday && (
                            <span className="text-xs text-yellow-600">Holiday</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Day Details */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Trades on {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
            </h3>
            {dayTrades.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Day P&L</p>
                  <p className={`text-lg font-bold ${getDayPL(dayTrades) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getDayPL(dayTrades) >= 0 ? '+' : ''}₹{getDayPL(dayTrades).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {dayTrades.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-gray-500">No trades on this day</p>
              </div>
            )}
            
            {dayTrades.map((trade, index) => (
              <div key={trade.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${trade.profitLoss && trade.profitLoss > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h4 className="font-semibold text-gray-900">{trade.symbol}</h4>
                      <p className="text-sm text-gray-600">
                        {trade.type} • {trade.strategy || 'No Strategy'} • {trade.quantity} shares
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-bold ${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profitLoss ? `${trade.profitLoss > 0 ? '+' : ''}₹${trade.profitLoss.toLocaleString('en-IN')}` : '-'}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{trade.entryPrice.toLocaleString('en-IN')} → {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : 'Open'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleViewTradeDetails(index)}
                      className="flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      👁️ Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Details Modal */}
        {showTradeDetails && selectedTradeIndex !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {dayTrades[selectedTradeIndex].symbol} Trade Details
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(dayTrades[selectedTradeIndex].entryDate), 'PPP')}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseTradeDetails}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Trade Setup Image */}
                {dayTrades[selectedTradeIndex].setupImageUrl && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Trade Setup</h4>
                    <img 
                      src={dayTrades[selectedTradeIndex].setupImageUrl} 
                      alt="Trade Setup" 
                      className="w-full rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
                      }}
                    />
                  </div>
                )}
                
                {/* Trade Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Symbol</p>
                    <p className="text-lg font-bold text-blue-900">{dayTrades[selectedTradeIndex].symbol}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Type</p>
                    <p className="text-lg font-bold text-green-900">{dayTrades[selectedTradeIndex].type}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Strategy</p>
                    <p className="text-lg font-bold text-purple-900">{dayTrades[selectedTradeIndex].strategy || '-'}</p>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium">P&L</p>
                    <p className={`text-lg font-bold ${dayTrades[selectedTradeIndex].profitLoss && dayTrades[selectedTradeIndex].profitLoss > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {dayTrades[selectedTradeIndex].profitLoss 
                        ? `${dayTrades[selectedTradeIndex].profitLoss > 0 ? '+' : ''}₹${dayTrades[selectedTradeIndex].profitLoss.toLocaleString('en-IN')}` 
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Additional Trade Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Price Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entry Price:</span>
                        <span className="font-medium">₹{dayTrades[selectedTradeIndex].entryPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Exit Price:</span>
                        <span className="font-medium">
                          {dayTrades[selectedTradeIndex].exitPrice 
                            ? `₹${dayTrades[selectedTradeIndex].exitPrice.toLocaleString('en-IN')}` 
                            : 'Not closed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{dayTrades[selectedTradeIndex].quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stop Loss:</span>
                        <span className="font-medium">
                          {dayTrades[selectedTradeIndex].stopLoss 
                            ? `₹${dayTrades[selectedTradeIndex].stopLoss.toLocaleString('en-IN')}` 
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Trade Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk-Reward:</span>
                        <span className="font-medium">{dayTrades[selectedTradeIndex].riskRewardRatio || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">
                          {dayTrades[selectedTradeIndex].tradeConfidence ? `${dayTrades[selectedTradeIndex].tradeConfidence}/10` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating:</span>
                        <span className="font-medium">
                          {dayTrades[selectedTradeIndex].tradeRating ? `${dayTrades[selectedTradeIndex].tradeRating}/10` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Frame:</span>
                        <span className="font-medium">{dayTrades[selectedTradeIndex].timeFrame || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes and Lessons */}
                {(dayTrades[selectedTradeIndex].notes || dayTrades[selectedTradeIndex].lessons) && (
                  <div className="border-t border-gray-200 pt-6">
                    {dayTrades[selectedTradeIndex].notes && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Trade Notes</h4>
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{dayTrades[selectedTradeIndex].notes}</p>
                      </div>
                    )}
                    
                    {dayTrades[selectedTradeIndex].lessons && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Lessons Learned</h4>
                        <p className="text-gray-700 bg-blue-50 rounded-lg p-3">{dayTrades[selectedTradeIndex].lessons}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 