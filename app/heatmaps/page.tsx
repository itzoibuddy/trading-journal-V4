'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/app/types/Trade';
import { format, parseISO, getDay } from 'date-fns';

// Define the color scale for the heatmap
const getHeatmapColor = (value: number, max: number, min: number) => {
  // Normalize the value between 0 and 1
  const normalized = (value - min) / (max - min || 1);
  
  if (value > 0) {
    // Green scale for positive values
    return `rgba(0, 128, 0, ${0.2 + normalized * 0.8})`;
  } else {
    // Red scale for negative values
    return `rgba(220, 53, 69, ${0.2 + Math.abs(normalized) * 0.8})`;
  }
};

export default function HeatmapsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('profitLoss');

  // Fetch trades data
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        setTrades(data);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Filter trades based on selected timeframe
  const filteredTrades = useMemo(() => {
    if (timeframe === 'all') return trades;

    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return trades;
    }

    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return tradeDate >= startDate && tradeDate <= now;
    });
  }, [trades, timeframe]);

  // Day of Week Heatmap Data
  const dayOfWeekData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map(day => ({
      day,
      trades: 0,
      profitLoss: 0,
      winRate: 0,
      avgReturn: 0,
    }));

    filteredTrades.forEach(trade => {
      // Use entryDate which is the correct property name
      const dateString = trade.entryDate;
      if (!dateString) return;
      
      // Fix: Handle both string and Date types
      const date = typeof dateString === 'string' 
        ? parseISO(dateString) 
        : dateString; // If it's already a Date object, use it directly
        
      const dayIndex = getDay(date);
      
      dayStats[dayIndex].trades += 1;
      // Fix: Handle null/undefined profitLoss
      dayStats[dayIndex].profitLoss += (trade.profitLoss ?? 0);
      
      // Fix: Check if profitLoss exists and is greater than 0
      if ((trade.profitLoss ?? 0) > 0) {
        dayStats[dayIndex].winRate += 1;
      }
    });

    // Calculate win rate percentage and average return
    dayStats.forEach(stat => {
      if (stat.trades > 0) {
        stat.winRate = (stat.winRate / stat.trades) * 100;
        stat.avgReturn = stat.profitLoss / stat.trades;
      }
    });

    return dayStats;
  }, [filteredTrades]);

  // Sector Performance Data
  const sectorData = useMemo(() => {
    const sectors: Record<string, { trades: number; profitLoss: number; winRate: number; avgReturn: number }> = {};

    filteredTrades.forEach(trade => {
      const sector = trade.sector || 'Unknown';
      
      if (!sectors[sector]) {
        sectors[sector] = { trades: 0, profitLoss: 0, winRate: 0, avgReturn: 0 };
      }
      
      sectors[sector].trades += 1;
      // Fix: Handle null/undefined profitLoss
      sectors[sector].profitLoss += (trade.profitLoss ?? 0);
      
      // Fix: Check if profitLoss exists and is greater than 0
      if ((trade.profitLoss ?? 0) > 0) {
        sectors[sector].winRate += 1;
      }
    });

    // Calculate win rate percentage and average return
    Object.keys(sectors).forEach(sector => {
      if (sectors[sector].trades > 0) {
        sectors[sector].winRate = (sectors[sector].winRate / sectors[sector].trades) * 100;
        sectors[sector].avgReturn = sectors[sector].profitLoss / sectors[sector].trades;
      }
    });

    // Convert to array and sort by profit/loss
    return Object.entries(sectors)
      .map(([sector, stats]) => ({ sector, ...stats }))
      .sort((a, b) => b.profitLoss - a.profitLoss);
  }, [filteredTrades]);

  // Trade Size vs Performance Data
  const tradeSizeData = useMemo(() => {
    // Define size buckets
    const sizeBuckets = [
      { name: 'Very Small', min: 0, max: 1000 },
      { name: 'Small', min: 1000, max: 5000 },
      { name: 'Medium', min: 5000, max: 10000 },
      { name: 'Large', min: 10000, max: 50000 },
      { name: 'Very Large', min: 50000, max: Infinity }
    ];

    const sizeStats = sizeBuckets.map(bucket => ({
      ...bucket,
      trades: 0,
      profitLoss: 0,
      winRate: 0,
      avgReturn: 0,
      returnPercentage: 0,
    }));

    filteredTrades.forEach(trade => {
      // Fix: Use only quantity property, not size
      const tradeSize = trade.quantity * trade.entryPrice;
      
      const bucketIndex = sizeBuckets.findIndex(
        bucket => tradeSize >= bucket.min && tradeSize < bucket.max
      );
      
      if (bucketIndex !== -1) {
        sizeStats[bucketIndex].trades += 1;
        // Fix: Handle null/undefined profitLoss
        sizeStats[bucketIndex].profitLoss += (trade.profitLoss ?? 0);
        
        // Fix: Check if profitLoss exists and is greater than 0
        if ((trade.profitLoss ?? 0) > 0) {
          sizeStats[bucketIndex].winRate += 1;
        }

        // Calculate return percentage - handle potential null/undefined
        const profitLoss = trade.profitLoss ?? 0;
        sizeStats[bucketIndex].returnPercentage += (profitLoss / tradeSize) * 100;
      }
    });

    // Calculate averages
    sizeStats.forEach(stat => {
      if (stat.trades > 0) {
        stat.winRate = (stat.winRate / stat.trades) * 100;
        stat.avgReturn = stat.profitLoss / stat.trades;
        stat.returnPercentage = stat.returnPercentage / stat.trades;
      }
    });

    return sizeStats.filter(stat => stat.trades > 0);
  }, [filteredTrades]);

  // Get min and max values for the selected metric
  const getMinMaxValues = (data: any[], metric: string) => {
    const values = data.map(item => item[metric]).filter(val => !isNaN(val));
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  const dayOfWeekMinMax = getMinMaxValues(dayOfWeekData, selectedMetric);
  const sectorMinMax = getMinMaxValues(sectorData, selectedMetric);
  const tradeSizeMinMax = getMinMaxValues(tradeSizeData, selectedMetric);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Performance Heatmaps</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="quarter">Past Quarter</option>
            <option value="year">Past Year</option>
          </select>
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="profitLoss">Profit/Loss</option>
            <option value="winRate">Win Rate</option>
            <option value="avgReturn">Avg Return</option>
            <option value="trades">Trade Count</option>
          </select>
        </div>
      </div>

      {/* Day of Week Heatmap */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Day of Week</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedMetric === 'profitLoss' ? 'Profit/Loss' : 
                   selectedMetric === 'winRate' ? 'Win Rate' : 
                   selectedMetric === 'avgReturn' ? 'Avg Return' : 'Trade Count'}
                </th>
                <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dayOfWeekData.map((day, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {day.day}
                  </td>
                  <td 
                    className="py-3 px-4 whitespace-nowrap text-sm text-gray-500"
                    style={{ 
                      backgroundColor: day.trades > 0 
                        ? getHeatmapColor(
                            day[selectedMetric as keyof typeof day] as number, 
                            dayOfWeekMinMax.max, 
                            dayOfWeekMinMax.min
                          ) 
                        : 'transparent' 
                    }}
                  >
                    {selectedMetric === 'profitLoss' ? `₹${day.profitLoss.toLocaleString('en-IN')}` :
                     selectedMetric === 'winRate' ? `${day.winRate.toFixed(1)}%` :
                     selectedMetric === 'avgReturn' ? `₹${day.avgReturn.toFixed(2)}` :
                     day.trades}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {day.trades > 0 ? (
                      <div className="flex flex-col">
                        <span>{day.trades} trade{day.trades !== 1 ? 's' : ''}</span>
                        <span className={day.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{day.profitLoss.toLocaleString('en-IN')}
                        </span>
                        <span>{day.winRate.toFixed(1)}% win rate</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No trades</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sector Performance Heatmap */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Sector</h3>
        
        {sectorData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No sector data available.</p>
            <p className="mt-2 text-sm">Add sector information to your trades to see this analysis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedMetric === 'profitLoss' ? 'Profit/Loss' : 
                     selectedMetric === 'winRate' ? 'Win Rate' : 
                     selectedMetric === 'avgReturn' ? 'Avg Return' : 'Trade Count'}
                  </th>
                  <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sectorData.map((sector, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sector.sector}
                    </td>
                    <td 
                      className="py-3 px-4 whitespace-nowrap text-sm text-gray-500"
                      style={{ 
                        backgroundColor: getHeatmapColor(
                          sector[selectedMetric as keyof typeof sector] as number, 
                          sectorMinMax.max, 
                          sectorMinMax.min
                        ) 
                      }}
                    >
                      {selectedMetric === 'profitLoss' ? `₹${sector.profitLoss.toLocaleString('en-IN')}` :
                       selectedMetric === 'winRate' ? `${sector.winRate.toFixed(1)}%` :
                       selectedMetric === 'avgReturn' ? `₹${sector.avgReturn.toFixed(2)}` :
                       sector.trades}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{sector.trades} trade{sector.trades !== 1 ? 's' : ''}</span>
                        <span className={sector.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{sector.profitLoss.toLocaleString('en-IN')}
                        </span>
                        <span>{sector.winRate.toFixed(1)}% win rate</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Size vs Performance Heatmap */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Size vs Performance</h3>
        
        {tradeSizeData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No trade size data available.</p>
            <p className="mt-2 text-sm">Add size and price information to your trades to see this analysis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trade Size
                  </th>
                  <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedMetric === 'profitLoss' ? 'Profit/Loss' : 
                     selectedMetric === 'winRate' ? 'Win Rate' : 
                     selectedMetric === 'avgReturn' ? 'Avg Return' : 'Trade Count'}
                  </th>
                  <th className="py-2 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tradeSizeData.map((size, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {size.name} (₹{size.min.toLocaleString('en-IN')} - 
                      {size.max < Infinity ? `₹${size.max.toLocaleString('en-IN')}` : 'Above'})
                    </td>
                    <td 
                      className="py-3 px-4 whitespace-nowrap text-sm text-gray-500"
                      style={{ 
                        backgroundColor: getHeatmapColor(
                          size[selectedMetric as keyof typeof size] as number, 
                          tradeSizeMinMax.max, 
                          tradeSizeMinMax.min
                        ) 
                      }}
                    >
                      {selectedMetric === 'profitLoss' ? `₹${size.profitLoss.toLocaleString('en-IN')}` :
                       selectedMetric === 'winRate' ? `${size.winRate.toFixed(1)}%` :
                       selectedMetric === 'avgReturn' ? `₹${size.avgReturn.toFixed(2)}` :
                       size.trades}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{size.trades} trade{size.trades !== 1 ? 's' : ''}</span>
                        <span className={size.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{size.profitLoss.toLocaleString('en-IN')}
                        </span>
                        <span>{size.winRate.toFixed(1)}% win rate</span>
                        <span className={size.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {size.returnPercentage.toFixed(2)}% avg return
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Day of Week */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Best Day of Week</h4>
            {dayOfWeekData.some(day => day.trades > 0) ? (
              (() => {
                const bestDay = [...dayOfWeekData]
                  .filter(day => day.trades > 0)
                  .sort((a, b) => b.profitLoss - a.profitLoss)[0];
                
                return (
                  <div>
                    <div className="text-xl font-bold text-indigo-600">{bestDay.day}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      <div>Total P/L: <span className={bestDay.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{bestDay.profitLoss.toLocaleString('en-IN')}
                      </span></div>
                      <div>Win Rate: {bestDay.winRate.toFixed(1)}%</div>
                      <div>Trades: {bestDay.trades}</div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>
          
          {/* Best Sector */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Best Performing Sector</h4>
            {sectorData.length > 0 ? (
              <div>
                <div className="text-xl font-bold text-indigo-600">{sectorData[0].sector}</div>
                <div className="mt-1 text-sm text-gray-600">
                  <div>Total P/L: <span className={sectorData[0].profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{sectorData[0].profitLoss.toLocaleString('en-IN')}
                  </span></div>
                  <div>Win Rate: {sectorData[0].winRate.toFixed(1)}%</div>
                  <div>Trades: {sectorData[0].trades}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No sector data available</div>
            )}
          </div>
          
          {/* Optimal Trade Size */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Optimal Trade Size</h4>
            {tradeSizeData.length > 0 ? (
              (() => {
                const optimalSize = [...tradeSizeData]
                  .sort((a, b) => b.returnPercentage - a.returnPercentage)[0];
                
                return (
                  <div>
                    <div className="text-xl font-bold text-indigo-600">{optimalSize.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      <div>Avg Return: <span className={optimalSize.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {optimalSize.returnPercentage.toFixed(2)}%
                      </span></div>
                      <div>Win Rate: {optimalSize.winRate.toFixed(1)}%</div>
                      <div>Size Range: ₹{optimalSize.min.toLocaleString('en-IN')} - 
                        {optimalSize.max < Infinity ? `₹${optimalSize.max.toLocaleString('en-IN')}` : 'Above'}</div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">No trade size data available</div>
            )}
          </div>
          
          {/* Worst Day of Week */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Worst Day of Week</h4>
            {dayOfWeekData.some(day => day.trades > 0) ? (
              (() => {
                const worstDay = [...dayOfWeekData]
                  .filter(day => day.trades > 0)
                  .sort((a, b) => a.profitLoss - b.profitLoss)[0];
                
                return (
                  <div>
                    <div className="text-xl font-bold text-indigo-600">{worstDay.day}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      <div>Total P/L: <span className={worstDay.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{worstDay.profitLoss.toLocaleString('en-IN')}
                      </span></div>
                      <div>Win Rate: {worstDay.winRate.toFixed(1)}%</div>
                      <div>Trades: {worstDay.trades}</div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 