'use client';

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
      })));
    } catch (err) {
      console.error('Error loading day trades:', err);
      setError('Failed to load trades for the selected day.');
    }
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
          {dayTrades.map((trade) => (
            <li key={trade.id} className="py-2 flex justify-between items-center">
              <div>
                <span className="font-medium">{trade.symbol}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {trade.type === 'LONG' ? 'Long' : 'Short'}
                </span>
              </div>
              <span className={trade.profitLoss && trade.profitLoss > 0 ? 'text-green-600' : 'text-red-600'}>
                {trade.profitLoss ? `₹${trade.profitLoss.toLocaleString('en-IN')}` : '-'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 