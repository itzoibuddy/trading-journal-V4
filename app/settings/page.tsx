'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UserSettings {
  // Personal Preferences
  timezone: string
  defaultRiskRatio: number
  tradingExperience: string
  notifications: {
    email: boolean
    browser: boolean
    tradeAlerts: boolean
    weeklyReports: boolean
  }
  
  // Display Preferences
  appearance: {
    theme: string
    dateFormat: string
    currency: string
    decimalPlaces: number
  }
  
  // Trading Preferences
  trading: {
    defaultTimeFrame: string
    defaultInstrument: string
    autoCalculatePL: boolean
    showDemoTrades: boolean
    confirmBeforeDelete: boolean
  }
  
  // Broker Connections
  brokers: {
    connectedBrokers: string[]
    autoSync: boolean
    syncFrequency: string
    lastSync: string | null
  }
}

interface BrokerConfig {
  id: string
  name: string
  logo: string
  status: 'available' | 'connected' | 'error'
  description: string
  features: string[]
  requiresAPI: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [connectingBroker, setConnectingBroker] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<UserSettings>({
    timezone: 'UTC',
    defaultRiskRatio: 2.0,
    tradingExperience: 'INTERMEDIATE',
    notifications: {
      email: true,
      browser: false,
      tradeAlerts: true,
      weeklyReports: false
    },
    appearance: {
      theme: 'light',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      decimalPlaces: 2
    },
    trading: {
      defaultTimeFrame: 'Daily',
      defaultInstrument: 'STOCK',
      autoCalculatePL: true,
      showDemoTrades: true,
      confirmBeforeDelete: true
    },
    brokers: {
      connectedBrokers: [],
      autoSync: true,
      syncFrequency: 'hourly',
      lastSync: null
    }
  })

  // Available brokers configuration
  const availableBrokers: BrokerConfig[] = [
    // Indian Brokers
    {
      id: 'zerodha',
      name: 'Zerodha',
      logo: '🔵',
      status: settings.brokers.connectedBrokers.includes('zerodha') ? 'connected' : 'available',
      description: 'India\'s largest discount broker with Kite Connect API',
      features: ['Real-time trade sync', 'Portfolio data', 'Order history', 'Holdings', 'P&L tracking'],
      requiresAPI: true
    },
    {
      id: 'upstox',
      name: 'Upstox',
      logo: '🟠',
      status: settings.brokers.connectedBrokers.includes('upstox') ? 'connected' : 'available',
      description: 'Modern discount broker with powerful API and low brokerage',
      features: ['Live market data', 'Order management', 'Portfolio tracking', 'Options chain'],
      requiresAPI: true
    },
    {
      id: 'angelone',
      name: 'Angel One',
      logo: '👼',
      status: settings.brokers.connectedBrokers.includes('angelone') ? 'connected' : 'available',
      description: 'Leading full-service broker with SmartAPI integration',
      features: ['Trade sync', 'Research reports', 'Mutual funds', 'IPO applications'],
      requiresAPI: true
    },
    {
      id: 'dhan',
      name: 'Dhan',
      logo: '💎',
      status: settings.brokers.connectedBrokers.includes('dhan') ? 'connected' : 'available',
      description: 'Next-gen trading platform with advanced charting and analytics',
      features: ['Advanced charts', 'Options strategies', 'Backtesting', 'Algo trading'],
      requiresAPI: true
    },
    {
      id: 'groww',
      name: 'Groww',
      logo: '🌱',
      status: settings.brokers.connectedBrokers.includes('groww') ? 'connected' : 'available',
      description: 'Popular platform for stocks, mutual funds and digital gold',
      features: ['Stock trading', 'Mutual funds', 'SIP tracking', 'Goal planning'],
      requiresAPI: true
    },
    {
      id: '5paisa',
      name: '5paisa',
      logo: '💰',
      status: settings.brokers.connectedBrokers.includes('5paisa') ? 'connected' : 'available',
      description: 'Affordable brokerage with comprehensive trading solutions',
      features: ['Low brokerage', 'Research reports', 'Mutual funds', 'Insurance'],
      requiresAPI: true
    },
    {
      id: 'icicidirect',
      name: 'ICICI Direct',
      logo: '🏛️',
      status: settings.brokers.connectedBrokers.includes('icicidirect') ? 'connected' : 'available',
      description: 'Full-service broker from ICICI Bank with research and advisory',
      features: ['Research reports', 'Investment advisory', 'Mutual funds', 'IPO services'],
      requiresAPI: true
    },
    {
      id: 'fyers',
      name: 'Fyers',
      logo: '🚀',
      status: settings.brokers.connectedBrokers.includes('fyers') ? 'connected' : 'available',
      description: 'Technology-focused broker with advanced trading tools',
      features: ['API trading', 'Advanced charts', 'Options strategies', 'Market scanner'],
      requiresAPI: true
    },
    {
      id: 'sasonline',
      name: 'SAS Online',
      logo: '📈',
      status: settings.brokers.connectedBrokers.includes('sasonline') ? 'connected' : 'available',
      description: 'Established broker with comprehensive trading and investment services',
      features: ['Full-service trading', 'Research', 'Mutual funds', 'Portfolio management'],
      requiresAPI: true
    }
  ]

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (session?.user) {
      fetchSettings()
    }
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      // For now, use default settings
      // In production, you'd fetch from API: const response = await fetch('/api/user/settings')
      setLoading(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      // In production, you'd save to API: await fetch('/api/user/settings', { method: 'PUT', body: JSON.stringify(settings) })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.')
      const newSettings = { ...prev }
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const handleConnectBroker = async (brokerId: string) => {
    setConnectingBroker(brokerId)
    try {
      // In production, this would redirect to broker OAuth or open API key setup
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate connection time
      
      const newConnectedBrokers = [...settings.brokers.connectedBrokers, brokerId]
      updateSetting('brokers.connectedBrokers', newConnectedBrokers)
      updateSetting('brokers.lastSync', new Date().toISOString())
      
      setMessage({ type: 'success', text: `Successfully connected to ${availableBrokers.find(b => b.id === brokerId)?.name}!` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to broker. Please try again.' })
    } finally {
      setConnectingBroker(null)
    }
  }

  const handleDisconnectBroker = (brokerId: string) => {
    const newConnectedBrokers = settings.brokers.connectedBrokers.filter(id => id !== brokerId)
    updateSetting('brokers.connectedBrokers', newConnectedBrokers)
    setMessage({ type: 'success', text: `Disconnected from ${availableBrokers.find(b => b.id === brokerId)?.name}` })
  }

  const handleSyncNow = async () => {
    setSaving(true)
    try {
      // In production, this would sync trades from connected brokers
      await new Promise(resolve => setTimeout(resolve, 3000))
      updateSetting('brokers.lastSync', new Date().toISOString())
      setMessage({ type: 'success', text: 'Successfully synced trades from connected brokers!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync trades. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'trading', label: 'Trading', icon: '📈' },
    { id: 'brokers', label: 'Brokers', icon: '🔗' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account preferences and trading settings</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-white/90 transition-all duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <span className="text-lg mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Personal Settings */}
            {activeTab === 'personal' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trading Experience</label>
                    <select
                      value={settings.tradingExperience}
                      onChange={(e) => updateSetting('tradingExperience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BEGINNER">Beginner (0-1 years)</option>
                      <option value="INTERMEDIATE">Intermediate (1-5 years)</option>
                      <option value="ADVANCED">Advanced (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Risk-Reward Ratio</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={settings.defaultRiskRatio}
                      onChange={(e) => updateSetting('defaultRiskRatio', parseFloat(e.target.value) || 2.0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your preferred risk-reward ratio for new trades</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Settings */}
            {activeTab === 'trading' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Trading Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Time Frame</label>
                    <select
                      value={settings.trading.defaultTimeFrame}
                      onChange={(e) => updateSetting('trading.defaultTimeFrame', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1m">1 Minute</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Instrument Type</label>
                    <select
                      value={settings.trading.defaultInstrument}
                      onChange={(e) => updateSetting('trading.defaultInstrument', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="STOCK">Stocks</option>
                      <option value="OPTIONS">Options</option>
                      <option value="FUTURES">Futures</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto-calculate P&L</label>
                        <p className="text-xs text-gray-500">Automatically calculate profit/loss when exit price is entered</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.trading.autoCalculatePL}
                          onChange={(e) => updateSetting('trading.autoCalculatePL', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Show Demo Trades</label>
                        <p className="text-xs text-gray-500">Include demo trades in analytics and charts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.trading.showDemoTrades}
                          onChange={(e) => updateSetting('trading.showDemoTrades', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Confirm Before Delete</label>
                        <p className="text-xs text-gray-500">Show confirmation dialog when deleting trades</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.trading.confirmBeforeDelete}
                          onChange={(e) => updateSetting('trading.confirmBeforeDelete', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Brokers Settings */}
            {activeTab === 'brokers' && (
              <div className="space-y-6">
                {/* Connected Brokers Overview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Connected Brokers</h2>
                  {settings.brokers.connectedBrokers.length > 0 ? (
                    <div className="space-y-4">
                      {settings.brokers.connectedBrokers.map((brokerId) => {
                        const broker = availableBrokers.find(b => b.id === brokerId)
                        return broker ? (
                          <div key={brokerId} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{broker.logo}</span>
                              <div>
                                <h3 className="font-semibold text-gray-900">{broker.name}</h3>
                                <p className="text-sm text-green-600">✓ Connected & Syncing</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDisconnectBroker(brokerId)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : null
                      })}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">Last sync: {settings.brokers.lastSync ? new Date(settings.brokers.lastSync).toLocaleString() : 'Never'}</p>
                        </div>
                        <button
                          onClick={handleSyncNow}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No brokers connected yet</p>
                      <p className="text-sm text-gray-400 mt-1">Connect your brokerage accounts to automatically sync trades</p>
                    </div>
                  )}
                </div>

                {/* Available Brokers */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Available Indian Brokers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBrokers.map((broker) => (
                      <div key={broker.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{broker.logo}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{broker.name}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                broker.status === 'connected' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {broker.status === 'connected' ? 'Connected' : 'Available'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{broker.description}</p>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                          <div className="flex flex-wrap gap-1">
                            {broker.features.map((feature, index) => (
                              <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {broker.status === 'connected' ? (
                          <button
                            onClick={() => handleDisconnectBroker(broker.id)}
                            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnectBroker(broker.id)}
                            disabled={connectingBroker === broker.id}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {connectingBroker === broker.id ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                        
                        {broker.requiresAPI && (
                          <p className="text-xs text-gray-500 mt-2">
                            * Requires API key setup
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Appearance & Display</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={settings.appearance.theme}
                      onChange={(e) => updateSetting('appearance.theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select
                      value={settings.appearance.dateFormat}
                      onChange={(e) => updateSetting('appearance.dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency Display</label>
                    <select
                      value={settings.appearance.currency}
                      onChange={(e) => updateSetting('appearance.currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Decimal Places</label>
                    <select
                      value={settings.appearance.decimalPlaces}
                      onChange={(e) => updateSetting('appearance.decimalPlaces', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Number of decimal places for price and P&L display</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-xs text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => updateSetting('notifications.email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Browser Notifications</label>
                      <p className="text-xs text-gray-500">Show desktop notifications in browser</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.browser}
                        onChange={(e) => updateSetting('notifications.browser', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Trade Alerts</label>
                      <p className="text-xs text-gray-500">Get notified about trade-related events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.tradeAlerts}
                        onChange={(e) => updateSetting('notifications.tradeAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Weekly Reports</label>
                      <p className="text-xs text-gray-500">Receive weekly trading performance summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklyReports}
                        onChange={(e) => updateSetting('notifications.weeklyReports', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Save Changes</h3>
                  <p className="text-sm text-gray-600">Your settings will be applied immediately</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 