import { useState, useEffect } from 'react'
import { notionClient } from '../../../lib/notion-client'

interface Appointment {
  id: string
  patient: string
  time: string
  status: string
  type?: string
  doctor?: string
}

export function TodayView({ databaseId }: { databaseId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodayAppointments()
  }, [databaseId])

  async function loadTodayAppointments() {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      const response = await notionClient.queryDatabase(databaseId, {
        property: 'Date',
        date: { equals: today }
      }, [{ property: 'Time', direction: 'ascending' }])
      
      const mapped = response.results.map((page: any) => ({
        id: page.id,
        patient: page.properties.Patient?.relation?.[0]?.id || page.properties['Patient Name']?.rich_text?.[0]?.plain_text || 'Unknown',
        time: page.properties.Time?.date?.start || page.properties.Date?.date?.start || '',
        status: page.properties.Status?.status?.name || 'Scheduled',
        type: page.properties.Type?.select?.name,
        doctor: page.properties.Doctor?.people?.[0]?.name
      }))
      
      setAppointments(mapped)
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(appointmentId: string, newStatus: string) {
    try {
      await notionClient.setStatus(appointmentId, 'Status', newStatus)
      await loadTodayAppointments()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const statusColors: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No Show': 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
        <span className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <span className="material-icons text-6xl mb-2">event_available</span>
          <p>No appointments scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-auto">
          {appointments.map(appt => (
            <div
              key={appt.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-icons text-gray-400 text-sm">schedule</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(appt.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-800 font-medium">{appt.patient}</p>
                  {appt.type && <p className="text-sm text-gray-600">{appt.type}</p>}
                  {appt.doctor && <p className="text-sm text-gray-600">Dr. {appt.doctor}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appt.status] || 'bg-gray-100 text-gray-800'}`}>
                  {appt.status}
                </span>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                {['Scheduled', 'In Progress', 'Completed', 'No Show'].map(status => (
                  status !== appt.status && (
                    <button
                      key={status}
                      onClick={() => updateStatus(appt.id, status)}
                      className="text-xs px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      {status}
                    </button>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
