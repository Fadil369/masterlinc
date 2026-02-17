/**
 * Centralized logging utility
 * Replaces console.* calls with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private isProduction = import.meta.env.PROD

  private formatMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message
    ]
    
    if (entry.context) {
      parts.push(JSON.stringify(entry.context))
    }
    
    return parts.join(' ')
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }
  }

  private log(entry: LogEntry): void {
    // In production, send to logging service (Sentry, LogRocket, etc.)
    if (this.isProduction) {
      // TODO: Integrate with logging service
      // this.sendToService(entry)
    }

    // In development, use console
    if (this.isDevelopment) {
      const formatted = this.formatMessage(entry)
      
      switch (entry.level) {
        case 'debug':
          console.debug(formatted, entry.context)
          break
        case 'info':
          console.info(formatted, entry.context)
          break
        case 'warn':
          console.warn(formatted, entry.context)
          break
        case 'error':
          console.error(formatted, entry.context, entry.error)
          break
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(this.createEntry('debug', message, context))
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(this.createEntry('info', message, context))
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(this.createEntry('warn', message, context))
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(this.createEntry('error', message, context, error))
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }
}

export const logger = new Logger()
