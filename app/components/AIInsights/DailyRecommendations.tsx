import { DailyInsight } from '../../lib/aiInsightsUtils';

interface DailyRecommendationsProps {
  insights: DailyInsight[];
}

export default function DailyRecommendations({ insights }: DailyRecommendationsProps) {
  if (insights.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Today's Trading Recommendations</h2>
          <span className="text-sm text-gray-500">
            No insights available • Add more trades to get recommendations
          </span>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Insights</h3>
          <p className="text-gray-500">Add at least 3 completed trades to get personalized daily recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Today's Trading Recommendations</h2>
        <span className="text-sm text-gray-500">
          {insights.length} actionable insights • Based on your trading history
        </span>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border-l-4 rounded-lg p-6 ${
              insight.type === 'alert' ? 'border-red-500 bg-red-50' :
              insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              insight.type === 'success' ? 'border-green-500 bg-green-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {insight.priority.toUpperCase()}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4 text-base">{insight.message}</p>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Recommended Action:
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{insight.action}</p>
            </div>
          </div>
        ))}
        
        <div className="bg-gray-50 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Quick Tips for Better Trading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <span className="text-green-600 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Plan Before Trading</h4>
                <p className="text-sm text-gray-600">Set clear entry, exit, and stop-loss levels before entering any trade.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-lg">🎯</span>
              <div>
                <h4 className="font-medium text-gray-900">Stick to Your Strategy</h4>
                <p className="text-sm text-gray-600">Follow your proven strategies and avoid emotional decision-making.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-orange-600 text-lg">⚖️</span>
              <div>
                <h4 className="font-medium text-gray-900">Manage Risk</h4>
                <p className="text-sm text-gray-600">Never risk more than 2-3% of your capital on a single trade.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-600 text-lg">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">Review & Learn</h4>
                <p className="text-sm text-gray-600">Regularly review your trades to identify patterns and improve.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 