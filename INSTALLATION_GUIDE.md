# Installation Guide - BrainSAIT MasterLinc Platform

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Installation](#detailed-installation)
4. [Service Configuration](#service-configuration)
5. [Database Setup](#database-setup)
6. [Verification](#verification)
7. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software
- **Node.js** v18.x or higher
- **npm** v9.x or higher
- **Docker** v24.x or higher
- **Docker Compose** v2.x or higher
- **PostgreSQL** v15.x or higher (or use Docker)
- **Redis** v7.x or higher (or use Docker)

### Optional Software
- **Git** for version control
- **curl** for API testing
- **jq** for JSON processing

### System Requirements
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection for external services

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Create environment file
cp .env.production.example .env.production

# Edit .env.production with your settings
nano .env.production

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Verify services are running
./scripts/phase1-verify.sh
```

### Option 2: Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Install dependencies
npm install

# Build all packages
npm run build

# Start PostgreSQL and Redis (use Docker or local install)
docker-compose -f docker-compose.lite.yml up -d

# Start individual services (in separate terminals)
cd services/oid-registry && npm install && npm run build && npm start
cd services/did-registry && npm install && npm run build && npm start
cd packages/masterlinc-orchestrator && npm install && npm run build && npm start
```

---

## Detailed Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc
```

### Step 2: Install Node.js Dependencies

```bash
# Install root dependencies
npm install

# Install service dependencies
cd services/oid-registry && npm install && cd ../..
cd services/did-registry && npm install && cd ../..
cd packages/masterlinc-orchestrator && npm install && cd ../..
cd packages/3cx-mcp && npm install && cd ../..
```

### Step 3: Build TypeScript Services

```bash
# Build all services in correct order
cd services/oid-registry && npm run build && cd ../..
cd services/did-registry && npm run build && cd ../..
cd packages/masterlinc-orchestrator && npm run build && cd ../..
cd packages/3cx-mcp && npm run build && cd ../..
```

### Step 4: Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with Docker
docker-compose -f docker-compose.lite.yml up -d postgres

# Wait for database to be ready
sleep 5

# Database will be initialized automatically with init.sql
```

#### Option B: Local PostgreSQL Installation

```bash
# Create database
createdb masterlinc

# Run initialization script
psql masterlinc < infrastructure/init.sql

# Run BrainSAIT schema
psql masterlinc < infrastructure/database/brainsait-schema.sql
```

### Step 5: Redis Setup

#### Option A: Using Docker

```bash
# Start Redis with Docker
docker-compose -f docker-compose.lite.yml up -d redis
```

#### Option B: Local Redis Installation

```bash
# Start Redis server
redis-server
```

### Step 6: Configure Environment Variables

Create `.env` files for each service:

**services/oid-registry/.env**
```bash
PORT=3001
DATABASE_URL=postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc
REDIS_URL=redis://localhost:6379
OID_PEN=61026
```

**services/did-registry/.env**
```bash
PORT=3002
DATABASE_URL=postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc
REDIS_URL=redis://localhost:6379
OID_ROOT=1.3.6.1.4.1.61026
```

**packages/masterlinc-orchestrator/.env**
```bash
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc
REDIS_URL=redis://localhost:6379
SBS_EMBEDDED=true
```

### Step 7: Start Services

#### Development Mode (with auto-reload)

```bash
# Terminal 1: OID Registry
cd services/oid-registry && npm run dev

# Terminal 2: DID Registry
cd services/did-registry && npm run dev

# Terminal 3: MasterLinc Orchestrator
cd packages/masterlinc-orchestrator && npm run dev
```

#### Production Mode

```bash
# Terminal 1: OID Registry
cd services/oid-registry && npm start

# Terminal 2: DID Registry
cd services/did-registry && npm start

# Terminal 3: MasterLinc Orchestrator
cd packages/masterlinc-orchestrator && npm start
```

---

## Service Configuration

### OID Registry Service

**Purpose**: Manages Object Identifiers for healthcare services

**Configuration Options**:
- `PORT`: Service port (default: 3001)
- `OID_PEN`: Private Enterprise Number (default: 61026)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

**API Endpoints**:
- `GET /health` - Health check
- `POST /api/oid/register` - Register new OID
- `GET /api/oid/resolve/:oid` - Resolve OID to service details

### DID Registry Service

**Purpose**: Manages Decentralized Identifiers for users and entities

**Configuration Options**:
- `PORT`: Service port (default: 3002)
- `OID_ROOT`: Root OID for DID mapping (default: 1.3.6.1.4.1.61026)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

**API Endpoints**:
- `GET /health` - Health check
- `POST /api/did/doctor/create` - Create doctor DID
- `GET /api/did/resolve/:did` - Resolve DID to document

### MasterLinc Orchestrator

**Purpose**: Central orchestration and service coordination

**Configuration Options**:
- `PORT`: Service port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SBS_EMBEDDED`: Enable embedded SBS claims (default: true)

**API Endpoints**:
- `GET /health` - Health check
- `POST /api/workflow/execute` - Execute workflow
- `GET /api/services` - List registered services

---

## Database Setup

### Schema Overview

The database includes the following core tables:

1. **patients** - Patient demographics and identifiers (OID/DID)
2. **oid_registry** - OID service registry
3. **did_registry** - DID identity registry
4. **did_oid_mapping** - DID to OID mappings
5. **appointments** - Appointment scheduling
6. **data_provenance** - Audit trail and data lineage
7. **claims** - SBS claims management
8. **workflows** - Workflow orchestration
9. **service_registry** - Service discovery
10. **events** - Event sourcing and audit log

### Database Initialization

The database is automatically initialized when using Docker Compose. For manual setup:

```bash
# Connect to database
psql -U masterlinc -d masterlinc

# Verify tables
\dt

# Check patients table
SELECT COUNT(*) FROM patients;

# Check OID registry
SELECT COUNT(*) FROM oid_registry;

# Check DID registry
SELECT COUNT(*) FROM did_registry;
```

### Schema Migration

To update the schema:

```bash
# Backup database first
pg_dump masterlinc > backup.sql

# Run migration
psql masterlinc < infrastructure/database/brainsait-schema.sql
```

---

## Verification

### Phase 1 Verification Script

Run the comprehensive verification script:

```bash
chmod +x scripts/phase1-verify.sh
./scripts/phase1-verify.sh
```

This will check:
- ✅ Infrastructure files presence
- ✅ Service directories structure
- ✅ Implementation files
- ✅ Docker setup
- ✅ Runtime services
- ✅ Database schema
- ✅ Configuration files

### Health Check System

Run the TypeScript health check:

```bash
# Install dependencies if needed
npm install axios

# Run health check
npx tsx scripts/health-check.ts
```

### Manual Verification

#### Check OID Registry

```bash
# Health check
curl http://localhost:3001/health

# Register a test OID
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "test",
    "serviceName": "Test Service",
    "serviceType": "test",
    "description": "Test OID registration"
  }'
```

#### Check DID Registry

```bash
# Health check
curl http://localhost:3002/health

# Create a test doctor DID
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "TEST-001",
    "region": "Central",
    "specialty": "Radiology"
  }'
```

#### Check Orchestrator

```bash
# Health check
curl http://localhost:4000/health

# List services
curl http://localhost:4000/api/services
```

#### Check Database

```bash
# Connect to database
psql postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc

# Verify schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# Check OID registry entries
SELECT COUNT(*) FROM oid_registry;

# Check DID registry entries
SELECT COUNT(*) FROM did_registry;
```

---

## Next Steps

After successful installation:

1. **Review Documentation**
   - Read [SERVICE_ENDPOINTS.md](./SERVICE_ENDPOINTS.md) for API details
   - Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for common issues

2. **Configure External Services**
   - Set up Basma Voice integration
   - Configure 3CX MCP server
   - Deploy healthcare platform

3. **Security Hardening**
   - Change default passwords
   - Enable SSL/TLS
   - Configure firewall rules
   - Set up monitoring

4. **Proceed to Phase 2**
   - Review [PHASE_2_3_4_5_ROADMAP.md](./PHASE_2_3_4_5_ROADMAP.md)
   - Plan Basma Mobile App development
   - Implement Enhanced Doctor's Workspace

---

## Support

For issues or questions:
- Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
- Review logs: `docker-compose logs -f`
- GitHub Issues: https://github.com/Fadil369/masterlinc/issues
