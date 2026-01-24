import { createContext, useContext, ReactNode } from 'react'
import { useNotifications } from '../hooks/use-notifications'

interface NotificationContextValue {
  notifications: ReturnType<typeof useNotifications>['notifications']
  unreadCount: ReturnType<typeof useNotifications>['unreadCount']
  addNotification: ReturnType<typeof useNotifications>['addNotification']
  markAsRead: ReturnType<typeof useNotifications>['markAsRead']
  markAllAsRead: ReturnType<typeof useNotifications>['markAllAsRead']
  deleteNotification: ReturnType<typeof useNotifications>['deleteNotification']
  clearAll: ReturnType<typeof useNotifications>['clearAll']
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationMethods = useNotifications()

  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
