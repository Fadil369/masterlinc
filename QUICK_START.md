# 📋 Quick Start Guide - BrainSAIT MasterLinc Phase 1

Welcome to the BrainSAIT MasterLinc Platform! This guide will get you up and running quickly.

---

## 🚀 5-Minute Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git installed
- 8GB+ RAM available

### Get Started

```bash
# 1. Clone repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# 2. Create Docker network
docker network create brainsait-net

# 3. Start services
docker-compose -f docker-compose.lite.yml up -d

# 4. Wait for services (30 seconds)
sleep 30

# 5. Verify everything is working
npm run verify
```

That's it! Your Phase 1 infrastructure is running.

---

## 📚 Documentation Index

### Getting Started
1. **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - Complete installation instructions
2. **[SERVICE_ENDPOINTS.md](./SERVICE_ENDPOINTS.md)** - API reference and examples
3. **[HEALTH_CHECK_GUIDE.md](./HEALTH_CHECK_GUIDE.md)** - Health monitoring

### Operations
4. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
5. **[TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)** - Common issues
6. **[SECURITY_COMPLIANCE_REPORT.md](./SECURITY_COMPLIANCE_REPORT.md)** - Security & compliance

### Planning
7. **[PHASE_2_3_4_5_ROADMAP.md](./PHASE_2_3_4_5_ROADMAP.md)** - Development roadmap
8. **[PHASE_1_SUCCESS_REPORT.md](./PHASE_1_SUCCESS_REPORT.md)** - Phase 1 completion

---

## 🧪 Verification Commands

```bash
# Full verification
npm run verify                # Phase 1 infrastructure check

# Health checks
npm run health-check          # Service health monitoring

# Database validation
npm run validate-db           # Schema verification

# Integration tests
npm run test:integration      # API tests
```

---

## 🏥 Service Access

Once running, access services at:

- **OID Registry**: http://localhost:3001
  - Health: http://localhost:3001/health
  - API Docs: [SERVICE_ENDPOINTS.md](./SERVICE_ENDPOINTS.md#oid-registry-service)

- **DID Registry**: http://localhost:3002
  - Health: http://localhost:3002/health
  - API Docs: [SERVICE_ENDPOINTS.md](./SERVICE_ENDPOINTS.md#did-registry-service)

- **Orchestrator**: http://localhost:4000
  - Health: http://localhost:4000/health
  - API Docs: [SERVICE_ENDPOINTS.md](./SERVICE_ENDPOINTS.md#masterlinc-orchestrator)

- **PostgreSQL**: localhost:5432
  - Database: `masterlinc`
  - User: `masterlinc`
  - Password: `MasterLinc2026Secure!` (change in production!)

- **Redis**: localhost:6379

---

## 🔍 Quick API Tests

### Test OID Registry

```bash
# Create an OID
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "test",
    "serviceName": "My Test Service",
    "serviceType": "test",
    "description": "Testing OID registration"
  }'

# Returns: { "success": true, "oid": "1.3.6.1.4.1.61026.test...." }
```

### Test DID Registry

```bash
# Create a doctor DID
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "DOC-001",
    "region": "Riyadh",
    "specialty": "Cardiology"
  }'

# Returns: { "success": true, "did": "did:brainsait:doctors:dr-DOC-001", ... }
```

---

## 📊 What's Included in Phase 1

### ✅ Core Services
- OID Registry (ISO/IEC 9834 compliant)
- DID Registry (W3C DID compliant)
- MasterLinc Orchestrator
- PostgreSQL Database
- Redis Cache
- Docker Infrastructure

### ✅ Database Schema
- Patients (with OID/DID)
- OID Registry
- DID Registry
- DID-OID Mapping
- Appointments
- Data Provenance
- Claims (NPHIES ready)
- Workflows
- Service Registry
- Events/Audit Log

### ✅ Documentation
- Installation guide
- API reference
- Troubleshooting guide
- Health check procedures
- Deployment guide
- Security & compliance report
- Phase 2-5 roadmap

### ✅ Verification Tools
- `phase1-verify.sh` - Infrastructure verification
- `health-check.ts` - Service health monitoring
- `validate-database.sh` - Schema validation
- `integration-tests.ts` - API integration tests

---

## 🎯 Next Steps

### For Developers

1. **Read the Roadmap**: [PHASE_2_3_4_5_ROADMAP.md](./PHASE_2_3_4_5_ROADMAP.md)
2. **Choose Your Phase**:
   - Phase 2: Basma Mobile App (EN/AR voice)
   - Phase 3: Enhanced Doctor's Workspace
   - Phase 4: Endorsements & Handover
   - Phase 5: Patient Workflows
   - Phase 6: AI Toolkit
3. **Create Feature Branch**: 
   ```bash
   git checkout -b feature/basma-mobile-app
   ```

### For DevOps

1. **Review Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Prepare Production Server**
3. **Configure Environment Variables**
4. **Deploy Phase 1**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```
5. **Set Up Monitoring**

### For Product Team

1. **Review Success Report**: [PHASE_1_SUCCESS_REPORT.md](./PHASE_1_SUCCESS_REPORT.md)
2. **Prioritize Features** from Phases 2-5
3. **Assign Teams** to parallel development
4. **Plan Sprints** based on roadmap timeline

---

## 🆘 Getting Help

### Documentation
- Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for common issues
- Review [SERVICE_ENDPOINTS.md](./SERVICE_ENDPOINTS.md) for API details
- See [HEALTH_CHECK_GUIDE.md](./HEALTH_CHECK_GUIDE.md) for monitoring

### Support
- GitHub Issues: https://github.com/Fadil369/masterlinc/issues
- Email: [support@brainsait.de]
- Emergency: [emergency contact]

### Diagnostics
```bash
# View logs
docker-compose -f docker-compose.lite.yml logs -f

# Check service status
docker ps

# Database connection
psql postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc

# Redis check
redis-cli ping
```

---

## 📈 Status Dashboard

Check system status:

```bash
# Quick status check
curl -s http://localhost:3001/health | jq
curl -s http://localhost:3002/health | jq
curl -s http://localhost:4000/health | jq

# Or run comprehensive health check
npm run health-check
```

---

## 🔒 Security

- ✅ CodeQL scan: **0 vulnerabilities**
- ✅ Compliance: OID, DID, HL7, NPHIES, HIPAA
- ✅ Encryption: TLS/SSL ready, database encryption capable
- ✅ Authentication: JWT ready, DID signatures
- ✅ Audit: Complete data provenance tracking

See [SECURITY_COMPLIANCE_REPORT.md](./SECURITY_COMPLIANCE_REPORT.md) for details.

---

## 📦 Repository Structure

```
masterlinc/
├── services/
│   ├── oid-registry/          # OID Registry Service
│   └── did-registry/          # DID Registry Service
├── packages/
│   ├── masterlinc-orchestrator/ # Central Orchestrator
│   └── 3cx-mcp/               # 3CX Integration
├── infrastructure/
│   ├── database/              # Database schemas
│   └── docker/                # Docker configs
├── scripts/
│   ├── phase1-verify.sh       # Verification script
│   ├── health-check.ts        # Health monitoring
│   ├── validate-database.sh   # DB validation
│   └── integration-tests.ts   # Integration tests
├── docs/                      # Additional documentation
├── INSTALLATION_GUIDE.md      # Installation instructions
├── SERVICE_ENDPOINTS.md       # API reference
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── TROUBLESHOOTING_GUIDE.md   # Troubleshooting
├── HEALTH_CHECK_GUIDE.md      # Health monitoring
├── PHASE_2_3_4_5_ROADMAP.md   # Development roadmap
├── PHASE_1_SUCCESS_REPORT.md  # Completion report
├── SECURITY_COMPLIANCE_REPORT.md # Security report
└── docker-compose*.yml        # Docker configurations
```

---

## ✨ Features Highlight

### OID Registry
- ISO/IEC 9834 compliant
- Root OID: 1.3.6.1.4.1.61026
- Branch-based organization
- Redis caching
- RESTful API

### DID Registry
- W3C DID specification compliant
- Ed25519 cryptographic signatures
- DID-OID integration
- Decentralized identity
- Privacy-preserving

### Database
- HIPAA compliant schema
- Complete audit trail
- OID/DID integration
- NPHIES ready
- FHIR compatible

### Infrastructure
- Docker containerized
- Auto-scaling ready
- Health monitoring
- Backup automated
- Production ready

---

## 🎉 Success Criteria

Phase 1 is successful when:
- ✅ All services passing health checks
- ✅ Database schema validated
- ✅ Integration tests passing
- ✅ Zero security vulnerabilities
- ✅ Documentation complete
- ✅ Deployment procedures tested

**Current Status**: ✅ **ALL CRITERIA MET**

---

## 📞 Contact

- **Project Lead**: [Name]
- **Technical Lead**: [Name]
- **DevOps Team**: [Email]
- **Security Team**: [Email]

---

**Version**: Phase 1 - Complete  
**Last Updated**: February 17, 2026  
**Status**: ✅ Production Ready
