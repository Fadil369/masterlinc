# MasterLinc Architecture

## Overview

MasterLinc is a comprehensive healthcare platform built with a modern monorepo architecture using Turborepo, integrating multiple apps, workers, packages, and services.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Healthcare   │  │   Web App    │  │  Mobile Apps    │  │
│  │   App (SPA)  │  │  (Next.js)   │  │   (Future)      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  API Worker  │  │ Voice Worker │  │  SBS Worker     │  │
│  │  (REST API)  │  │  (WebSocket) │  │  (D1 Database)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ Internal
┌─────────────────────────────────────────────────────────────┐
│                      Services Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Healthcare   │  │     AI       │  │  DID/OID        │  │
│  │     API      │  │ Orchestrator │  │  Registries     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Shared Packages                           │
├─────────────────────────────────────────────────────────────┤
│  @basma/shared │ @brainsait/sbs-types │ @masterlinc/*     │
└─────────────────────────────────────────────────────────────┘
```

## Apps

### 1. Healthcare App (`apps/healthcare`)
- **Type:** React SPA (Vite + TypeScript)
- **Purpose:** Main healthcare application UI
- **Features:**
  - Patient intake forms
  - Appointment management
  - Direct messaging
  - Live facilities map
  - Voice agent integration
  - Provider dashboard
  - CDI, RCM, and Coding modules

**Tech Stack:**
- React 19 + TypeScript
- Vite 7 (build tool)
- Tailwind CSS 4
- Radix UI components
- React Query (data fetching)
- Vitest (testing)

### 2. Web App (`apps/web`)
- **Type:** Next.js Application
- **Purpose:** Marketing/landing pages and voice AI
- **Features:**
  - Google GenAI integration
  - Voice interaction
  - Call management

**Tech Stack:**
- Next.js 16
- TypeScript
- Tailwind CSS

## Workers (Cloudflare)

### 1. API Worker (`apps/workers/api`)
- **Purpose:** REST API endpoints
- **Features:**
  - Appointments CRUD
  - Call logs
  - Visitor tracking
  - Conversations
  - Attributes management

### 2. Voice Worker (`apps/workers/voice`)
- **Purpose:** Real-time voice processing
- **Features:**
  - Twilio integration
  - WebSocket streaming
  - Speech-to-text
  - Text-to-speech
  - AI conversation handling

### 3. SBS Worker (`apps/workers/sbs`)
- **Purpose:** Smart Billing System
- **Features:**
  - Claim validation
  - Diagnosis verification
  - Procedure checks
  - D1 database integration

## Services

### 1. Healthcare API (`services/healthcare-api`)
- Express.js REST API
- Patient management
- FHIR integration
- NPHIES compliance

### 2. AI Orchestrator (`services/ai-orchestrator`)
- Multi-model AI coordination
- Anthropic Claude integration
- Request routing
- Response aggregation

### 3. DID Registry (`services/did-registry`)
- Decentralized Identifier management
- Identity verification
- Document signing

### 4. OID Registry (`services/oid-registry`)
- Organization Identifier management
- FHIR OID mapping
- Healthcare entity registration

## Packages

### 1. @basma/shared
- Common utilities
- Type definitions
- AI services
- Speech processing
- Logging utilities

### 2. @brainsait/sbs-types
- Smart Billing System types
- Claim interfaces
- Validation schemas

### 3. @masterlinc/* (Multiple packages)
- **3cx-mcp:** 3CX telephony integration
- **coordinator:** Service coordination
- **orchestrator:** AI orchestration
- **deepseek-radiology:** Radiology AI
- **radiolinc-agent:** Radio AI agent

## Data Flow

### User Request Flow
```
User → Healthcare App → API Worker → Services → Database
                    ↓
                Error Boundary → Logger → Monitoring
```

### Voice Call Flow
```
Twilio → Voice Worker → WebSocket → AI Service → Response
              ↓
         Speech Processing → Database
```

### AI Request Flow
```
User Input → Healthcare App → AI Orchestrator
                                    ↓
                        Multiple AI Models (Anthropic, etc.)
                                    ↓
                            Aggregated Response
```

## Key Technologies

- **Frontend:** React, Next.js, TypeScript
- **Backend:** Cloudflare Workers, Express.js
- **Database:** D1 (SQLite), PostgreSQL
- **AI:** Anthropic Claude, Google GenAI
- **Build:** Turborepo, Vite, TypeScript
- **Testing:** Vitest, Testing Library
- **CI/CD:** GitHub Actions
- **Deployment:** Cloudflare Pages, Wrangler

## Security

- CORS configured
- Rate limiting
- Request validation
- Security headers
- Error boundary protection
- Structured logging

## Monitoring & Logging

- Centralized logger
- Request/Response tracking
- Error tracking
- Performance metrics
- Audit trails

## Development Workflow

1. **Local Development:**
   ```bash
   npm run dev        # Start all apps
   npm test          # Run tests
   npm run type-check # TypeScript validation
   ```

2. **Building:**
   ```bash
   npm run build     # Build all packages
   ```

3. **Deployment:**
   ```bash
   npm run deploy    # Deploy workers
   ```

## Future Enhancements

- [ ] GraphQL API
- [ ] Mobile applications
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Blockchain integration
- [ ] Multi-tenancy support
