# BrainSAIT MASTERLINC - Deployment Guide

This guide covers deployment of the complete BrainSAIT MASTERLINC agentic backend infrastructure.

## Prerequisites

- Docker 24.0+ and Docker Compose 2.20+
- 8GB+ RAM recommended
- 20GB+ disk space
- Python 3.11+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

## Quick Start with Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set required values:
# - OPENAI_API_KEY (required for AI features)
# - JWT_SECRET (required for authentication)
# - Database passwords (change defaults)
```

### 3. Start All Services

```bash
docker-compose -f docker-compose.agents.yml up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- HAPI FHIR Server (port 8080)
- MasterLinc API (port 8000)
- ClaimLinc API (port 8001)
- DoctorLinc API (port 8002)
- PolicyLinc API (port 8003)
- DevLinc API (port 8004)
- AuthLinc API (port 8005)
- Audit Service (port 8006)
- Prometheus (port 9090)
- Grafana (port 3001)

### 4. Verify Services

Check that all services are healthy:

```bash
# Check service status
docker-compose -f docker-compose.agents.yml ps

# Check health endpoints
curl http://localhost:8000/health  # MasterLinc
curl http://localhost:8001/health  # ClaimLinc
curl http://localhost:8002/health  # DoctorLinc
curl http://localhost:8080/fhir/metadata  # FHIR Server
```

### 5. Access Documentation

- MasterLinc API Docs: http://localhost:8000/api/v1/docs
- ClaimLinc API Docs: http://localhost:8001/api/v1/docs
- DoctorLinc API Docs: http://localhost:8002/api/v1/docs
- FHIR Server: http://localhost:8080/fhir
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/changeme_in_production)

## Service-by-Service Details

### MasterLinc Orchestrator

Central orchestration brain coordinating all agents.

**Endpoints:**
- `POST /api/v1/delegate` - Delegate task to agent
- `POST /api/v1/workflow/execute` - Execute workflow
- `POST /api/v1/message/route` - Route message
- `GET /api/v1/agents` - List agents

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/v1/delegate \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Validate a healthcare claim",
    "preferred_agent": "claimlinc",
    "priority": 5
  }'
```

### ClaimLinc Agent

Intelligent claims processing with FHIR validation.

**Endpoints:**
- `POST /api/v1/validate` - Validate FHIR Claim
- `POST /api/v1/analyze` - Analyze rejection
- `POST /api/v1/batch/analyze` - Batch analysis

**Example Request:**

```bash
curl -X POST http://localhost:8001/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "claim_resource": {
      "resourceType": "Claim",
      "status": "active",
      "type": {"coding": [{"code": "institutional"}]},
      "use": "claim",
      "patient": {"reference": "Patient/123"},
      "provider": {"reference": "Organization/456"}
    },
    "validation_level": "full"
  }'
```

## Local Development

### Backend Services

Each service can be run independently for development:

```bash
cd services/masterlinc-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Dashboard

```bash
npm install
npm run dev
# Access at http://localhost:5173
```

## Production Deployment

### Environment Variables

Update `.env` for production:

```bash
ENVIRONMENT=production
LOG_LEVEL=warning

# Strong passwords
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<strong-secret-key>
ENCRYPTION_KEY=<32-byte-key>

# Real API keys
OPENAI_API_KEY=<your-key>
NPHIES_LICENSE_KEY=<your-key>

# Production URLs
API_HOST=0.0.0.0
CORS_ORIGINS=https://yourdomain.com
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET and ENCRYPTION_KEY
- [ ] Configure TLS/SSL certificates
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Configure backup strategy
- [ ] Review CORS_ORIGINS
- [ ] Set up monitoring alerts
- [ ] Enable HIPAA compliance mode
- [ ] Review RBAC configuration

### Kubernetes Deployment

See [kubernetes/README.md](../infrastructure/kubernetes/README.md) for Kubernetes deployment.

## Monitoring

### Prometheus

Access Prometheus at http://localhost:9090

Available metrics:
- Request rates and latencies
- Error rates
- Service health
- Database connections
- Redis operations

### Grafana

Access Grafana at http://localhost:3001

Default credentials: `admin` / `changeme_in_production`

Pre-configured dashboards:
- System Overview
- Agent Performance
- FHIR Operations
- Database Metrics

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.agents.yml logs masterlinc-api
docker-compose -f docker-compose.agents.yml logs postgres

# Restart services
docker-compose -f docker-compose.agents.yml restart

# Rebuild if needed
docker-compose -f docker-compose.agents.yml up -d --build
```

### Database Issues

```bash
# Connect to PostgreSQL
docker exec -it masterlinc-postgres psql -U masterlinc

# Check databases
\l

# Check tables
\c masterlinc
\dt
```

### FHIR Server Issues

```bash
# Check FHIR server logs
docker-compose -f docker-compose.agents.yml logs fhir-server

# Test FHIR endpoint
curl http://localhost:8080/fhir/metadata
```

### Port Conflicts

If ports are already in use, modify `docker-compose.agents.yml`:

```yaml
ports:
  - "9000:8000"  # Use 9000 instead of 8000
```

## Backup and Recovery

### Database Backup

```bash
# Backup all databases
docker exec masterlinc-postgres pg_dumpall -U masterlinc > backup.sql

# Restore
docker exec -i masterlinc-postgres psql -U masterlinc < backup.sql
```

### Configuration Backup

```bash
# Backup configuration
tar -czf config-backup.tar.gz config/ .env
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.agents.yml` to add:

```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "max_connections=200"
    - "-c"
    - "shared_buffers=2GB"
```

### Agent Services

Adjust worker count in Dockerfiles:

```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/Fadil369/masterlinc/issues
- Documentation: https://github.com/Fadil369/masterlinc/tree/main/docs
