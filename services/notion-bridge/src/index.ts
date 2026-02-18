import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { loadConfig } from './config'
import { createNotionClient } from './notion'
import { requireApiKey } from './auth'
import { NotionFHIRSync } from './sync'

const cfg = loadConfig(process.env)
const notion = createNotionClient(cfg.NOTION_TOKEN)

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notion-bridge' }))

app.use('/api', requireApiKey(cfg.NOTION_BRIDGE_API_KEY))

// 1) List databases the integration can see
app.get('/api/notion/databases', async (_req, res) => {
  const result = await notion.search({ filter: { property: 'object', value: 'database' } })
  res.json({ results: result.results })
})

// 1b) Discover databases with full schema
app.get('/api/notion/databases/discover', async (_req, res) => {
  const result = await notion.search({ filter: { property: 'object', value: 'database' }, page_size: 100 })
  const databases = await Promise.all(
    result.results.map(async (db: any) => {
      const dbInfo = await notion.databases.retrieve({ database_id: db.id })
      return {
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        properties: dbInfo.properties,
        url: db.url
      }
    })
  )
  res.json({ databases })
})

// 2) Query database
const querySchema = z.object({
  databaseId: z.string().min(10),
  filter: z.any().optional(),
  sorts: z.any().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
})

app.post('/api/notion/query', async (req, res) => {
  const body = querySchema.parse(req.body)
  const result = await notion.databases.query({
    database_id: body.databaseId,
    filter: body.filter,
    sorts: body.sorts,
    page_size: body.pageSize,
  } as any)
  res.json(result)
})

// 3) Update page properties (write)
const updateSchema = z.object({
  pageId: z.string().min(10),
  properties: z.record(z.any()),
})

app.post('/api/notion/page/update', async (req, res) => {
  const body = updateSchema.parse(req.body)
  const result = await notion.pages.update({ page_id: body.pageId, properties: body.properties } as any)
  res.json(result)
})

// 4) Create page in database (write)
const createSchema = z.object({
  databaseId: z.string().min(10),
  properties: z.record(z.any()),
  children: z.array(z.any()).optional(),
})

app.post('/api/notion/page/create', async (req, res) => {
  const body = createSchema.parse(req.body)
  const result = await notion.pages.create({
    parent: { database_id: body.databaseId },
    properties: body.properties,
    children: body.children,
  } as any)
  res.status(201).json(result)
})

// 5) Convenience: set status on a page (common workflow)
const setStatusSchema = z.object({
  pageId: z.string().min(10),
  statusProperty: z.string().min(1).default('Status'),
  statusValue: z.string().min(1),
})

app.post('/api/notion/page/set-status', async (req, res) => {
  const body = setStatusSchema.parse(req.body)
  const result = await notion.pages.update({
    page_id: body.pageId,
    properties: {
      [body.statusProperty]: {
        status: { name: body.statusValue },
      },
    },
  } as any)
  res.json(result)
})

// FHIR Sync endpoints (optional - requires FHIR_URL and PATIENTS_DB_ID env vars)
if (process.env.FHIR_URL && process.env.NOTION_PATIENTS_DB_ID) {
  const sync = new NotionFHIRSync(
    notion,
    process.env.FHIR_URL,
    process.env.NOTION_PATIENTS_DB_ID
  )

  app.post('/api/sync/fhir-to-notion', async (req, res) => {
    try {
      const result = await sync.syncAllFHIRToNotion()
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/api/sync/notion-to-fhir/:pageId', async (req, res) => {
    try {
      await sync.syncNotionPatientToFHIR(req.params.pageId)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
}

app.listen(cfg.PORT, () => {
  // never log NOTION_TOKEN
  console.log(`notion-bridge listening on :${cfg.PORT}`)
  if (process.env.FHIR_URL) {
    console.log(`FHIR sync enabled: ${process.env.FHIR_URL}`)
  }
})
