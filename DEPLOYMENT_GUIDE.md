# Phase 1 Deployment Guide - BrainSAIT MasterLinc

## Overview

This guide provides step-by-step instructions for deploying the Phase 1 BrainSAIT MasterLinc platform to production.

**Phase 1 Components:**
- PostgreSQL Database
- Redis Cache
- OID Registry Service
- DID Registry Service
- MasterLinc Orchestrator
- Docker Container Infrastructure

---

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- OS: Ubuntu 20.04+ or similar Linux distribution

**Recommended Specifications:**
- CPU: 8 cores
- RAM: 16GB
- Storage: 100GB SSD
- Network: 1Gbps

### Software Requirements

- Docker 24.x+
- Docker Compose 2.x+
- Git
- Node.js 18.x+ (for local builds)
- PostgreSQL client tools
- Redis client tools

---

## Pre-Deployment Checklist

- [ ] Server provisioned with adequate resources
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificates obtained
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Emergency contacts documented

---

## Step 1: Server Preparation

### Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect

# Verify installation
docker --version
docker-compose --version
```

### Install Additional Tools

```bash
sudo apt install -y git curl jq postgresql-client redis-tools
```

### Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow service ports (if direct access needed)
sudo ufw allow 3001/tcp  # OID Registry
sudo ufw allow 3002/tcp  # DID Registry
sudo ufw allow 4000/tcp  # Orchestrator
sudo ufw allow 5432/tcp  # PostgreSQL (only if external access needed)
sudo ufw allow 6379/tcp  # Redis (only if external access needed)

# Enable firewall
sudo ufw enable
```

---

## Step 2: Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/brainsait
sudo chown $USER:$USER /opt/brainsait
cd /opt/brainsait

# Clone repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Checkout main branch
git checkout main
git pull origin main
```

---

## Step 3: Environment Configuration

### Create Production Environment File

```bash
# Create .env.production
cat > .env.production << 'EOF'
# Database Configuration
DB_PASSWORD=<CHANGE_THIS_SECURE_PASSWORD>
DATABASE_URL=postgresql://masterlinc:${DB_PASSWORD}@postgres:5432/masterlinc

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Secret
JWT_SECRET=<CHANGE_THIS_SECURE_JWT_SECRET>

# OID Configuration
OID_PEN=61026
OID_ROOT=1.3.6.1.4.1.61026

# DID Configuration
DID_METHOD=did:brainsait

# Service Ports
OID_REGISTRY_PORT=3001
DID_REGISTRY_PORT=3002
ORCHESTRATOR_PORT=4000

# Node Environment
NODE_ENV=production

# CORS Origins (comma-separated)
CORS_ORIGINS=https://brainsait.de,https://hub.brainsait.de,https://api.brainsait.de

# Logging
LOG_LEVEL=info

# Security
SBS_EMBEDDED=true
EOF

# Secure the file
chmod 600 .env.production
```

### Generate Secure Passwords

```bash
# Generate database password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Database password: $DB_PASSWORD"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT secret: $JWT_SECRET"

# Update .env.production with these values
sed -i "s/<CHANGE_THIS_SECURE_PASSWORD>/$DB_PASSWORD/" .env.production
sed -i "s/<CHANGE_THIS_SECURE_JWT_SECRET>/$JWT_SECRET/" .env.production
```

### Create Service-Specific Environment Files

```bash
# OID Registry
cat > services/oid-registry/.env << EOF
PORT=3001
DATABASE_URL=postgresql://masterlinc:${DB_PASSWORD}@postgres:5432/masterlinc
REDIS_URL=redis://redis:6379
OID_PEN=61026
NODE_ENV=production
EOF

# DID Registry
cat > services/did-registry/.env << EOF
PORT=3002
DATABASE_URL=postgresql://masterlinc:${DB_PASSWORD}@postgres:5432/masterlinc
REDIS_URL=redis://redis:6379
OID_ROOT=1.3.6.1.4.1.61026
NODE_ENV=production
EOF

# Orchestrator
cat > packages/masterlinc-orchestrator/.env << EOF
PORT=4000
DATABASE_URL=postgresql://masterlinc:${DB_PASSWORD}@postgres:5432/masterlinc
REDIS_URL=redis://redis:6379
NODE_ENV=production
SBS_EMBEDDED=true
JWT_SECRET=${JWT_SECRET}
EOF
```

---

## Step 4: Build Services

### Create Docker Network

```bash
# Create external network for all services
docker network create brainsait-net
```

### Build Service Images

```bash
# Build OID Registry
cd services/oid-registry
docker build -t brainsait/oid-registry:latest .
cd ../..

# Build DID Registry
cd services/did-registry
docker build -t brainsait/did-registry:latest .
cd ../..

# Build Orchestrator
cd packages/masterlinc-orchestrator
docker build -t brainsait/orchestrator:latest .
cd ../..
```

---

## Step 5: Database Initialization

### Start PostgreSQL

```bash
# Start PostgreSQL using Docker Compose
docker-compose -f docker-compose.lite.yml up -d postgres

# Wait for PostgreSQL to be ready
sleep 10
```

### Initialize Database Schema

```bash
# Set database URL
export DATABASE_URL="postgresql://masterlinc:${DB_PASSWORD}@localhost:5432/masterlinc"

# Run initialization scripts
psql $DATABASE_URL < infrastructure/init.sql
psql $DATABASE_URL < infrastructure/database/brainsait-schema.sql

# Verify schema
./scripts/validate-database.sh
```

---

## Step 6: Start All Services

### Using Docker Compose

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Verify Services Started

```bash
# Wait for services to start
sleep 15

# Run health checks
./scripts/phase1-verify.sh

# Or use TypeScript health check
npm run health-check
```

---

## Step 7: Initial Data Setup

### Register Initial Services

```bash
# Register OID Registry itself
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "services",
    "serviceName": "OID Registry",
    "serviceType": "registry",
    "description": "BrainSAIT OID Registry Service"
  }'

# Register DID Registry
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "services",
    "serviceName": "DID Registry",
    "serviceType": "registry",
    "description": "BrainSAIT DID Registry Service"
  }'
```

### Create Admin DID

```bash
# Create admin doctor DID
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "ADMIN-001",
    "region": "Central",
    "specialty": "Administration"
  }'
```

---

## Step 8: Security Hardening

### SSL/TLS Configuration

If using Nginx reverse proxy:

```bash
# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx (see example below)
sudo nano /etc/nginx/sites-available/brainsait

# Enable site
sudo ln -s /etc/nginx/sites-available/brainsait /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.brainsait.de
```

**Nginx Configuration Example:**

```nginx
upstream oid_registry {
    server localhost:3001;
}

upstream did_registry {
    server localhost:3002;
}

upstream orchestrator {
    server localhost:4000;
}

server {
    listen 80;
    server_name api.brainsait.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.brainsait.de;

    ssl_certificate /etc/letsencrypt/live/api.brainsait.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.brainsait.de/privkey.pem;

    location /oid/ {
        proxy_pass http://oid_registry/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /did/ {
        proxy_pass http://did_registry/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://orchestrator/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Security

```bash
# Connect to database
psql $DATABASE_URL

# Create read-only user for monitoring
CREATE USER brainsait_monitor WITH PASSWORD 'secure_monitor_password';
GRANT CONNECT ON DATABASE masterlinc TO brainsait_monitor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO brainsait_monitor;

# Create backup user
CREATE USER brainsait_backup WITH PASSWORD 'secure_backup_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO brainsait_backup;
```

### Enable Audit Logging

```bash
# Update PostgreSQL config to log all connections and queries
sudo nano /etc/postgresql/15/main/postgresql.conf

# Add these lines:
# log_connections = on
# log_disconnections = on
# log_statement = 'mod'  # Log all modifications

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Step 9: Monitoring Setup

### Setup Log Rotation

```bash
# Create logrotate config
cat > /etc/logrotate.d/brainsait << EOF
/var/log/brainsait/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 brainsait brainsait
    sharedscripts
    postrotate
        docker-compose -f /opt/brainsait/masterlinc/docker-compose.production.yml restart
    endscript
}
EOF
```

### Setup Monitoring Script

```bash
# Copy monitoring script
sudo cp scripts/monitor-brainsait.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/monitor-brainsait.sh

# Create systemd service
cat > /etc/systemd/system/brainsait-monitor.service << EOF
[Unit]
Description=BrainSAIT Health Monitor
After=network.target docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/monitor-brainsait.sh
Restart=always
User=brainsait

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable brainsait-monitor
sudo systemctl start brainsait-monitor
```

---

## Step 10: Backup Configuration

### Automated Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-brainsait-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/brainsait"
DATE=$(date +%Y%m%d_%H%M%S)
DB_URL="postgresql://masterlinc:${DB_PASSWORD}@localhost:5432/masterlinc"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DB_URL | gzip > $BACKUP_DIR/masterlinc_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "masterlinc_*.sql.gz" -mtime +30 -delete

echo "Backup completed: masterlinc_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/backup-brainsait-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-brainsait-db.sh") | crontab -
```

---

## Step 11: Post-Deployment Verification

### Run All Verification Tests

```bash
# Phase 1 verification
./scripts/phase1-verify.sh

# Database validation
./scripts/validate-database.sh

# Health checks
npm run health-check

# Integration tests
npm run test:integration
```

### Manual Testing

```bash
# Test OID Registry
curl https://api.brainsait.de/oid/health

# Test DID Registry
curl https://api.brainsait.de/did/health

# Test Orchestrator
curl https://api.brainsait.de/health

# Create test OID
curl -X POST https://api.brainsait.de/oid/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "test",
    "serviceName": "Deployment Test",
    "serviceType": "test"
  }'
```

---

## Step 12: Documentation

### Update Configuration Management

```bash
# Document all passwords and secrets in secure location
# (Use password manager or encrypted file)

# Document server details
cat > /opt/brainsait/SERVER_INFO.md << EOF
# BrainSAIT MasterLinc - Server Information

## Server Details
- Hostname: $(hostname)
- IP Address: $(hostname -I)
- OS: $(lsb_release -d | cut -f2)
- Deployment Date: $(date)

## Services
- OID Registry: http://localhost:3001
- DID Registry: http://localhost:3002
- Orchestrator: http://localhost:4000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Backup Location
/var/backups/brainsait

## Logs
/var/log/brainsait
EOF
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Restore database from backup
gunzip < /var/backups/brainsait/masterlinc_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL

# Revert to previous version
git checkout <previous-version-tag>

# Restart services
docker-compose -f docker-compose.production.yml up -d
```

---

## Maintenance

### Daily Tasks
- Check service health
- Review logs for errors
- Monitor disk space

### Weekly Tasks
- Review database performance
- Check backup integrity
- Update security patches

### Monthly Tasks
- Full system backup
- Performance tuning
- Capacity planning review

---

## Support

For deployment issues:
- Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
- Review service logs
- Contact DevOps team

---

## Success Criteria

Deployment is successful when:
- ✅ All services passing health checks
- ✅ Database schema validated
- ✅ Integration tests passing
- ✅ Monitoring active
- ✅ Backups configured
- ✅ SSL/TLS enabled
- ✅ Documentation updated
