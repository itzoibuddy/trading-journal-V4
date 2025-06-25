import { TradePattern, BehavioralInsight } from '../../lib/ai-analytics';
import { AdvancedPattern, AdvancedInsight, PerformanceForecasting } from '../../lib/advanced-ai-analytics';

interface SummaryStatsProps {
  patterns: TradePattern[];
  advancedPatterns: AdvancedPattern[];
  insights: BehavioralInsight[];
  advancedInsights: AdvancedInsight[];
  performanceForecast: PerformanceForecasting | null;
  tradesCount: number;
}

export default function SummaryStats({
  patterns,
  advancedPatterns,
  insights,
  advancedInsights,
  performanceForecast,
  tradesCount
}: SummaryStatsProps) {
  const stats = [
    {
      label: 'Basic Patterns',
      value: patterns.length,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Advanced Patterns',
      value: advancedPatterns.length,
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgColor: 'bg-purple-100'
    },
    {
      label: 'AI Insights',
      value: insights.length + advancedInsights.length,
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-100'
    },
    {
      label: 'ML Confidence',
      value: performanceForecast ? `${(performanceForecast.modelAccuracy * 100).toFixed(0)}%` : 'N/A',
      icon: (
        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgColor: 'bg-indigo-100'
    },
    {
      label: 'Trades Analyzed',
      value: tradesCount,
      icon: (
        <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 