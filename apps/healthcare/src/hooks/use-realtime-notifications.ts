import { useEffect, useRef } from 'react'
import { useNotifications } from './use-notifications'

const APPOINTMENT_NOTIFICATIONS = [
  {
    title: 'Upcoming Appointment',
    message: 'Reminder: Appointment with Dr. Sarah Al-Faisal in 30 minutes',
    priority: 'high' as const,
    type: 'appointment' as const
  },
  {
    title: 'Appointment Confirmed',
    message: 'Your appointment for tomorrow at 2:00 PM has been confirmed',
    priority: 'medium' as const,
    type: 'appointment' as const
  },
  {
    title: 'Appointment Rescheduled',
    message: 'Dr. Ahmed Yassin has rescheduled your appointment to next week',
    priority: 'high' as const,
    type: 'appointment' as const
  }
]

const MESSAGE_NOTIFICATIONS = [
  {
    title: 'New Message',
    message: 'Dr. Sarah Al-Faisal: "Your test results are ready for review"',
    priority: 'medium' as const,
    type: 'message' as const
  },
  {
    title: 'New Message',
    message: 'Nurse Julia: "Please bring your insurance card to your next visit"',
    priority: 'low' as const,
    type: 'message' as const
  },
  {
    title: 'Urgent Message',
    message: 'Dr. Ahmed Yassin: "Please call the office as soon as possible"',
    priority: 'high' as const,
    type: 'message' as const
  }
]

const ALERT_NOTIFICATIONS = [
  {
    title: 'Critical Alert',
    message: 'Kingdom Hospital ER: High patient volume, estimated wait time 90+ minutes',
    priority: 'critical' as const,
    type: 'alert' as const
  },
  {
    title: 'Facility Update',
    message: 'Al-Amal Clinic closing early today at 5:00 PM',
    priority: 'medium' as const,
    type: 'alert' as const
  },
  {
    title: 'System Alert',
    message: 'New lab results available in your patient portal',
    priority: 'medium' as const,
    type: 'alert' as const
  }
]

export function useRealtimeNotifications(enabled: boolean = true) {
  const { addNotification } = useNotifications()
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const sendRandomNotification = () => {
      const notificationTypes = [APPOINTMENT_NOTIFICATIONS, MESSAGE_NOTIFICATIONS, ALERT_NOTIFICATIONS]
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
      const randomNotif = randomType[Math.floor(Math.random() * randomType.length)]

      addNotification(
        randomNotif.type,
        randomNotif.priority,
        randomNotif.title,
        randomNotif.message,
        {
          appointmentId: randomNotif.type === 'appointment' ? `apt-${Date.now()}` : undefined,
          messageId: randomNotif.type === 'message' ? `msg-${Date.now()}` : undefined
        }
      )
    }

    const minDelay = 15000
    const maxDelay = 45000

    const scheduleNextNotification = () => {
      const delay = Math.random() * (maxDelay - minDelay) + minDelay
      intervalRef.current = window.setTimeout(() => {
        sendRandomNotification()
        scheduleNextNotification()
      }, delay)
    }

    const initialDelay = Math.random() * 10000 + 5000
    const initialTimer = window.setTimeout(() => {
      sendRandomNotification()
      scheduleNextNotification()
    }, initialDelay)

    return () => {
      clearTimeout(initialTimer)
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [enabled, addNotification])
}
