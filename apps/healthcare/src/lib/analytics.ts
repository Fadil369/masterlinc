import { logger } from './logger'

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: string
}

interface PageView {
  path: string
  title?: string
  referrer?: string
}

class Analytics {
  private enabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  private queue: AnalyticsEvent[] = []

  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      logger.debug('Analytics disabled', { event, properties })
      return
    }

    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties: {
        ...properties,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      },
      timestamp: new Date().toISOString()
    }

    this.queue.push(analyticsEvent)
    logger.info('Analytics event', analyticsEvent)

    // TODO: Send to analytics service
    // this.flush()
  }

  page(view: PageView) {
    this.track('page_view', {
      path: view.path,
      title: view.title || document.title,
      referrer: view.referrer || document.referrer
    })
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.track('identify', {
      userId,
      ...traits
    })
  }

  // Feature usage tracking
  feature(featureName: string, action: string, metadata?: Record<string, any>) {
    this.track('feature_used', {
      feature: featureName,
      action,
      ...metadata
    })
  }

  // Performance tracking
  performance(metricName: string, value: number, unit: string = 'ms') {
    this.track('performance', {
      metric: metricName,
      value,
      unit
    })
  }

  // Error tracking
  error(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    })
  }

  private async flush() {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      // TODO: Send to analytics backend
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   body: JSON.stringify(events)
      // })
      logger.debug('Analytics flushed', { count: events.length })
    } catch (error) {
      logger.error('Failed to flush analytics', error as Error)
      // Put events back in queue
      this.queue.unshift(...events)
    }
  }
}

export const analytics = new Analytics()
