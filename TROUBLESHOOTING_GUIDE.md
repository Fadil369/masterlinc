# Troubleshooting Guide - BrainSAIT MasterLinc Platform

## Table of Contents

1. [Common Issues](#common-issues)
2. [Service-Specific Issues](#service-specific-issues)
3. [Database Issues](#database-issues)
4. [Docker Issues](#docker-issues)
5. [Network Issues](#network-issues)
6. [Build Issues](#build-issues)
7. [Performance Issues](#performance-issues)
8. [Logging and Debugging](#logging-and-debugging)

---

## Common Issues

### Issue: Services Won't Start

**Symptoms**: Services fail to start or crash immediately

**Possible Causes**:
1. Port already in use
2. Missing environment variables
3. Database connection failed
4. Dependencies not installed

**Solutions**:

```bash
# Check if port is in use
lsof -i :3001  # OID Registry
lsof -i :3002  # DID Registry
lsof -i :4000  # Orchestrator

# Kill process using the port
kill -9 <PID>

# Check environment variables
cat services/oid-registry/.env
cat services/did-registry/.env
cat packages/masterlinc-orchestrator/.env

# Reinstall dependencies
cd services/oid-registry && npm install
cd services/did-registry && npm install
cd packages/masterlinc-orchestrator && npm install

# Check database connection
psql $DATABASE_URL -c '\dt'
```

---

### Issue: "ECONNREFUSED" Error

**Symptoms**: Services cannot connect to database or Redis

**Possible Causes**:
1. Database/Redis not running
2. Wrong connection string
3. Firewall blocking connection

**Solutions**:

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Or check Docker container
docker ps | grep postgres

# Check if Redis is running
redis-cli ping

# Or check Docker container
docker ps | grep redis

# Start services if not running
docker-compose -f docker-compose.lite.yml up -d

# Verify connection strings
echo $DATABASE_URL
echo $REDIS_URL
```

---

### Issue: Database Tables Not Found

**Symptoms**: "relation does not exist" errors

**Possible Causes**:
1. Database not initialized
2. Wrong database connection
3. Schema not applied

**Solutions**:

```bash
# Check current database
psql $DATABASE_URL -c "SELECT current_database();"

# List all tables
psql $DATABASE_URL -c "\dt"

# Apply schema
psql $DATABASE_URL < infrastructure/init.sql
psql $DATABASE_URL < infrastructure/database/brainsait-schema.sql

# Verify tables exist
psql $DATABASE_URL -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name;
"
```

---

### Issue: TypeScript Build Errors

**Symptoms**: `tsc` compilation fails

**Possible Causes**:
1. Missing type definitions
2. Syntax errors
3. Version mismatch

**Solutions**:

```bash
# Clean build
rm -rf dist/
rm -rf node_modules/
npm install
npm run build

# Check TypeScript version
npx tsc --version

# Install missing types
npm install --save-dev @types/node @types/express @types/pg

# Check tsconfig.json
cat tsconfig.json
```

---

## Service-Specific Issues

### OID Registry Service

#### Issue: OID Generation Fails

**Symptoms**: POST /api/oid/register returns 500 error

**Solutions**:

```bash
# Check logs
tail -f logs/oid-registry.log

# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM oid_registry;"

# Manual OID test
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "test",
    "serviceName": "Test",
    "serviceType": "test"
  }' -v
```

#### Issue: Redis Cache Miss

**Symptoms**: All requests hit database, slow performance

**Solutions**:

```bash
# Check Redis connection
redis-cli ping

# Check Redis keys
redis-cli KEYS "oid:*"

# Clear Redis cache if needed
redis-cli FLUSHDB

# Monitor Redis
redis-cli MONITOR
```

---

### DID Registry Service

#### Issue: DID Creation Fails

**Symptoms**: POST /api/did/doctor/create returns 500 error

**Solutions**:

```bash
# Check crypto library
npm list @stablelib/ed25519

# Reinstall if needed
npm install @stablelib/ed25519 bs58

# Test DID creation
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "TEST-001",
    "region": "Test",
    "specialty": "Test"
  }' -v
```

#### Issue: Key Pair Generation Fails

**Symptoms**: Error generating Ed25519 keys

**Solutions**:

```bash
# Check Node.js version (needs v18+)
node --version

# Update Node.js if needed
nvm install 18
nvm use 18

# Reinstall dependencies
rm -rf node_modules/
npm install
```

---

### MasterLinc Orchestrator

#### Issue: Service Discovery Fails

**Symptoms**: Cannot find registered services

**Solutions**:

```bash
# Check service_registry table
psql $DATABASE_URL -c "SELECT * FROM service_registry;"

# Re-insert default services
psql $DATABASE_URL -c "
  INSERT INTO service_registry (service_id, name, url, status)
  VALUES ('oid-registry', 'OID Registry', 'http://localhost:3001', 'active')
  ON CONFLICT (service_id) DO UPDATE SET url = EXCLUDED.url;
"

# Test service endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## Database Issues

### Issue: Connection Pool Exhausted

**Symptoms**: "too many clients" error

**Solutions**:

```bash
# Check active connections
psql $DATABASE_URL -c "
  SELECT count(*) 
  FROM pg_stat_activity 
  WHERE datname = 'masterlinc';
"

# Terminate idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'masterlinc'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
"

# Increase max_connections in postgresql.conf
# max_connections = 200
```

---

### Issue: Slow Queries

**Symptoms**: Database operations take too long

**Solutions**:

```bash
# Enable query logging
psql $DATABASE_URL -c "ALTER DATABASE masterlinc SET log_min_duration_statement = 1000;"

# Check slow queries
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Analyze tables
psql $DATABASE_URL -c "ANALYZE;"

# Rebuild indexes
psql $DATABASE_URL -c "REINDEX DATABASE masterlinc;"
```

---

## Docker Issues

### Issue: Docker Containers Won't Start

**Symptoms**: `docker-compose up` fails

**Solutions**:

```bash
# Check Docker daemon
docker info

# Check logs
docker-compose -f docker-compose.production.yml logs

# Remove old containers
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Check network
docker network ls
docker network inspect brainsait-net

# Create network if missing
docker network create brainsait-net
```

---

### Issue: Container Health Check Fails

**Symptoms**: Containers are "unhealthy"

**Solutions**:

```bash
# Check container status
docker ps -a

# Inspect health check
docker inspect <container_id> | jq '.[0].State.Health'

# Check logs
docker logs <container_id>

# Execute health check manually
docker exec <container_id> curl -f http://localhost:3001/health
```

---

## Network Issues

### Issue: Cannot Access Services Externally

**Symptoms**: localhost works, but external access fails

**Solutions**:

```bash
# Check if ports are bound to 0.0.0.0
netstat -tulpn | grep 3001

# Update Docker Compose to bind to all interfaces
# ports:
#   - "0.0.0.0:3001:3001"

# Check firewall
sudo ufw status
sudo ufw allow 3001
sudo ufw allow 3002
sudo ufw allow 4000
```

---

### Issue: CORS Errors

**Symptoms**: Browser blocks requests from web app

**Solutions**:

```bash
# Add CORS headers to services
# In Express apps:
# app.use(cors({
#   origin: ['http://localhost:3000', 'https://yourdomain.com'],
#   credentials: true
# }));

# Check current CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3001/api/oid/register -v
```

---

## Build Issues

### Issue: npm install Fails

**Symptoms**: Cannot install dependencies

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Delete lock files
rm package-lock.json
rm -rf node_modules/

# Reinstall
npm install

# Use specific npm version
npm install -g npm@9

# Check for package conflicts
npm ls
```

---

### Issue: TypeScript Compilation Errors

**Symptoms**: `npm run build` fails

**Solutions**:

```bash
# Check TypeScript configuration
cat tsconfig.json

# Update TypeScript
npm install -D typescript@latest

# Check for syntax errors
npx tsc --noEmit

# Build with verbose output
npx tsc --verbose
```

---

## Performance Issues

### Issue: Slow API Response Times

**Symptoms**: Requests take several seconds

**Solutions**:

```bash
# Enable Redis caching
# Verify Redis is running and connected

# Check database indexes
psql $DATABASE_URL -c "
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
"

# Add missing indexes
psql $DATABASE_URL -c "
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_oid 
  ON patients(oid_identifier);
"

# Monitor query performance
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC;
"
```

---

### Issue: High Memory Usage

**Symptoms**: Services consume excessive memory

**Solutions**:

```bash
# Check memory usage
docker stats

# Or for local processes
ps aux | grep node

# Limit Node.js memory
node --max-old-space-size=512 dist/index.js

# Update Docker Compose memory limits
# services:
#   orchestrator:
#     mem_limit: 1g
#     mem_reservation: 512m
```

---

## Logging and Debugging

### Enable Debug Logging

```bash
# Set environment variable
export DEBUG=*

# Or per service
export DEBUG=oid-registry:*

# Start service with debug output
npm run dev
```

---

### Check Service Logs

```bash
# Docker logs
docker-compose -f docker-compose.production.yml logs -f orchestrator
docker-compose -f docker-compose.production.yml logs -f postgres

# Local service logs
tail -f logs/oid-registry.log
tail -f logs/did-registry.log
tail -f logs/orchestrator.log
```

---

### Database Query Logging

```bash
# Enable query logging
psql $DATABASE_URL -c "
  ALTER SYSTEM SET log_statement = 'all';
  SELECT pg_reload_conf();
"

# View PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log

# Or Docker logs
docker logs masterlinc-postgres
```

---

## Getting Help

If you cannot resolve an issue:

1. **Check Logs**: Review service and database logs
2. **Run Verification**: `./scripts/phase1-verify.sh`
3. **Health Checks**: `npx tsx scripts/health-check.ts`
4. **Documentation**: Review [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
5. **GitHub Issues**: Report at https://github.com/Fadil369/masterlinc/issues

---

## Quick Diagnostic Commands

```bash
# All-in-one diagnostic
echo "=== Services ==="
curl -s http://localhost:3001/health || echo "OID Registry: DOWN"
curl -s http://localhost:3002/health || echo "DID Registry: DOWN"
curl -s http://localhost:4000/health || echo "Orchestrator: DOWN"

echo "=== Database ==="
psql $DATABASE_URL -c '\dt' 2>&1 | head -5

echo "=== Docker ==="
docker ps --format "table {{.Names}}\t{{.Status}}"

echo "=== Ports ==="
lsof -i :3001 :3002 :4000 :5432 :6379 | grep LISTEN
```
