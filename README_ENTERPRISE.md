# BrainSAIT Enterprise Healthcare Platform
### Full OID+DID+AI Integration - Production Ready

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Overview

BrainSAIT is a comprehensive enterprise healthcare platform that combines:
- **OID (Object Identifier)** registry for globally unique identification
- **DID (Decentralized Identifier)** for secure, verifiable credentials
- **AI-powered** agents for patients, doctors, admins, and researchers
- **IoT integration** with ESP32 devices for asset management
- **Full compliance** with HIPAA, PDPL, and NPHIES standards

---

## 🌟 Key Features

### 1. OID Registry System
- ✅ IANA PEN 61026 compliant
- ✅ Hierarchical namespace management
- ✅ FHIR code generation
- ✅ QR code generation for IoT devices
- ✅ Asset management and tracking
- ✅ Multi-context code generation

### 2. DID Registry System
- ✅ Decentralized identity for doctors (`did:brainsait:doctors`)
- ✅ Ed25519 cryptographic keys
- ✅ Verifiable credential issuance and verification
- ✅ Digital signature support
- ✅ Blockchain anchor capability (simulated)
- ✅ OID-DID mapping and bridging

### 3. Healthcare API
- ✅ Patient registration with biometric support
- ✅ AI-powered triage and emergency detection
- ✅ Vital signs capture (voice, BLE, manual, IoT)
- ✅ Appointment booking and check-in
- ✅ Clinical documentation with voice transcription
- ✅ DID-based document signing
- ✅ Full OID/DID provenance chain

### 4. AI Orchestrator
- ✅ **Patient Coaching Agent** - EN/AR support, symptom guidance
- ✅ **Clinical Reasoning Agent** - Differential diagnosis, test recommendations
- ✅ **Admin Operations Agent** - Workflow optimization, scheduling
- ✅ **Research Analytics Agent** - Data analysis, insights
- ✅ **System Health Agent** - Real-time monitoring, anomaly detection
- ✅ **Explainable AI** - Transparency and bias detection

### 5. IoT Device Integration
- ✅ ESP32 firmware for QR code scanning
- ✅ Real-time OID validation
- ✅ Cloud reporting and sync
- ✅ Asset registration and tracking
- ✅ Anomaly detection support

### 6. Doctor's Workspace
- 🚧 Template library (planned)
- 🚧 Voice-to-text medical dictation (planned)
- 🚧 Task manager with automation (planned)
- 🚧 Endorsement and handover modules (planned)

### 7. Compliance & Security
- ✅ Full audit trail with OID/DID provenance
- ✅ Digital signatures on all critical documents
- ✅ HIPAA-compliant data handling
- ✅ PDPL compliance ready
- ✅ NPHIES integration endpoints
- ✅ RBAC with DID-based access control

---

## 📦 Architecture

```
┌───────────────────────────────────────────────────────────┐
│                  Client Applications                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │Bsma Mobile │  │Doctor Web  │  │ ESP32 IoT  │         │
│  │   (EN/AR)  │  │  Portal    │  │  Scanners  │         │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │
└────────┼────────────────┼────────────────┼────────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer              │
└──────────────────────┬───────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────┴───────┐ ┌────┴────┐ ┌──────┴──────┐
│ OID Registry  │ │  DID    │ │ Healthcare  │
│   :3001       │ │Registry │ │    API      │
│               │ │  :3002  │ │   :3003     │
│ • Register    │ │         │ │             │
│ • Resolve     │ │ • Create│ │ • Patients  │
│ • FHIR Gen    │ │ • Issue │ │ • Triage    │
│ • QR Gen      │ │ • Verify│ │ • Vitals    │
│ • Validate    │ │ • Sign  │ │ • Docs      │
└───────────────┘ └─────────┘ └─────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
              ┌────────┴────────┐
              │ AI Orchestrator │
              │      :3004      │
              │                 │
              │ ┌─────────────┐ │
              │ │  5 AI       │ │
              │ │  Agents     │ │
              │ └─────────────┘ │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────┴───────┐ ┌────┴────┐ ┌──────┴──────┐
│  PostgreSQL   │ │  Redis  │ │ Blockchain  │
│     :5432     │ │  :6379  │ │ (Simulated) │
└───────────────┘ └─────────┘ └─────────────┘
```

---

## 🗄️ Database Schema

**24 Tables** supporting full OID+DID+AI workflows:

### Core Tables
- `patients` - Patient demographics with OID/DID
- `doctors` - Doctor profiles with DID credentials
- `appointments` - Scheduling with OID tracking
- `oid_registry` - OID registry and metadata
- `did_registry` - DID documents and keys
- `did_oid_mapping` - Cross-reference mapping

### Clinical Workflow
- `triage` - Emergency assessment with AI
- `vitals` - Voice/BLE/manual vital signs
- `clinical_history` - Medical/surgical/family history
- `clinical_exam` - Physical/telehealth exams
- `assessment_plan` - Diagnosis and treatment
- `clinical_documentation` - Progress notes, consultations

### Doctor Workspace
- `templates` - Clinical templates by specialty
- `tasks` - Task management with automation
- `endorsements` - Peer ratings and reviews
- `handovers` - Shift transitions and data chain

### AI & Analytics
- `ai_interactions` - All AI agent interactions
- `consent_records` - Patient consent tracking
- `blockchain_anchors` - Provenance anchoring

### IoT & Compliance
- `assets` - IoT device registry
- `device_scans` - QR validation logs
- `audit_trail` - Enhanced compliance logging
- `doctor_verifiable_credentials` - DID credentials

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (optional, for local dev)
- 8GB+ RAM

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# 2. Configure environment
cp .env.brainsait.example .env.brainsait
# Edit .env.brainsait with your settings

# 3. Start all services
docker-compose up -d

# 4. Verify services
curl http://localhost:3001/health  # OID Registry
curl http://localhost:3002/health  # DID Registry
curl http://localhost:3003/health  # Healthcare API
curl http://localhost:3004/health  # AI Orchestrator

# 5. Check logs
docker-compose logs -f
```

### First Steps

```bash
# Create a doctor DID
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "DOC-001",
    "fullName": "Dr. Sarah Ahmad",
    "specialty": "Cardiology",
    "region": "SA-01",
    "phone": "+966501234567",
    "email": "sarah@example.com"
  }'

# Register a patient
curl -X POST http://localhost:3003/api/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmed Al-Saud",
    "phone": "+966509876543",
    "dob": "1985-03-15",
    "gender": "male",
    "preferredLanguage": "ar"
  }'

# Perform AI triage
curl -X POST http://localhost:3003/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "chiefComplaint": "chest pain and shortness of breath",
    "symptoms": ["chest pain", "shortness of breath"],
    "language": "en"
  }'
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](docs/API_DOCUMENTATION.md) | Complete API reference |
| [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | Installation and deployment |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Development setup and guidelines |
| [Compliance Guide](docs/COMPLIANCE.md) | HIPAA, PDPL, NPHIES compliance |
| [IoT Setup](iot/esp32-oid-scanner/README.md) | ESP32 device configuration |

---

## 🔌 API Endpoints

### OID Registry (:3001)
- `POST /api/oid/register` - Register new OID
- `GET /api/oid/resolve/:oid` - Resolve OID
- `POST /api/oid/generate-fhir` - Generate FHIR code
- `POST /api/oid/generate-qr` - Generate QR code
- `POST /api/oid/validate` - Validate OID
- `POST /api/oid/register-asset` - Register IoT asset
- `GET /api/oid/hierarchy` - Get OID hierarchy

### DID Registry (:3002)
- `POST /api/did/doctor/create` - Create doctor DID
- `POST /api/did/credential/issue` - Issue credential
- `POST /api/did/credential/verify` - Verify credential
- `POST /api/did/credential/revoke` - Revoke credential
- `GET /api/did/resolve/:did` - Resolve DID
- `POST /api/did/sign` - Create digital signature

### Healthcare API (:3003)
- `POST /api/patients/register` - Register patient
- `GET /api/patients/search` - Search patients
- `POST /api/triage/assess` - AI triage assessment
- `POST /api/vitals/record` - Record vital signs
- `POST /api/appointments/book` - Book appointment
- `POST /api/appointments/:id/checkin` - Check-in
- `POST /api/documentation/create` - Create documentation
- `POST /api/documentation/:id/sign` - Sign document

### AI Orchestrator (:3004)
- `POST /api/ai/patient-coaching` - Patient guidance (EN/AR)
- `POST /api/ai/clinical-reasoning` - Clinical decision support
- `POST /api/ai/admin-ops` - Admin operations
- `POST /api/ai/research-analytics` - Research insights
- `GET /api/ai/system-health` - System monitoring
- `POST /api/ai/explain` - AI explainability

---

## 🛠️ Technology Stack

### Backend
- **Node.js 20** - Runtime
- **TypeScript 5** - Type safety
- **Express.js 4** - Web framework
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching & sessions

### Security & Identity
- **Ed25519** - Digital signatures
- **DID (W3C)** - Decentralized identifiers
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### IoT
- **ESP32** - Microcontroller
- **Arduino** - Firmware framework
- **ArduinoJson** - JSON parsing
- **QR Code** - OID encoding

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy

---

## 📊 Project Structure

```
masterlinc/
├── services/
│   ├── oid-registry/          # OID management service
│   ├── did-registry/          # DID management service
│   ├── healthcare-api/        # Patient workflow service
│   └── ai-orchestrator/       # AI agents service
├── infrastructure/
│   ├── database/              # Database schemas
│   │   ├── enterprise-schema.sql
│   │   └── migrations/
│   └── docker/                # Docker configs
├── iot/
│   └── esp32-oid-scanner/     # ESP32 firmware
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── ...
├── docker-compose.yml
└── .env.brainsait.example
```

---

## 🧪 Testing

```bash
# Test all services
./scripts/test-services.sh

# Test specific service
cd services/oid-registry && npm test
cd services/did-registry && npm test
cd services/healthcare-api && npm test
cd services/ai-orchestrator && npm test

# Integration tests
./scripts/integration-test.sh
```

---

## 🌍 Internationalization

- **English (EN)** - Full support
- **Arabic (AR)** - Full support in AI agents, patient workflows
- Bilingual voice recognition planned
- RTL support in web interfaces

---

## 🔒 Security Features

- ✅ DID-based authentication
- ✅ Digital signatures on clinical documents
- ✅ End-to-end encryption
- ✅ RBAC with DID credentials
- ✅ Audit trail with full provenance
- ✅ HIPAA-compliant data handling
- ✅ Rate limiting on all APIs
- ✅ SQL injection prevention
- ✅ XSS protection

---

## 📈 Roadmap

### Phase 1 (Complete) ✅
- [x] OID/DID core services
- [x] Healthcare API
- [x] AI Orchestrator
- [x] IoT device firmware
- [x] Database schema
- [x] Documentation

### Phase 2 (In Progress) 🚧
- [ ] Doctor's workspace web app
- [ ] Template library
- [ ] Voice-to-text dictation
- [ ] Task manager
- [ ] Endorsement & handover modules

### Phase 3 (Planned) 📋
- [ ] Bsma mobile app (React Native)
- [ ] Real-time voice streaming
- [ ] Blockchain integration
- [ ] FHIR/HL7 full compliance
- [ ] Telehealth module

### Phase 4 (Future) 🔮
- [ ] Machine learning pipelines
- [ ] Predictive analytics
- [ ] Multi-region deployment
- [ ] Mobile device management
- [ ] Advanced reporting

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/masterlinc.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **BrainSAIT Platform Team** - Core development
- **Contributors** - See [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

## 📞 Support

- **Email**: support@brainsait.com
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Fadil369/masterlinc/issues)
- **Discord**: [BrainSAIT Community](#)

---

## 🙏 Acknowledgments

- IANA for PEN 61026 assignment
- W3C for DID specifications
- HL7/FHIR community
- Open source community

---

## 📊 Statistics

- **24 Database Tables**
- **40+ API Endpoints**
- **5 AI Agents**
- **4 Microservices**
- **1 IoT Firmware**
- **Full HIPAA Compliance**
- **Bilingual Support (EN/AR)**

---

**Built with ❤️ by the BrainSAIT Team**

**Version**: 1.0.0  
**Last Updated**: 2026-02-17
