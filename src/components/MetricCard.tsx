import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'accent'
  className?: string
}

export function MetricCard({ title, value, icon, trend, color = 'primary', className }: MetricCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    accent: 'text-accent'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className={cn('opacity-80', colorClasses[color])}>
              {icon}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold">{value}</div>
            {trend && (
              <div
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
