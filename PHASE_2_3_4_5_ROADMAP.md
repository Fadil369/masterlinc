# Phase 2-5 Roadmap - BrainSAIT MasterLinc Platform
## Actionable Development Checklist for Next Phases

**Document Version**: 1.0.0  
**Last Updated**: 2026-02-17  
**Status**: Ready for DevOps Pickup

---

## Table of Contents

1. [Overview](#overview)
2. [Branching Strategy](#branching-strategy)
3. [Phase 2: Basma Mobile App](#phase-2-basma-mobile-app)
4. [Phase 3: Enhanced Doctor's Workspace](#phase-3-enhanced-doctors-workspace)
5. [Phase 4: Endorsements and Handover Modules](#phase-4-endorsements-and-handover-modules)
6. [Phase 5: Advanced Patient Workflows](#phase-5-advanced-patient-workflows)
7. [Phase 6: AI Toolkit Integration](#phase-6-ai-toolkit-integration)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Strategy](#deployment-strategy)
10. [Success Metrics](#success-metrics)

---

## Overview

This document provides a comprehensive, actionable roadmap for Phases 2-5 of the BrainSAIT MasterLinc platform. Each phase includes:

- ✅ **Specific deliverables** with acceptance criteria
- 📁 **Required files and directories** to create
- 🔌 **API endpoints** to implement
- 🧪 **Testing requirements**
- 📊 **Success metrics**
- 🚀 **Deployment instructions**

**Phase 1 Status**: ✅ **COMPLETE** (Database, OID Registry, DID Registry, Docker Setup)

---

## Branching Strategy

### Repository Structure

```
main (protected)
├── develop (integration branch)
│   ├── feature/basma-mobile-app
│   ├── feature/doctor-workspace
│   ├── feature/endorsements-handover
│   ├── feature/patient-workflows
│   └── feature/ai-toolkit
└── hotfix/* (emergency fixes)
```

### Branch Workflow

1. **Feature Development**
   ```bash
   # Create feature branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/basma-mobile-app
   ```

2. **Pull Request Process**
   - Create PR to `develop` branch
   - Require 1+ code review
   - Pass all CI/CD checks
   - Merge using squash commits

3. **Release Process**
   ```bash
   # Create release branch from develop
   git checkout -b release/v2.0.0 develop
   
   # After testing, merge to main
   git checkout main
   git merge --no-ff release/v2.0.0
   git tag -a v2.0.0 -m "Release v2.0.0"
   git push origin main --tags
   ```

4. **Parallel Development**
   - All feature branches work independently from `develop`
   - Weekly integration merges to `develop`
   - Daily standups to coordinate dependencies
   - Feature flags for incomplete features

---

## Phase 2: Basma Mobile App
### EN/AR Live Voice Assistant for Patients

**Timeline**: 6-8 weeks  
**Team Size**: 3-4 developers (2 mobile, 1 backend, 1 AI/Voice)  
**Priority**: HIGH

### Goals

- ✅ Cross-platform mobile app (iOS + Android)
- ✅ Bilingual support (English + Arabic)
- ✅ Real-time voice conversation
- ✅ Appointment booking
- ✅ Vitals entry and tracking
- ✅ Medical records access
- ✅ OID/DID integration

### Development Checklist

#### Week 1-2: Setup & Foundation

- [ ] **Create React Native project structure**
  ```bash
  npx react-native init BasmaApp --template react-native-template-typescript
  cd BasmaApp
  ```

- [ ] **Create directory structure**
  ```
  apps/basma-mobile/
  ├── src/
  │   ├── components/
  │   │   ├── VoiceAssistant/
  │   │   ├── Appointments/
  │   │   ├── Vitals/
  │   │   └── Records/
  │   ├── screens/
  │   │   ├── HomeScreen.tsx
  │   │   ├── AppointmentScreen.tsx
  │   │   ├── VitalsScreen.tsx
  │   │   └── RecordsScreen.tsx
  │   ├── services/
  │   │   ├── api.ts
  │   │   ├── voice.ts
  │   │   └── auth.ts
  │   ├── localization/
  │   │   ├── en.json
  │   │   └── ar.json
  │   ├── navigation/
  │   └── types/
  ├── ios/
  ├── android/
  ├── package.json
  └── app.json
  ```

- [ ] **Install dependencies**
  ```bash
  npm install @react-navigation/native @react-navigation/stack
  npm install react-native-voice
  npm install react-native-tts
  npm install @react-native-community/async-storage
  npm install axios
  npm install i18next react-i18next
  npm install @react-native-firebase/app @react-native-firebase/messaging
  ```

- [ ] **Configure i18n for EN/AR**
  - Create translation files
  - Set up RTL support for Arabic
  - Implement language switcher

- [ ] **Setup navigation**
  - Bottom tab navigation
  - Stack navigation for flows
  - Deep linking support

#### Week 3-4: Voice Assistant Implementation

- [ ] **Create Voice Assistant service**
  ```typescript
  // src/services/voice.ts
  interface VoiceService {
    startListening(language: 'en' | 'ar'): Promise<void>;
    stopListening(): Promise<void>;
    speak(text: string, language: 'en' | 'ar'): Promise<void>;
    processCommand(transcript: string): Promise<VoiceResponse>;
  }
  ```

- [ ] **Implement voice commands**
  - "Book appointment" / "احجز موعد"
  - "Check my appointments" / "تحقق من مواعيدي"
  - "Record vitals" / "سجل القياسات"
  - "Show my records" / "أظهر سجلاتي"

- [ ] **Create API integration**
  ```typescript
  // src/services/api.ts
  class BasmaAPI {
    // Authentication
    login(nationalId: string, otp: string): Promise<AuthResponse>;
    
    // Appointments
    getAppointments(patientId: string): Promise<Appointment[]>;
    bookAppointment(data: AppointmentRequest): Promise<Appointment>;
    
    // Vitals
    submitVitals(vitals: VitalsData): Promise<VitalsResponse>;
    getVitalsHistory(patientId: string): Promise<Vitals[]>;
    
    // Records
    getMedicalRecords(patientId: string): Promise<MedicalRecord[]>;
  }
  ```

- [ ] **Backend endpoints to create**
  ```
  POST   /api/mobile/auth/login
  POST   /api/mobile/auth/verify-otp
  GET    /api/mobile/patient/:id/appointments
  POST   /api/mobile/patient/:id/appointments
  POST   /api/mobile/patient/:id/vitals
  GET    /api/mobile/patient/:id/vitals
  GET    /api/mobile/patient/:id/records
  POST   /api/mobile/voice/process
  ```

#### Week 5-6: Core Features

- [ ] **Appointment Booking UI**
  - Doctor selection (with OID lookup)
  - Date/time picker
  - Specialty filter
  - Voice-enabled booking flow

- [ ] **Vitals Entry**
  - Blood pressure input
  - Temperature
  - Heart rate
  - Oxygen saturation
  - Weight/Height
  - Save with patient OID/DID

- [ ] **Medical Records Viewer**
  - Past appointments
  - Prescriptions
  - Lab results
  - Imaging reports (link to PACS)

#### Week 7-8: Polish & Testing

- [ ] **Implement push notifications**
  - Appointment reminders
  - Medication reminders
  - Lab results ready

- [ ] **Offline support**
  - Cache appointments locally
  - Queue vitals submissions
  - Sync when online

- [ ] **Security implementation**
  - Biometric authentication
  - Secure storage for tokens
  - SSL pinning

- [ ] **Testing**
  - Unit tests (Jest)
  - Integration tests
  - E2E tests (Detox)
  - Voice recognition testing (both languages)

### Required Backend Services

Create these files in `services/mobile-api/`:

```typescript
// services/mobile-api/src/routes/appointments.ts
router.post('/patient/:id/appointments', async (req, res) => {
  const { patientId } = req.params;
  const { doctorOid, datetime, specialty } = req.body;
  
  // Validate patient DID/OID
  // Create appointment with data provenance
  // Send confirmation notification
});

// services/mobile-api/src/routes/vitals.ts
router.post('/patient/:id/vitals', async (req, res) => {
  const { patientId } = req.params;
  const { bloodPressure, temperature, heartRate, oxygenSat } = req.body;
  
  // Store vitals with patient OID
  // Create data provenance record
  // Trigger alerts if abnormal
});

// services/mobile-api/src/routes/voice.ts
router.post('/voice/process', async (req, res) => {
  const { transcript, language, patientId } = req.body;
  
  // Process voice command
  // Execute action
  // Return voice response
});
```

### Database Schema Extensions

Add to `infrastructure/database/brainsait-schema.sql`:

```sql
-- Vitals table
CREATE TABLE IF NOT EXISTS vitals (
    vital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    patient_oid VARCHAR(255),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature DECIMAL(4, 2),
    heart_rate INTEGER,
    oxygen_saturation INTEGER,
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    recorded_by_service_oid VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_oid ON vitals(patient_oid);
CREATE INDEX IF NOT EXISTS idx_vitals_recorded_at ON vitals(recorded_at DESC);

-- Mobile sessions
CREATE TABLE IF NOT EXISTS mobile_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    device_token VARCHAR(255),
    device_type VARCHAR(20),
    app_version VARCHAR(20),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Testing Requirements

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests (iOS)
detox test --configuration ios.sim.debug

# E2E tests (Android)
detox test --configuration android.emu.debug
```

### Deployment

```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android

# Production builds
# iOS
fastlane ios beta
fastlane ios release

# Android
fastlane android beta
fastlane android release
```

### Success Criteria

- ✅ App launches on iOS and Android
- ✅ Voice recognition works in English and Arabic
- ✅ Appointments can be booked via voice
- ✅ Vitals can be entered and saved
- ✅ Medical records display correctly
- ✅ OID/DID integration verified
- ✅ Push notifications working
- ✅ 95%+ test coverage

---

## Phase 3: Enhanced Doctor's Workspace
### Template Library, Voice-to-Text, Task Manager

**Timeline**: 8-10 weeks  
**Team Size**: 4-5 developers (2 frontend, 2 backend, 1 AI)  
**Priority**: HIGH

### Goals

- ✅ Template library for common procedures/notes
- ✅ Voice-to-text documentation
- ✅ Intelligent task manager
- ✅ Patient queue management
- ✅ Clinical decision support
- ✅ FHIR/HL7 integration

### Development Checklist

#### Week 1-2: Foundation

- [ ] **Create workspace app structure**
  ```
  apps/doctor-workspace/
  ├── src/
  │   ├── components/
  │   │   ├── TemplateLibrary/
  │   │   ├── VoiceRecorder/
  │   │   ├── TaskManager/
  │   │   ├── PatientQueue/
  │   │   └── ClinicalSupport/
  │   ├── pages/
  │   │   ├── Dashboard.tsx
  │   │   ├── PatientChart.tsx
  │   │   ├── Templates.tsx
  │   │   └── Tasks.tsx
  │   ├── services/
  │   │   ├── api.ts
  │   │   ├── voice.ts
  │   │   ├── templates.ts
  │   │   └── fhir.ts
  │   └── types/
  ├── package.json
  └── vite.config.ts
  ```

- [ ] **Setup Next.js/React app**
  ```bash
  npx create-next-app doctor-workspace --typescript
  npm install @tanstack/react-query axios
  npm install @headlessui/react @heroicons/react
  npm install recharts date-fns
  ```

#### Week 3-4: Template Library

- [ ] **Create template management system**
  ```typescript
  // Template types
  interface ClinicalTemplate {
    id: string;
    name: string;
    type: 'soap' | 'procedure' | 'prescription' | 'referral';
    specialty: string;
    content: string;
    variables: TemplateVariable[];
    oid: string;
    createdBy: string;
  }
  
  interface TemplateVariable {
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }
  ```

- [ ] **Common templates to create**
  - SOAP note templates (by specialty)
  - Procedure documentation
  - Prescription templates (common medications)
  - Referral letters
  - Lab order sets
  - Imaging requisitions

- [ ] **Database schema for templates**
  ```sql
  CREATE TABLE IF NOT EXISTS clinical_templates (
      template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      template_type VARCHAR(50),
      specialty VARCHAR(100),
      content TEXT NOT NULL,
      variables JSONB,
      created_by_oid VARCHAR(255),
      is_shared BOOLEAN DEFAULT false,
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **API endpoints for templates**
  ```
  GET    /api/templates?specialty=cardiology
  GET    /api/templates/:id
  POST   /api/templates
  PUT    /api/templates/:id
  DELETE /api/templates/:id
  POST   /api/templates/:id/use
  ```

#### Week 5-6: Voice-to-Text Integration

- [ ] **Voice recording component**
  ```typescript
  interface VoiceRecorder {
    startRecording(): Promise<void>;
    stopRecording(): Promise<Blob>;
    transcribe(audio: Blob, language: 'en' | 'ar'): Promise<string>;
    insertAtCursor(text: string): void;
  }
  ```

- [ ] **Integrate speech-to-text API**
  - Support for medical terminology
  - Bilingual support (EN/AR)
  - Punctuation and formatting
  - Speaker diarization

- [ ] **Create voice documentation flow**
  - Real-time transcription
  - Edit while speaking
  - Medical term suggestions
  - Auto-save drafts

- [ ] **Backend service for transcription**
  ```typescript
  // services/voice-transcription/src/index.ts
  router.post('/transcribe', async (req, res) => {
    const { audioFile, language, context } = req.body;
    
    // Send to speech-to-text service (e.g., Whisper, Google Speech)
    // Apply medical terminology corrections
    // Return formatted text
  });
  ```

#### Week 7-8: Task Manager

- [ ] **Task management system**
  ```typescript
  interface Task {
    id: string;
    patientId: string;
    patientOid: string;
    title: string;
    description: string;
    type: 'followup' | 'lab_review' | 'prescription_refill' | 'callback';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
    assignedToOid: string;
    createdAt: Date;
  }
  ```

- [ ] **Task types to support**
  - Follow-up appointments
  - Lab result reviews
  - Prescription refills
  - Patient callbacks
  - Referral tracking
  - Test result notifications

- [ ] **Database schema for tasks**
  ```sql
  CREATE TABLE IF NOT EXISTS doctor_tasks (
      task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(patient_id),
      patient_oid VARCHAR(255),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      task_type VARCHAR(50),
      priority VARCHAR(20),
      due_date TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      assigned_to_oid VARCHAR(255),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON doctor_tasks(assigned_to_oid, status);
  CREATE INDEX IF NOT EXISTS idx_tasks_due ON doctor_tasks(due_date);
  ```

- [ ] **Task management APIs**
  ```
  GET    /api/doctor/:oid/tasks?status=pending
  POST   /api/tasks
  PUT    /api/tasks/:id
  DELETE /api/tasks/:id
  POST   /api/tasks/:id/complete
  ```

#### Week 9-10: Integration & Polish

- [ ] **Patient queue management**
  - Real-time queue display
  - Triage level indicators
  - Estimated wait times
  - Quick patient summary

- [ ] **Clinical decision support**
  - Drug interaction warnings
  - Allergy alerts
  - Guideline recommendations
  - Differential diagnosis suggestions

- [ ] **FHIR/HL7 integration**
  ```typescript
  // services/fhir-bridge/src/index.ts
  class FHIRBridge {
    // Convert internal format to FHIR
    toFHIR(resource: any): fhir.Resource;
    
    // Convert FHIR to internal format
    fromFHIR(resource: fhir.Resource): any;
    
    // Send to external FHIR server
    sync(resource: fhir.Resource): Promise<void>;
  }
  ```

### Required Services

Create `services/doctor-workspace-api/`:

```typescript
// services/doctor-workspace-api/src/routes/workspace.ts
router.get('/doctor/:oid/dashboard', async (req, res) => {
  // Return dashboard data
  // - Today's appointments
  // - Pending tasks
  // - Recent patients
  // - Alerts
});

router.post('/documentation/create', async (req, res) => {
  // Create clinical documentation
  // - Apply template
  // - Save with provenance
  // - Generate FHIR resource
});
```

### Testing Requirements

- Unit tests for all components
- Integration tests for API
- E2E tests for workflows
- Voice transcription accuracy tests
- Template rendering tests

### Success Criteria

- ✅ Templates save 50%+ documentation time
- ✅ Voice-to-text accuracy >95%
- ✅ Task completion rate >90%
- ✅ FHIR resources validate
- ✅ Positive doctor feedback

---

## Phase 4: Endorsements and Handover Modules
### OID/DID Integration for Care Transitions

**Timeline**: 6-8 weeks  
**Team Size**: 3-4 developers (2 backend, 1 frontend, 1 compliance)  
**Priority**: MEDIUM-HIGH

### Goals

- ✅ Secure care handover between providers
- ✅ Digital endorsements with DID signatures
- ✅ Complete audit trail with OID tracking
- ✅ NPHIES integration for claims
- ✅ HL7 messaging for interoperability

### Development Checklist

#### Week 1-2: Foundation

- [ ] **Create handover module structure**
  ```
  services/handover/
  ├── src/
  │   ├── controllers/
  │   │   ├── endorsement.ts
  │   │   ├── handover.ts
  │   │   └── audit.ts
  │   ├── models/
  │   │   ├── Endorsement.ts
  │   │   ├── Handover.ts
  │   │   └── AuditLog.ts
  │   ├── services/
  │   │   ├── did-signing.ts
  │   │   ├── oid-tracking.ts
  │   │   └── nphies-integration.ts
  │   └── routes/
  ```

- [ ] **Database schema for handovers**
  ```sql
  -- Endorsements table
  CREATE TABLE IF NOT EXISTS endorsements (
      endorsement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(patient_id),
      patient_oid VARCHAR(255),
      from_doctor_did VARCHAR(255),
      from_doctor_oid VARCHAR(255),
      to_doctor_did VARCHAR(255),
      to_doctor_oid VARCHAR(255),
      endorsement_type VARCHAR(50),
      clinical_summary TEXT,
      recommendations TEXT,
      signature_did VARCHAR(500),
      signed_at TIMESTAMP,
      expires_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Handover records
  CREATE TABLE IF NOT EXISTS handovers (
      handover_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(patient_id),
      patient_oid VARCHAR(255),
      source_service_oid VARCHAR(255),
      target_service_oid VARCHAR(255),
      handover_type VARCHAR(50),
      clinical_data JSONB,
      endorsement_id UUID REFERENCES endorsements(endorsement_id),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Audit trail
  CREATE TABLE IF NOT EXISTS handover_audit (
      audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      handover_id UUID REFERENCES handovers(handover_id),
      action VARCHAR(50),
      performed_by_oid VARCHAR(255),
      performed_by_did VARCHAR(255),
      details JSONB,
      ip_address VARCHAR(45),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### Week 3-4: Endorsement System

- [ ] **Digital signature with DID**
  ```typescript
  interface EndorsementService {
    createEndorsement(data: EndorsementRequest): Promise<Endorsement>;
    signEndorsement(endorsementId: string, doctorDid: string): Promise<Signature>;
    verifySignature(signature: string): Promise<boolean>;
    revokeEndorsement(endorsementId: string, reason: string): Promise<void>;
  }
  ```

- [ ] **Endorsement types**
  - Referral to specialist
  - Transfer of care
  - Discharge summary
  - Treatment plan approval
  - Medication reconciliation

- [ ] **API endpoints**
  ```
  POST   /api/endorsements/create
  POST   /api/endorsements/:id/sign
  GET    /api/endorsements/:id/verify
  POST   /api/endorsements/:id/revoke
  GET    /api/doctor/:did/endorsements
  ```

#### Week 5-6: Handover Workflow

- [ ] **Care transition workflow**
  ```typescript
  interface HandoverWorkflow {
    initiateHandover(patientOid: string, targetServiceOid: string): Promise<Handover>;
    transferClinicalData(handoverId: string, data: ClinicalData): Promise<void>;
    acceptHandover(handoverId: string, receivingDoctorDid: string): Promise<void>;
    rejectHandover(handoverId: string, reason: string): Promise<void>;
    completeHandover(handoverId: string): Promise<void>;
  }
  ```

- [ ] **Data transfer protocol**
  - Patient demographics
  - Medical history
  - Current medications
  - Active diagnoses
  - Recent lab results
  - Treatment plan
  - Follow-up requirements

- [ ] **Implement HL7 messaging**
  ```typescript
  // services/handover/src/services/hl7-messaging.ts
  class HL7Messenger {
    // Create ADT message for patient transfer
    createADT(patient: Patient, event: 'A02' | 'A03'): HL7Message;
    
    // Create ORU message for results
    createORU(results: LabResults): HL7Message;
    
    // Send HL7 message
    send(message: HL7Message, endpoint: string): Promise<void>;
  }
  ```

#### Week 7-8: Integration & Compliance

- [ ] **NPHIES integration**
  ```typescript
  // services/handover/src/services/nphies-integration.ts
  class NPHIESIntegration {
    // Register handover with NPHIES
    registerHandover(handover: Handover): Promise<string>;
    
    // Submit claim for handover services
    submitClaim(handoverId: string): Promise<ClaimResponse>;
    
    // Query handover status
    queryStatus(nphiesId: string): Promise<Status>;
  }
  ```

- [ ] **Compliance features**
  - Complete audit trail
  - Data encryption at rest
  - Secure transmission (TLS 1.3)
  - Access control with OID/DID
  - HIPAA compliance
  - NPHIES compliance
  - Saudi MOH regulations

- [ ] **Audit logging**
  ```typescript
  interface AuditLogger {
    logAccess(who: string, what: string, when: Date): Promise<void>;
    logModification(who: string, what: string, changes: any): Promise<void>;
    logTransfer(from: string, to: string, data: string): Promise<void>;
    generateReport(startDate: Date, endDate: Date): Promise<AuditReport>;
  }
  ```

### API Endpoints

```
# Endorsements
POST   /api/endorsements
GET    /api/endorsements/:id
PUT    /api/endorsements/:id/sign
POST   /api/endorsements/:id/verify

# Handovers
POST   /api/handovers/initiate
POST   /api/handovers/:id/transfer-data
POST   /api/handovers/:id/accept
POST   /api/handovers/:id/reject
POST   /api/handovers/:id/complete

# Audit
GET    /api/audit/handover/:id
GET    /api/audit/report?start=:start&end=:end
```

### Testing Requirements

- Unit tests for signature verification
- Integration tests for workflow
- E2E tests for complete handover
- Security penetration testing
- Compliance validation

### Success Criteria

- ✅ Digital signatures verify correctly
- ✅ Complete audit trail maintained
- ✅ NPHIES integration successful
- ✅ Handover completion time <24 hours
- ✅ Zero data loss in transfers
- ✅ 100% compliance with regulations

---

## Phase 5: Advanced Patient Workflows
### Triage, Vitals, Check-in, Follow-up

**Timeline**: 8-10 weeks  
**Team Size**: 4-5 developers (2 frontend, 2 backend, 1 QA)  
**Priority**: HIGH

### Goals

- ✅ Intelligent triage system
- ✅ Automated vitals collection
- ✅ Digital check-in process
- ✅ Follow-up scheduling and tracking
- ✅ Patient engagement tools

### Development Checklist

#### Week 1-2: Triage System

- [ ] **Create triage module**
  ```
  services/triage/
  ├── src/
  │   ├── algorithms/
  │   │   ├── esi-triage.ts (Emergency Severity Index)
  │   │   ├── mts-triage.ts (Manchester Triage System)
  │   │   └── ai-triage.ts (AI-powered)
  │   ├── controllers/
  │   │   └── triage.ts
  │   └── routes/
  ```

- [ ] **Triage assessment interface**
  ```typescript
  interface TriageAssessment {
    id: string;
    patientId: string;
    patientOid: string;
    chiefComplaint: string;
    symptoms: Symptom[];
    vitalSigns: VitalSigns;
    triageLevel: 1 | 2 | 3 | 4 | 5;
    urgency: 'immediate' | 'urgent' | 'semi-urgent' | 'standard' | 'non-urgent';
    estimatedWaitTime: number;
    assignedTo?: string;
    performedBy: string;
    performedByOid: string;
    timestamp: Date;
  }
  ```

- [ ] **AI-powered triage**
  ```typescript
  // services/triage/src/algorithms/ai-triage.ts
  class AITriage {
    assessSymptoms(symptoms: Symptom[], vitals: VitalSigns): Promise<TriageLevel>;
    predictDeteriorationRisk(patientData: PatientData): Promise<RiskScore>;
    suggestDifferentialDiagnoses(assessment: TriageAssessment): Promise<Diagnosis[]>;
  }
  ```

- [ ] **Database schema**
  ```sql
  CREATE TABLE IF NOT EXISTS triage_assessments (
      triage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(patient_id),
      patient_oid VARCHAR(255),
      chief_complaint TEXT,
      symptoms JSONB,
      vital_signs JSONB,
      triage_level INTEGER CHECK (triage_level BETWEEN 1 AND 5),
      urgency VARCHAR(20),
      estimated_wait_minutes INTEGER,
      assigned_to_oid VARCHAR(255),
      performed_by_oid VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### Week 3-4: Vitals Collection

- [ ] **Automated vitals integration**
  ```typescript
  interface VitalsDevice {
    deviceId: string;
    deviceType: 'bp_monitor' | 'thermometer' | 'pulse_ox' | 'scale';
    deviceOid: string;
    connect(): Promise<void>;
    readVitals(): Promise<VitalReading>;
    disconnect(): Promise<void>;
  }
  ```

- [ ] **Vital signs monitoring**
  - Blood pressure
  - Temperature
  - Heart rate
  - Oxygen saturation
  - Respiratory rate
  - Pain scale
  - Glucose level (for diabetics)

- [ ] **Alert system for abnormal vitals**
  ```typescript
  interface VitalsAlertSystem {
    checkThresholds(vitals: VitalSigns, patient: Patient): Promise<Alert[]>;
    notifyProvider(alert: Alert): Promise<void>;
    escalate(alert: Alert): Promise<void>;
  }
  ```

#### Week 5-6: Digital Check-in

- [ ] **Check-in kiosk interface**
  ```
  apps/check-in-kiosk/
  ├── src/
  │   ├── screens/
  │   │   ├── WelcomeScreen.tsx
  │   │   ├── IdentificationScreen.tsx
  │   │   ├── InsuranceScreen.tsx
  │   │   ├── SymptomsScreen.tsx
  │   │   └── ConfirmationScreen.tsx
  │   ├── services/
  │   │   └── check-in-api.ts
  │   └── types/
  ```

- [ ] **Check-in workflow**
  1. Patient identification (ID, phone, QR code)
  2. Appointment verification
  3. Insurance validation
  4. Symptoms pre-screening
  5. Consent forms
  6. Queue assignment
  7. Notification to provider

- [ ] **QR code check-in**
  ```typescript
  interface QRCheckIn {
    generateAppointmentQR(appointmentId: string): Promise<string>;
    scanQR(qrData: string): Promise<Appointment>;
    completeCheckIn(appointmentId: string, data: CheckInData): Promise<void>;
  }
  ```

- [ ] **Database schema**
  ```sql
  CREATE TABLE IF NOT EXISTS check_ins (
      check_in_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(patient_id),
      appointment_id UUID REFERENCES appointments(appointment_id),
      check_in_method VARCHAR(20),
      insurance_verified BOOLEAN DEFAULT false,
      symptoms_screened JSONB,
      consents JSONB,
      check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      queue_number INTEGER,
      status VARCHAR(20) DEFAULT 'checked_in'
  );
  ```

#### Week 7-8: Follow-up System

- [ ] **Follow-up scheduling**
  ```typescript
  interface FollowUpSystem {
    scheduleFollowUp(patientId: string, afterDays: number, reason: string): Promise<FollowUp>;
    sendReminders(followUpId: string): Promise<void>;
    trackCompletion(followUpId: string): Promise<CompletionStatus>;
    escalateMissed(followUpId: string): Promise<void>;
  }
  ```

- [ ] **Automated reminders**
  - SMS reminders
  - Email reminders
  - WhatsApp messages
  - Push notifications
  - Phone calls (via 3CX)

- [ ] **Follow-up types**
  - Post-procedure check
  - Medication review
  - Lab result discussion
  - Chronic disease management
  - Preventive care

- [ ] **Database schema**
  ```sql
  CREATE TABLE IF NOT EXISTS follow_ups (
      follow_up_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(patient_id),
      original_appointment_id UUID REFERENCES appointments(appointment_id),
      follow_up_type VARCHAR(50),
      reason TEXT,
      scheduled_date TIMESTAMP,
      reminder_sent_count INTEGER DEFAULT 0,
      last_reminder_sent TIMESTAMP,
      status VARCHAR(20) DEFAULT 'scheduled',
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### Week 9-10: Integration & Testing

- [ ] **Patient engagement dashboard**
  - Upcoming appointments
  - Follow-up reminders
  - Medication adherence
  - Health goals tracking
  - Educational content

- [ ] **Workflow automation**
  ```typescript
  // Automatic workflow triggers
  class WorkflowAutomation {
    // After vitals recorded
    onVitalsRecorded(vitals: VitalSigns): Promise<void>;
    
    // After check-in
    onCheckInComplete(checkIn: CheckIn): Promise<void>;
    
    // After appointment
    onAppointmentComplete(appointment: Appointment): Promise<void>;
  }
  ```

### API Endpoints

```
# Triage
POST   /api/triage/assess
GET    /api/triage/:id
GET    /api/triage/queue?facility=:oid

# Vitals
POST   /api/vitals/record
GET    /api/vitals/patient/:id/latest
GET    /api/vitals/patient/:id/history
POST   /api/vitals/alert

# Check-in
POST   /api/check-in/start
POST   /api/check-in/:id/complete
GET    /api/check-in/appointment/:id
POST   /api/check-in/qr/generate
POST   /api/check-in/qr/scan

# Follow-up
POST   /api/follow-up/schedule
GET    /api/follow-up/patient/:id
POST   /api/follow-up/:id/remind
POST   /api/follow-up/:id/complete
```

### Testing Requirements

- Triage algorithm accuracy testing
- Device integration testing
- Check-in workflow E2E tests
- Reminder delivery testing
- Performance testing for queue management

### Success Criteria

- ✅ Triage accuracy >90%
- ✅ Check-in time <2 minutes
- ✅ Vitals accuracy 100%
- ✅ Follow-up completion rate >80%
- ✅ Patient satisfaction >4.5/5

---

## Phase 6: AI Toolkit Integration
### AI Tools for All Stakeholders

**Timeline**: 6-8 weeks  
**Team Size**: 3-4 developers (1 frontend, 1 backend, 2 AI/ML)  
**Priority**: MEDIUM

### Goals

- ✅ AI-powered clinical decision support
- ✅ Predictive analytics
- ✅ Natural language processing
- ✅ Automated insights
- ✅ Stakeholder-specific AI tools

### Development Checklist

#### Week 1-2: AI Infrastructure

- [ ] **Setup AI services**
  ```
  services/ai-toolkit/
  ├── src/
  │   ├── models/
  │   │   ├── clinical-nlp.ts
  │   │   ├── risk-prediction.ts
  │   │   ├── diagnosis-support.ts
  │   │   └── resource-optimization.ts
  │   ├── controllers/
  │   ├── services/
  │   │   ├── openai-integration.ts
  │   │   ├── deepseek-integration.ts
  │   │   └── custom-models.ts
  │   └── routes/
  ```

- [ ] **AI model integration**
  ```typescript
  interface AIModel {
    modelId: string;
    modelType: 'nlp' | 'prediction' | 'classification' | 'generation';
    invoke(input: any): Promise<any>;
    explain(result: any): Promise<Explanation>;
  }
  ```

#### Week 3-4: Doctor AI Tools

- [ ] **Clinical decision support**
  - Differential diagnosis suggestions
  - Treatment recommendations
  - Drug interaction checking
  - Guideline compliance

- [ ] **Documentation assistance**
  - Auto-summarization
  - Code suggestion (ICD-10, CPT)
  - Template completion
  - Quality improvement suggestions

- [ ] **Research assistant**
  - Literature search
  - Evidence-based recommendations
  - Clinical trial matching

#### Week 5-6: Patient AI Tools

- [ ] **Symptom checker**
  - Interactive symptom assessment
  - Triage recommendation
  - Self-care guidance
  - Red flag identification

- [ ] **Health coaching**
  - Personalized health advice
  - Medication adherence support
  - Lifestyle recommendations
  - Appointment preparation

#### Week 7-8: Administrative AI Tools

- [ ] **Resource optimization**
  - Appointment scheduling optimization
  - Staff allocation recommendations
  - Supply chain prediction
  - Revenue cycle optimization

- [ ] **Analytics and insights**
  - Performance dashboards
  - Predictive analytics
  - Trend analysis
  - Anomaly detection

### API Endpoints

```
# Clinical AI
POST   /api/ai/diagnosis/suggest
POST   /api/ai/treatment/recommend
POST   /api/ai/drug/check-interactions
POST   /api/ai/documentation/summarize

# Patient AI
POST   /api/ai/symptoms/assess
POST   /api/ai/health/coach
GET    /api/ai/education/:topic

# Administrative AI
POST   /api/ai/schedule/optimize
GET    /api/ai/analytics/predictions
POST   /api/ai/resources/allocate
```

### Success Criteria

- ✅ AI suggestions acceptance rate >70%
- ✅ Documentation time reduced 40%
- ✅ Diagnostic accuracy improved 15%
- ✅ Patient engagement increased 30%

---

## Testing Strategy

### Unit Testing

```bash
# All services should have unit tests
npm test

# Coverage threshold: 80%
npm run test:coverage
```

### Integration Testing

```bash
# Test service interactions
npm run test:integration

# Test database operations
npm run test:db
```

### E2E Testing

```bash
# Web applications
npm run test:e2e

# Mobile applications
detox test
```

### Performance Testing

```bash
# Load testing
k6 run load-test.js

# Stress testing
artillery run stress-test.yml
```

### Security Testing

```bash
# OWASP ZAP scan
zap-cli quick-scan http://localhost:4000

# Dependency audit
npm audit

# CodeQL scanning
codeql database analyze
```

---

## Deployment Strategy

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build services
        run: npm run build
      
      - name: Deploy to production
        run: ./scripts/deploy.sh
```

### Environment Strategy

- **Development**: Local development
- **Staging**: Pre-production testing
- **Production**: Live environment

### Rollback Plan

```bash
# Rollback script
./scripts/rollback.sh <version>
```

---

## Success Metrics

### Phase 2: Basma Mobile App
- App Store rating: >4.5 stars
- Daily active users: >1000
- Voice command success rate: >90%
- Appointment booking completion: >85%

### Phase 3: Doctor's Workspace
- Documentation time reduction: >50%
- Template usage rate: >80%
- Task completion rate: >90%
- Doctor satisfaction: >4.5/5

### Phase 4: Endorsements & Handover
- Handover completion time: <24 hours
- Digital signature verification: 100%
- Audit trail completeness: 100%
- NPHIES integration success: >95%

### Phase 5: Patient Workflows
- Check-in time: <2 minutes
- Triage accuracy: >90%
- Follow-up completion: >80%
- Patient satisfaction: >4.5/5

### Phase 6: AI Toolkit
- AI suggestion accuracy: >85%
- User acceptance: >70%
- Time savings: >40%
- Clinical outcomes improvement: >10%

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 2: Basma Mobile | 6-8 weeks | Week 1 | Week 8 |
| Phase 3: Doctor Workspace | 8-10 weeks | Week 1 | Week 10 |
| Phase 4: Endorsements | 6-8 weeks | Week 9 | Week 16 |
| Phase 5: Patient Workflows | 8-10 weeks | Week 9 | Week 18 |
| Phase 6: AI Toolkit | 6-8 weeks | Week 17 | Week 24 |

**Parallel Development**: Phases 2-3 can run concurrently, followed by Phases 4-5, then Phase 6.

**Total Timeline**: 24-26 weeks (6 months)

---

## Contact & Support

For questions about this roadmap:
- Technical Lead: [Contact Info]
- Product Manager: [Contact Info]
- DevOps Team: [Contact Info]

---

**Document Status**: ✅ Ready for Development  
**Last Review**: 2026-02-17  
**Next Review**: 2026-03-17
