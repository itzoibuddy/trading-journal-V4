'use client';

import { useState, useEffect } from 'react';
import { Trade } from '../types/Trade';
import { AdvancedAIAnalytics, MindsetCoach, PsychologicalPattern, BehavioralAnalysis } from '../lib/advanced-ai-analytics';

interface TradingMindsetCoachProps {
  trades: Trade[];
}

export default function TradingMindsetCoach({ trades }: TradingMindsetCoachProps) {
  const [analytics, setAnalytics] = useState<AdvancedAIAnalytics | null>(null);
  const [behavioralAnalysis, setBehavioralAnalysis] = useState<BehavioralAnalysis | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<MindsetCoach | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [coachingInsights, setCoachingInsights] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'patterns' | 'coaching' | 'analysis'>('patterns');
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [sessionProgress, setSessionProgress] = useState(0);
  const [allResponses, setAllResponses] = useState<Map<string, string>>(new Map());
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  useEffect(() => {
    if (trades && trades.length > 0) {
      const aiAnalytics = new AdvancedAIAnalytics(trades);
      setAnalytics(aiAnalytics);
      
      const analysis = aiAnalytics.generateBehavioralAnalysis();
      setBehavioralAnalysis(analysis);
    }
  }, [trades]);

  // Check if session is complete
  useEffect(() => {
    if (behavioralAnalysis && answeredQuestions.size === behavioralAnalysis.mindsetCoachingQuestions.length && behavioralAnalysis.mindsetCoachingQuestions.length > 0) {
      setIsSessionComplete(true);
    }
  }, [answeredQuestions, behavioralAnalysis]);

  const handleQuestionSelect = (question: MindsetCoach) => {
    setSelectedQuestion(question);
    setUserResponse(allResponses.get(question.id) || '');
    setCoachingInsights([]);
  };

  const handleResponseSubmit = () => {
    if (selectedQuestion && analytics && userResponse.trim()) {
      const insights = analytics.processCoachResponse(selectedQuestion.id, userResponse);
      setCoachingInsights(insights);
      
      // Store the response
      const newResponses = new Map(allResponses);
      newResponses.set(selectedQuestion.id, userResponse);
      setAllResponses(newResponses);
      
      // Track progress
      const newAnsweredQuestions = new Set(answeredQuestions);
      newAnsweredQuestions.add(selectedQuestion.id);
      setAnsweredQuestions(newAnsweredQuestions);
      
      // Update session progress
      if (behavioralAnalysis) {
        const totalQuestions = behavioralAnalysis.mindsetCoachingQuestions.length;
        setSessionProgress(Math.round((newAnsweredQuestions.size / totalQuestions) * 100));
      }
    }
  };

  const generateSessionSummary = () => {
    if (!behavioralAnalysis || !isSessionComplete) return null;

    const responses = Array.from(allResponses.values());
    const totalWords = responses.reduce((total, response) => total + response.trim().split(/\s+/).length, 0);
    
    // Analyze sentiment and themes from responses
    const positiveKeywords = ['confident', 'good', 'better', 'improved', 'learning', 'growing', 'successful'];
    const negativeKeywords = ['frustrated', 'angry', 'scared', 'worried', 'confused', 'stressed', 'anxious'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    const allText = responses.join(' ').toLowerCase();
    
    positiveKeywords.forEach(word => {
      if (allText.includes(word)) positiveCount++;
    });
    
    negativeKeywords.forEach(word => {
      if (allText.includes(word)) negativeCount++;
    });

    const sentimentScore = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'challenging' : 'balanced';
    
    return {
      totalWords,
      sentimentScore,
      keyThemes: extractKeyThemes(allText),
      recommendations: generatePersonalizedRecommendations(allText, behavioralAnalysis)
    };
  };

  const extractKeyThemes = (text: string): string[] => {
    const themes: string[] = [];
    if (text.includes('loss') || text.includes('losing')) themes.push('Loss Management');
    if (text.includes('emotion') || text.includes('feeling')) themes.push('Emotional Control');
    if (text.includes('plan') || text.includes('strategy')) themes.push('Strategy Adherence');
    if (text.includes('risk') || text.includes('money')) themes.push('Risk Management');
    if (text.includes('confident') || text.includes('doubt')) themes.push('Confidence Building');
    if (text.includes('learn') || text.includes('improve')) themes.push('Continuous Learning');
    return themes.slice(0, 3); // Top 3 themes
  };

  const generatePersonalizedRecommendations = (text: string, analysis: BehavioralAnalysis): string[] => {
    const recommendations: string[] = [];
    
    // Based on psychological patterns
    const hasRevengeTrading = analysis.psychologicalPatterns.some(p => p.label === 'Revenge Trading');
    const hasFOMO = analysis.psychologicalPatterns.some(p => p.label === 'FOMO');
    const hasAnalysisParalysis = analysis.psychologicalPatterns.some(p => p.label === 'Analysis Paralysis');
    
    if (hasRevengeTrading) {
      recommendations.push('Implement a mandatory cooling-off period after any losing trade before entering your next position.');
    }
    
    if (hasFOMO) {
      recommendations.push('Create a pre-market checklist of your top 3 trade setups to avoid chasing random opportunities.');
    }
    
    if (hasAnalysisParalysis) {
      recommendations.push('Set a maximum analysis time limit (e.g., 10 minutes) before making trade decisions.');
    }
    
    // Based on emotional stability
    if (analysis.emotionalStability < 0.7) {
      recommendations.push('Practice daily mindfulness or meditation to improve emotional regulation during trading.');
    }
    
    // Based on risk tolerance
    if (analysis.riskToleranceProfile === 'aggressive') {
      recommendations.push('Consider reducing position sizes by 25% until you demonstrate more consistent emotional control.');
    }
    
    // Based on text analysis
    if (text.includes('stressed') || text.includes('anxious')) {
      recommendations.push('Implement stress-reduction techniques like deep breathing exercises before each trading session.');
    }
    
    return recommendations.slice(0, 4); // Top 4 recommendations
  };

  const resetSession = () => {
    setAnsweredQuestions(new Set());
    setAllResponses(new Map());
    setSessionProgress(0);
    setIsSessionComplete(false);
    setSelectedQuestion(null);
    setUserResponse('');
    setCoachingInsights([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emotional_state': return '😊';
      case 'decision_process': return '🧠';
      case 'risk_management': return '🛡️';
      case 'confidence_level': return '💪';
      case 'learning_reflection': return '📚';
      default: return '💡';
    }
  };

  const getPatternIcon = (label: string) => {
    switch (label) {
      case 'FOMO': return '🏃';
      case 'Revenge Trading': return '⚔️';
      case 'Fear of Execution': return '😰';
      case 'Overconfidence': return '😎';
      case 'Analysis Paralysis': return '🤔';
      default: return '📊';
    }
  };

  if (!behavioralAnalysis) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Trading Mindset Coach</h3>
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h4 className="mt-2 text-lg font-medium text-gray-900">Ready to Coach You</h4>
          <p className="mt-1 text-sm text-gray-500">
            Add at least 3 completed trades to get personalized mindset coaching and insights.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-medium text-blue-900 mb-2">🎯 What you'll get:</h5>
            <ul className="text-xs text-blue-800 space-y-1 text-left">
              <li>• Personalized coaching questions based on your trading patterns</li>
              <li>• Psychological pattern detection (FOMO, Revenge Trading, etc.)</li>
              <li>• Emotional trigger analysis and coping strategies</li>
              <li>• Real-time response analysis with actionable insights</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🧠 Trading Mindset Coach</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-3 py-1 text-sm rounded-lg ${
              activeTab === 'patterns' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Patterns
          </button>
          <button
            onClick={() => setActiveTab('coaching')}
            className={`px-3 py-1 text-sm rounded-lg ${
              activeTab === 'coaching' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Coaching
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1 text-sm rounded-lg ${
              activeTab === 'analysis' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">🎯 Psychological Patterns Detected</h4>
            {behavioralAnalysis.psychologicalPatterns.length === 0 ? (
              <p className="text-gray-500 text-sm">No significant psychological patterns detected yet.</p>
            ) : (
              <div className="space-y-4">
                {behavioralAnalysis.psychologicalPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className={`border-l-4 rounded-lg p-4 ${
                      pattern.impact === 'negative' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">{getPatternIcon(pattern.label)}</span>
                        {pattern.label}
                      </h5>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pattern.impact === 'negative' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {pattern.impact.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{pattern.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h6 className="text-sm font-medium text-gray-900 mb-1">Triggers:</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pattern.triggers.map((trigger, index) => (
                            <li key={index}>• {trigger}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h6 className="text-sm font-medium text-gray-900 mb-1">Symptoms:</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pattern.symptoms.map((symptom, index) => (
                            <li key={index}>• {symptom}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Frequency: {pattern.frequency} trades</span>
                      <span>Confidence: {(pattern.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">📊 Behavioral Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Risk Tolerance</h5>
                <p className="text-lg font-semibold text-indigo-600 capitalize">
                  {behavioralAnalysis.riskToleranceProfile}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Emotional Stability</h5>
                <p className="text-lg font-semibold text-indigo-600">
                  {(behavioralAnalysis.emotionalStability * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Confidence Correlation</h5>
                <p className="text-lg font-semibold text-indigo-600">
                  {(behavioralAnalysis.confidenceCorrelation * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coaching' && (
        <div className="space-y-6">
          {/* Session Complete Banner */}
          {isSessionComplete && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">🎉 Coaching Session Complete!</h3>
                <p className="text-green-800 mb-4">
                  Congratulations! You've completed all {behavioralAnalysis.mindsetCoachingQuestions.length} coaching questions. 
                  Your insights are now being processed to create your personalized trading psychology profile.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>View Complete Analysis</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    onClick={resetSession}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <span>Start New Session</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Tracker */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-900">Coaching Session Progress</h4>
              <span className="text-xs text-indigo-700">{answeredQuestions.size} of {behavioralAnalysis.mindsetCoachingQuestions.length} answered</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${sessionProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-indigo-700 mt-2">
              {sessionProgress === 100 ? "✅ Session Complete!" :
               sessionProgress < 30 ? "🌱 Just getting started!" : 
               sessionProgress < 70 ? "🌿 Making good progress!" : 
               "🌳 You're doing great! Keep going!"}
            </p>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">💬 Coaching Questions</h4>
            {behavioralAnalysis.mindsetCoachingQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm">No coaching questions available yet.</p>
            ) : (
              <div className="space-y-4">
                {behavioralAnalysis.mindsetCoachingQuestions.map((question) => {
                  const isAnswered = answeredQuestions.has(question.id);
                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors relative ${
                        selectedQuestion?.id === question.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : isAnswered 
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleQuestionSelect(question)}
                    >
                      {isAnswered && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-2 pr-8">
                        <h5 className="font-medium text-gray-900 flex items-center">
                          <span className="mr-2">{getCategoryIcon(question.category)}</span>
                          {question.question}
                        </h5>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          question.priority === 'high' ? 'bg-red-100 text-red-800' :
                          question.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {question.priority.toUpperCase()}
                        </span>
                      </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Category: {question.category.replace('_', ' ')}</p>
                      <p>Expected insights: {question.expectedInsights.join(', ')}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedQuestion && (
            <div className="border-t pt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">💭 Your Response</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedQuestion.question}
                  </label>
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Share your thoughts, feelings, and experiences..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleResponseSubmit}
                    disabled={!userResponse.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Submit Response</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                  
                  <div className="text-xs text-gray-500">
                    {userResponse.trim().split(/\s+/).length} words
                  </div>
                </div>

                {coachingInsights.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-green-900 flex items-center">
                        <span className="mr-2">💡</span>
                        Coaching Insights
                      </h5>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {coachingInsights.length} insights
                      </div>
                    </div>
                    <div className="space-y-2">
                      {coachingInsights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-green-800">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">🔍 Follow-up Questions</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {selectedQuestion.followUpQuestions.map((followUp, index) => (
                      <li key={index}>• {followUp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Session Summary - Only show when complete */}
          {isSessionComplete && (() => {
            const summary = generateSessionSummary();
            return summary && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Your Coaching Session Summary
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Words Shared</h5>
                    <p className="text-2xl font-bold text-purple-600">{summary.totalWords}</p>
                    <p className="text-xs text-gray-500">Total reflection depth</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Sentiment</h5>
                    <p className={`text-2xl font-bold capitalize ${
                      summary.sentimentScore === 'positive' ? 'text-green-600' : 
                      summary.sentimentScore === 'challenging' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {summary.sentimentScore}
                    </p>
                    <p className="text-xs text-gray-500">Overall emotional tone</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Key Themes</h5>
                    <p className="text-lg font-bold text-purple-600">{summary.keyThemes.length}</p>
                    <p className="text-xs text-gray-500">Areas identified</p>
                  </div>
                </div>

                {summary.keyThemes.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-purple-900 mb-3">🎨 Key Themes Identified</h5>
                    <div className="flex flex-wrap gap-2">
                      {summary.keyThemes.map((theme, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {summary.recommendations.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-purple-900 mb-3">💡 Personalized Action Plan</h5>
                    <div className="space-y-3">
                      {summary.recommendations.map((recommendation, index) => (
                        <div key={index} className="bg-white border border-purple-100 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-purple-600">{index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">📈 Emotional Triggers</h4>
            {Array.from(behavioralAnalysis.emotionalTriggers.entries()).length === 0 ? (
              <p className="text-gray-500 text-sm">No emotional triggers detected yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(behavioralAnalysis.emotionalTriggers.entries()).map(([trigger, count]) => (
                  <div key={trigger} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">{trigger}</h5>
                    <p className="text-lg font-semibold text-indigo-600">{count} occurrences</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">🎯 Decision Biases</h4>
            {Array.from(behavioralAnalysis.decisionBiases.entries()).length === 0 ? (
              <p className="text-gray-500 text-sm">No decision biases detected yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(behavioralAnalysis.decisionBiases.entries()).map(([bias, count]) => (
                  <div key={bias} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">{bias}</h5>
                    <p className="text-lg font-semibold text-indigo-600">{count} occurrences</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">💡 Recommendations</h4>
            {behavioralAnalysis.recommendations.length === 0 ? (
              <p className="text-gray-500 text-sm">No recommendations available yet.</p>
            ) : (
              <div className="space-y-3">
                {behavioralAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 