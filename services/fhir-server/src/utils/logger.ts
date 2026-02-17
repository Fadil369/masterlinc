/**
 * Logger for FHIR Server
 */

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta || '')
  },
  error: (message: string, error: Error, meta?: any) => {
    console.error(`[ERROR] ${message}`, error.message, meta || '')
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta || '')
  }
}
