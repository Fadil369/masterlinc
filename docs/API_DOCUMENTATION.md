# BrainSAIT Enterprise Healthcare Platform - API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [OID Registry API](#oid-registry-api)
- [DID Registry API](#did-registry-api)
- [Healthcare API](#healthcare-api)
- [AI Orchestrator API](#ai-orchestrator-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The BrainSAIT Healthcare Platform provides a comprehensive suite of REST APIs for healthcare operations with full OID (Object Identifier) and DID (Decentralized Identifier) integration.

### Base URLs
- **OID Registry**: `http://localhost:3001`
- **DID Registry**: `http://localhost:3002`
- **Healthcare API**: `http://localhost:3003`
- **AI Orchestrator**: `http://localhost:3004`

### Common Headers
```http
Content-Type: application/json
X-Request-ID: <unique-request-id>
X-OID: <service-oid>
X-DID: <user-did>
```

---

## OID Registry API

### Register OID
Creates a new OID in the registry.

**Endpoint**: `POST /api/oid/register`

**Request Body**:
```json
{
  "branch": "6.1",
  "serviceName": "Patient Registration",
  "serviceType": "patient",
  "description": "Patient registration service",
  "metadata": {
    "customField": "value"
  }
}
```

**Response**:
```json
{
  "success": true,
  "oid": "1.3.6.1.4.1.61026.6.1.1234567890",
  "data": {
    "oid": "1.3.6.1.4.1.61026.6.1.1234567890",
    "oid_branch": "6.1",
    "service_name": "Patient Registration",
    "service_type": "patient",
    "created_at": "2026-02-17T19:00:00.000Z"
  }
}
```

### Resolve OID
Retrieves metadata for an OID.

**Endpoint**: `GET /api/oid/resolve/:oid`

**Response**:
```json
{
  "success": true,
  "data": {
    "oid": "1.3.6.1.4.1.61026.6.1.1234567890",
    "service_name": "Patient Registration",
    "metadata": {},
    "is_active": true
  },
  "source": "cache"
}
```

### Generate FHIR Code
Generates FHIR-compliant identifier code for an OID.

**Endpoint**: `POST /api/oid/generate-fhir`

**Request Body**:
```json
{
  "oid": "1.3.6.1.4.1.61026.6.1.123",
  "resourceType": "Identifier"
}
```

**Response**:
```json
{
  "success": true,
  "fhir": {
    "resourceType": "Identifier",
    "system": "urn:oid:1.3.6.1.4.1.61026.6.1.123",
    "value": "1.3.6.1.4.1.61026.6.1.123",
    "type": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code": "OID",
        "display": "Object Identifier"
      }]
    }
  }
}
```

### Generate QR Code
Generates a QR code for an OID (for IoT devices).

**Endpoint**: `POST /api/oid/generate-qr`

**Request Body**:
```json
{
  "oid": "1.3.6.1.4.1.61026.4.3.1.device-id",
  "assetName": "Blood Pressure Monitor",
  "location": "Ward A",
  "metadata": {
    "type": "medical_device"
  }
}
```

**Response**:
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "data": {
    "oid": "1.3.6.1.4.1.61026.4.3.1.device-id",
    "pen": "61026",
    "asset": "Blood Pressure Monitor",
    "location": "Ward A",
    "type": "medical_device"
  }
}
```

### Validate OID
Validates an OID format and checks registry.

**Endpoint**: `POST /api/oid/validate`

**Request Body**:
```json
{
  "oid": "1.3.6.1.4.1.61026.6.1.123"
}
```

**Response**:
```json
{
  "success": true,
  "validation": {
    "isValidFormat": true,
    "isOurOID": true,
    "existsInRegistry": true,
    "metadata": {}
  }
}
```

### Register Asset
Registers an IoT device or asset with OID and QR code.

**Endpoint**: `POST /api/oid/register-asset`

**Request Body**:
```json
{
  "assetName": "BP Monitor #1",
  "assetType": "medical_device",
  "location": "Ward A",
  "manufacturer": "MedTech Inc",
  "model": "BP-2000",
  "serialNumber": "SN123456"
}
```

**Response**:
```json
{
  "success": true,
  "oid": "1.3.6.1.4.1.61026.4.3.uuid",
  "assetId": "uuid",
  "qrCode": "data:image/png;base64,...",
  "data": {}
}
```

---

## DID Registry API

### Create Doctor DID
Creates a decentralized identifier for a doctor.

**Endpoint**: `POST /api/did/doctor/create`

**Request Body**:
```json
{
  "licenseNumber": "DOC-12345",
  "region": "SA-01",
  "specialty": "Cardiology",
  "fullName": "Dr. Ahmed Al-Saud",
  "phone": "+966501234567",
  "email": "ahmed@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "did": "did:brainsait:doctors:dr-DOC-12345",
  "didDocument": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:brainsait:doctors:dr-DOC-12345",
    "verificationMethod": [{
      "id": "did:brainsait:doctors:dr-DOC-12345#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:brainsait:doctors:dr-DOC-12345",
      "publicKeyMultibase": "z6MkhaXg..."
    }],
    "authentication": ["did:brainsait:doctors:dr-DOC-12345#key-1"]
  },
  "oid": "1.3.6.1.4.1.61026.2.1.1.dr-DOC-12345",
  "publicKey": "z6MkhaXg..."
}
```

### Issue Verifiable Credential
Issues a verifiable credential for a doctor.

**Endpoint**: `POST /api/did/credential/issue`

**Request Body**:
```json
{
  "doctorDid": "did:brainsait:doctors:dr-DOC-12345",
  "credentialType": "MedicalLicense",
  "issuerDid": "did:brainsait:org:medical-board",
  "issuerName": "Saudi Medical Board",
  "credentialData": {
    "licenseNumber": "DOC-12345",
    "specialty": "Cardiology",
    "issueDate": "2020-01-01",
    "expiryDate": "2025-01-01"
  },
  "expiresInDays": 1825
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "MedicalLicense"],
    "issuer": "did:brainsait:org:medical-board",
    "issuanceDate": "2026-02-17T19:00:00.000Z",
    "credentialSubject": {
      "id": "did:brainsait:doctors:dr-DOC-12345",
      "licenseNumber": "DOC-12345",
      "specialty": "Cardiology"
    }
  },
  "vcId": "uuid"
}
```

### Verify Credential
Verifies a verifiable credential.

**Endpoint**: `POST /api/did/credential/verify`

**Request Body**:
```json
{
  "vcId": "credential-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "verification": {
    "isValid": true,
    "isActive": true,
    "isNotExpired": true,
    "status": "active",
    "expiresAt": "2030-01-01T00:00:00.000Z"
  }
}
```

### Revoke Credential
Revokes a verifiable credential.

**Endpoint**: `POST /api/did/credential/revoke`

**Request Body**:
```json
{
  "vcId": "credential-uuid",
  "reason": "License suspended"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Credential revoked",
  "reason": "License suspended"
}
```

### Resolve DID
Resolves a DID to its document.

**Endpoint**: `GET /api/did/resolve/:did`

**Response**:
```json
{
  "success": true,
  "didDocument": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:brainsait:doctors:dr-DOC-12345",
    "verificationMethod": []
  },
  "source": "database"
}
```

### Create Digital Signature
Creates a digital signature for a document.

**Endpoint**: `POST /api/did/sign`

**Request Body**:
```json
{
  "did": "did:brainsait:doctors:dr-DOC-12345",
  "documentHash": "sha256-hash-of-document",
  "documentType": "progress_note"
}
```

**Response**:
```json
{
  "success": true,
  "signature": {
    "type": "Ed25519Signature2020",
    "created": "2026-02-17T19:00:00.000Z",
    "verificationMethod": "did:brainsait:doctors:dr-DOC-12345#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "base64-signature"
  },
  "documentType": "progress_note",
  "signer": "did:brainsait:doctors:dr-DOC-12345"
}
```

---

## Healthcare API

### Register Patient
Registers a new patient with OID generation.

**Endpoint**: `POST /api/patients/register`

**Request Body**:
```json
{
  "nationalId": "1234567890",
  "fullName": "Sarah Al-Qahtani",
  "fullNameAr": "سارة القحطاني",
  "dob": "1990-05-15",
  "gender": "female",
  "phone": "+966501234567",
  "email": "sarah@example.com",
  "emergencyContact": "+966509876543",
  "preferredLanguage": "ar",
  "biometricId": "fingerprint-hash"
}
```

**Response**:
```json
{
  "success": true,
  "patient": {
    "patient_id": "uuid",
    "national_id": "1234567890",
    "oid_identifier": "1.3.6.1.4.1.61026.6.1.timestamp",
    "full_name": "Sarah Al-Qahtani",
    "phone": "+966501234567"
  },
  "oid": "1.3.6.1.4.1.61026.6.1.timestamp"
}
```

### Search Patient
Searches for a patient by phone, national ID, or patient ID.

**Endpoint**: `GET /api/patients/search?phone=+966501234567`

**Response**:
```json
{
  "success": true,
  "patient": {
    "patient_id": "uuid",
    "full_name": "Sarah Al-Qahtani",
    "oid_identifier": "1.3.6.1.4.1.61026.6.1.timestamp"
  }
}
```

### Assess Triage
Performs AI-powered triage assessment.

**Endpoint**: `POST /api/triage/assess`

**Request Body**:
```json
{
  "patientId": "patient-uuid",
  "chiefComplaint": "chest pain and shortness of breath",
  "symptoms": ["chest pain", "shortness of breath", "sweating"],
  "voiceTranscript": "I have chest pain...",
  "language": "en",
  "appointmentId": "appointment-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "triage": {
    "triage_id": "uuid",
    "severity": "critical",
    "emergency_flag": true,
    "triage_score": 5,
    "oid_identifier": "1.3.6.1.4.1.61026.6.3.timestamp"
  },
  "oid": "1.3.6.1.4.1.61026.6.3.timestamp",
  "recommendations": {
    "priority": "critical",
    "recommendedDepartment": "Emergency",
    "estimatedWaitTime": 0,
    "alertProvider": true
  }
}
```

### Record Vitals
Records patient vital signs.

**Endpoint**: `POST /api/vitals/record`

**Request Body**:
```json
{
  "patientId": "patient-uuid",
  "appointmentId": "appointment-uuid",
  "temperature": 37.2,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 75,
  "respiratoryRate": 16,
  "oxygenSaturation": 98,
  "weight": 70.5,
  "height": 170,
  "captureMethod": "voice",
  "deviceOid": "1.3.6.1.4.1.61026.4.3.1.device",
  "voiceTranscript": "Temperature is 37.2..."
}
```

**Response**:
```json
{
  "success": true,
  "vitals": {
    "vital_id": "uuid",
    "temperature": 37.2,
    "blood_pressure_systolic": 120,
    "bmi": 24.39,
    "oid_identifier": "1.3.6.1.4.1.61026.6.4.timestamp"
  },
  "oid": "1.3.6.1.4.1.61026.6.4.timestamp"
}
```

### Book Appointment
Books an appointment for a patient.

**Endpoint**: `POST /api/appointments/book`

**Request Body**:
```json
{
  "patientId": "patient-uuid",
  "providerId": "doctor-uuid",
  "appointmentDate": "2026-02-20T10:00:00Z",
  "appointmentType": "consultation",
  "triageLevel": "medium"
}
```

**Response**:
```json
{
  "success": true,
  "appointment": {
    "appointment_id": "uuid",
    "patient_id": "patient-uuid",
    "appointment_date": "2026-02-20T10:00:00Z",
    "status": "scheduled"
  },
  "oid": "1.3.6.1.4.1.61026.6.2.timestamp"
}
```

### Create Clinical Documentation
Creates clinical documentation with voice support.

**Endpoint**: `POST /api/documentation/create`

**Request Body**:
```json
{
  "patientId": "patient-uuid",
  "appointmentId": "appointment-uuid",
  "documentType": "progress_note",
  "content": "Patient presents with...",
  "voiceTranscript": "Patient presents with chest pain...",
  "language": "en",
  "authorDid": "did:brainsait:doctors:dr-123",
  "templateId": "template-uuid",
  "structuredData": {
    "icdCodes": ["I20.0"],
    "medications": ["Aspirin 81mg"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "document_id": "uuid",
    "document_type": "progress_note",
    "status": "draft",
    "oid_identifier": "1.3.6.1.4.1.61026.6.9.timestamp"
  },
  "oid": "1.3.6.1.4.1.61026.6.9.timestamp"
}
```

### Sign Document
Signs a document with doctor's DID.

**Endpoint**: `POST /api/documentation/:id/sign`

**Request Body**:
```json
{
  "doctorDid": "did:brainsait:doctors:dr-DOC-12345"
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "document_id": "uuid",
    "status": "signed",
    "digital_signature": "{signature-object}"
  },
  "signature": {
    "type": "Ed25519Signature2020",
    "proofValue": "base64-signature"
  }
}
```

---

## AI Orchestrator API

### Patient Coaching Agent
Provides AI-powered patient coaching (EN/AR).

**Endpoint**: `POST /api/ai/patient-coaching`

**Request Body**:
```json
{
  "patientId": "patient-uuid",
  "userDid": "did:brainsait:patients:pt-123",
  "inputText": "I have a headache",
  "language": "en",
  "context": {
    "previousSymptoms": [],
    "medications": []
  },
  "sessionId": "session-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "response": "I understand you are experiencing a headache. Can you describe the severity and location?",
  "confidence": 0.85,
  "recommendations": [
    "Schedule appointment",
    "Monitor symptoms",
    "Stay hydrated"
  ],
  "oid": "1.3.6.1.4.1.61026.7.1.timestamp"
}
```

### Clinical Reasoning Agent
Provides AI clinical decision support for doctors.

**Endpoint**: `POST /api/ai/clinical-reasoning`

**Request Body**:
```json
{
  "doctorDid": "did:brainsait:doctors:dr-123",
  "patientId": "patient-uuid",
  "symptoms": ["chest pain", "shortness of breath"],
  "vitals": {
    "bp": "140/90",
    "hr": 95
  },
  "history": {
    "conditions": ["hypertension"],
    "medications": ["lisinopril"]
  },
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "reasoning": {
    "summary": "Preliminary assessment suggests cardiovascular investigation needed",
    "urgency": "High",
    "confidenceLevel": "Moderate"
  },
  "differentialDiagnosis": [
    {
      "condition": "Acute Coronary Syndrome",
      "probability": 0.35,
      "reasoning": "Classic presentation with risk factors"
    }
  ],
  "recommendedTests": [
    "ECG",
    "Troponin levels",
    "Chest X-Ray"
  ],
  "confidence": 0.78,
  "oid": "1.3.6.1.4.1.61026.7.2.timestamp"
}
```

### Admin Operations Agent
Provides AI administrative support.

**Endpoint**: `POST /api/ai/admin-ops`

**Request Body**:
```json
{
  "requestType": "schedule_optimization",
  "data": {
    "department": "Cardiology",
    "timeRange": "next_week"
  },
  "language": "en",
  "userDid": "did:brainsait:admin:admin-123"
}
```

**Response**:
```json
{
  "success": true,
  "response": {
    "status": "processed",
    "message": "Schedule optimization has been analyzed",
    "estimatedCompletionTime": "2-4 hours"
  },
  "actions": [
    {
      "action": "Analyze current bookings",
      "status": "completed"
    },
    {
      "action": "Generate optimization plan",
      "status": "pending"
    }
  ],
  "confidence": 0.92,
  "oid": "1.3.6.1.4.1.61026.7.3.timestamp"
}
```

### Research Analytics Agent
Provides research and data analytics.

**Endpoint**: `POST /api/ai/research-analytics`

**Request Body**:
```json
{
  "query": "cardiovascular disease trends",
  "dataScope": "2023-2024",
  "filters": {
    "ageRange": "40-60",
    "gender": "all"
  },
  "userDid": "did:brainsait:researcher:res-123"
}
```

**Response**:
```json
{
  "success": true,
  "analytics": {
    "totalRecords": 1247,
    "matchingCriteria": 342,
    "topFindings": [
      "35% increase in diagnoses",
      "Correlation with lifestyle factors"
    ]
  },
  "insights": [
    "Seasonal patterns detected",
    "Age group most affected: 50-55"
  ],
  "confidence": 0.88,
  "oid": "1.3.6.1.4.1.61026.7.4.timestamp"
}
```

### System Health Monitoring
Monitors overall system health.

**Endpoint**: `GET /api/ai/system-health`

**Response**:
```json
{
  "success": true,
  "health": {
    "overall": "healthy",
    "services": {
      "oidRegistry": "operational",
      "didRegistry": "operational",
      "healthcareApi": "operational"
    },
    "metrics": {
      "uptime": "99.9%",
      "responseTime": "45ms",
      "activeUsers": 127,
      "apiCalls24h": 15234
    },
    "alerts": [],
    "recommendations": ["System operating normally"]
  },
  "oid": "1.3.6.1.4.1.61026.7.5.timestamp"
}
```

### AI Explainability
Provides explanation for AI decisions.

**Endpoint**: `POST /api/ai/explain`

**Request Body**:
```json
{
  "interactionId": "interaction-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "explanation": {
    "interactionId": "interaction-uuid",
    "agentType": "clinical_reasoning",
    "explanation": "Analysis based on symptom patterns and clinical guidelines",
    "factorsConsidered": [
      "Symptom severity",
      "Patient history",
      "Clinical protocols"
    ],
    "confidence": 0.85,
    "biasDetection": {
      "detected": false,
      "risks": [],
      "mitigation": "Regular bias audits conducted"
    }
  }
}
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Rate limits are applied per IP address:
- **Development**: 100 requests/minute
- **Production**: 1000 requests/minute

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1708200000
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page` - Page number (default: 1)
- `perPage` - Results per page (default: 30, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "total": 150,
    "pages": 5
  }
}
```

---

## Webhooks

The platform supports webhooks for real-time notifications:

### Event Types
- `patient.registered`
- `appointment.booked`
- `triage.critical`
- `document.signed`
- `credential.issued`

### Webhook Payload
```json
{
  "event": "triage.critical",
  "timestamp": "2026-02-17T19:00:00.000Z",
  "data": {
    "triageId": "uuid",
    "patientId": "uuid",
    "severity": "critical"
  },
  "oid": "1.3.6.1.4.1.61026.6.3.timestamp"
}
```

---

For more information, see the [Developer Guide](DEVELOPER_GUIDE.md) and [Compliance Documentation](COMPLIANCE.md).
