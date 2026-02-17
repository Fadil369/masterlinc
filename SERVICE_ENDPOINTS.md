# Service Endpoints Reference - BrainSAIT MasterLinc Platform

## Overview

This document provides a comprehensive reference of all service endpoints in the BrainSAIT MasterLinc platform, including their purposes, request/response formats, and examples.

---

## Table of Contents

1. [OID Registry Service](#oid-registry-service)
2. [DID Registry Service](#did-registry-service)
3. [MasterLinc Orchestrator](#masterlinc-orchestrator)
4. [Database Schema](#database-schema)
5. [Authentication](#authentication)

---

## OID Registry Service

**Base URL**: `http://localhost:3001`  
**Purpose**: Manages Object Identifiers (OIDs) for healthcare services following ISO/IEC standards  
**Root OID**: `1.3.6.1.4.1.61026` (BrainSAIT PEN)

### Endpoints

#### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "BrainSAIT OID Registry",
  "pen": "61026",
  "root_oid": "1.3.6.1.4.1.61026",
  "timestamp": "2026-02-17T19:00:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:3001/health
```

---

#### Register OID

```http
POST /api/oid/register
```

**Request Body**:
```json
{
  "branch": "services",
  "serviceName": "Patient Portal",
  "serviceType": "web_application",
  "description": "Patient-facing web portal for appointment scheduling",
  "metadata": {
    "version": "1.0.0",
    "environment": "production",
    "owner": "BrainSAIT"
  }
}
```

**Response**:
```json
{
  "success": true,
  "oid": "1.3.6.1.4.1.61026.services.1708200000000",
  "data": {
    "oid": "1.3.6.1.4.1.61026.services.1708200000000",
    "oid_branch": "services",
    "service_name": "Patient Portal",
    "service_type": "web_application",
    "description": "Patient-facing web portal for appointment scheduling",
    "pen_number": 61026,
    "is_active": true,
    "metadata": {
      "version": "1.0.0",
      "environment": "production",
      "owner": "BrainSAIT"
    },
    "created_at": "2026-02-17T19:00:00.000Z",
    "updated_at": "2026-02-17T19:00:00.000Z"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "services",
    "serviceName": "Patient Portal",
    "serviceType": "web_application",
    "description": "Patient-facing web portal"
  }'
```

**Branch Naming Convention**:
- `services` - Application services (1.3.6.1.4.1.61026.1)
- `devices` - Medical devices (1.3.6.1.4.1.61026.2)
- `users` - User identities (1.3.6.1.4.1.61026.3)
- `documents` - Document types (1.3.6.1.4.1.61026.4)
- `facilities` - Healthcare facilities (1.3.6.1.4.1.61026.5)

---

#### Resolve OID

```http
GET /api/oid/resolve/:oid
```

**Parameters**:
- `oid` (path): The OID to resolve

**Response**:
```json
{
  "success": true,
  "data": {
    "oid": "1.3.6.1.4.1.61026.services.1708200000000",
    "oid_branch": "services",
    "service_name": "Patient Portal",
    "service_type": "web_application",
    "description": "Patient-facing web portal for appointment scheduling",
    "pen_number": 61026,
    "is_active": true,
    "metadata": {...},
    "created_at": "2026-02-17T19:00:00.000Z",
    "updated_at": "2026-02-17T19:00:00.000Z"
  },
  "source": "cache"
}
```

**Example**:
```bash
curl http://localhost:3001/api/oid/resolve/1.3.6.1.4.1.61026.services.1708200000000
```

---

## DID Registry Service

**Base URL**: `http://localhost:3002`  
**Purpose**: Manages Decentralized Identifiers (DIDs) for users and entities  
**DID Method**: `did:brainsait`

### Endpoints

#### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "BrainSAIT DID Registry",
  "didMethod": "did:brainsait"
}
```

**Example**:
```bash
curl http://localhost:3002/health
```

---

#### Create Doctor DID

```http
POST /api/did/doctor/create
```

**Request Body**:
```json
{
  "licenseNumber": "DR-12345",
  "region": "Riyadh",
  "specialty": "Cardiology"
}
```

**Response**:
```json
{
  "success": true,
  "did": "did:brainsait:doctors:dr-DR-12345",
  "didDocument": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:brainsait:doctors:dr-DR-12345",
    "verificationMethod": [{
      "id": "did:brainsait:doctors:dr-DR-12345#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:brainsait:doctors:dr-DR-12345",
      "publicKeyMultibase": "z6Mk..."
    }],
    "authentication": ["did:brainsait:doctors:dr-DR-12345#key-1"],
    "alsoKnownAs": ["oid:1.3.6.1.4.1.61026.2.1.1.dr-DR-12345"],
    "brainSAIT": {
      "oid": "1.3.6.1.4.1.61026.2.1.1.dr-DR-12345",
      "pen": "61026",
      "region": "Riyadh",
      "specialty": "Cardiology",
      "license": {
        "number": "DR-12345"
      }
    }
  },
  "oid": "1.3.6.1.4.1.61026.2.1.1.dr-DR-12345",
  "publicKey": "z6Mk...",
  "message": "DID created successfully. Private key has been generated securely."
}
```

**Example**:
```bash
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "DR-12345",
    "region": "Riyadh",
    "specialty": "Cardiology"
  }'
```

**DID Types**:
- `doctors` - Healthcare providers (did:brainsait:doctors:*)
- `patients` - Patients (did:brainsait:patients:*)
- `facilities` - Healthcare facilities (did:brainsait:facilities:*)
- `devices` - Medical devices (did:brainsait:devices:*)

---

## MasterLinc Orchestrator

**Base URL**: `http://localhost:4000`  
**Purpose**: Central orchestration and service coordination

### Endpoints

#### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "MasterLinc Orchestrator",
  "version": "2.0.0",
  "uptime": 3600,
  "timestamp": "2026-02-17T19:00:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:4000/health
```

---

#### List Services

```http
GET /api/services
```

**Response**:
```json
{
  "success": true,
  "services": [
    {
      "service_id": "oid-registry",
      "name": "OID Registry",
      "url": "http://localhost:3001",
      "status": "healthy",
      "health_endpoint": "/health",
      "last_health_check": "2026-02-17T18:59:00.000Z"
    },
    {
      "service_id": "did-registry",
      "name": "DID Registry",
      "url": "http://localhost:3002",
      "status": "healthy",
      "health_endpoint": "/health",
      "last_health_check": "2026-02-17T18:59:00.000Z"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:4000/api/services
```

---

#### Execute Workflow

```http
POST /api/workflow/execute
```

**Request Body**:
```json
{
  "workflowId": "patient-registration",
  "context": {
    "patientData": {
      "nationalId": "1234567890",
      "fullName": "Ahmad Al-Mansour",
      "dob": "1990-01-15",
      "phone": "+966501234567"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "workflowId": "patient-registration",
  "executionId": "exec-123456",
  "status": "completed",
  "result": {
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "oid": "1.3.6.1.4.1.61026.3.1.1234567890",
    "did": "did:brainsait:patients:1234567890"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:4000/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "patient-registration",
    "context": {
      "patientData": {
        "nationalId": "1234567890",
        "fullName": "Ahmad Al-Mansour"
      }
    }
  }'
```

---

## Database Schema

### Direct Database Queries

For advanced operations, you can query the database directly:

```bash
# Connect to database
psql postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc
```

#### Query Patients

```sql
SELECT 
  patient_id,
  national_id,
  oid_identifier,
  did_identifier,
  full_name,
  registration_date
FROM patients
ORDER BY registration_date DESC
LIMIT 10;
```

#### Query OID Registry

```sql
SELECT 
  oid,
  oid_branch,
  service_name,
  service_type,
  is_active,
  created_at
FROM oid_registry
WHERE is_active = true
ORDER BY created_at DESC;
```

#### Query DID Registry

```sql
SELECT 
  did,
  did_type,
  oid_identifier,
  status,
  created_at
FROM did_registry
WHERE status = 'active'
ORDER BY created_at DESC;
```

#### Query Data Provenance

```sql
SELECT 
  provenance_id,
  data_type,
  service_oid,
  operation,
  timestamp
FROM data_provenance
ORDER BY timestamp DESC
LIMIT 20;
```

---

## Authentication

### Current Status

**Phase 1**: Basic authentication is implemented for database and Redis connections.

### Future Phases

**Phase 2+** will include:
- JWT-based API authentication
- OAuth2 integration
- FHIR server authentication
- NPHIES integration credentials
- Role-based access control (RBAC)

---

## Integration Examples

### Patient Registration Flow

```bash
# Step 1: Create patient DID
PATIENT_DID=$(curl -s -X POST http://localhost:3002/api/did/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890",
    "region": "Riyadh"
  }' | jq -r '.did')

# Step 2: Register patient OID
PATIENT_OID=$(curl -s -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "patients",
    "serviceName": "Patient-1234567890",
    "serviceType": "patient_identity",
    "description": "Patient identity record"
  }' | jq -r '.oid')

# Step 3: Create patient record in database
psql $DATABASE_URL -c "
  INSERT INTO patients (national_id, oid_identifier, did_identifier, full_name)
  VALUES ('1234567890', '$PATIENT_OID', '$PATIENT_DID', 'Ahmad Al-Mansour')
"
```

### Service Registration Flow

```bash
# Register a new healthcare service
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "services",
    "serviceName": "Radiology PACS",
    "serviceType": "imaging_system",
    "description": "Orthanc PACS server for radiology",
    "metadata": {
      "vendor": "Orthanc",
      "version": "24.1.0",
      "modalities": ["CT", "MRI", "XR"]
    }
  }'
```

---

## Error Codes

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Custom Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Rate Limiting

**Current Status**: Not implemented in Phase 1

**Planned for Phase 2**:
- 100 requests per minute per IP
- 1000 requests per hour per API key
- Configurable limits per endpoint

---

## Monitoring

### Health Check Endpoints

All services provide health check endpoints at `/health`:

```bash
# Check all services
curl http://localhost:3001/health  # OID Registry
curl http://localhost:3002/health  # DID Registry
curl http://localhost:4000/health  # Orchestrator
```

### Service Status Monitoring

```bash
# Run comprehensive health check
npx tsx scripts/health-check.ts

# Or use the verification script
./scripts/phase1-verify.sh
```

---

## Support

For questions or issues with these endpoints:
- Check the [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
- Review service logs
- Contact support team
