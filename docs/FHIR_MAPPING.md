# FHIR R4 Resource Mapping Documentation

## Overview

This document maps the MasterLinc Healthcare database schema to FHIR R4 resources, ensuring standards-compliant interoperability and data exchange.

**FHIR Version**: R4 (4.0.1)  
**Base URL**: `https://api.masterlinc.health/fhir`  
**Conformance**: US Core Implementation Guide compatible

---

## Table of Contents

1. [Doctor → Practitioner](#doctor--practitioner)
2. [Patient → Patient](#patient--patient)
3. [Appointment → Appointment](#appointment--appointment)
4. [Triage Record → QuestionnaireResponse & Observation](#triage-record--questionnaireresponse--observation)
5. [Vitals → Observation](#vitals--observation)
6. [Exam Findings → Observation](#exam-findings--observation)
7. [Clinical Documentation → DocumentReference & DiagnosticReport](#clinical-documentation--documentreference--diagnosticreport)
8. [Emergency Flag → Flag](#emergency-flag--flag)
9. [Endorsement → Communication](#endorsement--communication)
10. [Handover Session → Communication](#handover-session--communication)
11. [Provenance Tracking](#provenance-tracking)

---

## Doctor → Practitioner

**FHIR Resource**: `Practitioner`

### Mapping

| Database Field | FHIR Path | Notes |
|----------------|-----------|-------|
| `id` | `Practitioner.id` | |
| `oid` | `Practitioner.identifier[0].value` | System: `urn:oid:1.3.6.1.4.1.61026` |
| `did` | `Practitioner.identifier[1].value` | System: `did:brainsait` |
| `name` | `Practitioner.name[0].text` | |
| `name_ar` | `Practitioner.name[1].text` | Language: ar |
| `email` | `Practitioner.telecom[type=email].value` | |
| `phone` | `Practitioner.telecom[type=phone].value` | |
| `specialty` | `Practitioner.qualification[0].code.coding[0].display` | |
| `license_number` | `Practitioner.identifier[type=LN].value` | |
| `status` | `Practitioner.active` | active → true, others → false |

### Example FHIR Resource

```json
{
  "resourceType": "Practitioner",
  "id": "DOC-123",
  "identifier": [
    {
      "system": "urn:oid:1.3.6.1.4.1.61026.healthcare.providers",
      "value": "1.3.6.1.4.1.61026.healthcare.providers.DOC-123"
    },
    {
      "system": "did:brainsait",
      "value": "did:brainsait:doctor:DOC-123"
    },
    {
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "LN",
            "display": "License number"
          }
        ]
      },
      "value": "MED-12345"
    }
  ],
  "active": true,
  "name": [
    {
      "text": "Dr. Ahmed Al-Rashid",
      "family": "Al-Rashid",
      "given": ["Ahmed"],
      "prefix": ["Dr."]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+966501234567"
    },
    {
      "system": "email",
      "value": "ahmed.rashid@hospital.sa"
    }
  ],
  "qualification": [
    {
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "394579002",
            "display": "Cardiology"
          }
        ],
        "text": "Cardiology"
      }
    }
  ]
}
```

---

## Patient → Patient

**FHIR Resource**: `Patient`

### Mapping

| Database Field | FHIR Path | Notes |
|----------------|-----------|-------|
| `id` | `Patient.id` | |
| `oid` | `Patient.identifier[0].value` | System: `urn:oid:1.3.6.1.4.1.61026` |
| `nphies_id` | `Patient.identifier[type=NPHIES].value` | Saudi national identifier |
| `national_id` | `Patient.identifier[type=NI].value` | |
| `name` | `Patient.name[0].text` | |
| `name_ar` | `Patient.name[1].text` | Language: ar |
| `date_of_birth` | `Patient.birthDate` | |
| `gender` | `Patient.gender` | male, female, other |
| `phone` | `Patient.telecom[type=phone].value` | |
| `email` | `Patient.telecom[type=email].value` | |
| `address` | `Patient.address[0].text` | |
| `language_preference` | `Patient.communication[0].language.coding[0].code` | |
| `status` | `Patient.active` | |
| `blood_type` | `Patient.extension[url=blood-type].valueCodeableConcept` | |
| `allergies` | → `AllergyIntolerance` resources | Separate resources |

### Example FHIR Resource

```json
{
  "resourceType": "Patient",
  "id": "PAT-001",
  "identifier": [
    {
      "system": "urn:oid:1.3.6.1.4.1.61026.healthcare.patients",
      "value": "1.3.6.1.4.1.61026.healthcare.patients.PAT-001"
    },
    {
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "NI",
            "display": "National unique individual identifier"
          }
        ]
      },
      "value": "1234567890"
    }
  ],
  "active": true,
  "name": [
    {
      "text": "محمد أحمد",
      "family": "أحمد",
      "given": ["محمد"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+966501234567"
    }
  ],
  "gender": "male",
  "birthDate": "1985-05-15",
  "address": [
    {
      "text": "Riyadh, Saudi Arabia",
      "city": "Riyadh",
      "country": "SA"
    }
  ],
  "communication": [
    {
      "language": {
        "coding": [
          {
            "system": "urn:ietf:bcp:47",
            "code": "ar",
            "display": "Arabic"
          }
        ]
      },
      "preferred": true
    }
  ]
}
```

---

## Appointment → Appointment

**FHIR Resource**: `Appointment`

### Mapping

| Database Field | FHIR Path | Notes |
|----------------|-----------|-------|
| `id` | `Appointment.id` | |
| `oid` | `Appointment.identifier[0].value` | |
| `status` | `Appointment.status` | Map statuses appropriately |
| `appointment_type` | `Appointment.appointmentType` | |
| `scheduled_start` | `Appointment.start` | |
| `scheduled_end` | `Appointment.end` | |
| `chief_complaint` | `Appointment.reasonCode[0].text` | |
| `patient_oid` | `Appointment.participant[actor.type=Patient].actor.reference` | |
| `doctor_oid` | `Appointment.participant[actor.type=Practitioner].actor.reference` | |

### Example FHIR Resource

```json
{
  "resourceType": "Appointment",
  "id": "APT-001",
  "identifier": [
    {
      "system": "urn:oid:1.3.6.1.4.1.61026.healthcare.appointments",
      "value": "1.3.6.1.4.1.61026.healthcare.appointments.APT-001"
    }
  ],
  "status": "booked",
  "appointmentType": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
        "code": "ROUTINE",
        "display": "Routine appointment"
      }
    ]
  },
  "reasonCode": [
    {
      "text": "صداع شديد"
    }
  ],
  "start": "2026-02-18T10:00:00+03:00",
  "end": "2026-02-18T10:30:00+03:00",
  "participant": [
    {
      "actor": {
        "reference": "Patient/PAT-001",
        "display": "محمد أحمد"
      },
      "required": "required",
      "status": "accepted"
    },
    {
      "actor": {
        "reference": "Practitioner/DOC-123",
        "display": "Dr. Ahmed Al-Rashid"
      },
      "required": "required",
      "status": "accepted"
    }
  ]
}
```

---

## Triage Record → QuestionnaireResponse & Observation

**FHIR Resources**: `QuestionnaireResponse` (for voice transcript), `Observation` (for severity)

### Triage Severity Observation

```json
{
  "resourceType": "Observation",
  "id": "TRI-001-severity",
  "identifier": [
    {
      "system": "urn:oid:1.3.6.1.4.1.61026.healthcare.triage",
      "value": "1.3.6.1.4.1.61026.healthcare.triage.TRI-001"
    }
  ],
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "survey",
          "display": "Survey"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "75328-4",
        "display": "Triage acuity"
      }
    ]
  },
  "subject": {
    "reference": "Patient/PAT-001"
  },
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "24484000",
        "display": "Severe"
      }
    ],
    "text": "critical"
  }
}
```

---

## Vitals → Observation

**FHIR Resource**: `Observation` (multiple observations for different vital signs)

### Blood Pressure Observation

```json
{
  "resourceType": "Observation",
  "id": "VIT-001-bp",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "85354-9",
        "display": "Blood pressure panel"
      }
    ]
  },
  "subject": {
    "reference": "Patient/PAT-001"
  },
  "effectiveDateTime": "2026-02-17T14:30:00+03:00",
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8480-6",
            "display": "Systolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 120,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 80,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    }
  ]
}
```

### Standard Vital Signs LOINC Codes

| Vital Sign | LOINC Code | Unit |
|------------|------------|------|
| Body Temperature | 8310-5 | °C |
| Heart Rate | 8867-4 | beats/min |
| Respiratory Rate | 9279-1 | breaths/min |
| Oxygen Saturation | 2708-6 | % |
| Body Weight | 29463-7 | kg |
| Body Height | 8302-2 | cm |
| BMI | 39156-5 | kg/m² |

---

## Clinical Documentation → DocumentReference

**FHIR Resource**: `DocumentReference`

```json
{
  "resourceType": "DocumentReference",
  "id": "DOC-001",
  "identifier": [
    {
      "system": "urn:oid:1.3.6.1.4.1.61026.healthcare.documentation",
      "value": "1.3.6.1.4.1.61026.healthcare.documentation.DOC-001"
    }
  ],
  "status": "current",
  "type": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "11506-3",
        "display": "Progress note"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category",
          "code": "clinical-note"
        }
      ]
    }
  ],
  "subject": {
    "reference": "Patient/PAT-001"
  },
  "date": "2026-02-17T15:00:00+03:00",
  "author": [
    {
      "reference": "Practitioner/DOC-123",
      "display": "Dr. Ahmed Al-Rashid"
    }
  ],
  "authenticator": {
    "reference": "Practitioner/DOC-123"
  },
  "content": [
    {
      "attachment": {
        "contentType": "text/markdown",
        "data": "base64_encoded_content",
        "title": "SOAP Note - 2026-02-17"
      }
    }
  ],
  "context": {
    "encounter": [
      {
        "reference": "Appointment/APT-001"
      }
    ]
  }
}
```

---

## Emergency Flag → Flag

**FHIR Resource**: `Flag`

```json
{
  "resourceType": "Flag",
  "id": "EMG-001",
  "identifier": [
    {
      "system": "urn:oid:1.3.6.1.4.1.61026.healthcare.emergency",
      "value": "1.3.6.1.4.1.61026.healthcare.emergency.EMG-001"
    }
  ],
  "status": "active",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/flag-category",
          "code": "safety",
          "display": "Safety"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "29857009",
        "display": "Chest pain"
      }
    ],
    "text": "Critical: Chest pain"
  },
  "subject": {
    "reference": "Patient/PAT-001"
  },
  "period": {
    "start": "2026-02-17T14:00:00+03:00"
  },
  "author": {
    "reference": "Device/BSMA-AI"
  }
}
```

---

## Provenance Tracking

**FHIR Resource**: `Provenance`

Every resource should have associated provenance tracking:

```json
{
  "resourceType": "Provenance",
  "id": "PROV-001",
  "target": [
    {
      "reference": "DocumentReference/DOC-001"
    }
  ],
  "recorded": "2026-02-17T15:00:00+03:00",
  "agent": [
    {
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
            "code": "author"
          }
        ]
      },
      "who": {
        "reference": "Practitioner/DOC-123",
        "identifier": {
          "system": "did:brainsait",
          "value": "did:brainsait:doctor:DOC-123"
        }
      }
    }
  ],
  "signature": [
    {
      "type": [
        {
          "system": "urn:iso-astm:E1762-95:2013",
          "code": "1.2.840.10065.1.12.1.1",
          "display": "Author's Signature"
        }
      ],
      "when": "2026-02-17T15:00:00+03:00",
      "who": {
        "reference": "Practitioner/DOC-123"
      },
      "data": "base64_encoded_did_signature"
    }
  ]
}
```

---

## NPHIES Integration

For Saudi Arabian NPHIES compliance, additional extensions and profiles are required:

### NPHIES-specific Extensions

```json
{
  "extension": [
    {
      "url": "http://nphies.sa/fhir/ksa/nphies/StructureDefinition/extension-ksa-administrative-gender",
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "http://nphies.sa/terminology/CodeSystem/ksa-administrative-gender",
            "code": "male"
          }
        ]
      }
    }
  ]
}
```

---

## Summary

This FHIR mapping enables:
- ✅ Standards-compliant data exchange
- ✅ Interoperability with other healthcare systems
- ✅ NPHIES integration for Saudi market
- ✅ Complete provenance tracking with DID signatures
- ✅ Multi-language support (EN/AR)
- ✅ Comprehensive audit trail

All resources include OID identifiers and DID-based authentication for enhanced security and traceability.
