import { useState } from 'react'
import { Bell, X, Check, Checks, Trash, Calendar, Chat, Warning, Info } from '@phosphor-icons/react'
import { useNotificationContext } from '../contexts/NotificationContext'
import { Notification, NotificationPriority } from '../types'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationCenterProps {
  onNavigate?: (view: string, metadata?: Notification['metadata']) => void
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationContext()

  const togglePanel = () => setIsOpen(!isOpen)

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (onNavigate && notification.metadata) {
      if (notification.type === 'appointment' && notification.metadata.appointmentId) {
        onNavigate('appointments', notification.metadata)
        setIsOpen(false)
      } else if (notification.type === 'message' && notification.metadata.senderId) {
        onNavigate('messages', notification.metadata)
        setIsOpen(false)
      }
    }
  }

  const getIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'appointment':
        return <Calendar className="w-5 h-5" />
      case 'message':
        return <Chat className="w-5 h-5" />
      case 'alert':
        return <Warning className="w-5 h-5" />
      case 'system':
        return <Info className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'medium':
        return 'bg-primary/10 border-primary/30 text-primary'
      case 'low':
        return 'bg-muted/10 border-muted/30 text-muted-foreground'
      default:
        return 'bg-muted/10 border-muted/30 text-muted-foreground'
    }
  }

  return (
    <>
      <button
        onClick={togglePanel}
        className="relative p-2 rounded-lg bg-surface-dark-lighter hover:bg-surface-dark border border-border hover:border-primary/50 transition-all duration-200 active:scale-95"
      >
        <Bell className="w-5 h-5 text-foreground" weight={unreadCount > 0 ? 'fill' : 'regular'} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={togglePanel}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-surface-dark-lighter">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-primary" weight="fill" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Notifications</h2>
                    <p className="text-xs text-muted-foreground">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePanel}
                  className="rounded-lg hover:bg-surface-dark"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center gap-2 p-3 border-b border-border bg-background">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs flex items-center gap-1.5 hover:bg-surface-dark"
                  >
                    <Checks className="w-4 h-4" />
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs flex items-center gap-1.5 hover:bg-surface-dark text-destructive hover:text-destructive"
                  >
                    <Trash className="w-4 h-4" />
                    Clear all
                  </Button>
                </div>
              )}

              <ScrollArea className="flex-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Bell className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      You're all caught up! We'll notify you when something important happens.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-surface-dark/50 cursor-pointer transition-colors group ${
                          !notification.read ? 'bg-primary/5' : ''
                        } ${notification.metadata ? 'active:scale-[0.99]' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${getPriorityColor(notification.priority)}`}>
                            {getIcon(notification)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 shrink-0">
                                {notification.metadata && (
                                  <span className="text-xs text-primary font-medium" title="Click to view">
                                    →
                                  </span>
                                )}
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRead(notification.id)
                                    }}
                                    className="h-7 w-7 rounded-md hover:bg-surface-dark"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="h-7 w-7 rounded-md hover:bg-destructive/10 text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
