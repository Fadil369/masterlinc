# OID Registry and Hierarchy Documentation

## Overview

This document defines the Object Identifier (OID) hierarchy for the MasterLinc Healthcare system, based on BrainSAIT's Private Enterprise Number (PEN) **61026** assigned by IANA.

**Root OID**: `1.3.6.1.4.1.61026`  
**Organization**: BrainSAIT Medical Imaging Solutions  
**PEN Assignment**: [IANA Private Enterprise Numbers](https://www.iana.org/assignments/enterprise-numbers/)

---

## Table of Contents

1. [OID Structure and Hierarchy](#oid-structure-and-hierarchy)
2. [Healthcare Branch](#healthcare-branch)
3. [Devices Branch](#devices-branch)
4. [Services Branch](#services-branch)
5. [Audit and Compliance](#audit-and-compliance)
6. [OID Generation Rules](#oid-generation-rules)
7. [Registry Management](#registry-management)
8. [Integration with ISO/IEC 61026](#integration-with-isoiec-61026)

---

## OID Structure and Hierarchy

### Root Structure

```
1.3.6.1.4.1.61026
├── healthcare (1)
│   ├── patients (1)
│   ├── providers (2)
│   ├── facilities (3)
│   ├── appointments (4)
│   ├── triage (5)
│   ├── vitals (6)
│   ├── exams (7)
│   ├── documentation (8)
│   ├── emergency (9)
│   ├── followups (10)
│   ├── templates (11)
│   ├── tasks (12)
│   ├── voice (13)
│   ├── endorsements (14)
│   └── handovers (15)
├── devices (2)
│   ├── vital_monitors (1)
│   ├── esp32_qr (2)
│   ├── tablets (3)
│   ├── workstations (4)
│   ├── iot_sensors (5)
│   └── medical_equipment (6)
├── services (3)
│   ├── oid_registry (1)
│   ├── did_registry (2)
│   ├── ai_orchestration (3)
│   ├── orchestrator (4)
│   ├── coordinator (5)
│   └── analytics (6)
├── audit (4)
│   ├── trail (1)
│   ├── compliance (2)
│   └── provenance (3)
├── claims (5)
│   ├── sbs (1)
│   ├── nphies (2)
│   └── payments (3)
└── imaging (6)
    ├── pacs (1)
    ├── dicom (2)
    └── studies (3)
```

---

## Healthcare Branch

**Base OID**: `1.3.6.1.4.1.61026.1` (healthcare)

### 1.1 Patients

**OID Pattern**: `1.3.6.1.4.1.61026.1.1.{patient_id}`

**Example**:
```
1.3.6.1.4.1.61026.1.1.PAT-20260217-abc123
```

**Sub-branches**:
- `1.3.6.1.4.1.61026.1.1.{patient_id}.1` - Medical records
- `1.3.6.1.4.1.61026.1.1.{patient_id}.2` - Lab results
- `1.3.6.1.4.1.61026.1.1.{patient_id}.3` - Imaging studies
- `1.3.6.1.4.1.61026.1.1.{patient_id}.4` - Prescriptions

### 1.2 Providers (Doctors)

**OID Pattern**: `1.3.6.1.4.1.61026.1.2.{doctor_id}`

**Example**:
```
1.3.6.1.4.1.61026.1.2.DOC-123
```

**Metadata**:
- DID Mapping: `did:brainsait:doctor:{doctor_id}`
- X.509 Certificate OID: Same as provider OID
- Public Key: Stored in did_oid_mapping

### 1.3 Facilities

**OID Pattern**: `1.3.6.1.4.1.61026.1.3.{facility_id}`

**Example**:
```
1.3.6.1.4.1.61026.1.3.FAC-RYD-001
```

**Sub-branches**:
- `1.3.6.1.4.1.61026.1.3.{facility_id}.1` - Departments
- `1.3.6.1.4.1.61026.1.3.{facility_id}.2` - Equipment
- `1.3.6.1.4.1.61026.1.3.{facility_id}.3` - Rooms

### 1.4 Appointments

**OID Pattern**: `1.3.6.1.4.1.61026.1.4.{appointment_id}`

**Example**:
```
1.3.6.1.4.1.61026.1.4.APT-20260218-xyz789
```

### 1.5 Triage Records

**OID Pattern**: `1.3.6.1.4.1.61026.1.5.{triage_id}`

**Example**:
```
1.3.6.1.4.1.61026.1.5.TRI-20260217-voice-001
```

### 1.6 Vitals

**OID Pattern**: `1.3.6.1.4.1.61026.1.6.{vitals_id}`

**Sub-branches** (Vital Sign Types):
- `1.3.6.1.4.1.61026.1.6.{vitals_id}.1` - Temperature
- `1.3.6.1.4.1.61026.1.6.{vitals_id}.2` - Blood Pressure
- `1.3.6.1.4.1.61026.1.6.{vitals_id}.3` - Heart Rate
- `1.3.6.1.4.1.61026.1.6.{vitals_id}.4` - Oxygen Saturation
- `1.3.6.1.4.1.61026.1.6.{vitals_id}.5` - Weight
- `1.3.6.1.4.1.61026.1.6.{vitals_id}.6` - BMI

### 1.7 Exam Findings

**OID Pattern**: `1.3.6.1.4.1.61026.1.7.{exam_id}`

### 1.8 Clinical Documentation

**OID Pattern**: `1.3.6.1.4.1.61026.1.8.{document_id}`

**Sub-branches** (Document Types):
- `1.3.6.1.4.1.61026.1.8.{document_id}.1` - SOAP Notes
- `1.3.6.1.4.1.61026.1.8.{document_id}.2` - Progress Notes
- `1.3.6.1.4.1.61026.1.8.{document_id}.3` - Discharge Summaries
- `1.3.6.1.4.1.61026.1.8.{document_id}.4` - Prescriptions
- `1.3.6.1.4.1.61026.1.8.{document_id}.5` - Lab Orders
- `1.3.6.1.4.1.61026.1.8.{document_id}.6` - Referrals

### 1.9 Emergency Flags

**OID Pattern**: `1.3.6.1.4.1.61026.1.9.{emergency_id}`

### 1.10 Follow-ups

**OID Pattern**: `1.3.6.1.4.1.61026.1.10.{followup_id}`

### 1.11 Templates

**OID Pattern**: `1.3.6.1.4.1.61026.1.11.{template_id}`

### 1.12 Tasks

**OID Pattern**: `1.3.6.1.4.1.61026.1.12.{task_id}`

### 1.13 Voice Transcriptions

**OID Pattern**: `1.3.6.1.4.1.61026.1.13.{voice_id}`

### 1.14 Endorsements

**OID Pattern**: `1.3.6.1.4.1.61026.1.14.{endorsement_id}`

### 1.15 Handovers

**OID Pattern**: `1.3.6.1.4.1.61026.1.15.{handover_id}`

---

## Devices Branch

**Base OID**: `1.3.6.1.4.1.61026.2` (devices)

### 2.1 Vital Monitors

**OID Pattern**: `1.3.6.1.4.1.61026.2.1.{device_id}`

**Example**:
```
1.3.6.1.4.1.61026.2.1.VM-FAC001-ROOM203
```

### 2.2 ESP32 QR Code Scanners

**OID Pattern**: `1.3.6.1.4.1.61026.2.2.{device_id}`

**Example**:
```
1.3.6.1.4.1.61026.2.2.ESP32-QR-001
```

**IoT Integration**:
- Device authenticates using certificate with this OID
- Heartbeat endpoint: `/api/devices/{oid}/heartbeat`
- Data validation against OID registry

### 2.3 Tablets

**OID Pattern**: `1.3.6.1.4.1.61026.2.3.{device_id}`

### 2.4 Workstations

**OID Pattern**: `1.3.6.1.4.1.61026.2.4.{device_id}`

### 2.5 IoT Sensors

**OID Pattern**: `1.3.6.1.4.1.61026.2.5.{sensor_id}`

### 2.6 Medical Equipment

**OID Pattern**: `1.3.6.1.4.1.61026.2.6.{equipment_id}`

---

## Services Branch

**Base OID**: `1.3.6.1.4.1.61026.3` (services)

### 3.1 OID Registry Service

**OID**: `1.3.6.1.4.1.61026.3.1`

**Function**: Central OID generation and resolution service

### 3.2 DID Registry Service

**OID**: `1.3.6.1.4.1.61026.3.2`

**Function**: DID creation, resolution, and revocation

### 3.3 AI Orchestration

**OID**: `1.3.6.1.4.1.61026.3.3`

**Sub-services**:
- `1.3.6.1.4.1.61026.3.3.1` - Patient AI Services
- `1.3.6.1.4.1.61026.3.3.2` - Doctor AI Services
- `1.3.6.1.4.1.61026.3.3.3` - Admin AI Services
- `1.3.6.1.4.1.61026.3.3.4` - Analytics AI

### 3.4 MasterLinc Orchestrator

**OID**: `1.3.6.1.4.1.61026.3.4`

### 3.5 MasterLinc Coordinator

**OID**: `1.3.6.1.4.1.61026.3.5`

### 3.6 Analytics Service

**OID**: `1.3.6.1.4.1.61026.3.6`

---

## Audit and Compliance

**Base OID**: `1.3.6.1.4.1.61026.4` (audit)

### 4.1 Audit Trail

**OID Pattern**: `1.3.6.1.4.1.61026.4.1.{audit_id}`

**Example**:
```
1.3.6.1.4.1.61026.4.1.AUD-20260217-143052-abc
```

### 4.2 Compliance Flags

**OID Pattern**: `1.3.6.1.4.1.61026.4.2.{compliance_id}`

**Types**:
- `1.3.6.1.4.1.61026.4.2.1` - HIPAA Compliance
- `1.3.6.1.4.1.61026.4.2.2` - NPHIES Compliance
- `1.3.6.1.4.1.61026.4.2.3` - GDPR Compliance

### 4.3 Data Provenance

**OID Pattern**: `1.3.6.1.4.1.61026.4.3.{provenance_id}`

---

## Claims Branch

**Base OID**: `1.3.6.1.4.1.61026.5` (claims)

### 5.1 SBS Claims

**OID Pattern**: `1.3.6.1.4.1.61026.5.1.{claim_id}`

### 5.2 NPHIES Claims

**OID Pattern**: `1.3.6.1.4.1.61026.5.2.{nphies_claim_id}`

### 5.3 Payments

**OID Pattern**: `1.3.6.1.4.1.61026.5.3.{payment_id}`

---

## Imaging Branch

**Base OID**: `1.3.6.1.4.1.61026.6` (imaging)

### 6.1 PACS

**OID**: `1.3.6.1.4.1.61026.6.1`

### 6.2 DICOM Studies

**OID Pattern**: `1.3.6.1.4.1.61026.6.2.{study_id}`

---

## OID Generation Rules

### Format

All OIDs follow this pattern:
```
1.3.6.1.4.1.61026.{branch}.{sub_branch}.{entity_id}
```

### Entity ID Format

**Standard Format**: `{TYPE}-{TIMESTAMP}-{RANDOM}`

**Examples**:
- Patient: `PAT-20260217-abc123`
- Doctor: `DOC-123`
- Appointment: `APT-20260218-xyz789`
- Device: `ESP32-QR-001`

### Timestamp Format

- **Pattern**: `YYYYMMDD` or `YYYYMMDDHHmmss`
- **Example**: `20260217` or `20260217143052`

### Random Component

- **Length**: 6-9 alphanumeric characters
- **Charset**: a-z, 0-9 (lowercase)
- **Example**: `abc123`, `xyz789abc`

---

## Registry Management

### OID Registry Service API

**Base URL**: `https://oid-registry.masterlinc.health`

#### Register OID

**POST /api/oid/register**

```json
{
  "oid": "1.3.6.1.4.1.61026.1.1.PAT-001",
  "entity_type": "patient",
  "entity_id": "PAT-001",
  "metadata": {
    "name": "Patient Name",
    "created_at": "2026-02-17T14:00:00Z"
  }
}
```

#### Resolve OID

**GET /api/oid/resolve/:oid**

**Response**:
```json
{
  "oid": "1.3.6.1.4.1.61026.1.1.PAT-001",
  "entity_type": "patient",
  "entity_id": "PAT-001",
  "metadata": {...},
  "status": "active",
  "created_at": "2026-02-17T14:00:00Z"
}
```

### Caching Strategy

- **Redis Cache**: 1-hour TTL for active OIDs
- **PostgreSQL**: Persistent storage
- **Rate Limiting**: 100 req/min per IP

---

## Integration with ISO/IEC 61026

While our PEN is 61026, it's important to note the distinction from ISO/IEC 61026 (Medical Device Software - Software Lifecycle Processes).

### Compliance Mapping

Our OID hierarchy supports compliance with:
- **ISO 13485**: Medical device quality management
- **IEC 62304**: Medical device software lifecycle
- **ISO/HL7 27931**: Data exchange standards
- **ISO 22077**: Medical waveform encoding

### Traceability

Every OID in our system enables:
- ✅ End-to-end traceability
- ✅ Provenance tracking
- ✅ Audit trail linkage
- ✅ HIPAA compliance
- ✅ NPHIES integration

---

## X.509 Certificate Integration

### Certificate Subject DN

```
CN=did:brainsait:doctor:DOC-123
OU=Healthcare Providers
O=BrainSAIT Medical Imaging
C=SA
```

### Certificate OID Extensions

**Subject Alternative Name** (SAN):
- `uniformResourceIdentifier`: `did:brainsait:doctor:DOC-123`
- `otherName.registeredID`: `1.3.6.1.4.1.61026.1.2.DOC-123`

### Certificate Policies

**OID**: `1.3.6.1.4.1.61026.7.1` (Certificate Policy)

**Types**:
- `1.3.6.1.4.1.61026.7.1.1` - Doctor Authentication
- `1.3.6.1.4.1.61026.7.1.2` - Document Signing
- `1.3.6.1.4.1.61026.7.1.3` - Device Authentication

---

## MCP Integration

For ESP32-QR and IoT devices, MCP (Model Context Protocol) server integration:

### Device Registration

1. Generate OID: `1.3.6.1.4.1.61026.2.2.{device_id}`
2. Issue X.509 certificate with OID in SAN
3. Register in device_registry table
4. Configure MCP server endpoint

### QR Code Content

```json
{
  "oid": "1.3.6.1.4.1.61026.2.2.ESP32-QR-001",
  "facility_oid": "1.3.6.1.4.1.61026.1.3.FAC-RYD-001",
  "device_type": "esp32_qr",
  "public_key": "base58_encoded_key",
  "verify_url": "https://oid-registry.masterlinc.health/verify"
}
```

---

## Summary

This OID hierarchy provides:
- ✅ **Global Uniqueness**: Based on IANA PEN 61026
- ✅ **Hierarchical Organization**: Logical grouping of entities
- ✅ **Traceability**: Full audit and provenance tracking
- ✅ **Standards Compliance**: FHIR, HL7, ISO/IEC integration
- ✅ **Security**: DID integration for authentication
- ✅ **Scalability**: Extensible structure for future growth

All OIDs are registered, cached, and validated through the central OID Registry Service.
