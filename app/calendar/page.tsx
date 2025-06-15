'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { getTradesByDate } from '../actions/trade';

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

export default function CalendarPage() {
  // Initialize with empty values first
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dayTrades, setDayTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [weeklyTotals, setWeeklyTotals] = useState<number[]>([0, 0, 0, 0, 0]);
  const [showTradeDetails, setShowTradeDetails] = useState<boolean>(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number | null>(null);

  // Set the current date in useEffect to ensure it runs on the client
  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(now);
  }, []);

  // Only calculate these values if currentMonth is set
  const year = currentMonth ? currentMonth.getFullYear() : new Date().getFullYear();
  const month = currentMonth ? currentMonth.getMonth() : new Date().getMonth();
  const daysInMonth = currentMonth ? getDaysInMonth(currentMonth) : 30;
  const firstDayOfWeek = currentMonth ? getDay(startOfMonth(currentMonth)) : 0; // 0 (Sun) - 6 (Sat)

  useEffect(() => {
    if (!selectedDate || !currentMonth) return;
    
    async function loadTradesForMonth() {
      try {
        setIsLoading(true);
        
        // Fetch all trades instead of filtering by date
        const response = await fetch('/api/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        setTrades(data);
        
        // Calculate monthly total
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        const monthTrades = data.filter((trade: Trade) => {
          const tradeDate = new Date(trade.entryDate);
          return tradeDate >= monthStart && tradeDate <= monthEnd;
        });
        
        const total = monthTrades.reduce((sum: number, trade: Trade) => sum + (trade.profitLoss || 0), 0);
        setMonthlyTotal(total);
        
        // Calculate weekly totals
        const weeklyTotals: number[] = [];
        
        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        
        // Find the first Sunday that's either in the month or the last Sunday of the previous month
        let currentWeekStart = startOfWeek(firstDay);
        
        // Calculate for up to 6 weeks (maximum number of weeks that can appear in a month view)
        for (let weekNum = 0; weekNum < 6; weekNum++) {
          const weekStart = addDays(currentWeekStart, weekNum * 7);
          const weekEnd = addDays(weekStart, 6);
          
          // Filter trades for this week
          const weekTrades = data.filter((trade: Trade) => {
            const tradeDate = new Date(trade.entryDate);
            return tradeDate >= weekStart && tradeDate <= weekEnd;
          });
          
          // Calculate total for this week
          const weekTotal = weekTrades.reduce((sum: number, trade: Trade) => sum + (trade.profitLoss || 0), 0);
          weeklyTotals.push(weekTotal);
        }
        
        setWeeklyTotals(weeklyTotals);
        
        // Load trades for the selected day
        if (selectedDate) {
          await loadTradesForDay(selectedDate);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading trades:', err);
        setError('Failed to load trades. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    async function loadTradesForDay(date: Date) {
      try {
        const dayTrades = await getTradesByDate(date);
        setDayTrades(dayTrades.map(trade => ({
          ...trade,
          entryDate: trade.entryDate.toISOString(),
          exitDate: trade.exitDate?.toISOString() || null,
          expiryDate: trade.expiryDate?.toISOString() || null,
        })));
      } catch (err) {
        console.error('Error loading day trades:', err);
      }
    }
    
    loadTradesForMonth();
    
    // Load trades for the selected day
    loadTradesForDay(selectedDate);
  }, [year, month, selectedDate, currentMonth]);

  // Build the grid for the month
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null); // Empty cells for previous month
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    try {
      const dayTrades = await getTradesByDate(date);
      setDayTrades(dayTrades.map(trade => ({
        ...trade,
        entryDate: trade.entryDate.toISOString(),
        exitDate: trade.exitDate?.toISOString() || null,
        expiryDate: trade.expiryDate?.toISOString() || null,
      })));
    } catch (err) {
      console.error('Error loading day trades:', err);
      setError('Failed to load trades for the selected day.');
    }
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

  // Show loading state if date isn't initialized yet
  if (!selectedDate || !currentMonth) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Trade Calendar (P&amp;L in INR)</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="flex justify-center items-center mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg inline-block">
          <div className="px-4 py-2 text-center">
            <span className="text-lg font-semibold mr-4 text-blue-900">
              {monthNames[month]} {year}
            </span>
            <span className={`font-mono font-bold ${monthlyTotal < 0 ? 'text-red-600' : monthlyTotal > 0 ? 'text-green-600' : ''}`}>
              Total {monthlyTotal < 0 ? '-' : monthlyTotal > 0 ? '+' : ''}₹{Math.abs(monthlyTotal).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          onClick={navigateToPreviousMonth}
        >
          &lt;
        </button>
        <div className="flex-grow"></div>
        <button
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          onClick={navigateToNextMonth}
        >
          &gt;
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">Loading calendar data...</div>
      ) : (
        <div className="flex">
          <div className="flex-grow">
            <div className="grid grid-cols-7 gap-1">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <div key={d} className="text-xs font-bold text-center text-gray-500 mb-1">{d}</div>
              ))}
              {days.map((date, idx) => {
                if (!date) {
                  return <div key={idx} />;
                }
                
                // Find trades for this day
                const dayTrades = trades.filter(trade => 
                  isSameDay(new Date(trade.entryDate), date)
                );
                
                const pl = getDayPL(dayTrades);
                const count = getDayTradeCount(dayTrades);
                
                // Check if it's a weekend (market holiday)
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
                
                let bg = 'bg-white';
                let border = 'border border-gray-200';
                let textColor = 'text-gray-700';
                
                if (isWeekend) {
                  bg = 'bg-gray-100';
                  textColor = 'text-gray-400';
                } else if (count > 0 && pl > 0) {
                  bg = 'bg-green-100';
                  border = 'border border-green-500';
                  textColor = 'text-green-600';
                } else if (count > 0 && pl < 0) {
                  bg = 'bg-red-100';
                  border = 'border border-red-500';
                  textColor = 'text-red-600';
                }
                
                // Highlight the selected date
                if (selectedDate && isSameDay(date, selectedDate)) {
                  border = 'border-2 border-blue-500';
                }
                
                return (
                  <button
                    key={idx}
                    className={`flex flex-col items-center justify-center h-[70px] ${bg} ${border} hover:border-blue-400 rounded-md`}
                    onClick={() => handleDateClick(date)}
                  >
                    <span className="font-bold">{date.getDate()}</span>
                    {!isWeekend ? (
                      <span className={textColor}>
                        ₹{pl !== 0 ? Math.abs(pl).toLocaleString('en-IN') : '0'}
                      </span>
                    ) : null}
                    {count > 0 && !isWeekend && (
                      <span className="text-xs text-gray-600">
                        {count} trade{count > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="ml-2" style={{ width: '120px' }}>
            {weeklyTotals.slice(0, 5).map((total, idx) => (
              <div 
                key={idx} 
                className="bg-blue-50 border border-blue-200 rounded-md mb-1"
                style={{ height: '70px' }}
              >
                <div className="text-center text-blue-800 font-semibold pt-2">Week {idx + 1}</div>
                <div className={`text-center ${total < 0 ? 'text-red-600' : total > 0 ? 'text-green-600' : 'text-gray-700'} pt-1`}>
                  {total !== 0 ? `₹${Math.abs(total).toLocaleString('en-IN')}` : '₹0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-white shadow border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Trades on {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}</h2>
        <ul className="divide-y divide-gray-200">
          {dayTrades.length === 0 && (
            <li className="py-2 text-gray-500">No trades on this day.</li>
          )}
          {dayTrades.map((trade, index) => (
            <li key={trade.id} className="py-2 flex justify-between items-center">
              <div>
                <span className="font-medium">{trade.symbol}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {trade.type === 'LONG' ? 'Long' : 'Short'}
                </span>
              </div>
              <div className="flex items-center">
                <span className={`mr-4 ${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.profitLoss ? `₹${trade.profitLoss.toLocaleString('en-IN')}` : '-'}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTradeDetails(index);
                  }}
                  className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md"
                >
                  Details
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Trade Details Modal */}
      {showTradeDetails && selectedTradeIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Trade Details: {dayTrades[selectedTradeIndex].symbol}
                </h3>
                <button
                  onClick={handleCloseTradeDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Trade Setup Screenshot */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {dayTrades[selectedTradeIndex].setupImageUrl ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Trade Setup</h4>
                      <img 
                        src={dayTrades[selectedTradeIndex].setupImageUrl} 
                        alt="Trade Setup" 
                        className="w-full rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
                      No screenshot available
                    </div>
                  )}
                </div>
                
                {/* Trade Information */}
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Trade Information</h4>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Symbol</p>
                      <p className="font-medium">{dayTrades[selectedTradeIndex].symbol}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className={`font-medium ${dayTrades[selectedTradeIndex].type === 'LONG' ? 'text-green-700' : 'text-red-700'}`}>
                        {dayTrades[selectedTradeIndex].type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Strategy</p>
                      <p className="font-medium">{dayTrades[selectedTradeIndex].strategy || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time Frame</p>
                      <p className="font-medium">{dayTrades[selectedTradeIndex].timeFrame || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Entry Price</p>
                      <p className="font-medium">₹{dayTrades[selectedTradeIndex].entryPrice.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Exit Price</p>
                      <p className="font-medium">
                        {dayTrades[selectedTradeIndex].exitPrice 
                          ? `₹${dayTrades[selectedTradeIndex].exitPrice.toLocaleString('en-IN')}` 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-medium">{dayTrades[selectedTradeIndex].quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit/Loss</p>
                      <p className={`font-medium ${dayTrades[selectedTradeIndex].profitLoss && dayTrades[selectedTradeIndex].profitLoss > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {dayTrades[selectedTradeIndex].profitLoss 
                          ? `${dayTrades[selectedTradeIndex].profitLoss > 0 ? '+' : ''}₹${dayTrades[selectedTradeIndex].profitLoss.toLocaleString('en-IN')}` 
                          : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Trade Analysis</h4>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Risk-Reward Ratio</p>
                        <p className="font-medium">{dayTrades[selectedTradeIndex].riskRewardRatio || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stop Loss</p>
                        <p className="font-medium">
                          {dayTrades[selectedTradeIndex].stopLoss 
                            ? `₹${dayTrades[selectedTradeIndex].stopLoss.toLocaleString('en-IN')}` 
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Target Price</p>
                        <p className="font-medium">
                          {dayTrades[selectedTradeIndex].targetPrice 
                            ? `₹${dayTrades[selectedTradeIndex].targetPrice.toLocaleString('en-IN')}` 
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Market Condition</p>
                        <p className="font-medium">{dayTrades[selectedTradeIndex].marketCondition || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pre-Trade Emotion</p>
                        <p className="font-medium">{dayTrades[selectedTradeIndex].preTradeEmotion || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Post-Trade Emotion</p>
                        <p className="font-medium">{dayTrades[selectedTradeIndex].postTradeEmotion || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trade Confidence</p>
                        <div className="flex items-center">
                          {dayTrades[selectedTradeIndex].tradeConfidence ? (
                            <>
                              <span className={`font-medium ${
                                dayTrades[selectedTradeIndex].tradeConfidence >= 8 ? 'text-green-700' : 
                                dayTrades[selectedTradeIndex].tradeConfidence >= 5 ? 'text-amber-600' : 
                                'text-red-700'
                              }`}>
                                {dayTrades[selectedTradeIndex].tradeConfidence}
                              </span>
                              <span className="ml-1 text-gray-400 text-xs">/10</span>
                            </>
                          ) : '-'}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trade Rating</p>
                        <div className="flex items-center">
                          {dayTrades[selectedTradeIndex].tradeRating ? (
                            <>
                              <span className={`font-medium ${
                                dayTrades[selectedTradeIndex].tradeRating >= 8 ? 'text-green-700' : 
                                dayTrades[selectedTradeIndex].tradeRating >= 5 ? 'text-amber-600' : 
                                'text-red-700'
                              }`}>
                                {dayTrades[selectedTradeIndex].tradeRating}
                              </span>
                              <span className="ml-1 text-gray-400 text-xs">/10</span>
                            </>
                          ) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(dayTrades[selectedTradeIndex].notes || dayTrades[selectedTradeIndex].lessons) && (
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      {dayTrades[selectedTradeIndex].notes && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Notes</p>
                          <p className="text-sm">{dayTrades[selectedTradeIndex].notes}</p>
                        </div>
                      )}
                      
                      {dayTrades[selectedTradeIndex].lessons && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Lessons Learned</p>
                          <p className="text-sm">{dayTrades[selectedTradeIndex].lessons}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 