# Cloudflare Workers

Edge compute workers for the MasterLinc platform.

## Workers

### 1. API Worker (`api/`)
**Purpose:** REST API endpoints for healthcare data

**Endpoints:**
- `GET /health` - Health check
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `GET /call-logs` - Call history
- `GET /visitors` - Visitor tracking
- `POST /conversations` - AI conversations

**Database:** Cloudflare D1 (SQLite)

### 2. Voice Worker (`voice/`)
**Purpose:** Real-time voice processing with Twilio

**Features:**
- WebSocket streaming
- Speech-to-text conversion
- Text-to-speech synthesis
- AI-powered conversations
- Call recording

**Integrations:** Twilio, AI Service

### 3. SBS Worker (`sbs/`)
**Purpose:** Smart Billing System with claim validation

**Features:**
- Claim validation
- Diagnosis code verification
- Procedure checks
- Billing rules engine

**Database:** D1 with billing schema

## Development

### Prerequisites
- Node.js 20+
- Wrangler CLI
- Cloudflare account

### Setup

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Install dependencies
npm install --legacy-peer-deps
```

### Local Development

```bash
# API Worker
cd apps/workers/api
npm run dev

# Voice Worker
cd apps/workers/voice
npm run dev

# SBS Worker
cd apps/workers/sbs
npm run dev
```

### Environment Variables

Create `wrangler.toml`:

```toml
name = "masterlinc-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "masterlinc_db"
database_id = "your-database-id"
```

## Deployment

```bash
# Deploy API Worker
cd apps/workers/api
npm run deploy

# Deploy Voice Worker
cd apps/workers/voice
npm run deploy

# Deploy SBS Worker
cd apps/workers/sbs
npm run deploy
```

## Database Migrations

```bash
# Create D1 database
wrangler d1 create masterlinc_db

# Run migrations
wrangler d1 execute masterlinc_db --file=./schema.sql

# Query database
wrangler d1 execute masterlinc_db --command="SELECT * FROM appointments"
```

## Shared Middleware

Located in `apps/workers/shared-middleware.ts`:

- **Error Handling** - Catches and formats errors
- **Rate Limiting** - Prevents abuse
- **Request ID** - Tracks requests across services
- **Security Headers** - Adds security headers
- **Performance Timing** - Measures response times

## Testing

```bash
# Run worker locally
npm run dev

# Test endpoint
curl http://localhost:8787/health
```

## Monitoring

- Cloudflare Dashboard → Workers → Analytics
- View logs: `wrangler tail`
- Metrics: Request count, errors, CPU time

## Best Practices

1. **Keep workers lightweight** - Max 1MB compressed
2. **Use D1 for data** - Don't store in KV for structured data
3. **Handle errors gracefully** - Always return JSON errors
4. **Add request IDs** - For debugging and tracking
5. **Use middleware** - DRY code with shared middleware
6. **Monitor performance** - Check CPU time and memory

## Troubleshooting

**Worker fails to deploy:**
```bash
wrangler publish --compatibility-date=2024-01-01
```

**Database connection error:**
```bash
# Check D1 binding
wrangler d1 list
```

**CORS issues:**
```typescript
// Add CORS middleware
app.use('/*', cors())
```

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
