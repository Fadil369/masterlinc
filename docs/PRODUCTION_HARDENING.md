# BrainSAIT Production Hardening Guide

## Overview

This document provides guidance for hardening the BrainSAIT services for production deployment.

## Security Enhancements Required for Production

### 1. Rate Limiting ⚠️ CRITICAL

**Issue**: API endpoints are not rate-limited, making them vulnerable to abuse and DoS attacks.

**Solution**: Implement express-rate-limit middleware

```bash
npm install express-rate-limit
```

**Implementation** (add to both services):

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Stricter rate limiting for creation endpoints
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 create operations per minute
  message: 'Too many creation requests, please try again later.',
});

app.post('/api/oid/register', createLimiter, async (req, res) => {
  // ... existing code
});

app.post('/api/did/doctor/create', createLimiter, async (req, res) => {
  // ... existing code
});
```

### 2. Private Key Management ⚠️ CRITICAL

**Issue**: Phase 1 generates keys but doesn't store them securely.

**Production Requirements**:

1. **Use a Key Management Service (KMS)**:
   - AWS KMS
   - Azure Key Vault
   - HashiCorp Vault
   - Google Cloud KMS

2. **Encrypt keys before storage**:
   ```typescript
   import { KMS } from '@aws-sdk/client-kms';
   
   const kms = new KMS({ region: 'us-east-1' });
   
   // Encrypt private key
   const encrypted = await kms.encrypt({
     KeyId: process.env.KMS_KEY_ID,
     Plaintext: Buffer.from(keyPair.secretKey),
   });
   
   // Store encrypted key in database
   await pool.query(
     'UPDATE did_registry SET encrypted_private_key = $1 WHERE did = $2',
     [encrypted.CiphertextBlob, did]
   );
   ```

3. **Never expose private keys in logs or responses**

### 3. HTTPS/TLS ⚠️ CRITICAL

**Issue**: Services run on HTTP in development.

**Solution**: Enable HTTPS for all production traffic

**Options**:

1. **Reverse Proxy (Recommended)**:
   - Use nginx or Traefik as reverse proxy
   - Handle TLS termination at proxy level
   - Let's Encrypt for certificates

2. **Application-level TLS**:
   ```typescript
   import https from 'https';
   import fs from 'fs';
   
   const httpsOptions = {
     key: fs.readFileSync(process.env.TLS_KEY_PATH),
     cert: fs.readFileSync(process.env.TLS_CERT_PATH),
   };
   
   https.createServer(httpsOptions, app).listen(PORT);
   ```

### 4. Input Validation

**Issue**: Limited input validation on API endpoints.

**Solution**: Add comprehensive validation using Joi or Zod

```typescript
import Joi from 'joi';

const oidRegistrationSchema = Joi.object({
  branch: Joi.string().pattern(/^\d+(\.\d+)*$/).required(),
  serviceName: Joi.string().min(3).max(255).required(),
  serviceType: Joi.string().min(3).max(50).required(),
  description: Joi.string().max(1000),
  metadata: Joi.object(),
});

app.post('/api/oid/register', async (req, res) => {
  const { error, value } = oidRegistrationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }
  
  // ... continue with validated data
});
```

### 5. Authentication & Authorization

**Issue**: No authentication on API endpoints.

**Solution**: Implement JWT-based authentication

```typescript
import jwt from 'jsonwebtoken';

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/oid/register', authenticateJWT, async (req, res) => {
  // ... existing code
});
```

### 6. Database Security

**Current**: Basic PostgreSQL connection.

**Production Hardening**:

1. **Use connection pooling with limits**:
   ```typescript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20, // maximum pool size
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
     ssl: {
       rejectUnauthorized: true,
       ca: fs.readFileSync(process.env.DB_CA_CERT_PATH),
     },
   });
   ```

2. **Enable SSL/TLS for database connections**

3. **Use prepared statements** (already implemented ✅)

4. **Implement database backups**

5. **Enable audit logging**

### 7. Redis Security

**Current**: Password authentication only.

**Production Hardening**:

1. **Enable TLS**:
   ```typescript
   const redis = createClient({
     url: process.env.REDIS_URL,
     socket: {
       tls: true,
       rejectUnauthorized: true,
     },
   });
   ```

2. **Use Redis ACLs** (Redis 6+):
   ```bash
   # redis.conf
   user oid-service on >secure_password ~oid:* +@read +@write
   user did-service on >secure_password ~did:* +@read +@write
   ```

3. **Limit key TTL** (already implemented ✅)

### 8. Monitoring & Alerting

**Required**:

1. **Structured logging**:
   ```typescript
   import winston from 'winston';
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
     ],
   });
   ```

2. **Metrics collection**:
   - Prometheus metrics
   - Request duration
   - Error rates
   - Database query times

3. **Health checks** (already implemented ✅)

4. **Alerts for**:
   - High error rates
   - Slow queries
   - Service downtime
   - Unusual traffic patterns

### 9. Container Security

**Docker Hardening**:

1. **Use non-root user**:
   ```dockerfile
   FROM node:20-alpine
   
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S nodejs -u 1001
   
   USER nodejs
   ```

2. **Scan images for vulnerabilities**:
   ```bash
   docker scan brainsait-oid-registry
   ```

3. **Use minimal base images** (already using alpine ✅)

4. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

### 10. Environment Security

**Production .env**:

```bash
# Use strong, random passwords
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Use production URLs
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/db?sslmode=require
REDIS_URL=rediss://user:pass@prod-redis.example.com:6379

# Enable production mode
NODE_ENV=production
```

**Never commit .env files to version control!**

## Security Checklist for Production

- [ ] Rate limiting implemented
- [ ] HTTPS/TLS enabled
- [ ] Private keys stored in KMS
- [ ] Input validation added
- [ ] Authentication implemented
- [ ] Authorization implemented
- [ ] Database SSL enabled
- [ ] Redis TLS enabled
- [ ] Structured logging configured
- [ ] Metrics collection enabled
- [ ] Alerts configured
- [ ] Container security hardened
- [ ] Security headers added (helmet.js)
- [ ] CORS properly configured
- [ ] Secrets rotated regularly
- [ ] Backup strategy implemented
- [ ] Incident response plan documented
- [ ] Security audit completed

## Compliance Considerations

### HIPAA Compliance

For HIPAA compliance, ensure:

1. **Encryption at rest**: Database and file storage
2. **Encryption in transit**: TLS 1.2+ for all connections
3. **Access controls**: Role-based access control (RBAC)
4. **Audit logging**: All data access logged
5. **Data retention**: Implement retention policies
6. **Breach notification**: Automated alerting
7. **Business Associate Agreements**: With cloud providers

### References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/auth-methods.html)
- [Redis Security](https://redis.io/topics/security)

## Summary

This Phase 1 implementation provides a solid foundation but requires the above enhancements before production deployment. Prioritize:

1. **CRITICAL**: Rate limiting, HTTPS, key management
2. **HIGH**: Authentication, input validation, monitoring
3. **MEDIUM**: Container hardening, database SSL
4. **LOW**: Advanced monitoring, compliance documentation

**Estimated effort**: 2-3 weeks for production hardening
