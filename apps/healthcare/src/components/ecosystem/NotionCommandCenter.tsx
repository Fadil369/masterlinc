import { useState, useEffect } from 'react'
import { notionBridge } from '../../lib/notion-client'
import { PatientsView } from './notion/PatientsView'
import { TodayView } from './notion/TodayView'
import { TasksView } from './notion/TasksView'
import { BillingView } from './notion/BillingView'

interface NotionDatabase {
  id: string
  title: string
  properties: any
}

type DashboardTab = 'overview' | 'patients' | 'today' | 'tasks' | 'billing'

export function NotionCommandCenter() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [loading, setLoading] = useState(true)
  const [databaseIds, setDatabaseIds] = useState<Record<string, string>>({})

  useEffect(() => {
    discoverDatabases()
  }, [])

  async function discoverDatabases() {
    try {
      setLoading(true)
      const result = await notionBridge.discoverDatabases()
      setDatabases(result.databases || [])
      
      // Auto-map databases by title
      const mapped: Record<string, string> = {}
      result.databases?.forEach((db: NotionDatabase) => {
        const title = db.title.toLowerCase()
        if (title.includes('patient')) mapped.patients = db.id
        else if (title.includes('appointment')) mapped.appointments = db.id
        else if (title.includes('task')) mapped.tasks = db.id
        else if (title.includes('billing') || title.includes('invoice')) mapped.billing = db.id
      })
      setDatabaseIds(mapped)
    } catch (err) {
      console.error('Failed to discover databases:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: DashboardTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'today', label: "Today's Schedule", icon: 'today' },
    { id: 'patients', label: 'Patients', icon: 'people' },
    { id: 'tasks', label: 'Tasks', icon: 'task_alt' },
    { id: 'billing', label: 'Billing', icon: 'receipt_long' }
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Notion Command Center</h1>
        <p className="text-sm text-gray-600">
          {databases.length} databases connected • Live sync enabled
        </p>
      </div>

      <div className="flex border-b border-gray-200 bg-white px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <span className="material-icons text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Databases</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {databases.map(db => (
                      <div key={db.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-gray-900 mb-2">{db.title}</h3>
                        <p className="text-xs text-gray-500 mb-2 font-mono truncate">{db.id}</p>
                        <p className="text-sm text-gray-600">
                          {Object.keys(db.properties || {}).length} properties
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Databases</p>
                      <p className="text-2xl font-bold text-blue-900">{databases.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Auto-Mapped</p>
                      <p className="text-2xl font-bold text-green-900">{Object.keys(databaseIds).length}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Read/Write</p>
                      <p className="text-2xl font-bold text-purple-900">✓</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Live Sync</p>
                      <p className="text-2xl font-bold text-yellow-900">✓</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'today' && databaseIds.appointments && (
              <TodayView databaseId={databaseIds.appointments} />
            )}

            {activeTab === 'patients' && databaseIds.patients && (
              <PatientsView databaseId={databaseIds.patients} />
            )}

            {activeTab === 'tasks' && databaseIds.tasks && (
              <TasksView databaseId={databaseIds.tasks} />
            )}

            {activeTab === 'billing' && databaseIds.billing && (
              <BillingView databaseId={databaseIds.billing} />
            )}

            {activeTab !== 'overview' && !databaseIds[activeTab === 'today' ? 'appointments' : activeTab] && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <span className="material-icons text-6xl mb-2">database</span>
                <p>No {activeTab} database found</p>
                <p className="text-sm mt-2">Create a database in Notion with "{activeTab}" in the title</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
