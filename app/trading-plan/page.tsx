'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ChecklistItem {
  id: string;
  text: string;
  isRequired: boolean;
}

interface EmotionalState {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface TradingSession {
  id: string;
  date: string;
  preTradeChecklist: Record<string, boolean>;
  emotionalState: string;
  notes: string;
  planAdherence: number;
  trades: number;
  profitLoss: number;
}

export default function TradingPlanPage() {
  // Default checklist items
  const defaultChecklistItems: ChecklistItem[] = [
    { id: '1', text: 'Reviewed market conditions and key levels', isRequired: true },
    { id: '2', text: 'Checked economic calendar for news events', isRequired: true },
    { id: '3', text: 'Defined entry, stop-loss, and take-profit levels', isRequired: true },
    { id: '4', text: 'Calculated position size based on risk management', isRequired: true },
    { id: '5', text: 'Confirmed trade aligns with overall strategy', isRequired: true },
    { id: '6', text: 'Checked technical indicators for confirmation', isRequired: false },
    { id: '7', text: 'Reviewed recent price action', isRequired: false },
    { id: '8', text: 'Identified potential support/resistance levels', isRequired: false },
  ];

  // Emotional states
  const emotionalStates: EmotionalState[] = [
    { id: 'calm', name: 'Calm', description: 'Relaxed, focused, and clear-minded', color: 'bg-green-100 text-green-800' },
    { id: 'excited', name: 'Excited', description: 'Energetic and enthusiastic', color: 'bg-blue-100 text-blue-800' },
    { id: 'anxious', name: 'Anxious', description: 'Worried about potential losses', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'frustrated', name: 'Frustrated', description: 'Annoyed by market conditions or previous results', color: 'bg-orange-100 text-orange-800' },
    { id: 'fearful', name: 'Fearful', description: 'Afraid of making mistakes or losing money', color: 'bg-red-100 text-red-800' },
    { id: 'overconfident', name: 'Overconfident', description: 'Excessive optimism about trading abilities', color: 'bg-purple-100 text-purple-800' },
    { id: 'impatient', name: 'Impatient', description: 'Rushing decisions or forcing trades', color: 'bg-pink-100 text-pink-800' },
    { id: 'neutral', name: 'Neutral', description: 'Neither positive nor negative emotions', color: 'bg-gray-100 text-gray-800' },
  ];

  // State for checklist items and sessions
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(defaultChecklistItems);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState({ text: '', isRequired: false });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);

  // Form for trading sessions
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{
    date: string;
    emotionalState: string;
    notes: string;
    planAdherence: number;
    trades: number;
    profitLoss: number;
    checklist: Record<string, boolean>;
  }>();

  // Watch form values
  const watchedChecklist = watch('checklist', {});
  const watchedAdherence = watch('planAdherence', 5);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('tradingSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }

    const savedChecklist = localStorage.getItem('tradingChecklist');
    if (savedChecklist) {
      setChecklistItems(JSON.parse(savedChecklist));
    }
  }, []);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('tradingSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save checklist items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tradingChecklist', JSON.stringify(checklistItems));
  }, [checklistItems]);

  // Calculate completion percentage
  const calculateCompletionPercentage = (checklist: Record<string, boolean>) => {
    const requiredItems = checklistItems.filter(item => item.isRequired);
    if (requiredItems.length === 0) return 100;

    const completedRequiredItems = requiredItems.filter(item => checklist[item.id]);
    return Math.round((completedRequiredItems.length / requiredItems.length) * 100);
  };

  // Add new checklist item
  const addChecklistItem = () => {
    if (newChecklistItem.text.trim() === '') return;

    const newItem = {
      id: Date.now().toString(),
      text: newChecklistItem.text,
      isRequired: newChecklistItem.isRequired,
    };

    setChecklistItems([...checklistItems, newItem]);
    setNewChecklistItem({ text: '', isRequired: false });
    setIsAddingItem(false);
  };

  // Delete checklist item
  const deleteChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  // Submit session form
  const onSubmit = (data: any) => {
    const sessionData: TradingSession = {
      id: editingSession || Date.now().toString(),
      date: data.date,
      preTradeChecklist: data.checklist || {},
      emotionalState: data.emotionalState,
      notes: data.notes,
      planAdherence: data.planAdherence,
      trades: data.trades,
      profitLoss: data.profitLoss,
    };

    if (editingSession) {
      setSessions(sessions.map(s => (s.id === editingSession ? sessionData : s)));
      setEditingSession(null);
    } else {
      setSessions([sessionData, ...sessions]);
    }

    setShowSessionForm(false);
    reset();
  };

  // Edit session
  const editSession = (session: TradingSession) => {
    setEditingSession(session.id);
    setShowSessionForm(true);

    setValue('date', session.date);
    setValue('emotionalState', session.emotionalState);
    setValue('notes', session.notes);
    setValue('planAdherence', session.planAdherence);
    setValue('trades', session.trades);
    setValue('profitLoss', session.profitLoss);

    // Set checklist values
    checklistItems.forEach(item => {
      setValue(`checklist.${item.id}`, session.preTradeChecklist[item.id] || false);
    });
  };

  // Delete session
  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  // Get emotional state by ID
  const getEmotionalState = (id: string) => {
    return emotionalStates.find(state => state.id === id) || emotionalStates[7]; // Default to neutral
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Trading Plan Compliance</h2>
        <button
          onClick={() => {
            setShowSessionForm(true);
            setEditingSession(null);
            reset();
            // Set default date to today
            setValue('date', new Date().toISOString().split('T')[0]);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Record Trading Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Trade Checklist Section */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pre-Trade Checklist</h3>
            <button
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
            >
              {isAddingItem ? 'Cancel' : 'Add Item'}
            </button>
          </div>

          {isAddingItem && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="mb-3">
                <label htmlFor="newItemText" className="block text-sm font-medium text-gray-700 mb-1">
                  Checklist Item
                </label>
                <input
                  type="text"
                  id="newItemText"
                  value={newChecklistItem.text}
                  onChange={e => setNewChecklistItem({ ...newChecklistItem, text: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter checklist item"
                />
              </div>

              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="newItemRequired"
                  checked={newChecklistItem.isRequired}
                  onChange={e => setNewChecklistItem({ ...newChecklistItem, isRequired: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="newItemRequired" className="ml-2 block text-sm text-gray-700">
                  Required item
                </label>
              </div>

              <button
                onClick={addChecklistItem}
                disabled={!newChecklistItem.text.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
              >
                Add to Checklist
              </button>
            </div>
          )}

          <div className="space-y-3">
            {checklistItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No checklist items yet. Add some to get started!</p>
            ) : (
              checklistItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-start">
                    <span className="block text-sm text-gray-700">{item.text}</span>
                    {item.isRequired && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteChecklistItem(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emotional States Section */}
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotional States</h3>
          <div className="grid grid-cols-2 gap-3">
            {emotionalStates.map(state => (
              <div key={state.id} className={`p-3 rounded-md ${state.color}`}>
                <h4 className="font-medium">{state.name}</h4>
                <p className="text-sm mt-1">{state.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-700 mb-2">Why Track Emotions?</h4>
            <p className="text-sm text-blue-800">
              Emotional states significantly impact trading decisions. Recognizing patterns between your emotions and trading outcomes helps improve discipline and consistency.
            </p>
          </div>
        </div>
      </div>

      {/* Session Form */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingSession ? 'Edit Trading Session' : 'Record New Trading Session'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    {...register('date', { required: 'Date is required' })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                </div>

                <div>
                  <label htmlFor="emotionalState" className="block text-sm font-medium text-gray-700 mb-1">
                    Emotional State
                  </label>
                  <select
                    id="emotionalState"
                    {...register('emotionalState', { required: 'Please select your emotional state' })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select your emotional state</option>
                    {emotionalStates.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {errors.emotionalState && <p className="mt-1 text-sm text-red-600">{errors.emotionalState.message}</p>}
                </div>

                <div>
                  <label htmlFor="trades" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Trades
                  </label>
                  <input
                    type="number"
                    id="trades"
                    {...register('trades', { required: 'Number of trades is required', min: 0 })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.trades && <p className="mt-1 text-sm text-red-600">{errors.trades.message}</p>}
                </div>

                <div>
                  <label htmlFor="profitLoss" className="block text-sm font-medium text-gray-700 mb-1">
                    Profit/Loss (₹)
                  </label>
                  <input
                    type="number"
                    id="profitLoss"
                    {...register('profitLoss', { required: 'Profit/Loss is required' })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.profitLoss && <p className="mt-1 text-sm text-red-600">{errors.profitLoss.message}</p>}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pre-Trade Checklist Completion
                </label>
                <div className="space-y-3">
                  {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`checklist-${item.id}`}
                        {...register(`checklist.${item.id}`)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`checklist-${item.id}`} className="ml-2 block text-sm text-gray-700">
                        {item.text}
                        {item.isRequired && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Completion:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {calculateCompletionPercentage(watchedChecklist)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${calculateCompletionPercentage(watchedChecklist)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="planAdherence" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Adherence Rating (1-10)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="planAdherence"
                    min="1"
                    max="10"
                    step="1"
                    {...register('planAdherence', { required: true, min: 1, max: 10 })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg font-semibold text-gray-700 min-w-[30px] text-center">
                    {watchedAdherence}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor adherence</span>
                  <span>Perfect adherence</span>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  {...register('notes')}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="What went well? What could be improved? Any patterns noticed?"
                ></textarea>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingSession ? 'Update Session' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Sessions</h3>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No trading sessions recorded yet.</p>
            <p className="mt-2 text-sm">Record your first session to start tracking your trading plan compliance.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => {
              const emotionalState = getEmotionalState(session.emotionalState);
              const completionPercentage = calculateCompletionPercentage(session.preTradeChecklist);
              
              return (
                <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{new Date(session.date).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${emotionalState.color}`}>
                        {emotionalState.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editSession(session)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Trades</div>
                        <div className="font-semibold">{session.trades}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Profit/Loss</div>
                        <div className={`font-semibold ${session.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{session.profitLoss.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Plan Adherence</div>
                        <div className="font-semibold">{session.planAdherence}/10</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">Checklist Completion:</span>
                        <span className="text-sm font-medium">{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            completionPercentage >= 80 ? 'bg-green-600' : completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-600'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {session.notes && (
                      <div className="mt-3 bg-gray-50 p-3 rounded text-sm">
                        <div className="font-medium mb-1">Notes:</div>
                        <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 