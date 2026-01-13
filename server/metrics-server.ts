import express from 'express'
import { MetricsService } from './MetricsService'

const app = express()

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', MetricsService.metricsRegistry().contentType)
  res.end(await MetricsService.metricsRegistry().metrics())
})

const port = Number(process.env.METRICS_PORT ?? 9000)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MASTERLINC metrics server listening on http://localhost:${port}/metrics`)
})
