# MASTERLINC - BrainSAIT Agentic Platform

A complete full-stack platform for intelligent healthcare agent orchestration in the Saudi Arabian healthcare ecosystem. Features a sophisticated bilingual (English/Arabic) dashboard with production-ready Python backend services.

## 🏗️ Architecture

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Python 3.11 + FastAPI + LangChain
- **FHIR Server:** HAPI FHIR R4 with NPHIES profiles
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Monitoring:** Prometheus + Grafana
- **Standards:** FHIR R4, NPHIES 1.0.0, HIPAA-compliant

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Configure environment
cp .env.example .env
# Edit .env and set OPENAI_API_KEY and other values

# Start all services
docker-compose -f docker-compose.agents.yml up -d

# Verify services
curl http://localhost:8000/health  # MasterLinc API
curl http://localhost:8001/health  # ClaimLinc API
curl http://localhost:8080/fhir/metadata  # FHIR Server
```

### Frontend Dashboard

```bash
npm install
npm run dev
# Access at http://localhost:5173
```

See [Deployment Guide](docs/deployment/DEPLOYMENT.md) for detailed instructions.

## 📦 Backend Services

### MasterLinc Orchestrator (Port 8000)
Central orchestration brain with LangChain-powered task delegation:
- Task analysis and intent classification
- Agent delegation based on capabilities
- Multi-agent workflow execution
- Message routing between agents
- Full audit logging and RBAC

**API Docs:** http://localhost:8000/api/v1/docs

### ClaimLinc Agent (Port 8001)
Intelligent claims processing for Saudi healthcare:
- 5-layer FHIR claim validation (Schema, NPHIES, Business Rules, Payer, Clinical)
- AI-powered rejection root cause analysis
- Resubmission recommendations
- Batch pattern detection
- Financial impact calculation

**API Docs:** http://localhost:8001/api/v1/docs

### DoctorLinc Agent (Port 8002)
Clinical decision support system:
- Diagnosis assistance
- Treatment recommendations
- Drug interaction checking
- Medical literature search
- FHIR Patient/Condition handling

### PolicyLinc Agent (Port 8003)
Payer policy interpretation with RAG:
- Coverage verification
- Pre-authorization requirements
- Benefit limitations checking
- Policy document Q&A

### DevLinc Agent (Port 8004)
Development automation:
- Code generation (FastAPI, React, FHIR)
- Code review and suggestions
- Test generation
- Documentation generation

### AuthLinc Agent (Port 8005)
Authentication and authorization:
- JWT token management
- OAuth 2.0 / OpenID Connect
- RBAC enforcement
- Session management

### Audit Service (Port 8006)
HIPAA-compliant audit logging:
- Immutable audit event storage
- 7-year retention policy
- Real-time alerting
- FHIR AuditEvent generation

### FHIR Server (Port 8080)
HAPI FHIR R4 with NPHIES profiles:
- Saudi-specific StructureDefinitions
- NPHIES 1.0.0 compliance
- Terminology services (ICD-10, CPT, SNOMED CT)
- Example resources included

**FHIR Endpoint:** http://localhost:8080/fhir

## 🎨 Frontend Features

### 🌐 Bilingual Interface
- **Full English/Arabic Support** - Complete interface translation
- **RTL Layout** - Proper right-to-left layout for Arabic
- **Arabic Fonts** - IBM Plex Sans Arabic for optimal readability
- **Seamless Switching** - Toggle between languages instantly

### 🤖 Agent Management
- **Agent Registry** - View all registered agents with real-time status
- **Category Filtering** - Filter by healthcare, business, automation, content, security
- **Search Functionality** - Search agents by name, ID, or description
- **Status Monitoring** - Visual indicators for online/offline/degraded/maintenance
- **Capability Display** - View agent capabilities and versions
- **Priority Levels** - Agents sorted by priority and status

### 📨 Message Communication
- **Message Log** - View all messages between agents
- **Send Messages** - Create and send messages between any agents
- **Real-time Updates** - Messages appear instantly with animations
- **Status Tracking** - Track delivery status (delivered/pending/failed)
- **Content Preview** - View JSON message payloads

### 📊 System Dashboard
- **System Health** - Monitor overall system status
- **Agent Metrics** - Quick stats on registered agents
- **Recent Activity** - View latest messages and agent updates
- **Service Status** - Check database, Redis, message queue health
- **Uptime Tracking** - System uptime display

### 🔄 Workflow Management
- **Workflow Creation** - (Ready for implementation)
- **Multi-agent Orchestration** - Coordinate actions across agents
- **Step-by-step Execution** - Define sequential agent operations

## 🛠️ Technology Stack

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Beautiful, accessible components
- **Phosphor Icons** - Comprehensive icon set
- **Sonner** - Toast notifications
- **Spark KV Storage** - Persistent state management

### Backend
- **Python 3.11+** - Modern async Python
- **FastAPI 0.109+** - High-performance API framework
- **LangChain 0.1+** - LLM orchestration
- **Pydantic 2.0+** - Data validation
- **SQLAlchemy 2.0** - Database ORM
- **asyncpg** - Async PostgreSQL driver
- **Redis** - Caching and queues
- **structlog** - Structured logging

### FHIR & Healthcare
- **HAPI FHIR R4** - FHIR server implementation
- **fhir.resources 7.0+** - Python FHIR models
- **NPHIES 1.0.0** - Saudi health insurance profiles
- **ICD-10-CM, CPT, SNOMED CT** - Medical terminologies

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL 15** - Relational database
- **Redis 7** - In-memory data store
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 📂 Project Structure

```
masterlinc/
├── apps/
│   └── dashboard/          # React frontend (existing)
├── services/               # Backend microservices
│   ├── masterlinc-api/     # Central orchestrator
│   ├── claimlinc-api/      # Claims processing
│   ├── doctorlinc-api/     # Clinical support
│   ├── policylinc-api/     # Policy interpretation
│   ├── devlinc-api/        # Dev automation
│   ├── authlinc-api/       # Authentication
│   ├── audit-service/      # Audit logging
│   └── fhir-server/        # HAPI FHIR configuration
├── packages/               # Shared packages
│   ├── nphies-client/      # NPHIES integration
│   ├── arabic-nlp/         # Arabic NLP processing
│   ├── shared-types/       # Shared type definitions
│   └── fhir-utils/         # FHIR utilities
├── infrastructure/         # Infrastructure configs
│   ├── docker/             # Docker configurations
│   ├── kubernetes/         # K8s manifests
│   ├── api-gateway/        # Kong/Traefik configs
│   ├── prometheus/         # Prometheus config
│   └── grafana/            # Grafana dashboards
├── config/                 # Application configs
│   ├── agents.yaml         # Agent registry
│   └── rbac.yaml           # RBAC policies
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── deployment/         # Deployment guides
│   └── prompts/            # LLM prompts
├── docker-compose.agents.yml  # Multi-service deployment
└── .env.example            # Environment template
```

## Design System

### Colors
- **Primary (Teal)**: `oklch(0.55 0.15 200)` - Healthcare trust and precision
- **Accent (Cyan)**: `oklch(0.70 0.18 210)` - CTAs and active states
- **Success (Green)**: `oklch(0.65 0.18 150)` - Online status
- **Warning (Yellow)**: `oklch(0.75 0.15 80)` - Degraded status
- **Purple**: `oklch(0.50 0.18 290)` - Business/automation category

### Typography
- **IBM Plex Sans** - Primary interface font
- **IBM Plex Sans Arabic** - Arabic text
- **JetBrains Mono** - Agent IDs, endpoints, code

### Components
All components built with shadcn/ui v4:
- Cards, Badges, Buttons
- Tabs, Dialogs, ScrollArea
- Select, Input, Textarea
- Tooltip, Switch

## Data Persistence

All data persists using Spark's KV storage:
- `masterlinc-language` - User's language preference
- `masterlinc-agents` - Agent registry
- `masterlinc-messages` - Message log
- `masterlinc-workflows` - Workflow definitions

## Agent Categories

### Healthcare
- **DoctorLINC** - Clinical decision support
- **NurseLINC** - Nursing workflow automation
- **PatientLINC** - Patient engagement

### Business
- **BizLINC** - Business intelligence & analytics

### Security
- **AuthLINC** - Authentication & security gateway

### Content
- **ContentLINC** - Content generation & management

## Mock Data

The app includes realistic mock data for demonstration:
- 6 sample agents (healthcare, business, content, security)
- Pre-populated messages showing agent communication
- System health metrics
- Bilingual agent names and descriptions

## Real-time Features

- **Auto-refresh** - Agent heartbeats update every 10 seconds
- **Live Updates** - Messages appear with smooth animations
- **Status Changes** - Agents can change status dynamically
- **Uptime Counter** - System uptime increments automatically

## Responsive Design

- **Mobile-first** - Optimized for all screen sizes
- **Breakpoints**:
  - Mobile: Single column layout
  - Tablet: 2-column grid
  - Desktop: 3-column grid
- **Touch-friendly** - Large tap targets for mobile
- **Adaptive UI** - Drawers on mobile, modals on desktop

## Accessibility

- **WCAG AA Compliant** - All color contrasts meet standards
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Ready** - Semantic HTML
- **Focus Indicators** - Clear focus states
- **ARIA Labels** - Proper labeling

## Arabic/RTL Support

- **Complete RTL** - Entire layout flips for Arabic
- **Proper Text Flow** - Arabic text reads right-to-left
- **Icon Positioning** - Icons adjust for RTL
- **Number Formatting** - Respects locale
- **Date/Time** - Arabic locale formatting

## Future Enhancements

1. **Real Backend Integration** - Connect to actual MASTERLINC API
2. **WebSocket Support** - Real-time agent communication
3. **Workflow Builder** - Visual workflow creation interface
4. **Advanced Metrics** - Charts and analytics
5. **Agent Configuration** - Edit agent settings
6. **Message Filtering** - Filter by agent, type, status
7. **Export/Import** - Backup and restore data
8. **Dark Mode** - Theme switching
9. **Multi-language** - Add French, Spanish support
10. **Performance Dashboard** - Agent performance metrics

## Usage

### Viewing Agents
1. Navigate to the "Agents" tab
2. Use search to find specific agents
3. Filter by category
4. Click any agent card for details

### Sending Messages
1. Go to the "Messages" tab
2. Click "Send Message"
3. Select sender and receiver agents
4. Enter message content (JSON format)
5. Click "Send"

### Monitoring System
1. View the "Dashboard" tab
2. Check system health status
3. Monitor recent activity
4. View agent metrics

### Changing Language
1. Click the EN/AR toggle in the header
2. Interface immediately switches
3. Preference is saved automatically

## Development Notes

- Built as a frontend demonstration of the MASTERLINC concept
- Uses mock data but structured for easy API integration
- All components are production-ready
- Follows React best practices
- Type-safe with TypeScript
- Accessible and responsive

## Credits

Part of the BrainSAIT LINC ecosystem - a Saudi healthcare digital transformation initiative.

**MASTERLINC** = **M**ulti-**A**gent **S**ystem for **T**ransformative **E**nterprise **R**esource **L**anguage-**I**ntegrated **N**etworked **C**oordination

---

**Built with ❤️ for healthcare innovation**
