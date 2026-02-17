import { useEffect } from 'react'
import { toast } from 'sonner'
import { logger } from '../lib/logger'

interface NotificationPermission {
  granted: boolean
  denied: boolean
  prompt: boolean
}

export function useNotifications() {
  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      logger.warn('This browser does not support notifications')
      return
    }

    // Check current permission
    if (Notification.permission === 'default') {
      logger.info('Notification permission not yet requested')
    }
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, prompt: false }
    }

    try {
      const permission = await Notification.requestPermission()
      logger.info('Notification permission', { permission })

      return {
        granted: permission === 'granted',
        denied: permission === 'denied',
        prompt: permission === 'default'
      }
    } catch (error) {
      logger.error('Failed to request notification permission', error as Error)
      return { granted: false, denied: false, prompt: true }
    }
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      toast(title, { description: options?.body })
      return
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          ...options
        })
        logger.info('Notification sent', { title })
      } catch (error) {
        logger.error('Failed to send notification', error as Error)
        toast(title, { description: options?.body })
      }
    } else if (Notification.permission === 'default') {
      requestPermission().then(({ granted }) => {
        if (granted) {
          sendNotification(title, options)
        } else {
          toast(title, { description: options?.body })
        }
      })
    } else {
      // Permission denied, use toast fallback
      toast(title, { description: options?.body })
    }
  }

  return {
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied'
  }
}
