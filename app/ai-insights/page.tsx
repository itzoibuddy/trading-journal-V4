'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '../components/LoadingSpinner';

interface InsightData {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  riskReward: number;
  emotionalInsights: {
    mostConfidentTrades: any[];
    emotionalTrends: any[];
    lessonsLearned: string[];
  };
  tradingPatterns: {
    bestDays: string[];
    bestTimes: string[];
    worstTimes: string[];
  };
  aiRecommendations: string[];
}

export default function AIInsights() {
  const { data: session, status } = useSession();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInsights();
    }
  }, [status]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/insights/quick');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Insights</h1>
          <p className="text-gray-600">Please sign in to view your trading insights.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Insights</h1>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchInsights}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Insights</h1>
          <p className="text-gray-600">No trading data available for analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Trading Insights</h1>
        <p className="text-gray-600">Advanced analytics powered by artificial intelligence</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
              <p className={`text-2xl font-bold ${insights.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{insights.totalPnL.toLocaleString()}
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-blue-600">{insights.winRate.toFixed(1)}%</p>
            </div>
            <span className="text-3xl">🎯</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk/Reward</p>
              <p className="text-2xl font-bold text-purple-600">{insights.riskReward.toFixed(2)}</p>
            </div>
            <span className="text-3xl">⚖️</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className={`text-2xl font-bold ${insights.currentStreak >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insights.currentStreak >= 0 ? '+' : ''}{insights.currentStreak}
              </p>
            </div>
            <span className="text-3xl">🔥</span>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          🧠 AI Recommendations
        </h2>
        <div className="space-y-3">
          {insights.aiRecommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-500 mt-0.5">💡</span>
              <p className="text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            📈 Trading Patterns
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Best Trading Days</p>
              <div className="flex flex-wrap gap-2">
                {insights.tradingPatterns.bestDays.map((day, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {day}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Optimal Trading Times</p>
              <div className="flex flex-wrap gap-2">
                {insights.tradingPatterns.bestTimes.map((time, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            💭 Emotional Insights
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Key Lessons Learned</p>
              <div className="space-y-2">
                {insights.emotionalInsights.lessonsLearned.slice(0, 3).map((lesson, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-500 mt-0.5">📝</span>
                    <p className="text-sm text-gray-700">{lesson}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          📊 Performance Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Average Win</p>
            <p className="text-2xl font-bold text-green-600">₹{insights.avgWin.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Average Loss</p>
            <p className="text-2xl font-bold text-red-600">₹{Math.abs(insights.avgLoss).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-blue-600">{insights.totalTrades}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 