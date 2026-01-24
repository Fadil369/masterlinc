# 🚀 Production Deployment Guide

## ✅ Repository Status

**Repository:** https://github.com/Fadil369/masterlinc  
**Branch:** main  
**Version:** v1.0.0  
**Status:** ✅ All branches merged and conflicts resolved

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] TypeScript compilation: PASSING (0 errors)
- [x] Build successful: dist/ generated
- [x] All branches merged to main
- [x] Git conflicts resolved
- [x] Repository cleaned and organized

### ✅ Configuration Files
- [x] Production .env template created
- [x] Docker Compose configured
- [x] GitHub Spark configurations ready
- [x] CI/CD pipeline configured
- [x] Prometheus + Grafana setup

### ✅ Documentation
- [x] README.md - Complete setup guide
- [x] QUICK_START.md - Immediate usage
- [x] CONFIGURATION_SUMMARY.md - Quick reference
- [x] VALIDATION_REPORT.md - Security review
- [x] DEPLOYMENT_COMPLETE.md - Deployment summary
- [x] PRODUCTION_DEPLOYMENT.md - This guide

---

## 🔧 Production Setup Steps

### 1. Server Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- OS: Linux (Ubuntu 20.04+) or macOS

**Recommended:**
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB
- Node.js: v22+
- Docker: Latest
- Docker Compose: v2.0+

### 2. Clone Repository

```bash
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc/packages/3cx-mcp
```

### 3. Configure Environment

```bash
cp .env.production .env
```

Edit `.env` and set:
```bash
PBX_USERNAME=your-actual-username
PBX_PASSWORD=your-actual-password
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Build Application

```bash
npm run build
```

### 6. Production Deployment Options

#### Option A: Direct Node.js

```bash
# Set production environment
export NODE_ENV=production

# Start HTTP server
npm run start:http

# Server will run on http://localhost:3000
```

#### Option B: Docker Compose (Recommended)

```bash
# Start Docker Desktop
open -a Docker

# Build and start all services
docker compose up -d --build

# Services:
# - 3cx-mcp-server: port 3000
# - Redis: port 6379
# - Prometheus: port 9090
# - Grafana: port 3002
```

#### Option C: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index-http.js --name 3cx-mcp-server

# Enable startup on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

---

## 🔍 Health Checks

### Verify Server Health

```bash
# Basic health check
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"..."}

# Check available tools
curl http://localhost:3000/api/mcp/tools

# Expected: JSON array with 18 tools
```

### Verify Metrics

```bash
# Prometheus metrics
curl http://localhost:3000/metrics

# Expected: Prometheus format metrics
```

### Verify Dashboard

```bash
# Dashboard data
curl http://localhost:3000/api/dashboard

# Expected: JSON with stats, activeCalls, recentActivity
```

---

## 🔐 Security Configuration

### 1. Firewall Rules

```bash
# Allow HTTP port
sudo ufw allow 3000/tcp

# Allow Prometheus (internal only)
sudo ufw allow from 10.0.0.0/8 to any port 9090

# Allow Grafana (internal only)
sudo ufw allow from 10.0.0.0/8 to any port 3002
```

### 2. SSL/TLS Setup (Production)

```bash
# Install certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure reverse proxy (nginx)
sudo nano /etc/nginx/sites-available/3cx-mcp

# Add SSL configuration
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable and restart nginx
sudo ln -s /etc/nginx/sites-available/3cx-mcp /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 3. Secure Environment Variables

```bash
# Use secrets management
# Option 1: HashiCorp Vault
# Option 2: AWS Secrets Manager
# Option 3: Docker Secrets

# Example with Docker Secrets:
echo "your-api-key" | docker secret create anthropic_api_key -
```

---

## 📊 Monitoring Setup

### Prometheus

Access: http://localhost:9090

**Queries:**
```promql
# Active calls
3cx_active_calls_total

# Total calls
rate(3cx_calls_total[5m])

# Available agents
3cx_agents_available

# Average duration
avg(3cx_call_duration_seconds)
```

### Grafana

Access: http://localhost:3002  
Default credentials: admin/admin

**Import Dashboard:**
1. Go to Dashboards → Import
2. Upload: `grafana-dashboard.json`
3. Select Prometheus datasource

---

## 🔄 CI/CD Integration

### GitHub Actions

Already configured in `.github/workflows/ci-cd.yml`

**Workflow triggers:**
- Push to main
- Pull requests
- Manual workflow dispatch

**Pipeline stages:**
1. Lint & Type Check
2. Build
3. Security Scan
4. Deploy to Staging
5. Deploy to Production

### Required Secrets

Set in GitHub repository settings:

```
PBX_FQDN
PBX_USERNAME
PBX_PASSWORD
ANTHROPIC_API_KEY
OPENAI_API_KEY
SLACK_WEBHOOK (optional)
SNYK_TOKEN (optional)
```

---

## 🧪 Testing in Production

### Smoke Tests

```bash
# Test 1: Health check
curl -f http://localhost:3000/health || echo "FAILED"

# Test 2: List tools
TOOL_COUNT=$(curl -s http://localhost:3000/api/mcp/tools | jq '.tools | length')
[ "$TOOL_COUNT" -eq 18 ] && echo "PASSED" || echo "FAILED"

# Test 3: Metrics endpoint
curl -s http://localhost:3000/metrics | grep -q "3cx_calls_total" && echo "PASSED" || echo "FAILED"
```

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 http://localhost:3000/health

# Expected: >95% success rate
```

---

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.override.yml
services:
  3cx-mcp:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Load Balancer (nginx)

```nginx
upstream 3cx_mcp {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://3cx_mcp;
    }
}
```

---

## 🔧 Troubleshooting

### Issue: Server Won't Start

```bash
# Check logs
docker compose logs 3cx-mcp-server

# Check port availability
lsof -i :3000

# Restart service
docker compose restart 3cx-mcp-server
```

### Issue: High Memory Usage

```bash
# Check memory
docker stats

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run start:http
```

### Issue: 3CX Connection Failed

```bash
# Test PBX connectivity
ping 1593.3cx.cloud

# Test HTTPS
curl -I https://1593.3cx.cloud

# Check credentials in .env
cat .env | grep PBX_
```

---

## 📝 Maintenance

### Regular Tasks

**Daily:**
- Check health endpoints
- Review error logs
- Monitor metrics

**Weekly:**
- Update dependencies
- Review security alerts
- Backup configurations

**Monthly:**
- Update Docker images
- Review and optimize queries
- Performance testing

### Backup Strategy

```bash
# Backup configuration
tar -czf backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml

# Backup Redis data
docker exec redis redis-cli BGSAVE
docker cp redis:/data/dump.rdb ./backup/

# Automated backup (cron)
0 2 * * * /path/to/backup-script.sh
```

---

## 🎯 Performance Optimization

### Node.js Tuning

```bash
# Enable cluster mode
NODE_ENV=production \
NODE_OPTIONS="--max-old-space-size=4096" \
npm run start:http
```

### Redis Optimization

```redis
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

### Database Indexing

```sql
-- For future PostgreSQL integration
CREATE INDEX idx_calls_timestamp ON calls(timestamp DESC);
CREATE INDEX idx_calls_caller ON calls(caller);
```

---

## 📞 Support

**Issues:** https://github.com/Fadil369/masterlinc/issues  
**Email:** dr.mf.12298@gmail.com  
**Extension:** 12310

---

## ✅ Production Checklist

Before going live, ensure:

- [ ] All environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring dashboards set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Documentation reviewed
- [ ] Team trained on operations
- [ ] Runbooks prepared
- [ ] Incident response plan ready

---

**Version:** 1.0.0  
**Last Updated:** January 25, 2026  
**Status:** ✅ PRODUCTION READY
