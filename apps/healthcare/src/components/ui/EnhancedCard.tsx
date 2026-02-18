import * as React from 'react'
import { cn } from '../../lib/utils'

export interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  right?: React.ReactNode
}

export function EnhancedCard({ title, description, right, className, children, ...props }: EnhancedCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-dark p-4 shadow-lg transition-all duration-200 hover:shadow-primary/10 hover:border-primary/30',
        className,
      )}
      {...props}
    >
      {(title || description || right) && (
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            {title && <div className="text-white font-bold">{title}</div>}
            {description && <div className="text-text-secondary text-sm">{description}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}
