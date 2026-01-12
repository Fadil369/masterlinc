import { cn } from '@/lib/utils'
import type { AgentStatus } from '@/lib/types'

interface StatusIndicatorProps {
  status: AgentStatus
  withPulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusIndicator({ status, withPulse = true, size = 'md', className }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const statusClasses = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    degraded: 'bg-warning',
    maintenance: 'bg-purple'
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          statusClasses[status]
        )}
      />
      {status === 'online' && withPulse && (
        <div
          className={cn(
            'absolute rounded-full bg-success animate-pulse-glow',
            sizeClasses[size]
          )}
        />
      )}
    </div>
  )
}
