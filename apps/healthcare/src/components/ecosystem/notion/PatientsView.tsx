import { useState, useEffect } from 'react'
import { notionClient } from '../../../lib/notion-client'

interface Patient {
  id: string
  name: string
  age?: number
  status?: string
  lastVisit?: string
}

export function PatientsView({ databaseId }: { databaseId: string }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')

  useEffect(() => {
    loadPatients()
  }, [databaseId, filter])

  async function loadPatients() {
    try {
      setLoading(true)
      const notionFilter = filter !== 'all' ? {
        property: 'Status',
        status: { equals: filter === 'active' ? 'Active' : 'Inactive' }
      } : undefined

      const response = await notionClient.queryDatabase(databaseId, notionFilter)
      
      const mapped = response.results.map((page: any) => ({
        id: page.id,
        name: page.properties.Name?.title?.[0]?.plain_text || 'Unnamed',
        age: page.properties.Age?.number,
        status: page.properties.Status?.status?.name || 'Unknown',
        lastVisit: page.properties['Last Visit']?.date?.start
      }))
      
      setPatients(mapped)
    } catch (err) {
      console.error('Failed to load patients:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Active Patients</h2>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
          {patients.map(patient => (
            <div
              key={patient.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {patient.status}
                </span>
              </div>
              {patient.age && (
                <p className="text-sm text-gray-600 mb-1">Age: {patient.age}</p>
              )}
              {patient.lastVisit && (
                <p className="text-sm text-gray-600">
                  Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
