# MasterLinc Integration Map

Complete overview of all system integrations, workflows, and LINC agents.

## 🏥 Core Systems

### 1. **SBS (Smart Billing System)**
**Location:** `apps/workers/sbs/`  
**Database:** Cloudflare D1  
**Purpose:** NPHIES-compliant billing and claims management

**Features:**
- ✅ Claim creation and validation
- ✅ Diagnosis code verification
- ✅ Procedure checks
- ✅ Payment tracking
- ✅ OID integration
- ✅ Digital signatures
- ✅ NPHIES submission

**API Endpoints:**
- `POST /api/claims/create` - Create new claim
- `GET /api/claims/:id` - Get claim details
- `POST /api/claims/:id/validate` - Validate claim
- `POST /api/claims/:id/submit` - Submit to NPHIES
- `GET /api/payments` - List payments

**Integration Points:**
- OID Registry (for identifiers)
- Healthcare API (for patient data)
- MasterLinc Orchestrator (for AI validation)

---

### 2. **BASMA (Voice & Communication Platform)**
**Location:** `apps/workers/voice/`, `packages/masterlinc-orchestrator/src/services/basma-integration.ts`  
**Purpose:** AI-powered voice calls, IVR, and messaging

**Features:**
- ✅ Twilio WebSocket streaming
- ✅ Speech-to-text (STT)
- ✅ Text-to-speech (TTS)
- ✅ Call routing with AI
- ✅ Intent analysis
- ✅ SMS notifications
- ✅ Call recording
- ✅ Transcript generation
- ✅ Call statistics

**API Endpoints:**
- `POST /api/calls/make` - Initiate outbound call
- `POST /api/calls/:id/route` - AI call routing
- `GET /api/calls/:id/transcript` - Get transcript
- `POST /api/ai/analyze-intent` - Analyze call intent
- `POST /api/sms/send` - Send SMS
- `GET /api/calls/statistics` - Call stats

**Integration Points:**
- 3CX MCP (telephony)
- MasterLinc Orchestrator (AI)
- Healthcare API (patient context)

---

### 3. **OID Registry System**
**Location:** `services/oid-registry/`  
**Database:** PostgreSQL + Redis  
**Purpose:** Organization Identifier management for FHIR/NPHIES

**Features:**
- ✅ OID generation (1.3.6.1.4.1.61026.X.X.X)
- ✅ Service registration
- ✅ OID lookup
- ✅ QR code generation
- ✅ Validation
- ✅ Redis caching
- ✅ Bulk operations

**API Endpoints:**
- `POST /api/oid/register` - Register new OID
- `GET /api/oid/:oid` - Lookup OID
- `POST /api/oid/batch` - Batch register
- `GET /api/oid/qr/:oid` - Generate QR code
- `POST /api/oid/validate` - Validate OID

**Integration Points:**
- DID Registry (identifier mapping)
- SBS Worker (claim identifiers)
- Healthcare API (facility/provider IDs)
- ESP32 IoT Scanner (physical scanning)

---

### 4. **DID Registry System**
**Location:** `services/did-registry/`  
**Database:** PostgreSQL + Redis  
**Purpose:** Decentralized Identifiers for doctors, patients, and entities

**Features:**
- ✅ DID generation (did:brainsait:type:id)
- ✅ Ed25519 key pair generation
- ✅ DID Document creation
- ✅ OID-DID mapping
- ✅ Doctor DIDs
- ✅ Patient DIDs
- ✅ Organization DIDs
- ✅ Document signing
- ✅ Verification

**API Endpoints:**
- `POST /api/did/doctor/create` - Create doctor DID
- `POST /api/did/patient/create` - Create patient DID
- `POST /api/did/organization/create` - Create org DID
- `GET /api/did/:did` - Resolve DID
- `POST /api/did/:did/sign` - Sign document
- `POST /api/did/verify` - Verify signature

**Integration Points:**
- OID Registry (identifier mapping)
- Healthcare API (identity verification)
- SBS Worker (claim signing)

---

## 🤖 LINC Agents & Orchestration

### 1. **MasterLinc Orchestrator**
**Location:** `packages/masterlinc-orchestrator/`  
**Purpose:** Central AI coordination and service orchestration

**Components:**
- **Service Registry** - Dynamic service discovery
- **NLP Service** - Natural language processing
- **Event Bus** - Redis pub/sub messaging
- **WebSocket Server** - Real-time communication
- **Workflow Engine** - Multi-step processes

**Integrated Services:**
- BASMA Integration (voice/calls)
- SBS Integration (billing)
- Healthcare Integration (patient data)
- OID Integration (identifiers)

**Key Features:**
- Multi-model AI routing
- Context management
- Service health monitoring
- Event-driven architecture
- WebSocket streaming

---

### 2. **3CX MCP (Telephony Agent)**
**Location:** `packages/3cx-mcp/`  
**Purpose:** 3CX telephony system integration

**Features:**
- Call control
- IVR management
- Extension management
- Call queues
- BASMA bridge
- AI orchestration

---

### 3. **RadioLinc Agent**
**Location:** `packages/radiolinc-agent/`  
**Purpose:** Radiology AI agent

**Features:**
- Study triage
- DICOM processing
- Priority scoring
- AI analysis

---

### 4. **DeepSeek Radiology**
**Location:** `packages/deepseek-radiology/`  
**Purpose:** Advanced radiology AI with DeepSeek

**Features:**
- Image analysis
- Report generation
- Finding extraction
- AI-powered diagnostics

---

## 🏥 Healthcare Workflows

### 1. **Doctor Workspace**
**Location:** `apps/healthcare/src/components/ecosystem/DoctorDashboard.tsx`

**Features:**
- Patient list view
- Appointment calendar
- Clinical notes
- Prescription management
- Lab results
- Imaging orders
- Referrals

**Missing Features to Add:**
- [ ] E-prescription integration
- [ ] Lab order integration
- [ ] DICOM viewer
- [ ] Voice dictation
- [ ] Clinical decision support

---

### 2. **Patient Workflow**
**Location:** `apps/healthcare/src/components/ecosystem/PatientIntake.tsx`

**Current Steps:**
1. Demographics
2. Insurance verification
3. Medical history
4. Chief complaint

**Missing Features to Add:**
- [ ] DID/OID assignment
- [ ] Insurance eligibility check
- [ ] Photo ID upload
- [ ] Consent forms (digital signature)
- [ ] Appointment scheduling
- [ ] Payment collection

---

### 3. **Appointment Management**
**Location:** `apps/healthcare/src/components/ecosystem/Appointments.tsx`

**Features:**
- View appointments
- Schedule new appointments
- Status management
- Reminders
- Notifications

**Missing Features to Add:**
- [ ] Calendar sync (Google, Apple)
- [ ] SMS reminders via BASMA
- [ ] Telehealth integration
- [ ] Waitlist management
- [ ] No-show tracking

---

### 4. **Direct Messaging**
**Location:** `apps/healthcare/src/components/ecosystem/DirectMessages.tsx`

**Features:**
- Provider-to-provider messaging
- Unread indicators
- Real-time updates

**Missing Features to Add:**
- [ ] File attachments
- [ ] Voice messages
- [ ] Video calls
- [ ] Group chats
- [ ] End-to-end encryption

---

## 🔌 Integration Flows

### Flow 1: Patient Registration
```
Patient Intake Form
  ↓
Create DID (did:brainsait:patient:xxx)
  ↓
Assign OID (1.3.6.1.4.1.61026.3.1.xxx)
  ↓
Store in Healthcare API
  ↓
Insurance Verification
  ↓
Complete Registration
```

### Flow 2: Claim Submission
```
Doctor creates encounter
  ↓
Generate claim (SBS Worker)
  ↓
Validate diagnosis codes
  ↓
Validate procedure codes
  ↓
Sign with DID
  ↓
Submit to NPHIES
  ↓
Track payment
```

### Flow 3: Voice Call Handling
```
Incoming call (Twilio)
  ↓
BASMA Voice Worker
  ↓
Speech-to-Text
  ↓
MasterLinc Orchestrator (AI)
  ↓
Intent Analysis
  ↓
Route to Department
  ↓
Store transcript & recording
```

### Flow 4: Radiology Study
```
Doctor orders imaging
  ↓
Create study in PACS
  ↓
RadioLinc Agent triages
  ↓
DeepSeek Radiology analyzes
  ↓
Generate report
  ↓
Radiologist review
  ↓
Report to referring doctor
```

---

## 🎯 Integration Gaps Identified

### Critical Gaps:
1. **No FHIR server** - Need HAPI FHIR implementation
2. **No EHR integration** - Epic, Cerner connectors missing
3. **No DICOM server** - Orthanc or DCM4CHEE needed
4. **No payment gateway** - Stripe/PayPal integration missing
5. **No e-prescription** - SFDA integration needed

### Medium Priority:
6. **No telehealth** - Video consultation missing
7. **No lab interface** - HL7/LIS integration missing
8. **No pharmacy integration** - Dispensing system missing
9. **No notification service** - Push notifications missing
10. **No audit logging** - Compliance logging incomplete

### Low Priority:
11. **No mobile apps** - iOS/Android missing
12. **No patient portal** - Self-service portal missing
13. **No analytics dashboard** - BI/reporting missing
14. **No blockchain** - Immutable audit trail missing

---

## 📊 System Health

| System | Status | Coverage | Integration |
|--------|--------|----------|-------------|
| SBS Worker | ✅ Complete | 90% | Good |
| BASMA Voice | ✅ Complete | 85% | Good |
| OID Registry | ✅ Complete | 95% | Excellent |
| DID Registry | ✅ Complete | 95% | Excellent |
| MasterLinc Orchestrator | ✅ Complete | 80% | Good |
| Healthcare API | ⚠️ Partial | 60% | Fair |
| 3CX MCP | ✅ Complete | 75% | Good |
| RadioLinc Agent | ✅ Complete | 70% | Good |
| DeepSeek Radiology | ✅ Complete | 70% | Good |

---

## 🚀 Recommended Next Steps

1. **Implement FHIR Server** - Use HAPI FHIR
2. **Add Payment Gateway** - Integrate Stripe
3. **Complete Patient Workflow** - Add DID/OID assignment
4. **Add E-Prescription** - SFDA integration
5. **Implement Audit Logging** - Compliance requirements
6. **Add Notification Service** - Push + SMS via BASMA
7. **Create Mobile Apps** - React Native
8. **Add Telehealth** - WebRTC integration
9. **Implement Analytics** - Grafana + BI dashboard
10. **Add Test Suite** - Integration tests for all flows
