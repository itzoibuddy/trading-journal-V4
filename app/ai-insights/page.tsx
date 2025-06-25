'use client';

import { useState, useEffect } from 'react';
import { getTrades } from '../actions/trade';
import { Trade } from '../types/Trade';
import { AIAnalytics, TradePattern, BehavioralInsight } from '../lib/ai-analytics';
import { AdvancedAIAnalytics, AdvancedPattern, AdvancedInsight, PerformanceForecasting } from '../lib/advanced-ai-analytics';
import TradingMindsetCoach from '../components/TradingMindsetCoach';
import TabNavigation from '../components/AIInsights/TabNavigation';
import SummaryStats from '../components/AIInsights/SummaryStats';
import DailyRecommendations from '../components/AIInsights/DailyRecommendations';
import { generateDailyInsights, formatCurrency, getConfidenceColor, getImpactColor, getInsightIcon, DailyInsight } from '../lib/aiInsightsUtils';

type TabType = 'recommendations' | 'patterns' | 'insights' | 'predictions' | 'mindset';

export default function AIInsightsPage() {
  // State management
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabType>('recommendations');
  
  // AI Analytics states
  const [patterns, setPatterns] = useState<TradePattern[]>([]);
  const [insights, setInsights] = useState<BehavioralInsight[]>([]);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [showRelatedTrades, setShowRelatedTrades] = useState<string | null>(null);
  
  // Advanced AI states
  const [advancedPatterns, setAdvancedPatterns] = useState<AdvancedPattern[]>([]);
  const [advancedInsights, setAdvancedInsights] = useState<AdvancedInsight[]>([]);
  const [performanceForecast, setPerformanceForecast] = useState<PerformanceForecasting | null>(null);

  // Tab configuration
  const tabs = [
    { key: 'recommendations', label: 'Daily Recommendations', icon: '💡' },
    { key: 'patterns', label: 'Trading Patterns', icon: '📊' },
    { key: 'insights', label: 'Behavioral Insights', icon: '🧠' },
    { key: 'predictions', label: 'Performance Predictions', icon: '🔮' },
    { key: 'mindset', label: 'Trading Mindset', icon: '🤖' }
  ];

  useEffect(() => {
    async function loadTradesAndAnalyze() {
      try {
        setIsLoading(true);
        const tradesData = await getTrades();
        const formattedTrades = tradesData.map((trade: any) => ({
          ...trade,
          entryDate: trade.entryDate.toISOString(),
          exitDate: trade.exitDate?.toISOString() || null,
        }));
        setTrades(formattedTrades);

        // Run AI Analytics
        if (formattedTrades.length > 0) {
          const aiAnalytics = new AIAnalytics(formattedTrades);
          const detectedPatterns = aiAnalytics.identifyTradingPatterns();
          const behavioralInsights = aiAnalytics.generateAutomatedInsights();
          
          setPatterns(detectedPatterns);
          setInsights(behavioralInsights);
          
          // Generate daily actionable insights
          const dailyRecommendations = generateDailyInsights(formattedTrades);
          setDailyInsights(dailyRecommendations);
          
          // Run Advanced AI Analytics
          if (formattedTrades.length >= 10) {
            const advancedAI = new AdvancedAIAnalytics(formattedTrades);
            const advancedPatternsDetected = advancedAI.identifyAdvancedPatterns();
            const advancedInsightsGenerated = advancedAI.generateAdvancedInsights();
            const forecastGenerated = advancedAI.generatePerformanceForecast();
            
            setAdvancedPatterns(advancedPatternsDetected);
            setAdvancedInsights(advancedInsightsGenerated);
            setPerformanceForecast(forecastGenerated);
          }
        }
      } catch (err) {
        console.error('Error loading trades:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTradesAndAnalyze();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Analyzing your trading patterns...</p>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No trades to analyze</h3>
            <p className="mt-1 text-sm text-gray-500">Add some trades to get AI-powered insights</p>
          </div>
        </div>
      </div>
    );
  }

  const completedTradesCount = trades.filter(t => t.profitLoss !== null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Trading Insights</h1>
          <p className="text-gray-600">Discover patterns and get actionable insights from your trading behavior</p>
        </div>

        {/* Summary Stats */}
        <SummaryStats
          patterns={patterns}
          advancedPatterns={advancedPatterns}
          insights={insights}
          advancedInsights={advancedInsights}
          performanceForecast={performanceForecast}
          tradesCount={completedTradesCount}
        />

        {/* Tab Navigation */}
        <TabNavigation
          selectedTab={selectedTab}
          onTabChange={(tab) => setSelectedTab(tab as TabType)}
          tabs={tabs}
        />

        {/* Tab Content */}
        {selectedTab === 'recommendations' && (
          <DailyRecommendations insights={dailyInsights} />
        )}

        {selectedTab === 'patterns' && (
          <PatternsTab
            patterns={patterns}
            showRelatedTrades={showRelatedTrades}
            setShowRelatedTrades={setShowRelatedTrades}
          />
        )}

        {selectedTab === 'insights' && (
          <InsightsTab insights={insights} />
        )}

        {selectedTab === 'predictions' && (
          <PredictionsTab
            performanceForecast={performanceForecast}
            advancedInsights={advancedInsights}
            advancedPatterns={advancedPatterns}
            completedTradesCount={completedTradesCount}
          />
        )}

        {selectedTab === 'mindset' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">🧠 Trading Mindset Coach</h2>
            <TradingMindsetCoach trades={trades} />
          </div>
        )}
      </div>
    </div>
  );
}

// Patterns Tab Component
function PatternsTab({ patterns, showRelatedTrades, setShowRelatedTrades }: {
  patterns: TradePattern[];
  showRelatedTrades: string | null;
  setShowRelatedTrades: (id: string | null) => void;
}) {
  return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Detected Trading Patterns</h2>
            {patterns.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">No significant patterns detected yet. Add more trades to discover patterns.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {patterns.map((pattern) => (
                  <div key={pattern.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{pattern.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(pattern.confidence)}`}>
                        {Math.round(pattern.confidence * 100)}% Confidence
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{pattern.successRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Success Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(pattern.avgReturn)}</p>
                        <p className="text-xs text-gray-500">Avg Return</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{pattern.frequency}</p>
                        <p className="text-xs text-gray-500">Occurrences</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Key Indicators:</h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.indicators.map((indicator, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setShowRelatedTrades(showRelatedTrades === pattern.id ? null : pattern.id)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  {showRelatedTrades === pattern.id ? 'Hide' : 'View'} {pattern.trades.length} Related Trades →
                      </button>
                    </div>

              {showRelatedTrades === pattern.id && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Related Trades ({pattern.trades.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pattern.trades.map((trade, tradeIndex) => (
                      <div key={tradeIndex} className="bg-white rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{trade.symbol || 'N/A'}</span>
                          <span className={`font-semibold ${
                            (trade.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(trade.profitLoss || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(trade.entryDate).toLocaleDateString()}</span>
                          <span>Qty: {trade.quantity}</span>
                          <span>Entry: ₹{trade.entryPrice}</span>
                          {trade.exitPrice && <span>Exit: ₹{trade.exitPrice}</span>}
                        </div>
                        {trade.strategy && (
                          <div className="mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {trade.strategy}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
                  </div>
                ))}
              </div>
            )}
          </div>
  );
}

// Insights Tab Component
function InsightsTab({ insights }: { insights: BehavioralInsight[] }) {
  return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Behavioral Insights & Recommendations</h2>
            {insights.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">No behavioral insights available yet. Add more trades to get personalized recommendations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                              {insight.impact.toUpperCase()} IMPACT
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                              {Math.round(insight.confidence * 100)}% Confidence
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Recommendation:</h4>
                          <p className="text-blue-800 text-sm">{insight.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  );
}

// Predictions Tab Component (simplified version)
function PredictionsTab({ performanceForecast, advancedInsights, advancedPatterns, completedTradesCount }: {
  performanceForecast: PerformanceForecasting | null;
  advancedInsights: AdvancedInsight[];
  advancedPatterns: AdvancedPattern[];
  completedTradesCount: number;
}) {
  return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">AI Performance Predictions</h2>
            
            {performanceForecast ? (
              <div className="space-y-6">
                {/* Performance Forecast Card */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔮</span>
                    Next Trade Prediction
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 mb-1">
                        {(performanceForecast.nextTradeProbability * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Success Probability</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${performanceForecast.nextTradeProbability * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        ₹{performanceForecast.expectedReturn.toFixed(0)}
                      </div>
                      <p className="text-sm text-gray-600">Expected Return</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Range: ₹{performanceForecast.confidenceInterval[0].toFixed(0)} to ₹{performanceForecast.confidenceInterval[1].toFixed(0)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {(performanceForecast.optimalPositionSize * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Optimal Position Size</p>
                <p className="text-xs text-gray-500 mt-1">Kelly Criterion Based</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">📊 Model Performance</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span>Accuracy: {(performanceForecast.modelAccuracy * 100).toFixed(1)}%</span>
                      <span>Risk-Adjusted Return: {performanceForecast.riskAdjustedReturn.toFixed(2)}</span>
                      <span>Time Horizon: {performanceForecast.timeHorizon}</span>
                    </div>
                  </div>
                </div>

          {/* Show limited advanced insights and patterns */}
                {advancedInsights.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Advanced AI Insights</h3>
                    <div className="space-y-4">
                {advancedInsights.slice(0, 2).map((insight, index) => (
                        <div key={index} className="border-l-4 border-purple-500 pl-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                ML Score: {(insight.mlScore * 100).toFixed(0)}%
                              </span>
                    </div>
                    <p className="text-gray-700 mb-2">{insight.description}</p>
                    <p className="text-sm text-gray-600">{insight.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          {completedTradesCount < 10 ? (
                  <>
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced AI Loading...</h3>
                    <p className="text-gray-600 mb-4">
                      You need at least 10 completed trades to unlock advanced AI predictions.
                Current trades: {completedTradesCount}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (completedTradesCount / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Advanced AI is analyzing your trading patterns...</p>
                  </>
                )}
              </div>
            )}
    </div>
  );
} 