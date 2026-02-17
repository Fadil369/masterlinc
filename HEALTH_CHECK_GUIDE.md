# Health Check Guide - BrainSAIT MasterLinc Platform

## Overview

This guide provides comprehensive health monitoring and verification procedures for all Phase 1 services. Use these checks to ensure your deployment is running correctly and to troubleshoot issues.

---

## Table of Contents

1. [Quick Health Check](#quick-health-check)
2. [Detailed Service Checks](#detailed-service-checks)
3. [Database Health](#database-health)
4. [Infrastructure Health](#infrastructure-health)
5. [Automated Monitoring](#automated-monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Quick Health Check

### One-Liner Status Check

```bash
# Check all critical services
curl -s http://localhost:3001/health && echo "✅ OID Registry OK" || echo "❌ OID Registry FAILED"
curl -s http://localhost:3002/health && echo "✅ DID Registry OK" || echo "❌ DID Registry FAILED"
curl -s http://localhost:4000/health && echo "✅ Orchestrator OK" || echo "❌ Orchestrator FAILED"
pg_isready -h localhost -p 5432 && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL FAILED"
redis-cli ping && echo "✅ Redis OK" || echo "❌ Redis FAILED"
```

### Automated Verification Script

```bash
# Run comprehensive verification
./scripts/phase1-verify.sh

# Or run TypeScript health check
npx tsx scripts/health-check.ts
```

---

## Detailed Service Checks

### OID Registry Service

**Port**: 3001  
**Health Endpoint**: `/health`

#### Basic Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "BrainSAIT OID Registry",
  "pen": "61026",
  "root_oid": "1.3.6.1.4.1.61026",
  "timestamp": "2026-02-17T19:00:00.000Z"
}
```

#### Functional Test

```bash
# Register a test OID
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "test",
    "serviceName": "Health Check Test",
    "serviceType": "test",
    "description": "Automated health check test"
  }'

# Should return 201 Created with OID in format:
# 1.3.6.1.4.1.61026.test.<timestamp>
```

#### Performance Check

```bash
# Measure response time
time curl -s http://localhost:3001/health > /dev/null

# Should complete in <100ms
```

#### Database Connectivity

```bash
# Check OID registry table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM oid_registry;"

# Check recent entries
psql $DATABASE_URL -c "
  SELECT oid, service_name, created_at 
  FROM oid_registry 
  ORDER BY created_at DESC 
  LIMIT 5;
"
```

#### Redis Cache Check

```bash
# Check Redis keys for OID cache
redis-cli KEYS "oid:*"

# Should show cached OID entries
# Example: oid:1.3.6.1.4.1.61026.services.1234567890
```

---

### DID Registry Service

**Port**: 3002  
**Health Endpoint**: `/health`

#### Basic Health Check

```bash
curl http://localhost:3002/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "BrainSAIT DID Registry",
  "didMethod": "did:brainsait"
}
```

#### Functional Test

```bash
# Create a test doctor DID
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "HEALTH-CHECK-001",
    "region": "Test",
    "specialty": "Testing"
  }'

# Should return 201 Created with DID in format:
# did:brainsait:doctors:dr-HEALTH-CHECK-001
```

#### Cryptographic Verification

```bash
# The response should include:
# - did: The identifier
# - didDocument: W3C DID Document
# - publicKeyMultibase: Ed25519 public key (starts with 'z')
# - oid: Mapped OID identifier

# Verify key format
curl -s http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{"licenseNumber":"TEST"}' | \
  jq -r '.publicKey' | \
  grep -q '^z' && echo "✅ Valid key format" || echo "❌ Invalid key"
```

#### Database Connectivity

```bash
# Check DID registry table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM did_registry;"

# Check recent DIDs
psql $DATABASE_URL -c "
  SELECT did, did_type, created_at 
  FROM did_registry 
  ORDER BY created_at DESC 
  LIMIT 5;
"

# Check DID-OID mappings
psql $DATABASE_URL -c "SELECT COUNT(*) FROM did_oid_mapping;"
```

---

### MasterLinc Orchestrator

**Port**: 4000 (or 3001 depending on configuration)  
**Health Endpoint**: `/health`

#### Basic Health Check

```bash
curl http://localhost:4000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "MasterLinc Orchestrator",
  "version": "2.0.0",
  "uptime": 3600,
  "timestamp": "2026-02-17T19:00:00.000Z"
}
```

#### Service Registry Check

```bash
# List registered services
curl http://localhost:4000/api/services

# Should return array of registered services
```

#### Database Connectivity

```bash
# Check service registry
psql $DATABASE_URL -c "
  SELECT service_id, name, url, status 
  FROM service_registry;
"

# Check workflows table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM workflows;"

# Check events table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM events;"
```

#### Event Bus Check

```bash
# Check Redis for event bus
redis-cli KEYS "event:*"
redis-cli KEYS "workflow:*"
```

---

## Database Health

### PostgreSQL Health

#### Connection Test

```bash
# Check if database is accepting connections
pg_isready -h localhost -p 5432

# Or connect to specific database
pg_isready -d masterlinc -h localhost -p 5432
```

#### Database Size

```bash
psql $DATABASE_URL -c "
  SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
  FROM pg_database
  WHERE datname = 'masterlinc';
"
```

#### Table Sizes

```bash
psql $DATABASE_URL -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY size_bytes DESC;
"
```

#### Active Connections

```bash
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) as connection_count,
    state,
    datname
  FROM pg_stat_activity
  WHERE datname = 'masterlinc'
  GROUP BY state, datname;
"
```

#### Long-Running Queries

```bash
psql $DATABASE_URL -c "
  SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
  FROM pg_stat_activity
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
    AND state = 'active';
"
```

#### Schema Verification

```bash
# List all tables
psql $DATABASE_URL -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name;
"

# Expected tables:
# - patients
# - oid_registry
# - did_registry
# - did_oid_mapping
# - appointments
# - data_provenance
# - claims
# - claim_services
# - workflows
# - service_registry
# - events
```

#### Index Health

```bash
psql $DATABASE_URL -c "
  SELECT 
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
"
```

---

### Redis Health

#### Connection Test

```bash
# Ping Redis
redis-cli ping
# Should return: PONG
```

#### Memory Usage

```bash
redis-cli INFO memory | grep used_memory_human
```

#### Key Count

```bash
# Total keys
redis-cli DBSIZE

# Keys by pattern
redis-cli KEYS "oid:*" | wc -l
redis-cli KEYS "did:*" | wc -l
```

#### Cache Hit Rate

```bash
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"

# Calculate hit rate:
# hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses)
```

---

## Infrastructure Health

### Docker Health (if using Docker)

#### Container Status

```bash
# List all containers
docker ps -a

# Check specific services
docker ps --filter "name=masterlinc"
```

#### Container Health

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' masterlinc-orchestrator
docker inspect --format='{{.State.Health.Status}}' masterlinc-postgres
docker inspect --format='{{.State.Health.Status}}' masterlinc-redis
```

#### Container Logs

```bash
# View recent logs
docker logs --tail 100 masterlinc-orchestrator
docker logs --tail 100 masterlinc-postgres
docker logs --tail 100 masterlinc-redis

# Follow logs in real-time
docker logs -f masterlinc-orchestrator
```

#### Resource Usage

```bash
# Check CPU and memory usage
docker stats --no-stream
```

### Network Health

#### Port Availability

```bash
# Check if ports are listening
netstat -tlnp | grep -E "3001|3002|4000|5432|6379"

# Or using lsof
lsof -i :3001 -i :3002 -i :4000 -i :5432 -i :6379
```

#### DNS Resolution

```bash
# If using domain names
nslookup brainsait-oid-integr.github.app
nslookup brainsait-healthcare.github.app
```

---

## Automated Monitoring

### Continuous Health Monitoring

Create a monitoring script that runs periodically:

```bash
#!/bin/bash
# /usr/local/bin/monitor-brainsait.sh

while true; do
  echo "$(date): Running health checks..."
  
  # OID Registry
  if curl -sf http://localhost:3001/health > /dev/null; then
    echo "✅ OID Registry: OK"
  else
    echo "❌ OID Registry: FAILED" | mail -s "ALERT: OID Registry Down" admin@brainsait.de
  fi
  
  # DID Registry
  if curl -sf http://localhost:3002/health > /dev/null; then
    echo "✅ DID Registry: OK"
  else
    echo "❌ DID Registry: FAILED" | mail -s "ALERT: DID Registry Down" admin@brainsait.de
  fi
  
  # Orchestrator
  if curl -sf http://localhost:4000/health > /dev/null; then
    echo "✅ Orchestrator: OK"
  else
    echo "❌ Orchestrator: FAILED" | mail -s "ALERT: Orchestrator Down" admin@brainsait.de
  fi
  
  # PostgreSQL
  if pg_isready -h localhost -p 5432 > /dev/null; then
    echo "✅ PostgreSQL: OK"
  else
    echo "❌ PostgreSQL: FAILED" | mail -s "ALERT: PostgreSQL Down" admin@brainsait.de
  fi
  
  # Redis
  if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: OK"
  else
    echo "❌ Redis: FAILED" | mail -s "ALERT: Redis Down" admin@brainsait.de
  fi
  
  sleep 300  # Check every 5 minutes
done
```

Make it executable and run:

```bash
chmod +x /usr/local/bin/monitor-brainsait.sh
nohup /usr/local/bin/monitor-brainsait.sh > /var/log/brainsait-monitor.log 2>&1 &
```

### Systemd Service for Monitoring

Create `/etc/systemd/system/brainsait-monitor.service`:

```ini
[Unit]
Description=BrainSAIT Health Monitor
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/monitor-brainsait.sh
Restart=always
User=brainsait

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl enable brainsait-monitor
systemctl start brainsait-monitor
systemctl status brainsait-monitor
```

---

## Troubleshooting

### Common Issues

#### Service Not Responding

```bash
# Check if process is running
ps aux | grep node

# Check if port is in use
lsof -i :3001

# Check logs
tail -f logs/oid-registry.log
```

#### Database Connection Failed

```bash
# Verify credentials
psql $DATABASE_URL -c '\conninfo'

# Check PostgreSQL status
systemctl status postgresql
# Or for Docker:
docker ps | grep postgres
```

#### Redis Connection Failed

```bash
# Check Redis status
systemctl status redis
# Or for Docker:
docker ps | grep redis

# Test connection
redis-cli ping
```

### Performance Issues

#### Slow Queries

```bash
# Enable query logging
psql $DATABASE_URL -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
psql $DATABASE_URL -c "SELECT pg_reload_conf();"

# View slow queries
tail -f /var/log/postgresql/postgresql-15-main.log | grep "duration"
```

#### High Memory Usage

```bash
# Check service memory
ps aux | grep node | awk '{sum+=$6} END {print sum/1024 " MB"}'

# Check database cache
psql $DATABASE_URL -c "
  SELECT 
    pg_size_pretty(pg_database_size('masterlinc')) AS db_size,
    pg_size_pretty(sum(heap_blks_hit) * 8192) AS cache_hit
  FROM pg_statio_user_tables;
"
```

---

## Health Check Schedule

### Daily Checks

- [ ] Service health endpoints
- [ ] Database connections
- [ ] Log file review
- [ ] Disk space

### Weekly Checks

- [ ] Database performance
- [ ] Index optimization
- [ ] Cache hit rates
- [ ] Security updates

### Monthly Checks

- [ ] Database backups
- [ ] Performance trends
- [ ] Capacity planning
- [ ] Compliance audit

---

## Alerting

### Set Up Alerts

```bash
# Example: Alert on high database connections
psql $DATABASE_URL -c "
  SELECT 
    CASE 
      WHEN count(*) > 80 THEN 'CRITICAL: Too many connections'
      ELSE 'OK'
    END AS status
  FROM pg_stat_activity
  WHERE datname = 'masterlinc';
"
```

### Integration with Monitoring Tools

- **Prometheus**: Export metrics from services
- **Grafana**: Visualize health metrics
- **PagerDuty**: Alert on critical failures
- **Slack**: Send notifications to team channel

---

## Support

For health check issues:
- Review [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
- Check service logs
- Run diagnostic scripts
- Contact DevOps team
