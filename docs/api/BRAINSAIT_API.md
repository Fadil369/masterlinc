# BrainSAIT Healthcare Platform - API Reference

## Overview

This document provides detailed API reference for the BrainSAIT Healthcare Platform core services.

## Base URLs

- **OID Registry Service**: `http://localhost:3001`
- **DID Registry Service**: `http://localhost:3002`

---

## OID Registry Service API

### 1. Register OID

Register a new Object Identifier (OID) for a service or entity.

**Endpoint**: `POST /api/oid/register`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "branch": "string",
  "serviceName": "string",
  "serviceType": "string",
  "description": "string",
  "metadata": {}
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "oid": "1.3.6.1.4.1.61026.2.1.1234567890",
  "data": {}
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/oid/register \
  -H "Content-Type: application/json" \
  -d '{"branch": "2.1", "serviceName": "Test", "serviceType": "test", "description": "Test"}'
```

---

### 2. Resolve OID

**Endpoint**: `GET /api/oid/resolve/:oid`

**Example**:
```bash
curl http://localhost:3001/api/oid/resolve/1.3.6.1.4.1.61026.2.1.1234567890
```

---

### 3. Health Check

**Endpoint**: `GET /health`

**Example**:
```bash
curl http://localhost:3001/health
```

---

## DID Registry Service API

### 1. Create Doctor DID

**Endpoint**: `POST /api/did/doctor/create`

**Request Body**:
```json
{
  "licenseNumber": "string",
  "region": "string",
  "specialty": "string"
}
```

**Example**:
```bash
curl -X POST http://localhost:3002/api/did/doctor/create \
  -H "Content-Type: application/json" \
  -d '{"licenseNumber": "DOC-12345", "region": "SA-01", "specialty": "Cardiology"}'
```

---

### 2. Health Check

**Endpoint**: `GET /health`

**Example**:
```bash
curl http://localhost:3002/health
```
