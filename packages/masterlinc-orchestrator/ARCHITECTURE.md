# 🏗️ MasterLinc Orchestration Architecture

## System Overview

MasterLinc acts as the central orchestrator coordinating multiple subsystems in the BrainSAIT healthcare ecosystem to provide end-to-end workflow automation from call routing to NPHIES claims submission.

---

## 🌐 Subsystem Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MasterLinc Orchestrator                            │
│              https://masterlinc-agent-pla--Fadil369.github.app              │
│                  https://github.com/Fadil369/masterlinc.git                 │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Service Registry & Router                          │  │
│  │  • Service Discovery  • Load Balancing  • Health Monitoring          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Workflow Orchestration Engine                      │  │
│  │  • State Machine  • Event Bus  • Task Scheduler                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Data Layer (Unified)                               │  │
│  │  • PostgreSQL  • Redis Cache  • MongoDB  • Vector DB                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│   Basma Voice Chat    │ │ BrainSAIT Healthcare  │ │   BrainSAIT OID       │
│   Call Routing &      │ │ Booking & Triage      │ │   Identity & Access   │
│   3CX Integration     │ │ Patient Management    │ │   Credential Mgmt     │
│                       │ │                       │ │                       │
│ basma-voice-chat-app  │ │ brainsait-healthcare  │ │ brainsait-oid-integr  │
│ --fadil369.github.app │ │ --fadil369.github.app │ │ --fadil369.github.app │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                │                     │                     │
                └─────────────────────┼─────────────────────┘
                                      │
                                      ▼
                         ┌───────────────────────────┐
                         │  SBS Claims Management    │
                         │  • Claims Processing      │
                         │  • NPHIES Integration     │
                         │  • Billing & Payments     │
                         │                           │
                         │  sbs--fadil369.github.app │
                         └───────────────────────────┘
```

---

## 📊 Complete Workflow

### Phase 1: Call Routing & Intake (Basma + 3CX)
1. **Incoming Call** → 3CX receives call
2. **IVR/AI Routing** → Basma Voice Chat analyzes intent
3. **Patient Identification** → Lookup existing patient or create new
4. **Call Classification** → Emergency, Urgent, Routine, Inquiry
5. **Smart Routing** → Route to appropriate department/doctor

### Phase 2: Triage & Booking (BrainSAIT Healthcare)
1. **Symptom Collection** → AI-guided triage questionnaire
2. **Severity Assessment** → Clinical decision support
3. **Appointment Scheduling** → Check availability and book
4. **Doctor Assignment** → Match patient needs with specialist
5. **Pre-visit Instructions** → Send via SMS/email

### Phase 3: Identity & Access (BrainSAIT OID)
1. **OID Assignment** → Create unique healthcare identifier
2. **Credential Generation** → Issue access credentials
3. **Resource Creation** → Set up patient profile, medical records
4. **Permission Management** → RBAC for healthcare staff
5. **Audit Logging** → Track all access and modifications

### Phase 4: Claims & Billing (SBS + NPHIES)
1. **Service Recording** → Capture all billable services
2. **Claim Generation** → Auto-generate NPHIES-compliant claims
3. **Pre-authorization** → Submit for approval if required
4. **Claim Submission** → Send to NPHIES gateway
5. **Status Tracking** → Monitor approval/rejection
6. **Payment Processing** → Handle co-pays and settlements

---

## 🔧 Technical Architecture

### Service Communication

```typescript
// Service-to-Service Communication Patterns
- REST APIs: Synchronous requests
- Message Queue (RabbitMQ): Asynchronous events
- gRPC: High-performance service calls
- WebSockets: Real-time updates
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Event-Driven Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Event Bus (RabbitMQ/Redis Pub/Sub)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Call    │  │ Booking  │  │   OID    │  │  Claim   │   │
│  │  Events  │  │  Events  │  │  Events  │  │  Events  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │ Basma  │    │ Health │    │  OID   │    │  SBS   │
    │ Service│    │ Service│    │ Service│    │ Service│
    └────────┘    └────────┘    └────────┘    └────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  Unified Data  │
                  │  PostgreSQL    │
                  │  + Redis Cache │
                  │  + MongoDB     │
                  └────────────────┘
```

### Database Strategy

**PostgreSQL (Primary Relational DB)**
- Patient records
- Appointments
- Claims data
- Audit logs

**Redis (Caching & Session)**
- Session management
- Real-time data cache
- Rate limiting
- Pub/Sub messaging

**MongoDB (Document Store)**
- Medical records (flexible schema)
- Call transcripts
- AI conversation history
- Large documents

**Vector DB (Qdrant/Pinecone)**
- Semantic search
- RAG for medical knowledge
- Similar case matching

---

## 🔄 Workflow State Machine

```typescript
interface WorkflowState {
  id: string;
  patientId: string;
  currentPhase: 'intake' | 'triage' | 'booking' | 'service' | 'claims';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: {
    call?: CallData;
    triage?: TriageData;
    appointment?: AppointmentData;
    oid?: OIDData;
    claim?: ClaimData;
  };
  transitions: StateTransition[];
}

// State Transitions
intake → triage → booking → service → claims → completed
   ↓        ↓        ↓         ↓         ↓
  error → retry → escalate → manual_intervention
```

---

## 🔐 Security & Compliance

### HIPAA Compliance
- End-to-end encryption (TLS 1.3)
- Data encryption at rest (AES-256)
- PHI data masking
- Audit logging (immutable)
- Access controls (RBAC)

### Saudi NPHIES Requirements
- OID-based identification
- FHIR R4 compliance
- Digital signatures
- Secure messaging
- Transaction logging

---

## 📦 Service Registry

### Registered Services

| Service | URL | Health Endpoint | Status |
|---------|-----|-----------------|--------|
| MasterLinc | masterlinc-agent-pla--Fadil369.github.app | /health | ✅ |
| Basma Voice | basma-voice-chat-app--fadil369.github.app | /health | 🔄 |
| Healthcare | brainsait-healthcare--fadil369.github.app | /health | 🔄 |
| OID Service | brainsait-oid-integr--fadil369.github.app | /health | 🔄 |
| SBS Claims | sbs--fadil369.github.app | /health | 🔄 |

---

## 🚀 Deployment Architecture

### Dev Containers (Local Development)

```yaml
# docker-compose.unified.yml
services:
  masterlinc:
    build: ./masterlinc
    ports: ["4000:4000"]
    depends_on: [postgres, redis, mongodb, rabbitmq]
  
  basma:
    build: ./basma-voice-chat-app
    ports: ["5000:5000"]
  
  healthcare:
    build: ./brainsait-healthcare
    ports: ["5001:5001"]
  
  oid-service:
    build: ./brainsait-oid-integr
    ports: ["5002:5002"]
  
  sbs:
    build: ./sbs
    ports: ["5003:5003"]
  
  # Data Layer
  postgres:
    image: postgres:15
    volumes: [postgres-data:/var/lib/postgresql/data]
  
  redis:
    image: redis:7-alpine
    volumes: [redis-data:/data]
  
  mongodb:
    image: mongo:7
    volumes: [mongo-data:/data/db]
  
  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
```

### GitHub Pages Hosting
- Static frontend served from GitHub Pages
- API calls proxied to serverless functions
- Cloudflare Workers for edge computing
- R2 for file storage

---

## 📊 Monitoring & Observability

### Metrics Collection
- Prometheus: Service metrics
- Grafana: Visualization dashboards
- Loki: Log aggregation
- Jaeger: Distributed tracing

### Key Metrics
- Call volume and routing success rate
- Appointment booking conversion rate
- OID creation time
- Claim submission success rate
- End-to-end workflow completion time
- System latency (p50, p95, p99)

---

## 🎯 API Gateway Pattern

```
Client Request
     │
     ▼
┌─────────────────┐
│  API Gateway    │  ← MasterLinc Entry Point
│  (Rate Limit)   │
│  (Auth)         │
│  (Routing)      │
└─────────────────┘
     │
     ├───→ GET /basma/calls → Basma Service
     ├───→ POST /healthcare/appointments → Healthcare Service
     ├───→ POST /oid/credentials → OID Service
     └───→ POST /sbs/claims → SBS Service
```

---

## 🔄 Event-Driven Workflow

### Sample Event Flow

```typescript
// 1. Call Received Event
{
  type: 'call.received',
  callId: 'call-123',
  from: '+966501234567',
  timestamp: '2026-01-25T10:00:00Z'
}

// 2. Triage Completed Event
{
  type: 'triage.completed',
  callId: 'call-123',
  patientId: 'patient-456',
  severity: 'urgent',
  symptoms: ['chest pain', 'shortness of breath']
}

// 3. Appointment Booked Event
{
  type: 'appointment.booked',
  appointmentId: 'appt-789',
  patientId: 'patient-456',
  doctorId: 'doctor-101',
  datetime: '2026-01-25T14:00:00Z'
}

// 4. Service Completed Event
{
  type: 'service.completed',
  appointmentId: 'appt-789',
  services: ['consultation', 'ecg'],
  diagnosis: 'atrial fibrillation'
}

// 5. Claim Submitted Event
{
  type: 'claim.submitted',
  claimId: 'claim-321',
  nphiesId: 'nphies-654',
  amount: 500.00,
  status: 'pending'
}
```

---

This architecture provides:
- ✅ Scalability through microservices
- ✅ Reliability through event-driven design
- ✅ Maintainability through clear separation
- ✅ Observability through comprehensive monitoring
- ✅ Compliance with HIPAA and NPHIES standards
