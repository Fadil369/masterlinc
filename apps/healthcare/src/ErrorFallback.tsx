import type { FallbackProps } from 'react-error-boundary'

import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Button } from './components/ui/button'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // In development, rethrow to show overlay
  if (import.meta.env.DEV) throw error

  const message = (error as any)?.message ? String((error as any).message) : String(error)

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>This application has encountered a runtime error</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. The error details are shown below.
          </AlertDescription>
        </Alert>

        <div className="bg-surface-dark border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-text-secondary mb-2">Error Details:</h3>
          <pre className="text-xs text-red-200 bg-surface-dark-lighter p-3 rounded border border-border overflow-auto max-h-32 whitespace-pre-wrap">
            {message}
          </pre>
        </div>

        <Button onClick={resetErrorBoundary} className="w-full" variant="outline">
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
