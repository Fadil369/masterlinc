# MASTERLINC Production Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Database Migrations](#database-migrations)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## 🔧 Prerequisites

### System Requirements

- **Operating System**: Ubuntu 22.04 LTS or newer (or equivalent)
- **CPU**: Minimum 8 cores (16 recommended for production)
- **RAM**: Minimum 16GB (32GB recommended)
- **Storage**: Minimum 100GB SSD
- **Network**: Static IP address with open ports (80, 443, 5432, 6379)

### Software Requirements

```bash
# Docker & Docker Compose
docker --version  # 24.0+ required
docker compose version  # 2.20+ required

# kubectl (for Kubernetes deployment)
kubectl version --client  # 1.28+ required

# Database client tools
psql --version  # PostgreSQL 15+
redis-cli --version  # Redis 7+

# SSL/TLS certificates
openssl version  # 3.0+
```

### Cloud Provider Setup (Optional)

- **AWS**: ECS/EKS cluster, RDS PostgreSQL, ElastiCache Redis
- **Azure**: AKS cluster, Azure Database for PostgreSQL, Azure Cache for Redis
- **GCP**: GKE cluster, Cloud SQL, Memorystore for Redis

---

## 🔐 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc
git checkout main  # or specific release tag
```

### 2. Create Production Environment File

```bash
# Copy template
cp .env.production.template .env.production

# Generate secure secrets
export SECRET_KEY=$(openssl rand -hex 32)
export JWT_SECRET_KEY=$(openssl rand -hex 32)
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export KONG_DB_PASSWORD=$(openssl rand -base64 32)
export GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Update .env.production with generated secrets
sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env.production
sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_SECRET_KEY/" .env.production
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env.production
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env.production
sed -i "s/KONG_DB_PASSWORD=.*/KONG_DB_PASSWORD=$KONG_DB_PASSWORD/" .env.production
sed -i "s/GRAFANA_PASSWORD=.*/GRAFANA_PASSWORD=$GRAFANA_PASSWORD/" .env.production
```

### 3. Configure Application Settings

Edit `.env.production` and update:

- `CORS_ORIGINS`: Your frontend domain(s)
- `ALLOWED_HOSTS`: Your API domain(s)
- `NPHIES_*`: Saudi NPHIES credentials (if applicable)
- `SMTP_*`: Email server configuration
- `AWS_*`: Cloud provider credentials (if using)

### 4. SSL/TLS Certificates

```bash
# Option 1: Let's Encrypt (recommended)
sudo apt-get install certbot
sudo certbot certonly --standalone -d api.yourdomain.com

# Option 2: Self-signed (development only)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout ./certs/key.pem \
  -out ./certs/cert.pem \
  -days 365 \
  -subj "/CN=api.yourdomain.com"

# Update Kong configuration to use certificates
```

---

## 🐳 Docker Deployment

### 1. Build Images

```bash
# Build all services
docker compose -f docker-compose.prod.yml build

# Or build specific service
docker compose -f docker-compose.prod.yml build claimlinc-api

# Tag images for registry
docker tag masterlinc-claimlinc-api:latest registry.yourdomain.com/masterlinc/claimlinc-api:latest
```

### 2. Start Services

```bash
# Load environment variables
source .env.production

# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Check service health
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

### 3. Verify Deployment

```bash
# Check health endpoints
curl http://localhost:8000/health  # MasterLinc
curl http://localhost:8001/health  # ClaimLinc
curl http://localhost:8002/health  # DoctorLinc
curl http://localhost:8003/health  # PolicyLinc
curl http://localhost:8005/health  # AuthLinc

# Check database connectivity
docker compose -f docker-compose.prod.yml exec postgres psql -U masterlinc -c '\l'

# Check Redis connectivity
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD ping
```

### 4. Initialize Database

```bash
# Run migrations for all services
docker compose -f docker-compose.prod.yml exec claimlinc-api python -m alembic upgrade head
docker compose -f docker-compose.prod.yml exec policylinc-api python -m alembic upgrade head
docker compose -f docker-compose.prod.yml exec doctorlinc-api python -m alembic upgrade head
docker compose -f docker-compose.prod.yml exec authlinc-api python -m alembic upgrade head

# Create initial admin user
docker compose -f docker-compose.prod.yml exec authlinc-api python scripts/create_admin.py
```

---

## ☸️ Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl config set-context --current --namespace=masterlinc
```

### 2. Create Secrets

```bash
# Create secrets from .env.production
kubectl create secret generic masterlinc-secrets \
  --from-env-file=.env.production \
  --namespace=masterlinc

# Create TLS secret
kubectl create secret tls masterlinc-tls \
  --cert=./certs/cert.pem \
  --key=./certs/key.pem \
  --namespace=masterlinc
```

### 3. Deploy ConfigMaps

```bash
kubectl apply -f infrastructure/kubernetes/configmaps.yaml
```

### 4. Deploy Services

```bash
# Deploy in order
kubectl apply -f infrastructure/kubernetes/deployments/core-services.yaml
kubectl apply -f infrastructure/kubernetes/services/core-services.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml

# Wait for deployments to be ready
kubectl rollout status deployment/masterlinc-api -n masterlinc
kubectl rollout status deployment/claimlinc-api -n masterlinc
kubectl rollout status deployment/policylinc-api -n masterlinc
kubectl rollout status deployment/doctorlinc-api -n masterlinc
kubectl rollout status deployment/authlinc-api -n masterlinc
```

### 5. Configure Horizontal Pod Autoscaler

```bash
# Apply HPA configurations
kubectl apply -f infrastructure/kubernetes/hpa.yaml

# Verify HPA status
kubectl get hpa -n masterlinc
```

### 6. Verify Deployment

```bash
# Check pod status
kubectl get pods -n masterlinc

# Check service endpoints
kubectl get svc -n masterlinc

# Check ingress
kubectl get ingress -n masterlinc

# View logs
kubectl logs -f deployment/masterlinc-api -n masterlinc
```

---

## 📊 Database Migrations

### Alembic Setup (for each service)

```bash
# Initialize Alembic (first time only)
cd services/claimlinc-api
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Database Backup

```bash
# Backup PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U masterlinc masterlinc > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore PostgreSQL
docker compose -f docker-compose.prod.yml exec -T postgres psql \
  -U masterlinc masterlinc < backup_20240101_120000.sql

# Automated backup script
cat << 'EOF' > /usr/local/bin/masterlinc-backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/masterlinc"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker compose -f /opt/masterlinc/docker-compose.prod.yml exec postgres pg_dump \
  -U masterlinc masterlinc > $BACKUP_DIR/masterlinc_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF
chmod +x /usr/local/bin/masterlinc-backup.sh

# Add to crontab
echo "0 2 * * * /usr/local/bin/masterlinc-backup.sh" | crontab -
```

---

## 📈 Monitoring & Observability

### Prometheus Setup

```bash
# Access Prometheus UI
open http://localhost:9090

# Check targets
curl http://localhost:9090/api/v1/targets

# Example queries
# Request rate: rate(http_requests_total[5m])
# Error rate: rate(http_requests_total{status=~"5.."}[5m])
# Latency: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Grafana Setup

```bash
# Access Grafana UI
open http://localhost:3001
# Login: admin / $GRAFANA_PASSWORD

# Import dashboards
# Dashboard IDs: 12230 (FastAPI), 13946 (PostgreSQL), 11835 (Redis)
```

### Application Metrics

```python
# Add to each FastAPI service
from prometheus_fastapi_instrumentator import Instrumentator

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app)
```

### Distributed Tracing (OpenTelemetry)

```python
# Add to requirements.txt
opentelemetry-api==1.21.0
opentelemetry-sdk==1.21.0
opentelemetry-instrumentation-fastapi==0.42b0
opentelemetry-exporter-jaeger==1.21.0

# Initialize tracing
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)
```

### Logging

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Filter by service
docker compose -f docker-compose.prod.yml logs -f claimlinc-api

# Search logs
docker compose -f docker-compose.prod.yml logs | grep ERROR

# Export logs to file
docker compose -f docker-compose.prod.yml logs > logs_$(date +%Y%m%d).txt
```

---

## 🔒 Security Checklist

### Pre-Deployment Security

- [ ] All secrets generated with `openssl rand -hex 32`
- [ ] `.env.production` not committed to git (in `.gitignore`)
- [ ] SSL/TLS certificates configured and valid
- [ ] Database passwords rotated from defaults
- [ ] Redis password enabled
- [ ] JWT secret keys unique and secure
- [ ] API rate limiting enabled
- [ ] CORS origins restricted to production domains
- [ ] SQL injection prevention (parameterized queries)
- [ ] Input validation on all endpoints
- [ ] XSS protection headers enabled
- [ ] CSRF protection enabled for state-changing operations

### Runtime Security

```bash
# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (restrict to app subnet)
sudo ufw allow 6379/tcp  # Redis (restrict to app subnet)

# Fail2ban for SSH protection
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Regular security updates
sudo apt-get update && sudo apt-get upgrade -y
```

### Container Security

```bash
# Scan Docker images for vulnerabilities
docker scan masterlinc-claimlinc-api:latest

# Use non-root user in Dockerfile
USER appuser

# Read-only filesystem
docker compose -f docker-compose.prod.yml up -d --read-only

# Security scanning with Trivy
trivy image masterlinc-claimlinc-api:latest
```

---

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs service-name

# Check health
docker compose -f docker-compose.prod.yml ps

# Restart specific service
docker compose -f docker-compose.prod.yml restart service-name

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build service-name
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker compose -f docker-compose.prod.yml exec postgres psql -U masterlinc -c 'SELECT 1'

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Reset database (WARNING: destroys data)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d postgres
```

### Memory Issues

```bash
# Check memory usage
docker stats

# Increase service limits in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G

# Clear Docker cache
docker system prune -a --volumes
```

### Performance Issues

```bash
# Check slow queries
docker compose -f docker-compose.prod.yml exec postgres psql -U masterlinc -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"

# Enable query logging
# Add to postgresql.conf: log_statement = 'all'

# Check Redis performance
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD --latency
```

---

## ⏮️ Rollback Procedures

### Docker Rollback

```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout tags/v1.0.0  # or previous commit

# Rebuild and start
docker compose -f docker-compose.prod.yml up -d --build

# Rollback database migration
docker compose -f docker-compose.prod.yml exec claimlinc-api alembic downgrade -1
```

### Kubernetes Rollback

```bash
# Rollback deployment
kubectl rollout undo deployment/claimlinc-api -n masterlinc

# Rollback to specific revision
kubectl rollout history deployment/claimlinc-api -n masterlinc
kubectl rollout undo deployment/claimlinc-api --to-revision=2 -n masterlinc

# Check rollout status
kubectl rollout status deployment/claimlinc-api -n masterlinc
```

### Database Rollback

```bash
# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres psql \
  -U masterlinc masterlinc < backup_20240101_120000.sql

# Or use point-in-time recovery (if enabled)
```

---

## 📞 Support

- **Documentation**: https://github.com/Fadil369/masterlinc/docs
- **Issues**: https://github.com/Fadil369/masterlinc/issues
- **Security**: security@masterlinc.health
- **Status Page**: https://status.masterlinc.health

---

## 📝 Production Checklist

### Before Go-Live

- [ ] All services deployed and healthy
- [ ] Database migrations applied
- [ ] SSL/TLS certificates installed
- [ ] Monitoring and alerting configured
- [ ] Backup strategy tested
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated
- [ ] Team trained on operations
- [ ] Incident response plan ready
- [ ] Rollback procedure tested
- [ ] Performance benchmarks met

### Post-Deployment

- [ ] Smoke tests passed
- [ ] API endpoints responding
- [ ] Frontend connected to backend
- [ ] Workflow test successful
- [ ] Monitoring dashboards showing data
- [ ] Logs being collected
- [ ] Backups running on schedule
- [ ] Team notified of deployment
- [ ] Change log updated
- [ ] Documentation published

---

**Last Updated**: January 19, 2026  
**Version**: 1.0.0  
**Maintainer**: MASTERLINC DevOps Team
