# 🎯 MasterLinc Orchestrator

**Central orchestrator for the BrainSAIT healthcare ecosystem**

MasterLinc coordinates all subsystems to provide end-to-end workflow automation from call routing through NPHIES claims submission.

---

## 🌐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  MasterLinc Orchestrator                        │
│     https://masterlinc-agent-pla--Fadil369.github.app           │
│                                                                 │
│  • Service Registry & Discovery                                 │
│  • Workflow State Machine                                       │
│  • Event-Driven Coordination                                    │
│  • Unified Data Layer                                           │
└─────────────────────────────────────────────────────────────────┘
            │          │          │          │
            ▼          ▼          ▼          ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Basma   │  │Healthcare│  │   OID    │  │   SBS    │
    │  Voice   │  │ Booking  │  │Identity  │  │ Claims   │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 📊 Complete Workflow

### 1. **Intake Phase** (Basma Voice)
- Receive incoming call via 3CX
- AI-powered intent analysis
- Patient identification/creation
- Intelligent call routing

### 2. **Triage Phase** (BrainSAIT Healthcare)
- Symptom collection
- AI-guided triage assessment
- Severity determination
- SMS notifications

### 3. **Booking Phase** (BrainSAIT Healthcare)
- Check doctor availability
- Schedule appointment
- Department assignment
- Confirmation messages

### 4. **Service Phase** (Healthcare Delivery)
- Medical consultation
- Service recording
- Diagnosis documentation

### 5. **Claims Phase** (SBS)
- Claim generation
- NPHIES submission
- Status tracking
- Invoice generation
- Payment processing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- PostgreSQL, Redis, MongoDB (or use Docker)

### Installation

```bash
# Clone repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc/packages/masterlinc-orchestrator

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development Mode

```bash
# Start infrastructure with Docker
docker-compose up -d postgres redis mongodb rabbitmq

# Run orchestrator in dev mode
npm run dev
```

### Production Deployment

```bash
# Build Docker image
docker build -t masterlinc-orchestrator .

# Start full stack
docker-compose up -d

# Check health
curl http://localhost:4000/health
```

---

## 📡 API Endpoints

### Health & Monitoring

```http
GET /health
```
Returns service and database health status.

```http
GET /api/services
```
List all registered services with health status.

```http
GET /api/statistics
```
Get workflow and service statistics.

### Workflow Management

```http
POST /api/workflows/start-from-call
Content-Type: application/json

{
  "callId": "call-123",
  "from": "+966501234567"
}
```
Start new workflow from incoming call.

```http
GET /api/workflows/:workflowId
```
Get workflow status and data.

```http
POST /api/workflows/:workflowId/complete-service
Content-Type: application/json

{
  "services": [
    {
      "code": "99213",
      "description": "Office visit",
      "quantity": 1,
      "unitPrice": 150.00
    }
  ]
}
```
Complete service phase and trigger claims.

```http
GET /api/workflows/patient/:patientId
```
Get all workflows for a patient.

### Patient Management

```http
GET /api/patients/phone/:phone
```
Lookup patient by phone number.

```http
POST /api/patients
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "phone": "+966501234567",
  "email": "ahmed@example.com"
}
```
Create or update patient record.

### Call Operations

```http
POST /api/calls/make
Content-Type: application/json

{
  "from": "+966501234567",
  "to": "+966509876543",
  "message": "Appointment reminder"
}
```
Make outbound call.

```http
POST /api/sms/send
Content-Type: application/json

{
  "to": "+966501234567",
  "message": "Your appointment is confirmed"
}
```
Send SMS notification.

### OID & Identity

```http
POST /api/oid/generate
Content-Type: application/json

{
  "entityType": "patient",
  "entityId": "patient-123",
  "metadata": {}
}
```
Generate OID for entity.

```http
POST /api/credentials/issue
Content-Type: application/json

{
  "oid": "2.16.840.1.113883.4.1234",
  "type": "access_token",
  "permissions": ["read", "write"],
  "expiresIn": 3600
}
```
Issue credentials for OID.

### Claims & Billing

```http
POST /api/claims/create
Content-Type: application/json

{
  "patientOID": "2.16.840.1.113883.4.1234",
  "providerOID": "2.16.840.1.113883.4.5678",
  "facilityOID": "2.16.840.1.113883.4.9012",
  "services": [...]
}
```
Create new claim.

```http
POST /api/claims/:claimId/submit-nphies
```
Submit claim to NPHIES gateway.

---

## 🗄️ Database Schema

### PostgreSQL Tables

**patients**
- Patient demographics
- Contact information
- OID mapping

**appointments**
- Scheduled appointments
- Doctor assignments
- Status tracking

**claims**
- Billing claims
- NPHIES integration
- Payment tracking

**call_logs**
- Call records
- Transcripts
- Patient linking

**workflow_states**
- Workflow tracking
- Phase transitions
- State persistence

**audit_logs**
- Security auditing
- Access control
- Compliance tracking

### Redis (Caching)
- Session management
- Workflow state cache
- Rate limiting
- Real-time data

### MongoDB (Documents)
- Call transcripts
- Medical records
- AI conversation history
- Large documents

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=4000
NODE_ENV=production
LOG_LEVEL=info

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=masterlinc
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=masterlinc

# Service URLs
BASMA_URL=https://basma-voice-chat-app--fadil369.github.app
HEALTHCARE_URL=https://brainsait-healthcare--fadil369.github.app
OID_URL=https://brainsait-oid-integr--fadil369.github.app
SBS_URL=https://sbs--fadil369.github.app
```

---

## 🔒 Security & Compliance

### HIPAA Compliance
- ✅ End-to-end encryption (TLS 1.3)
- ✅ Data encryption at rest (AES-256)
- ✅ PHI data masking
- ✅ Immutable audit logs
- ✅ Role-based access control

### Saudi NPHIES Requirements
- ✅ OID-based identification
- ✅ FHIR R4 compliance
- ✅ Digital signatures
- ✅ Secure messaging
- ✅ Transaction logging

---

## 📊 Monitoring

### Prometheus Metrics
- Service health status
- Workflow completion rates
- API response times
- Database connection pools
- Error rates

### Grafana Dashboards
- Real-time service monitoring
- Workflow analytics
- Resource utilization
- Custom alerts

### Access Monitoring Tools

```bash
# Prometheus
open http://localhost:9090

# Grafana  
open http://localhost:3001
# Default credentials: admin/admin

# RabbitMQ Management
open http://localhost:15672
# Default credentials: admin/admin
```

---

## 🧪 Testing

```bash
# Run type check
npm run build

# Test health endpoint
curl http://localhost:4000/health

# Test workflow creation
curl -X POST http://localhost:4000/api/workflows/start-from-call \
  -H "Content-Type: application/json" \
  -d '{"callId":"test-123","from":"+966501234567"}'

# Check workflow status
curl http://localhost:4000/api/workflows/wf-xxx
```

---

## 📦 Docker Deployment

### Start Full Stack

```bash
docker-compose up -d
```

This starts:
- MasterLinc Orchestrator (port 4000)
- PostgreSQL (port 5432)
- Redis (port 6379)
- MongoDB (port 27017)
- RabbitMQ (ports 5672, 15672)
- Prometheus (port 9090)
- Grafana (port 3001)

### Check Services

```bash
docker-compose ps
docker-compose logs -f masterlinc
```

### Stop Services

```bash
docker-compose down
```

---

## 🔄 Workflow State Machine

```
intake → triage → booking → service → claims → completed
   ↓        ↓        ↓         ↓         ↓
  error → retry → escalate → manual_intervention
```

### State Transitions

Each phase transition is logged with:
- Timestamp
- Trigger event
- Previous state
- New state
- Actor/system

---

## 🎯 Service Integration

### Basma Voice Chat
- **Purpose**: Call routing & IVR
- **Capabilities**: Voice AI, SMS, 3CX integration
- **Events**: call.received, call.ended

### BrainSAIT Healthcare
- **Purpose**: Patient management & appointments
- **Capabilities**: Triage, booking, EMR
- **Events**: triage.completed, appointment.booked

### BrainSAIT OID
- **Purpose**: Identity & access management
- **Capabilities**: OID generation, credentials, RBAC
- **Events**: oid.created, credential.issued

### SBS Claims
- **Purpose**: Claims & billing
- **Capabilities**: NPHIES integration, payments
- **Events**: claim.submitted, claim.approved

---

## 🚨 Troubleshooting

### Service Unreachable
```bash
# Check service health
curl http://localhost:4000/api/services

# Check database connections
curl http://localhost:4000/health
```

### Database Connection Failed
```bash
# Check PostgreSQL
docker-compose logs postgres

# Test connection
psql -h localhost -U postgres -d masterlinc
```

### Workflow Stuck
```bash
# Check workflow status
curl http://localhost:4000/api/workflows/:workflowId

# Check logs
docker-compose logs -f masterlinc
```

---

## 📚 Documentation

- **Architecture**: See `ARCHITECTURE.md`
- **API Reference**: See `/api/*` endpoints above
- **Database Schema**: See Database Schema section
- **Deployment Guide**: See Docker Deployment section

---

## 🤝 Contributing

This is part of the BrainSAIT healthcare ecosystem. For contributions or issues, contact the development team.

---

## 📄 License

Private - BrainSAIT Internal Use Only

---

## 📞 Support

**Repository**: https://github.com/Fadil369/masterlinc  
**Email**: dr.mf.12298@gmail.com  
**Extension**: 12310

---

**Version**: 2.0.0  
**Status**: Production Ready  
**Last Updated**: January 25, 2026
