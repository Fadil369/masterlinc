import { useState, useEffect } from 'react'
import { Appointment } from '../../types'
import { useNotificationContext } from '../../contexts/NotificationContext'
import { toast } from 'sonner'

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'Sarah Al-Qahtani',
    patientId: 'P-2024-001',
    providerName: 'Dr. Ahmad Al-Rashid',
    providerId: 'D-001',
    date: '2024-01-15',
    time: '09:00',
    type: 'Follow-up',
    status: 'scheduled',
    reason: 'Cardiology consultation'
  },
  {
    id: '2',
    patientName: 'Mohammed Hassan',
    patientId: 'P-2024-002',
    providerName: 'Dr. Fatima Al-Zahrani',
    providerId: 'D-002',
    date: '2024-01-15',
    time: '10:30',
    type: 'New Patient',
    status: 'scheduled',
    reason: 'Annual checkup'
  },
  {
    id: '3',
    patientName: 'Layla Ibrahim',
    patientId: 'P-2024-003',
    providerName: 'Dr. Ahmad Al-Rashid',
    providerId: 'D-001',
    date: '2024-01-15',
    time: '14:00',
    type: 'Follow-up',
    status: 'completed',
    reason: 'Post-surgery review'
  }
]

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>('appointments', mockAppointments)
  const [selectedDate, setSelectedDate] = useState('2024-01-15')
  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const { addNotification } = useNotificationContext()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      const currentDate = now.toISOString().split('T')[0]
      
      appointments?.forEach((appointment) => {
        if (appointment.status === 'scheduled' && appointment.date === currentDate) {
          const [aptHour, aptMin] = appointment.time.split(':').map(Number)
          const [nowHour, nowMin] = currentTime.split(':').map(Number)
          
          const aptMinutes = aptHour * 60 + aptMin
          const nowMinutes = nowHour * 60 + nowMin
          const diffMinutes = aptMinutes - nowMinutes
          
          if (diffMinutes === 30) {
            addNotification(
              'appointment',
              'high',
              'Appointment Reminder',
              `${appointment.patientName} has an appointment in 30 minutes at ${appointment.time}.`,
              { appointmentId: appointment.id }
            )
          } else if (diffMinutes === 15) {
            addNotification(
              'appointment',
              'high',
              'Appointment Starting Soon',
              `${appointment.patientName} appointment starts in 15 minutes!`,
              { appointmentId: appointment.id }
            )
          }
        }
      })
    }, 60000)
    
    return () => clearInterval(interval)
  }, [appointments, addNotification])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'no-show': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments((current) =>
      (current || []).map((apt) => {
        if (apt.id === appointmentId) {
          const updated = { ...apt, status: newStatus }
          
          let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
          let message = ''
          
          switch (newStatus) {
            case 'completed':
              message = `Appointment with ${apt.patientName} has been marked as completed.`
              priority = 'low'
              break
            case 'cancelled':
              message = `Appointment with ${apt.patientName} at ${apt.time} has been cancelled.`
              priority = 'high'
              break
            case 'no-show':
              message = `Patient ${apt.patientName} did not show up for appointment at ${apt.time}.`
              priority = 'medium'
              break
          }
          
          if (message) {
            addNotification(
              'appointment',
              priority,
              'Appointment Status Updated',
              message,
              { appointmentId: apt.id }
            )
          }
          
          return updated
        }
        return apt
      })
    )
  }

  const handleDeleteAppointment = (appointmentId: string) => {
    const appointment = appointments?.find(a => a.id === appointmentId)
    if (appointment) {
      setAppointments((current) => (current || []).filter(a => a.id !== appointmentId))
      
      addNotification(
        'appointment',
        'medium',
        'Appointment Deleted',
        `Appointment with ${appointment.patientName} at ${appointment.time} has been deleted.`,
        { appointmentId }
      )
      
      toast.success('Appointment deleted successfully')
    }
  }

  const handleBookSlot = (time: string) => {
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientName: 'New Patient',
      patientId: `P-${Date.now()}`,
      providerName: 'Dr. Ahmad Al-Rashid',
      providerId: 'D-001',
      date: selectedDate,
      time,
      type: 'New Patient',
      status: 'scheduled',
      reason: 'General consultation'
    }
    
    setAppointments((current) => [...(current || []), newAppointment])
    
    addNotification(
      'appointment',
      'medium',
      'New Appointment Scheduled',
      `Appointment scheduled for ${time} on ${selectedDate}.`,
      { appointmentId: newAppointment.id }
    )
    
    toast.success('Appointment scheduled successfully')
  }

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
              Appointments
            </h1>
            <p className="text-text-secondary text-base">
              Schedule and manage patient appointments
            </p>
          </div>
          
          <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Appointment
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="bg-surface-dark-lighter p-1 rounded-lg inline-flex">
            {['day', 'week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as typeof view)}
                className={`px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm capitalize ${
                  view === v
                    ? 'bg-surface-dark shadow-md text-primary'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="text-white font-bold text-lg">
              January 15, 2024
            </div>
            <button className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-dark rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-12 bg-surface-dark-lighter border-b border-border">
                <div className="col-span-1 p-3 text-center text-text-secondary text-xs font-bold uppercase">
                  Time
                </div>
                <div className="col-span-11 p-3 text-text-secondary text-xs font-bold uppercase">
                  Appointment
                </div>
              </div>

              <div className="divide-y divide-border">
                {appointments && appointments
                  .filter(apt => apt.date === selectedDate)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment) => (
                    <div key={appointment.id} className="grid grid-cols-12 hover:bg-surface-dark-lighter transition-colors">
                      <div className="col-span-1 p-4 text-center">
                        <p className="text-white font-bold text-sm">{appointment.time}</p>
                      </div>
                      <div className="col-span-11 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-bold text-base">
                                {appointment.patientName}
                              </h3>
                              <span className="text-text-secondary text-sm">
                                {appointment.patientId}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm mb-1">
                              <span className="font-medium">Provider:</span> {appointment.providerName}
                            </p>
                            <p className="text-text-secondary text-sm mb-1">
                              <span className="font-medium">Type:</span> {appointment.type}
                            </p>
                            <p className="text-text-secondary text-sm">
                              <span className="font-medium">Reason:</span> {appointment.reason}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {appointment.status === 'scheduled' && (
                              <button 
                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                title="Mark as completed"
                              >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                              </button>
                            )}
                            {appointment.status === 'scheduled' && (
                              <button 
                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                title="Cancel appointment"
                              >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="p-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-dark rounded-xl border border-border p-5">
              <h3 className="text-white font-bold text-lg mb-4">Today's Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Total Appointments</span>
                  <span className="text-white font-bold text-lg">
                    {appointments?.filter(a => a.date === selectedDate).length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Completed</span>
                  <span className="text-green-400 font-bold text-lg">
                    {appointments?.filter(a => a.date === selectedDate && a.status === 'completed').length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Scheduled</span>
                  <span className="text-blue-400 font-bold text-lg">
                    {appointments?.filter(a => a.date === selectedDate && a.status === 'scheduled').length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Cancelled</span>
                  <span className="text-red-400 font-bold text-lg">
                    {appointments?.filter(a => a.date === selectedDate && a.status === 'cancelled').length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-dark rounded-xl border border-border p-5">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Available Slots
              </h3>
              
              <div className="space-y-2">
                {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'].map((time) => {
                  const isBooked = appointments?.some(a => a.date === selectedDate && a.time === time) || false
                  return (
                    <button
                      key={time}
                      disabled={isBooked}
                      onClick={() => !isBooked && handleBookSlot(time)}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        isBooked
                          ? 'bg-surface-dark-lighter text-text-secondary cursor-not-allowed'
                          : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95'
                      }`}
                    >
                      {time} {isBooked && '(Booked)'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
