# BrainSAIT Healthcare Platform - Phase 1 Implementation

## 🎯 Implementation Complete

This repository now includes the **BrainSAIT Healthcare Platform Phase 1: Core Infrastructure**, providing foundational services for healthcare applications with OID and DID support.

## 📦 What's Included

### Services Implemented

1. **OID Registry Service** (Port 3001)
   - ISO/IEC Object Identifier management
   - IANA PEN 61026
   - Redis caching layer
   - PostgreSQL persistence

2. **DID Registry Service** (Port 3002)
   - Decentralized Identifier (DID) management
   - Ed25519 cryptographic keys
   - DID Method: `did:brainsait`
   - OID-DID mapping

### Infrastructure

- **PostgreSQL 16** with complete healthcare schema
- **Redis 7** for high-performance caching
- **Docker Compose** orchestration
- **TypeScript** implementation with full type safety

### Database Tables

- `patients` - Patient demographics and registration
- `oid_registry` - OID registry for services
- `did_registry` - DID registry with cryptographic keys
- `did_oid_mapping` - DID-OID mappings
- `appointments` - Appointment management
- `data_provenance` - Data audit trail

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Deploy with Docker

```bash
# 1. Configure environment
cp .env.brainsait.example .env.brainsait
# Edit .env.brainsait with secure passwords

# 2. Start all services
cd infrastructure/docker
docker compose up -d

# 3. Verify services are running
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Local Development

```bash
# Install dependencies
cd services/oid-registry && npm install
cd ../did-registry && npm install

# Build services
cd services/oid-registry && npm run build
cd ../did-registry && npm run build

# Run tests
./scripts/test-brainsait.sh
```

## 📚 Documentation

- **Setup Guide**: [docs/BRAINSAIT_SETUP.md](docs/BRAINSAIT_SETUP.md)
- **API Reference**: [docs/api/BRAINSAIT_API.md](docs/api/BRAINSAIT_API.md)
- **Database Schema**: [infrastructure/database/brainsait-schema.sql](infrastructure/database/brainsait-schema.sql)

## 🧪 Testing

Run the comprehensive test suite:

```bash
./scripts/test-brainsait.sh
```

This validates:
- ✅ Service builds
- ✅ TypeScript compilation
- ✅ Database schema
- ✅ Docker configuration
- ✅ Documentation completeness

## 🔌 API Examples

### Register an OID

```bash
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "2.1",
    "serviceName": "Patient Registration",
    "serviceType": "registration",
    "description": "Patient registration service"
  }'
```

### Create a Doctor DID

```bash
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "DOC-12345",
    "region": "SA-01",
    "specialty": "Cardiology"
  }'
```

## 📁 Project Structure

```
masterlinc/
├── services/
│   ├── oid-registry/         # OID Registry Service
│   └── did-registry/         # DID Registry Service
├── infrastructure/
│   ├── docker/               # Docker Compose configs
│   └── database/             # Database schemas
├── docs/
│   ├── BRAINSAIT_SETUP.md   # Setup guide
│   └── api/
│       └── BRAINSAIT_API.md # API documentation
└── scripts/
    └── test-brainsait.sh    # Test suite
```

## 🔐 Security Features

- Ed25519 cryptographic signatures
- PostgreSQL with proper indexing
- Redis password authentication
- HIPAA-compliant data structures
- Audit trail via data_provenance table

## 🛠️ Technology Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript 5.2
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Container**: Docker with Docker Compose
- **Crypto**: @stablelib/ed25519, bs58

## 📊 Services Status

| Service | Port | Status | Health Check |
|---------|------|--------|--------------|
| OID Registry | 3001 | ✅ Ready | `/health` |
| DID Registry | 3002 | ✅ Ready | `/health` |
| PostgreSQL | 5432 | ✅ Ready | Internal |
| Redis | 6379 | ✅ Ready | Internal |

## 🎯 Next Phase

Phase 2 will implement:
- Patient workflow services
- Triage and emergency flagging
- FHIR integration
- Mobile app structure

## 📝 Environment Variables

Required environment variables (see `.env.brainsait.example`):

```bash
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OID_PEN=61026
DID_METHOD=did:brainsait
```

## 🤝 Contributing

1. Follow existing code style
2. Update documentation for API changes
3. Run tests before submitting PRs
4. Ensure Docker builds succeed

## 📄 License

Copyright © 2026 BrainSAIT Healthcare Platform

## 🆘 Support

For issues or questions:
- GitHub Issues: https://github.com/Fadil369/masterlinc/issues
- Documentation: See `docs/` directory

---

**Built with ❤️ for healthcare innovation**
