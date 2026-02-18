export const designSystem = {
  radii: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
  },
  shadows: {
    card: '0 8px 24px rgba(0,0,0,0.25)',
  },
} as const

export type DesignSystem = typeof designSystem
