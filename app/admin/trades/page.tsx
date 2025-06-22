'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Trade {
  id: number
  symbol: string
  type: string
  instrumentType: string
  entryPrice: number
  exitPrice: number | null
  quantity: number
  profitLoss: number | null
  entryDate: string
  exitDate: string | null
  strategy: string | null
  notes: string | null
  isDemo: boolean
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function AdminTradeOversight() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterUser, setFilterUser] = useState('ALL')
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalPnL: 0,
    winningTrades: 0,
    losingTrades: 0,
    activeUsers: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (session?.user) {
      const userRole = (session.user as any).role
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        router.push('/')
      } else {
        fetchTrades()
      }
    }
  }, [session, status, router])

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/admin/trades')
      if (response.ok) {
        const data = await response.json()
        setTrades(data.trades)
        
        // Calculate stats
        const totalTrades = data.trades.length
        const completedTrades = data.trades.filter((t: Trade) => t.exitPrice !== null)
        const totalPnL = completedTrades.reduce((sum: number, t: Trade) => sum + (t.profitLoss || 0), 0)
        const winningTrades = completedTrades.filter((t: Trade) => (t.profitLoss || 0) > 0).length
        const losingTrades = completedTrades.filter((t: Trade) => (t.profitLoss || 0) < 0).length
        const activeUsers = new Set(data.trades.map((t: Trade) => t.user.id)).size
        
        setStats({
          totalTrades,
          totalPnL,
          winningTrades,
          losingTrades,
          activeUsers
        })
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trade.user.name && trade.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === 'ALL' || trade.type === filterType
    const matchesUser = filterUser === 'ALL' || trade.user.id === filterUser
    
    return matchesSearch && matchesType && matchesUser
  })

  const uniqueUsers = Array.from(new Set(trades.map(t => t.user.id)))
    .map(id => trades.find(t => t.user.id === id)?.user)
    .filter(Boolean)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trade Oversight</h1>
              <p className="text-gray-600 mt-1">Monitor and analyze all trading activities</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-white/90 transition-all duration-200"
            >
              Back to Admin
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Total Trades</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTrades}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Total P&L</p>
            <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.totalPnL.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Winning Trades</p>
            <p className="text-2xl font-bold text-green-600">{stats.winningTrades}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Losing Trades</p>
            <p className="text-2xl font-bold text-red-600">{stats.losingTrades}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeUsers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by symbol, user name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
            <div>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ALL">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user?.id} value={user?.id}>
                    {user?.name || user?.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry/Exit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{trade.symbol}</div>
                        <div className="text-sm text-gray-500">{trade.instrumentType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{trade.user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{trade.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.type === 'LONG' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>₹{trade.entryPrice.toLocaleString()}</div>
                        {trade.exitPrice && (
                          <div className="text-gray-500">₹{trade.exitPrice.toLocaleString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trade.profitLoss !== null ? (
                        <span className={`text-sm font-medium ${
                          trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{trade.profitLoss.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Open</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(trade.entryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.isDemo 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {trade.isDemo ? 'Demo' : 'Live'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 