# MasterLinc Healthcare Enhancement API Documentation

## Overview

This document provides comprehensive API documentation for the MasterLinc Healthcare Enhancement system with DID/OID integration, AI orchestration, and multi-language support (EN/AR).

**Base URL**: `https://api.masterlinc.health`  
**Version**: 1.0.0  
**Authentication**: DID-based authentication with JWT tokens

---

## Table of Contents

1. [Authentication](#authentication)
2. [Doctor Workspace APIs](#doctor-workspace-apis)
3. [Endorsements & Handovers APIs](#endorsements--handovers-apis)
4. [Bsma Patient Voice Workflow APIs](#bsma-patient-voice-workflow-apis)
5. [DID/OID Integration APIs](#didoid-integration-apis)
6. [AI Orchestration APIs](#ai-orchestration-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication using DID-based tokens.

### POST /api/did/authenticate

Authenticate using DID and digital signature.

**Request Body**:
```json
{
  "did": "did:brainsait:doctor:DOC123",
  "challenge": "random_challenge_string",
  "signature": "ed25519_signature",
  "public_key": "base58_encoded_public_key"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "did": "did:brainsait:doctor:DOC123",
    "expires_in": 3600
  }
}
```

**Headers for Authenticated Requests**:
```
Authorization: Bearer <jwt_token>
X-Doctor-DID: did:brainsait:doctor:DOC123
X-Doctor-OID: 1.3.6.1.4.1.61026.healthcare.providers.DOC123
```

---

## Doctor Workspace APIs

### Template Library

#### GET /api/doctors/workspace/templates

List all templates with filtering.

**Query Parameters**:
- `category` (optional): Template category (soap_note, prescription, etc.)
- `specialty` (optional): Filter by specialty
- `language` (optional): en, ar, or both
- `is_public` (optional): true/false
- `status` (optional): active, archived, deprecated
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "TPL-001",
        "oid": "1.3.6.1.4.1.61026.healthcare.templates.TPL-001",
        "name": "General Consultation SOAP Note",
        "name_ar": "ملاحظات استشارة عامة",
        "category": "soap_note",
        "language": "both",
        "usage_count": 142,
        "rating": 4.7
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### POST /api/doctors/workspace/templates

Create a new template.

**Request Body**:
```json
{
  "name": "Diabetes Follow-up Template",
  "name_ar": "قالب متابعة السكري",
  "category": "progress_note",
  "specialty": "endocrinology",
  "language": "both",
  "template_content": "## Subjective\n...",
  "template_content_ar": "## الشكوى\n...",
  "variables": [
    {
      "name": "hba1c_level",
      "type": "number",
      "label": "HbA1c Level",
      "required": true
    }
  ],
  "tags": ["diabetes", "chronic_disease"]
}
```

**Response**: `201 Created` with template object

### Task Management

#### GET /api/doctors/workspace/tasks

Get doctor's tasks with filtering.

**Query Parameters**:
- `status`: pending, in_progress, completed, cancelled
- `priority`: low, medium, high, urgent
- `task_type`: review_labs, follow_up_call, etc.
- `patient_oid`: Filter by patient
- `page`, `limit`: Pagination

**Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "TASK-001",
        "oid": "1.3.6.1.4.1.61026.healthcare.tasks.TASK-001",
        "title": "Review lab results for Patient A",
        "task_type": "review_labs",
        "priority": "high",
        "status": "pending",
        "due_date": "2026-02-18T10:00:00Z",
        "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001"
      }
    ],
    "summary": {
      "pending": 12,
      "in_progress": 3,
      "completed": 45,
      "urgent": 2
    }
  }
}
```

#### POST /api/doctors/workspace/tasks

Create a new task.

**Request Body**:
```json
{
  "task_type": "follow_up_call",
  "title": "Call patient regarding test results",
  "title_ar": "الاتصال بالمريض بشأن نتائج الاختبار",
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "priority": "medium",
  "due_date": "2026-02-20T14:00:00Z"
}
```

### Voice-to-Text

#### POST /api/doctors/workspace/voice/transcribe

Transcribe voice recording to text (EN/AR).

**Request Body**:
```json
{
  "audio_url": "https://storage.example.com/audio/voice-123.mp3",
  "language": "ar",
  "context_type": "clinical_note",
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "appointment_oid": "1.3.6.1.4.1.61026.healthcare.appointments.APT-001"
}
```

**Response**: `202 Accepted` (async processing)

---

## Endorsements & Handovers APIs

### Endorsements

#### POST /api/endorsements

Create patient endorsement (feedback/rating).

**Request Body**:
```json
{
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "doctor_oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-001",
  "appointment_oid": "1.3.6.1.4.1.61026.healthcare.appointments.APT-001",
  "rating": 5,
  "feedback_text": "Excellent care and communication",
  "feedback_text_ar": "رعاية ممتازة وتواصل جيد",
  "feedback_voice_url": "https://storage.example.com/feedback-voice.mp3",
  "language": "ar",
  "categories": ["bedside_manner", "expertise", "communication"],
  "consent_for_display": true,
  "consent_for_sharing": true
}
```

**Response**: `201 Created`

#### GET /api/endorsements/doctor/:doctor_oid

Get endorsements for a specific doctor.

**Response**:
```json
{
  "success": true,
  "data": {
    "endorsements": [...],
    "summary": {
      "total_endorsements": 248,
      "average_rating": 4.6,
      "rating_distribution": {
        "5": 180,
        "4": 52,
        "3": 12,
        "2": 3,
        "1": 1
      }
    }
  }
}
```

### Handovers

#### POST /api/handovers

Create handover session.

**Request Body**:
```json
{
  "from_doctor_oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-001",
  "to_doctor_oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-002",
  "shift_type": "day_to_night",
  "handover_time": "2026-02-17T20:00:00Z",
  "voice_brief_url": "https://storage.example.com/handover-brief.mp3",
  "critical_patients": [
    {
      "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-005",
      "patient_name": "John Doe",
      "condition": "Post-op day 1, abdominal surgery",
      "critical_details": "Monitoring for bleeding and infection",
      "required_actions": ["Check vitals q4h", "Pain management", "Monitor drain output"]
    }
  ],
  "urgent_items": [
    {
      "type": "test_result",
      "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-003",
      "description": "Awaiting troponin levels",
      "action_required": "Call cardiologist if elevated"
    }
  ]
}
```

**Response**: `201 Created`

#### PUT /api/handovers/:id/acknowledge

Receiving doctor acknowledges handover.

**Request Body**:
```json
{
  "signature": "did:brainsait:doctor:DOC-002#signature"
}
```

**Headers**: `X-Doctor-DID: did:brainsait:doctor:DOC-002`

---

## Bsma Patient Voice Workflow APIs

### Patient Registration

#### POST /api/bsma/patients/register

Register patient via voice (EN/AR).

**Request Body**:
```json
{
  "name": "محمد أحمد",
  "name_ar": "محمد أحمد",
  "date_of_birth": "1985-05-15",
  "gender": "male",
  "phone": "+966501234567",
  "email": "mohammed@example.com",
  "language_preference": "ar",
  "national_id": "1234567890",
  "voice_recording_url": "https://storage.example.com/registration-voice.mp3"
}
```

**Response**: `201 Created` with patient object

#### GET /api/bsma/patients/phone/:phone

Get patient by phone number.

**Query**: `?language=ar`

### Appointment Booking

#### POST /api/bsma/appointments/book

Book appointment via voice.

**Request Body**:
```json
{
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "facility_oid": "1.3.6.1.4.1.61026.healthcare.facilities.FAC-001",
  "scheduled_start": "2026-02-18T10:00:00Z",
  "chief_complaint": "صداع شديد منذ يومين",
  "chief_complaint_ar": "صداع شديد منذ يومين",
  "language": "ar",
  "voice_recording_url": "https://storage.example.com/booking-voice.mp3"
}
```

**Response**: `201 Created` - "تم حجز الموعد بنجاح"

### Triage

#### POST /api/bsma/triage

Voice triage with AI classification.

**Request Body**:
```json
{
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "language": "ar",
  "audio_url": "https://storage.example.com/triage-voice.mp3",
  "transcript": "أعاني من ألم شديد في الصدر منذ ساعة",
  "chief_complaint": "ألم في الصدر",
  "symptoms": ["chest_pain", "shortness_of_breath"],
  "pain_level": 8,
  "duration_days": 0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "TRI-001",
    "severity": "critical",
    "ai_classification": {
      "urgency_score": 95,
      "recommended_specialty": "cardiology",
      "red_flags": ["chest_pain", "cardiac_risk"],
      "confidence": 0.92
    }
  },
  "message": "حالة طارئة - سيتم توجيهك فوراً",
  "next_steps": "Emergency routing"
}
```

### Emergency Flags

#### POST /api/bsma/emergency

Create emergency flag with real-time routing.

**Request Body**:
```json
{
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "severity": "critical",
  "flag_type": "chest_pain",
  "description": "Severe chest pain radiating to left arm",
  "description_ar": "ألم شديد في الصدر ينتشر إلى الذراع الأيسر",
  "voice_recording_url": "https://storage.example.com/emergency-voice.mp3",
  "location": "Home, Building 5",
  "language": "ar"
}
```

**Response**: `201 Created` - Emergency flag created, routing to on-call doctor

---

## DID/OID Integration APIs

### DID Management

#### POST /api/did/doctor/create

Create DID for a doctor.

**Request Body**:
```json
{
  "doctor_id": "DOC-123",
  "name": "Dr. Ahmed Al-Rashid",
  "email": "ahmed.rashid@hospital.sa",
  "specialty": "cardiology",
  "license_number": "MED-12345"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "did": "did:brainsait:doctor:DOC-123",
    "oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-123",
    "public_key": "z6Mk...",
    "private_key": "STORE_SECURELY"
  },
  "warning": "Store the private key securely - it cannot be recovered"
}
```

#### GET /api/did/resolve/:did

Resolve DID to OID and W3C DID Document.

**Response**:
```json
{
  "success": true,
  "data": {
    "did_document": {
      "@context": "https://www.w3.org/ns/did/v1",
      "id": "did:brainsait:doctor:DOC-123",
      "verificationMethod": [...]
    },
    "oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-123",
    "entity_type": "doctor"
  }
}
```

### Document Signing

#### POST /api/did/sign

Sign document using DID.

**Request Body**:
```json
{
  "document_oid": "1.3.6.1.4.1.61026.healthcare.documentation.DOC-001",
  "document_hash": "sha256_hash_of_document",
  "signature": "ed25519_signature"
}
```

**Headers**: `X-Doctor-DID: did:brainsait:doctor:DOC-123`

**Response**: `200 OK` - Document signed successfully

### Access Control

#### POST /api/access/check

Check if DID has access to resource.

**Request Body**:
```json
{
  "actor_did": "did:brainsait:doctor:DOC-123",
  "resource_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "action_type": "read"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "has_access": true,
    "actor_did": "did:brainsait:doctor:DOC-123",
    "resource_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
    "action_type": "read"
  }
}
```

### Audit Trail

#### GET /api/audit

Query audit trail (admin only).

**Query Parameters**:
- `actor_did`: Filter by actor
- `resource_oid`: Filter by resource
- `action_type`: create, read, update, delete, sign, etc.
- `start_date`, `end_date`: Date range
- `page`, `limit`: Pagination

---

## AI Orchestration APIs

### Patient AI Services

#### POST /api/ai/patient/triage

AI-powered patient triage.

**Request Body**:
```json
{
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "chief_complaint": "صداع وغثيان",
  "symptoms": ["headache", "nausea", "dizziness"],
  "pain_level": 7,
  "transcript": "أشعر بصداع شديد منذ يومين مع غثيان ودوخة",
  "language": "ar"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "service_type": "patient_triage",
    "result": {
      "urgency_score": 65,
      "severity": "medium",
      "recommended_specialty": "neurology",
      "red_flags": [],
      "confidence": 0.85
    },
    "recommendations": ["Monitor symptoms", "Schedule neurology consult"],
    "actions_taken": [
      {
        "action_type": "suggest_tests",
        "parameters": { "tests": ["CT scan", "Blood work"] },
        "status": "pending"
      }
    ]
  }
}
```

### Doctor AI Services

#### POST /api/ai/doctor/decision-support

Clinical decision support.

**Request Body**:
```json
{
  "doctor_oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-001",
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "chief_complaint": "Chronic cough for 3 weeks",
  "exam_findings": {...},
  "vitals": {...},
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "result": {
      "differential_diagnosis": [
        { "condition": "COPD exacerbation", "probability": 0.45 },
        { "condition": "Pneumonia", "probability": 0.30 },
        { "condition": "Asthma", "probability": 0.15 }
      ],
      "recommended_tests": ["Chest X-ray", "Spirometry", "CBC"],
      "treatment_options": [...]
    },
    "confidence": 0.80,
    "reasoning": "Based on clinical presentation and evidence-based guidelines"
  }
}
```

#### POST /api/ai/doctor/documentation

AI-assisted documentation.

**Request Body**:
```json
{
  "doctor_oid": "1.3.6.1.4.1.61026.healthcare.providers.DOC-001",
  "patient_oid": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001",
  "document_type": "soap_note",
  "voice_transcript": "Patient presents with...",
  "language": "en"
}
```

**Response**: Generated SOAP note (requires doctor review)

### Admin AI Services

#### POST /api/ai/admin/scheduling

AI-powered scheduling optimization.

**Request Body**:
```json
{
  "doctor_availability": [...],
  "patient_requests": [...],
  "constraints": {...}
}
```

**Response**: Optimized schedule with utilization metrics

---

## Error Handling

All API errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes**:
- `400` - Bad Request: Missing or invalid parameters
- `401` - Unauthorized: Invalid or missing authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

---

## Rate Limiting

**Limits**:
- Authentication endpoints: 10 requests/minute
- Standard endpoints: 100 requests/minute
- AI endpoints: 20 requests/minute
- Voice transcription: 30 requests/minute

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708200000
```

---

## HIPAA Compliance

All endpoints are HIPAA-compliant:
- ✅ End-to-end encryption (TLS 1.3)
- ✅ Audit logging for all PHI access
- ✅ DID-based authentication and non-repudiation
- ✅ Access control with OID/DID integration
- ✅ Data anonymization in logs

---

## Support

**Documentation**: https://docs.masterlinc.health  
**API Status**: https://status.masterlinc.health  
**Support Email**: api-support@masterlinc.health

---

**Version History**:
- v1.0.0 (2026-02-17): Initial release with full DID/OID/AI integration
