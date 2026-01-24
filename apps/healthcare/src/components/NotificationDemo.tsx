import { useState } from 'react'
import { Bell, Calendar, Chat, Warning, Play, Pause } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { useNotificationContext } from '../contexts/NotificationContext'
import { Card } from './ui/card'

export function NotificationDemo() {
  const { addNotification } = useNotificationContext()
  const [isExpanded, setIsExpanded] = useState(false)

  const triggerAppointmentNotification = () => {
    const notifications = [
      {
        title: 'Appointment Reminder',
        message: 'Your appointment with Dr. Sarah Al-Faisal is in 30 minutes',
        priority: 'high' as const
      },
      {
        title: 'Appointment Confirmed',
        message: 'Your appointment for tomorrow at 2:00 PM has been confirmed',
        priority: 'medium' as const
      },
      {
        title: 'Appointment Cancelled',
        message: 'Your appointment with Dr. Ahmed Yassin has been cancelled',
        priority: 'high' as const
      }
    ]
    const random = notifications[Math.floor(Math.random() * notifications.length)]
    addNotification('appointment', random.priority, random.title, random.message, {
      appointmentId: `apt-${Date.now()}`
    })
  }

  const triggerMessageNotification = () => {
    const notifications = [
      {
        title: 'New Message',
        message: 'Dr. Sarah Al-Faisal: "Your test results are ready for review"',
        priority: 'medium' as const
      },
      {
        title: 'Urgent Message',
        message: 'Dr. Ahmed Yassin: "Please call the office as soon as possible"',
        priority: 'high' as const
      },
      {
        title: 'New Message',
        message: 'Nurse Julia: "Reminder to complete your pre-visit questionnaire"',
        priority: 'low' as const
      }
    ]
    const random = notifications[Math.floor(Math.random() * notifications.length)]
    addNotification('message', random.priority, random.title, random.message, {
      messageId: `msg-${Date.now()}`
    })
  }

  const triggerAlertNotification = () => {
    const notifications = [
      {
        title: 'Critical Alert',
        message: 'Kingdom Hospital ER: High patient volume, estimated wait time 90+ minutes',
        priority: 'critical' as const
      },
      {
        title: 'Facility Update',
        message: 'Al-Amal Clinic closing early today at 5:00 PM',
        priority: 'medium' as const
      },
      {
        title: 'Lab Results Available',
        message: 'Your recent blood work results are now available in the portal',
        priority: 'medium' as const
      }
    ]
    const random = notifications[Math.floor(Math.random() * notifications.length)]
    addNotification('alert', random.priority, random.title, random.message, {
      facilityId: `fac-${Date.now()}`
    })
  }

  const triggerSystemNotification = () => {
    addNotification(
      'system',
      'low',
      'System Update',
      'A new version of the application is available. Refresh to update.',
      {}
    )
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg shadow-lg shadow-primary/30 transition-all duration-200 active:scale-95 font-semibold text-sm"
      >
        <Bell className="w-4 h-4" weight="fill" />
        <span>Notification Demo</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 w-80">
      <Card className="bg-card border-border shadow-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" weight="fill" />
            <h3 className="font-bold text-sm text-foreground">Notification Demo</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 rounded-lg"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </Button>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Click buttons below to trigger test notifications
          </p>
          <Button
            onClick={triggerAppointmentNotification}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Appointment Notification</span>
          </Button>
          <Button
            onClick={triggerMessageNotification}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Chat className="w-4 h-4 text-green-400" />
            <span className="text-sm">Message Notification</span>
          </Button>
          <Button
            onClick={triggerAlertNotification}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Warning className="w-4 h-4 text-orange-400" />
            <span className="text-sm">Alert Notification</span>
          </Button>
          <Button
            onClick={triggerSystemNotification}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Bell className="w-4 h-4 text-purple-400" />
            <span className="text-sm">System Notification</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
