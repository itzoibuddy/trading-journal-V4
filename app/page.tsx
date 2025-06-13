'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Heroicons SVGs
const icons = {
  trades: (
    <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h2.5m11-4.5V19a2 2 0 01-2 2h-2.5m-6-6.5V5a2 2 0 012-2h6a2 2 0 012 2v10.5m-10 0h10" /></svg>
  ),
  winrate: (
    <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
  ),
  profit: (
    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  winners: (
    <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
};

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

export default function Home() {
  const [stats, setStats] = useState({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfitLoss: 0,
  });

  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      tension: number;
    }[];
  }>({
    labels: [],
    datasets: [
      {
        label: 'Profit/Loss (INR)',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        
        // Get all trades instead of limiting by date
        const response = await fetch(`/api/trades`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // API route not found, show welcome message instead
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch trades');
        }
        
        const trades: Trade[] = await response.json();
        
        // Calculate dashboard stats
        const tradesWithPL = trades.filter(t => t.profitLoss !== null);
        const winningTrades = tradesWithPL.filter(t => (t.profitLoss || 0) > 0);
        const losingTrades = tradesWithPL.filter(t => (t.profitLoss || 0) < 0);
        
        const totalProfitLoss = tradesWithPL.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
        const winRate = tradesWithPL.length > 0 
          ? Math.round((winningTrades.length / tradesWithPL.length) * 100 * 10) / 10
          : 0;
        
        setStats({
          totalTrades: trades.length,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
          winRate,
          totalProfitLoss,
        });
        
        // Process data for chart
        // Group trades by day
        const sortedTrades = [...trades].sort((a, b) => 
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
        );
        
        const dailyPL: { [key: string]: number } = {};
        
        sortedTrades.forEach(trade => {
          const date = new Date(trade.entryDate);
          const key = date.toLocaleDateString();
          
          if (!dailyPL[key]) {
            dailyPL[key] = 0;
          }
          
          dailyPL[key] += trade.profitLoss || 0;
        });
        
        const labels = Object.keys(dailyPL);
        const data = Object.values(dailyPL);
        
        // Set chart line color based on total P/L
        const lineColor = totalProfitLoss >= 0 ? 'rgb(34, 197, 94)' : 'rgb(220, 38, 38)';
        
        setChartData({
          labels,
          datasets: [{
            label: 'Profit/Loss (INR)',
            data,
            borderColor: lineColor,
            tension: 0.1,
          }],
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  // Welcome message when no trades exist yet
  const renderWelcomeMessage = () => (
    <div className="text-center py-12 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Welcome to Your Trading Journal!</h1>
      <p className="text-xl text-gray-600">Start tracking your trades to see your performance metrics here.</p>
      <div className="flex justify-center">
        <a href="/trades" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Add Your First Trade
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
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
      
      {isLoading ? (
        <div className="text-center py-12">Loading dashboard data...</div>
      ) : stats.totalTrades === 0 ? (
        renderWelcomeMessage()
      ) : (
        <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Trades */}
        <div className="bg-blue-50 border border-blue-100 shadow rounded-xl p-5 flex items-center gap-4">
          <div>{icons.trades}</div>
          <div>
            <div className="text-sm text-blue-700 font-semibold">Total Trades</div>
            <div className="text-2xl font-bold text-blue-900">{stats.totalTrades}</div>
          </div>
        </div>
        {/* Win Rate */}
        <div className="bg-yellow-50 border border-yellow-100 shadow rounded-xl p-5 flex items-center gap-4">
          <div>{icons.winrate}</div>
          <div>
            <div className="text-sm text-yellow-700 font-semibold">Win Rate</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.winRate}%</div>
          </div>
        </div>
        {/* Total Profit/Loss */}
        <div className={`${stats.totalProfitLoss >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} border shadow rounded-xl p-5 flex items-center gap-4`}>
          <div>{stats.totalProfitLoss >= 0 ? icons.profit : 
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }</div>
          <div>
            <div className={`text-sm font-semibold ${stats.totalProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total P/L</div>
            <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {stats.totalProfitLoss >= 0 ? '+' : ''}₹{stats.totalProfitLoss.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        {/* Winning Trades */}
        <div className="bg-purple-50 border border-purple-100 shadow rounded-xl p-5 flex items-center gap-4">
          <div>{icons.winners}</div>
          <div>
            <div className="text-sm text-purple-700 font-semibold">Winning Trades</div>
            <div className="text-2xl font-bold text-purple-900">{stats.winningTrades}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profit/Loss Over Time (INR)</h3>
        <div className="h-96">
              {chartData.labels.length > 0 ? (
          <Line data={chartData} options={{ maintainAspectRatio: false }} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No trade data available for the last 30 days
                </div>
              )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
