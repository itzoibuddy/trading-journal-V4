'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AuditLog {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  metadata: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    name: string | null
    email: string
  }
}

export default function AuditLogs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')
  const [filterResource, setFilterResource] = useState('ALL')

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (session?.user) {
      const userRole = (session.user as any).role
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        router.push('/')
      } else {
        fetchLogs()
      }
    }
  }, [session, status, router])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.user?.email && log.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesAction = filterAction === 'ALL' || log.action === filterAction
    const matchesResource = filterResource === 'ALL' || log.resource === filterResource
    
    return matchesSearch && matchesAction && matchesResource
  })

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource)))

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_CREATED': return '👤'
      case 'USER_UPDATED': return '✏️'
      case 'USER_DELETED': return '🗑️'
      case 'TRADE_CREATED': return '📈'
      case 'TRADE_UPDATED': return '📊'
      case 'TRADE_DELETED': return '❌'
      case 'LOGIN': return '🔑'
      case 'LOGOUT': return '🚪'
      case 'PASSWORD_CHANGED': return '🔐'
      case 'DEMO_DATA_CLEARED': return '🧹'
      default: return '📝'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
      case 'TRADE_CREATED':
      case 'LOGIN':
        return 'bg-green-100 text-green-800'
      case 'USER_UPDATED':
      case 'TRADE_UPDATED':
      case 'PASSWORD_CHANGED':
        return 'bg-blue-100 text-blue-800'
      case 'USER_DELETED':
      case 'TRADE_DELETED':
      case 'LOGOUT':
        return 'bg-red-100 text-red-800'
      case 'DEMO_DATA_CLEARED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">View system activity and security logs</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Today's Events</p>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(log => new Date(log.createdAt).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Unique Actions</p>
            <p className="text-2xl font-bold text-green-600">{uniqueActions.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <p className="text-sm text-gray-600">Resources</p>
            <p className="text-2xl font-bold text-purple-600">{uniqueResources.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by action, resource, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ALL">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ALL">All Resources</option>
                {uniqueResources.map((resource) => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getActionIcon(log.action)}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.resource}</div>
                      {log.resourceId && (
                        <div className="text-sm text-gray-500">ID: {log.resourceId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.metadata && (
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                        </div>
                      )}
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