'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SystemSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxTradesPerUser: number
  maxUsersAllowed: number
  systemMessage: string
  backupEnabled: boolean
  emailNotifications: boolean
}

export default function SystemSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    maxTradesPerUser: 1000,
    maxUsersAllowed: 10000,
    systemMessage: '',
    backupEnabled: true,
    emailNotifications: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    storageUsed: '0 MB',
    uptime: '0 days',
    lastBackup: 'Never'
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
        fetchSettings()
        fetchSystemStats()
      }
    }
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats')
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleBackupNow = async () => {
    try {
      const response = await fetch('/api/admin/backup', { method: 'POST' })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup initiated successfully' })
        fetchSystemStats()
      } else {
        setMessage({ type: 'error', text: 'Failed to initiate backup' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Backup failed' })
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
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure application settings and preferences</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-white/90 transition-all duration-200"
            >
              Back to Admin
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Statistics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">System Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Users</span>
                <span className="text-lg font-bold text-blue-600">{systemStats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Trades</span>
                <span className="text-lg font-bold text-green-600">{systemStats.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Storage Used</span>
                <span className="text-lg font-bold text-purple-600">{systemStats.storageUsed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">System Uptime</span>
                <span className="text-lg font-bold text-orange-600">{systemStats.uptime}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Last Backup</span>
                <span className="text-lg font-bold text-gray-600">{systemStats.lastBackup}</span>
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Application Settings</h2>
            <div className="space-y-6">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                  <p className="text-xs text-gray-500">Temporarily disable access for maintenance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Registration Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">New User Registration</label>
                  <p className="text-xs text-gray-500">Allow new users to register</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.registrationEnabled}
                    onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Max Trades Per User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Trades Per User</label>
                <input
                  type="number"
                  value={settings.maxTradesPerUser}
                  onChange={(e) => setSettings({...settings, maxTradesPerUser: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Max Users Allowed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Users Allowed</label>
                <input
                  type="number"
                  value={settings.maxUsersAllowed}
                  onChange={(e) => setSettings({...settings, maxUsersAllowed: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* System Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Message</label>
                <textarea
                  value={settings.systemMessage}
                  onChange={(e) => setSettings({...settings, systemMessage: e.target.value})}
                  placeholder="Display a message to all users..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Backup & Security */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Backup & Security</h2>
            <div className="space-y-6">
              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Automatic Backups</label>
                  <p className="text-xs text-gray-500">Enable daily automated backups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backupEnabled}
                    onChange={(e) => setSettings({...settings, backupEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Manual Backup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manual Backup</label>
                <button
                  onClick={handleBackupNow}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Backup Now
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-xs text-gray-500">Send admin notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Actions</h2>
            <div className="space-y-4">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset to Current Values
              </button>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Danger Zone</p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all demo data? This action cannot be undone.')) {
                      // Implementation for clearing demo data
                    }
                  }}
                  className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Clear All Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 