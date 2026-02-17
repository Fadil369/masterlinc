# BrainSAIT Enterprise Healthcare Platform - Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

The BrainSAIT Enterprise Healthcare Platform is a comprehensive healthcare solution with full OID (Object Identifier), DID (Decentralized Identifier), and AI integration.

### System Components

#### Backend Services
1. **OID Registry Service** (Port 3001) - Object identifier management
2. **DID Registry Service** (Port 3002) - Decentralized identity management
3. **Healthcare API** (Port 3003) - Patient workflows and clinical operations
4. **AI Orchestrator** (Port 3004) - AI agents for all stakeholders

#### Infrastructure
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching and session management
- **Docker** - Containerization

#### IoT Devices
- **ESP32 Scanner** - OID QR code scanning and validation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Bsma Mobile │  │Doctor Portal │  │ IoT Devices  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                            │
┌─────────────────────────────┼─────────────────────────────────┐
│                      API Gateway / Load Balancer              │
└─────────────────────────────┼─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────┴────────┐  ┌──────┴──────┐  ┌───────┴────────┐
│  OID Registry   │  │ DID Registry │  │ Healthcare API │
│   (Port 3001)   │  │ (Port 3002)  │  │  (Port 3003)   │
└────────┬────────┘  └──────┬───────┘  └───────┬────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   ┌────────┴────────┐
                   │ AI Orchestrator │
                   │  (Port 3004)    │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────┴────────┐  ┌──────┴──────┐  ┌───────┴────────┐
│   PostgreSQL    │  │    Redis    │  │  Blockchain    │
│  (Port 5432)    │  │ (Port 6379) │  │   (Simulated)  │
└─────────────────┘  └─────────────┘  └────────────────┘
```

### Data Flow

1. **Patient Registration**:
   ```
   Mobile App → Healthcare API → OID Registry → PostgreSQL
                                ↓
                            Patient OID Generated
   ```

2. **Doctor Authentication**:
   ```
   Doctor Portal → DID Registry → Verify DID Document → Grant Access
                                 ↓
                            Credentials Validated
   ```

3. **AI Interaction**:
   ```
   Any Client → AI Orchestrator → Appropriate Agent → Response
                                 ↓
                            Interaction Logged (OID)
   ```

4. **IoT Device Scan**:
   ```
   ESP32 → Scan QR → OID Registry (Validate) → Healthcare API (Report)
                                              ↓
                                         Scan Recorded
   ```

---

## Prerequisites

### System Requirements

**Development Environment**:
- CPU: 4+ cores
- RAM: 8GB minimum, 16GB recommended
- Storage: 20GB available space
- OS: Linux, macOS, or Windows with WSL2

**Production Environment**:
- CPU: 8+ cores
- RAM: 32GB minimum
- Storage: 100GB+ SSD
- OS: Ubuntu 22.04 LTS or similar

### Software Requirements

- **Docker** 24.0+ and Docker Compose 2.0+
- **Node.js** 20+  (for local development)
- **PostgreSQL** 16+ (if not using Docker)
- **Redis** 7+ (if not using Docker)
- **Git** 2.30+

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc
```

### 2. Install Dependencies

#### For Docker Deployment (Recommended):
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### For Local Development:
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install service dependencies
cd services/oid-registry && npm install
cd ../did-registry && npm install
cd ../healthcare-api && npm install
cd ../ai-orchestrator && npm install
```

---

## Configuration

### 1. Environment Variables

Create environment file:
```bash
cp .env.brainsait.example .env.brainsait
```

Edit `.env.brainsait`:
```bash
# Database Configuration
DATABASE_URL=postgresql://brainsait:secure_password@localhost:5432/brainsait

# Redis Configuration
REDIS_URL=redis://localhost:6379

# OID Configuration
OID_PEN=61026
OID_ROOT=1.3.6.1.4.1.61026

# DID Configuration
DID_METHOD=did:brainsait

# Service URLs
OID_SERVICE_URL=http://localhost:3001
DID_SERVICE_URL=http://localhost:3002
HEALTHCARE_API_URL=http://localhost:3003
AI_ORCHESTRATOR_URL=http://localhost:3004

# Security (Change in production!)
JWT_SECRET=change-this-secret-key
ENCRYPTION_KEY=change-this-encryption-key

# API Keys (if using external AI services)
OPENAI_API_KEY=your-openai-key
```

### 2. Database Setup

#### Using Docker:
```bash
docker-compose up -d postgres redis
```

#### Manual Setup:
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE brainsait;"
sudo -u postgres psql -c "CREATE USER brainsait WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE brainsait TO brainsait;"

# Run migrations
psql -U brainsait -d brainsait -f infrastructure/database/enterprise-schema.sql
```

---

## Docker Deployment

### Development Deployment

1. **Build and start all services**:
```bash
docker-compose -f docker-compose.yml up -d
```

2. **Verify services**:
```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test services
curl http://localhost:3001/health  # OID Registry
curl http://localhost:3002/health  # DID Registry
curl http://localhost:3003/health  # Healthcare API
curl http://localhost:3004/health  # AI Orchestrator
```

3. **View logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f oid-registry
docker-compose logs -f did-registry
docker-compose logs -f healthcare-api
docker-compose logs -f ai-orchestrator
```

### Docker Compose Configuration

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: brainsait
      POSTGRES_USER: brainsait
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/database/enterprise-schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U brainsait"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  oid-registry:
    build: ./services/oid-registry
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      OID_PEN: ${OID_PEN}
      PORT: 3001
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  did-registry:
    build: ./services/did-registry
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      OID_ROOT: ${OID_ROOT}
      PORT: 3002
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  healthcare-api:
    build: ./services/healthcare-api
    ports:
      - "3003:3003"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      OID_SERVICE_URL: http://oid-registry:3001
      DID_SERVICE_URL: http://did-registry:3002
      PORT: 3003
    depends_on:
      - oid-registry
      - did-registry
    restart: unless-stopped

  ai-orchestrator:
    build: ./services/ai-orchestrator
    ports:
      - "3004:3004"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      OID_SERVICE_URL: http://oid-registry:3001
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      PORT: 3004
    depends_on:
      - oid-registry
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
```

---

## Production Deployment

### Security Hardening

1. **Update secrets**:
```bash
# Generate secure passwords
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

2. **Enable HTTPS**:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

3. **Configure firewall**:
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

4. **Set up reverse proxy** (Nginx example):
```nginx
upstream brainsait_api {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
    server localhost:3004;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location /oid/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /did/ {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /healthcare/ {
        proxy_pass http://localhost:3003/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ai/ {
        proxy_pass http://localhost:3004/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Kubernetes Deployment

For enterprise Kubernetes deployment, see `docs/KUBERNETES_DEPLOYMENT.md` (to be created).

---

## Monitoring

### Health Checks

Check all service health:
```bash
#!/bin/bash
services=("3001" "3002" "3003" "3004")
for port in "${services[@]}"; do
    echo "Checking service on port $port..."
    curl -f http://localhost:$port/health || echo "Service on port $port is DOWN"
done
```

### Logging

View logs in real-time:
```bash
# All services
docker-compose logs -f --tail=100

# Specific service with timestamp
docker-compose logs -f -t oid-registry

# Save logs to file
docker-compose logs > logs/brainsait-$(date +%Y%m%d).log
```

### Metrics and Monitoring

1. **Prometheus** (optional):
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
```

2. **Grafana** (optional):
```yaml
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### 2. Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**:
```bash
# Check if Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

#### 3. Service Won't Start
```
Error: Port 3001 is already in use
```

**Solution**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env file
```

#### 4. OID/DID Service Not Responding

**Solution**:
```bash
# Check service logs
docker-compose logs oid-registry
docker-compose logs did-registry

# Restart services
docker-compose restart oid-registry did-registry

# Verify database schema
psql -U brainsait -d brainsait -c "\dt"
```

### Performance Optimization

1. **Database Indexing**:
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

2. **Redis Cache Monitoring**:
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check cache stats
INFO stats

# Monitor in real-time
MONITOR
```

3. **Service Scaling**:
```bash
# Scale specific service
docker-compose up -d --scale healthcare-api=3
```

---

## Backup and Recovery

### Database Backup
```bash
# Backup
docker-compose exec postgres pg_dump -U brainsait brainsait > backup-$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U brainsait brainsait < backup-20260217.sql
```

### Full System Backup
```bash
# Backup all volumes
docker run --rm \
  -v masterlinc_postgres-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## Maintenance

### Regular Tasks

**Daily**:
- Check service health
- Review error logs
- Monitor disk space

**Weekly**:
- Database backup
- Update dependencies
- Review security logs

**Monthly**:
- Performance optimization
- Security audit
- Update documentation

---

## Support

For additional help:
- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@brainsait.com

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-17
