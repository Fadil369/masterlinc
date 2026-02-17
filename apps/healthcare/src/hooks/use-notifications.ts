import { useEffect, useCallback, useState } from 'react'
import { Notification, NotificationType, NotificationPriority } from '../types'
import { toast } from 'sonner'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    message: string,
    metadata?: Notification['metadata']
  ) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      metadata
    }

    setNotifications((current) => [newNotification, ...(current || [])])

    const icon = getNotificationIcon(type)
    const duration = priority === 'critical' ? 10000 : priority === 'high' ? 7000 : 5000

    switch (priority) {
      case 'critical':
        toast.error(title, {
          description: message,
          duration,
          icon,
          className: 'border-l-4 border-l-red-500'
        })
        break
      case 'high':
        toast.warning(title, {
          description: message,
          duration,
          icon,
          className: 'border-l-4 border-l-orange-500'
        })
        break
      case 'medium':
        toast.info(title, {
          description: message,
          duration,
          icon,
          className: 'border-l-4 border-l-primary'
        })
        break
      default:
        toast(title, {
          description: message,
          duration,
          icon,
          className: 'border-l-4 border-l-muted'
        })
    }

    return newNotification.id
  }, [setNotifications])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((current) =>
      (current || []).map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [setNotifications])

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      (current || []).map(notif => ({ ...notif, read: true }))
    )
  }, [setNotifications])

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((current) =>
      (current || []).filter(notif => notif.id !== notificationId)
    )
  }, [setNotifications])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [setNotifications])

  const unreadCount = (notifications || []).filter(n => !n.read).length

  return {
    notifications: notifications || [],
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  }
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'appointment':
      return '📅'
    case 'message':
      return '💬'
    case 'alert':
      return '⚠️'
    case 'system':
      return '🔔'
    default:
      return '📢'
  }
}
