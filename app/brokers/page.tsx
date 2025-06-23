'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface BrokerConfig {
  id: string
  name: string
  logo: string
  status: 'available' | 'connected' | 'error'
  description: string
  features: string[]
  requiresAPI: boolean
}

interface BrokerSettings {
  connectedBrokers: string[]
  autoSync: boolean
  syncFrequency: string
  lastSync: string | null
}

export default function BrokersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [connectingBroker, setConnectingBroker] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  
  const [brokerSettings, setBrokerSettings] = useState<BrokerSettings>({
    connectedBrokers: [],
    autoSync: true,
    syncFrequency: 'hourly',
    lastSync: null
  })

  // Available brokers configuration
  const availableBrokers: BrokerConfig[] = [
    // Indian Brokers
    {
      id: 'zerodha',
      name: 'Zerodha',
      logo: '🔵',
      status: brokerSettings.connectedBrokers.includes('zerodha') ? 'connected' : 'available',
      description: 'India\'s largest discount broker with Kite Connect API',
      features: ['Real-time trade sync', 'Portfolio data', 'Order history', 'Holdings', 'P&L tracking'],
      requiresAPI: true
    },
    {
      id: 'upstox',
      name: 'Upstox',
      logo: '🟠',
      status: brokerSettings.connectedBrokers.includes('upstox') ? 'connected' : 'available',
      description: 'Modern discount broker with powerful API and low brokerage',
      features: ['Live market data', 'Order management', 'Portfolio tracking', 'Options chain'],
      requiresAPI: true
    },
    {
      id: 'angelone',
      name: 'Angel One',
      logo: '👼',
      status: brokerSettings.connectedBrokers.includes('angelone') ? 'connected' : 'available',
      description: 'Leading full-service broker with SmartAPI integration',
      features: ['Trade sync', 'Research reports', 'Mutual funds', 'IPO applications'],
      requiresAPI: true
    },
    {
      id: 'dhan',
      name: 'Dhan',
      logo: '💎',
      status: brokerSettings.connectedBrokers.includes('dhan') ? 'connected' : 'available',
      description: 'Next-gen trading platform with advanced charting and analytics',
      features: ['Advanced charts', 'Options strategies', 'Backtesting', 'Algo trading'],
      requiresAPI: true
    },
    {
      id: 'groww',
      name: 'Groww',
      logo: '🌱',
      status: brokerSettings.connectedBrokers.includes('groww') ? 'connected' : 'available',
      description: 'Popular platform for stocks, mutual funds and digital gold',
      features: ['Stock trading', 'Mutual funds', 'SIP tracking', 'Goal planning'],
      requiresAPI: true
    },
    {
      id: '5paisa',
      name: '5paisa',
      logo: '💰',
      status: brokerSettings.connectedBrokers.includes('5paisa') ? 'connected' : 'available',
      description: 'Affordable brokerage with comprehensive trading solutions',
      features: ['Low brokerage', 'Research reports', 'Mutual funds', 'Insurance'],
      requiresAPI: true
    },
    {
      id: 'icicidirect',
      name: 'ICICI Direct',
      logo: '🏛️',
      status: brokerSettings.connectedBrokers.includes('icicidirect') ? 'connected' : 'available',
      description: 'Full-service broker from ICICI Bank with research and advisory',
      features: ['Research reports', 'Investment advisory', 'Mutual funds', 'IPO services'],
      requiresAPI: true
    },
    {
      id: 'fyers',
      name: 'Fyers',
      logo: '🚀',
      status: brokerSettings.connectedBrokers.includes('fyers') ? 'connected' : 'available',
      description: 'Technology-focused broker with advanced trading tools',
      features: ['API trading', 'Advanced charts', 'Options strategies', 'Market scanner'],
      requiresAPI: true
    },
    {
      id: 'sasonline',
      name: 'SAS Online',
      logo: '📈',
      status: brokerSettings.connectedBrokers.includes('sasonline') ? 'connected' : 'available',
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
      fetchBrokerSettings()
    }
  }, [session, status, router])

  const fetchBrokerSettings = async () => {
    try {
      // For now, use default settings
      // In production, you'd fetch from API: const response = await fetch('/api/user/brokers')
      setLoading(false)
    } catch (error) {
      console.error('Error fetching broker settings:', error)
      setLoading(false)
    }
  }

  const handleConnectBroker = async (brokerId: string) => {
    setConnectingBroker(brokerId)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setBrokerSettings(prev => ({
        ...prev,
        connectedBrokers: [...prev.connectedBrokers, brokerId]
      }))
      
      setMessage({ type: 'success', text: `Successfully connected to ${availableBrokers.find(b => b.id === brokerId)?.name}!` })
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect broker. Please try again.' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setConnectingBroker(null)
    }
  }

  const handleDisconnectBroker = (brokerId: string) => {
    setBrokerSettings(prev => ({
      ...prev,
      connectedBrokers: prev.connectedBrokers.filter(id => id !== brokerId)
    }))
    setMessage({ type: 'success', text: 'Broker disconnected successfully!' })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setBrokerSettings(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }))
      
      setMessage({ type: 'success', text: 'Trades synced successfully!' })
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed. Please try again.' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Broker Connections</h1>
          <p className="text-lg text-gray-600">Connect your brokerage accounts to automatically sync trades and portfolio data</p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Connected Brokers Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Connected Brokers</h2>
              {brokerSettings.connectedBrokers.length > 0 && (
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Syncing...</span>
                    </div>
                  ) : (
                    'Sync Now'
                  )}
                </button>
              )}
            </div>

            {brokerSettings.connectedBrokers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No brokers connected yet</h3>
                <p className="text-gray-600">Connect your brokerage accounts to automatically sync trades</p>
              </div>
            ) : (
              <div className="space-y-4">
                {brokerSettings.connectedBrokers.map(brokerId => {
                  const broker = availableBrokers.find(b => b.id === brokerId)
                  if (!broker) return null
                  
                  return (
                    <div key={brokerId} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{broker.logo}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{broker.name}</h4>
                          <p className="text-sm text-gray-600">Connected & Active</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnectBroker(brokerId)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  )
                })}
                
                {brokerSettings.lastSync && (
                  <div className="text-sm text-gray-500 mt-4">
                    Last synced: {new Date(brokerSettings.lastSync).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Available Brokers Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Indian Brokers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableBrokers
              .filter(broker => !brokerSettings.connectedBrokers.includes(broker.id))
              .map((broker) => (
                <div key={broker.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{broker.logo}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{broker.name}</h3>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{broker.description}</p>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {broker.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg">
                          {feature}
                        </span>
                      ))}
                      {broker.features.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">
                          +{broker.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnectBroker(broker.id)}
                    disabled={connectingBroker === broker.id}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connectingBroker === broker.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      'Connect'
                    )}
                  </button>

                  {broker.requiresAPI && (
                    <p className="text-xs text-gray-500 mt-2 text-center">* Requires API key setup</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
} 