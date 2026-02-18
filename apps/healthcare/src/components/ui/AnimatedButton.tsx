import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function AnimatedButton({ className, variant = 'primary', disabled, ...props }: AnimatedButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98] hover:-translate-y-[1px]'

  const variants: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20',
    secondary: 'bg-surface-dark-lighter text-white hover:bg-muted',
    ghost: 'bg-transparent text-white hover:bg-surface-dark-lighter',
  }

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled}
      {...props}
    />
  )
}
