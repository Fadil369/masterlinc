# BrainSAIT Healthcare Platform - Phase 1: Core Infrastructure

## 📋 Overview

The BrainSAIT Healthcare Platform provides a comprehensive, HIPAA-compliant infrastructure for healthcare applications with OID (Object Identifier) and DID (Decentralized Identifier) support.

## 🏗️ Architecture

### Core Components

1. **OID Registry Service** (Port 3001)
   - Manages ISO/IEC Object Identifiers
   - PEN: 61026 (IANA-assigned)
   - Root OID: 1.3.6.1.4.1.61026

2. **DID Registry Service** (Port 3002)
   - Decentralized Identifier management
   - Ed25519 cryptographic key pairs
   - DID Method: `did:brainsait`

3. **PostgreSQL Database** (Port 5432)
   - HIPAA-compliant data storage
   - Complete schema with indexes and constraints

4. **Redis Cache** (Port 6379)
   - High-performance caching layer
   - Session management

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ (for local development)
- Redis 7+ (for local development)

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Configure environment
cp .env.brainsait.example .env.brainsait
# Edit .env.brainsait with your secure passwords

# Start all services
cd infrastructure/docker
docker-compose up -d

# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Option 2: Local Development

```bash
# Install dependencies for OID Registry
cd services/oid-registry
npm install
npm run dev

# In another terminal - Install dependencies for DID Registry
cd services/did-registry
npm install
npm run dev
```

## 📊 Database Schema

### Core Tables

1. **patients** - Patient demographic and registration data
2. **oid_registry** - OID registry for services and entities
3. **did_registry** - DID registry with cryptographic keys
4. **did_oid_mapping** - Mapping between DIDs and OIDs
5. **appointments** - Appointment scheduling and management
6. **data_provenance** - Data lineage and audit trail

See [infrastructure/database/brainsait-schema.sql](../../infrastructure/database/brainsait-schema.sql) for complete schema.

## 🔌 API Endpoints

### OID Registry Service (Port 3001)

#### Register OID
```bash
POST /api/oid/register
Content-Type: application/json

{
  "branch": "2.1",
  "serviceName": "Patient Registration Service",
  "serviceType": "registration",
  "description": "Handles patient registration",
  "metadata": {
    "version": "1.0.0",
    "region": "SA-01"
  }
}

Response:
{
  "success": true,
  "oid": "1.3.6.1.4.1.61026.2.1.1234567890",
  "data": { ... }
}
```

#### Resolve OID
```bash
GET /api/oid/resolve/:oid

Response:
{
  "success": true,
  "data": {
    "oid": "1.3.6.1.4.1.61026.2.1.1234567890",
    "service_name": "Patient Registration Service",
    "service_type": "registration",
    ...
  },
  "source": "cache" | "database"
}
```

#### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "BrainSAIT OID Registry",
  "pen": "61026",
  "root_oid": "1.3.6.1.4.1.61026",
  "timestamp": "2026-02-17T18:00:00.000Z"
}
```

### DID Registry Service (Port 3002)

#### Create Doctor DID
```bash
POST /api/did/doctor/create
Content-Type: application/json

{
  "licenseNumber": "DOC-12345",
  "region": "SA-01",
  "specialty": "Cardiology"
}

Response:
{
  "success": true,
  "did": "did:brainsait:doctors:dr-DOC-12345",
  "didDocument": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:brainsait:doctors:dr-DOC-12345",
    "verificationMethod": [...],
    "authentication": [...],
    "alsoKnownAs": ["oid:1.3.6.1.4.1.61026.2.1.1.dr-DOC-12345"],
    "brainSAIT": {
      "oid": "1.3.6.1.4.1.61026.2.1.1.dr-DOC-12345",
      "pen": "61026",
      "region": "SA-01",
      "specialty": "Cardiology"
    }
  },
  "oid": "1.3.6.1.4.1.61026.2.1.1.dr-DOC-12345",
  "publicKey": "z...",
  "privateKey": "base64-encoded-key"
}
```

#### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "BrainSAIT DID Registry",
  "didMethod": "did:brainsait"
}
```

## 🔐 Security

- All passwords should be strong and unique
- Private keys should be stored securely (consider using a key management service)
- Enable HTTPS/TLS in production
- Follow HIPAA compliance guidelines
- Regular security audits recommended

## 📁 Project Structure

```
masterlinc/
├── services/
│   ├── oid-registry/         # OID Registry Service
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   └── did-registry/         # DID Registry Service
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── Dockerfile
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml
│   └── database/
│       └── brainsait-schema.sql
└── .env.brainsait.example
```

## 🧪 Testing

### Test OID Registration
```bash
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "2.1",
    "serviceName": "Test Service",
    "serviceType": "test",
    "description": "Test service",
    "metadata": {}
  }'
```

### Test DID Creation
```bash
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "TEST-001",
    "region": "TEST",
    "specialty": "Testing"
  }'
```

## 📚 References

- [IANA Private Enterprise Numbers](https://www.iana.org/assignments/enterprise-numbers)
- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [Ed25519 Signature Scheme](https://ed25519.cr.yp.to/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## 🛠️ Troubleshooting

### Services won't start
- Check Docker logs: `docker-compose logs`
- Verify environment variables are set
- Ensure ports 3001, 3002, 5432, 6379 are not in use

### Database connection errors
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check DATABASE_URL environment variable
- Verify database credentials

### Redis connection errors
- Verify Redis is running: `docker ps | grep redis`
- Check REDIS_URL environment variable
- Verify Redis password

## 📝 License

Copyright © 2026 BrainSAIT Healthcare Platform

## 🤝 Support

For issues and questions, please open a GitHub issue.
