import { useState, useEffect, useCallback } from 'react'
import { logger } from '../lib/logger'

interface SyncItem {
  id: string
  type: string
  data: any
  timestamp: number
  retries: number
}

const SYNC_QUEUE_KEY = 'healthcare_sync_queue'
const MAX_RETRIES = 3

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Load queue from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY)
      if (stored) {
        setSyncQueue(JSON.parse(stored))
      }
    } catch (error) {
      logger.error('Failed to load sync queue', error as Error)
    }
  }, [])

  // Save queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue))
    } catch (error) {
      logger.error('Failed to save sync queue', error as Error)
    }
  }, [syncQueue])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Connection restored')
      setIsOnline(true)
    }

    const handleOffline = () => {
      logger.warn('Connection lost')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      syncPendingItems()
    }
  }, [isOnline, syncQueue.length])

  const addToQueue = useCallback((type: string, data: any) => {
    const item: SyncItem = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    setSyncQueue(prev => [...prev, item])
    logger.info('Added to sync queue', { type, id: item.id })
  }, [])

  const syncPendingItems = useCallback(async () => {
    if (isSyncing || syncQueue.length === 0) return

    setIsSyncing(true)
    logger.info('Starting sync', { queueLength: syncQueue.length })

    const results = await Promise.allSettled(
      syncQueue.map(async (item) => {
        try {
          // Implement your sync logic here
          // Example: await api.post(`/sync/${item.type}`, item.data)
          
          logger.info('Synced item', { id: item.id, type: item.type })
          return item.id
        } catch (error) {
          if (item.retries < MAX_RETRIES) {
            logger.warn('Sync failed, will retry', { id: item.id, retries: item.retries })
            throw error
          } else {
            logger.error('Sync failed, max retries reached', error as Error, { id: item.id })
            throw error
          }
        }
      })
    )

    // Remove successfully synced items
    const successfulIds = results
      .filter((r, i) => r.status === 'fulfilled')
      .map((r, i) => syncQueue[i].id)

    // Increment retry count for failed items
    setSyncQueue(prev =>
      prev
        .filter(item => !successfulIds.includes(item.id))
        .map(item => {
          const result = results[prev.indexOf(item)]
          if (result.status === 'rejected') {
            return { ...item, retries: item.retries + 1 }
          }
          return item
        })
        .filter(item => item.retries < MAX_RETRIES)
    )

    setIsSyncing(false)
    logger.info('Sync completed', { synced: successfulIds.length, failed: syncQueue.length - successfulIds.length })
  }, [syncQueue, isSyncing])

  const clearQueue = useCallback(() => {
    setSyncQueue([])
    logger.info('Sync queue cleared')
  }, [])

  return {
    isOnline,
    syncQueue,
    isSyncing,
    addToQueue,
    syncPendingItems,
    clearQueue,
    pendingCount: syncQueue.length
  }
}
