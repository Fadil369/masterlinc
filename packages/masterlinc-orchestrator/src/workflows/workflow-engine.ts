/**
 * Workflow Orchestration Engine
 * Manages end-to-end patient journey workflows from call to claims submission
 */

import { pino } from 'pino';
import type { BasmaIntegration } from '../services/basma-integration.js';
import type { HealthcareIntegration, Patient } from '../services/healthcare-integration.js';
import type { OIDIntegration } from '../services/oid-integration.js';
import type { SBSIntegration } from '../services/sbs-integration.js';
import type { DatabaseManager } from '../data/database.js';
import type { NlpService, ExtractedHealthData } from '../services/nlp-service.js';

const logger = pino({ name: 'workflow-engine' });

export type Domain = 'healthcare' | 'business' | 'tech' | 'personal';
export type WorkflowPhase = 'intake' | 'triage' | 'analysis' | 'booking' | 'service' | 'claims' | 'completed';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowState {
  workflowId: string;
  domain: Domain;
  patientId?: string;
  patientOID?: string;
  currentPhase: WorkflowPhase;
  status: WorkflowStatus;
  data: {
    call?: {
      callId: string;
      from: string;
      transcript?: string;
      intent?: string;
      sentiment?: string;
      summary?: string;
    };
    triage?: {
      symptoms: string[];
      severity: 'emergency' | 'urgent' | 'routine';
      assessment: string;
    };
    appointment?: {
      appointmentId: string;
      doctorId: string;
      datetime: Date;
      department: string;
    };
    oid?: {
      oid: string;
      credentialId?: string;
    };
    claim?: {
      claimId: string;
      nphiesId?: string;
      amount: number;
      status: string;
    };
    analysis?: {
      entities: Record<string, string>;
      recommendation: string;
    };
  };
  transitions: Array<{
    from: WorkflowPhase;
    to: WorkflowPhase;
    timestamp: Date;
    trigger: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowEngine {
  private activeWorkflows: Map<string, WorkflowState> = new Map();

  constructor(
    private basma: BasmaIntegration,
    private healthcare: HealthcareIntegration,
    private oid: OIDIntegration,
    private sbs: SBSIntegration,
    private db: DatabaseManager,
    private nlp: NlpService,
  ) {}

  /**
   * Start new workflow from incoming call
   */
  async startWorkflowFromCall(callId: string, from: string, domain: Domain = 'healthcare'): Promise<WorkflowState> {
    logger.info({ callId, from, domain }, 'Starting new workflow from call');

    const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow: WorkflowState = {
      workflowId,
      domain,
      currentPhase: 'intake',
      status: 'in_progress',
      data: {
        call: {
          callId,
          from,
        },
      },
      transitions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeWorkflows.set(workflowId, workflow);
    await this.saveWorkflowState(workflow);

    // Execute based on domain
    if (domain === 'healthcare') {
      await this.executeIntakePhase(workflow);
    } else {
      await this.executeGenericPhase(workflow);
    }

    return workflow;
  }

  /**
   * Phase 1: Intake - Call routing and patient identification (Intelligent)
   */
  private async executeIntakePhase(workflow: WorkflowState): Promise<void> {
    logger.info({ workflowId: workflow.workflowId }, 'Executing intelligent intake phase');

    try {
      const { callId, from } = workflow.data.call!;

      // 1. Get call transcript
      const transcript = await this.basma.getCallTranscript(callId);
      workflow.data.call!.transcript = transcript;

      // 2. Intelligent NLP Analysis
      const analysis = await this.nlp.analyzeTranscript(transcript);
      workflow.data.call!.intent = analysis.intent;
      workflow.data.call!.summary = analysis.summary;

      // 3. Lookup or create patient
      let patient = await this.healthcare.getPatientByPhone(from);
      
      if (!patient) {
        logger.info({ phone: from }, 'New patient - creating record');
        patient = await this.healthcare.upsertPatient({
          phone: from,
          firstName: analysis.entities.name || 'New',
          lastName: 'Patient',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'other',
        });
      }

      workflow.patientId = patient.id;
      workflow.patientOID = patient.oid;

      // 4. Ensure patient has OID
      if (!workflow.patientOID) {
        const oidRecord = await this.oid.generateOID({
          entityType: 'patient',
          entityId: patient.id,
          metadata: { phone: from },
        });
        workflow.patientOID = oidRecord.oid;
        
        await this.healthcare.upsertPatient({
          ...patient,
          oid: oidRecord.oid,
        });
      }

      // 5. Route call based on intent
      await this.basma.routeCall(callId, {
        intent: analysis.intent,
        patientId: patient.id,
      });

      // Update Triage data early if we have it from NLP
      workflow.data.triage = {
        symptoms: analysis.symptoms,
        severity: analysis.severity,
        assessment: analysis.summary,
      };

      // Transition to triage
      await this.transitionPhase(workflow, 'triage', 'intake_completed');
      await this.executeTriagePhase(workflow);

    } catch (error: any) {
      logger.error({ error: error.message }, 'Intake phase failed');
      workflow.status = 'failed';
      await this.saveWorkflowState(workflow);
    }
  }

  /**
   * Phase 2: Triage - Symptom assessment (Leveraging NLP results)
   */
  private async executeTriagePhase(workflow: WorkflowState): Promise<void> {
    logger.info({ workflowId: workflow.workflowId }, 'Executing triage phase');

    try {
      const triage = workflow.data.triage!;
      
      // Perform deeper AI triage via healthcare integration
      const triageResult = await this.healthcare.performTriage({
        patientId: workflow.patientId!,
        symptoms: triage.symptoms,
        chiefComplaint: workflow.data.call?.transcript?.substring(0, 500) || '',
      });

      workflow.data.triage = {
        symptoms: triageResult.symptoms,
        severity: triageResult.severity,
        assessment: triageResult.assessment,
      };

      // Notify patient
      await this.basma.sendSMS({
        to: workflow.data.call!.from,
        message: `MasterLinc: Assessment complete. Action: ${triageResult.recommendedAction}.`,
      });

      // Transition to booking
      await this.transitionPhase(workflow, 'booking', 'triage_completed');
      await this.executeBookingPhase(workflow);

    } catch (error: any) {
      logger.error({ error: error.message }, 'Triage phase failed');
      workflow.status = 'failed';
      await this.saveWorkflowState(workflow);
    }
  }

  /**
   * Phase 3: Booking - Appointment scheduling
   */
  private async executeBookingPhase(workflow: WorkflowState): Promise<void> {
    logger.info({ workflowId: workflow.workflowId }, 'Executing booking phase');

    try {
      const severity = workflow.data.triage?.severity || 'routine';
      const department = this.nlpSelectDepartment(workflow.data.triage?.symptoms || []);

      const availableSlots = await this.healthcare.checkAvailability({
        department,
        date: new Date(),
        duration: 30,
      });

      if (availableSlots.length === 0) {
        workflow.status = 'failed';
        await this.saveWorkflowState(workflow);
        return;
      }

      const appointment = await this.healthcare.bookAppointment({
        patientId: workflow.patientId!,
        doctorId: 'doctor-auto-assigned',
        datetime: availableSlots[0],
        type: severity === 'emergency' ? 'emergency' : 'consultation',
        department,
        notes: workflow.data.triage?.assessment,
      });

      workflow.data.appointment = {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        datetime: appointment.datetime,
        department: appointment.department,
      };

      await this.basma.sendSMS({
        to: workflow.data.call!.from,
        message: `Appointment confirmed for ${appointment.datetime.toLocaleString()} at ${department}`,
      });

      await this.transitionPhase(workflow, 'service', 'booking_completed');
      workflow.status = 'pending'; // Waiting for physical service
      await this.saveWorkflowState(workflow);

    } catch (error: any) {
      logger.error({ error: error.message }, 'Booking phase failed');
      workflow.status = 'failed';
      await this.saveWorkflowState(workflow);
    }
  }

  /**
   * Handle generic phases for other domains
   */
  private async executeGenericPhase(workflow: WorkflowState): Promise<void> {
    logger.info({ workflowId: workflow.workflowId, domain: workflow.domain }, 'Executing generic phase');
    // Implementation for Business, Tech, Personal domains would go here
    // For now, we analyze and complete
    const transcript = await this.basma.getCallTranscript(workflow.data.call!.callId);
    const analysis = await this.nlp.analyzeTranscript(transcript);
    
    workflow.data.analysis = {
      entities: analysis.entities,
      recommendation: analysis.summary,
    };
    
    await this.transitionPhase(workflow, 'completed', 'generic_analysis_completed');
    workflow.status = 'completed';
    await this.saveWorkflowState(workflow);
  }

  /**
   * Phase 4/5: Service & Claims (Automated)
   */
  async completeServicePhase(workflowId: string, services: any[]): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    workflow.status = 'in_progress';
    await this.transitionPhase(workflow, 'claims', 'service_completed');
    
    try {
      const claim = await this.sbs.createClaim({
        patientOID: workflow.patientOID!,
        providerOID: 'provider-oid-001',
        facilityOID: 'facility-oid-001',
        services,
      });

      workflow.data.claim = {
        claimId: claim.claimId,
        amount: claim.totalAmount,
        status: claim.status,
      };

      const nphiesResult = await this.sbs.submitClaimToNPHIES(claim.claimId);
      if (nphiesResult.success) {
        workflow.data.claim.nphiesId = nphiesResult.nphiesId;
      }

      await this.transitionPhase(workflow, 'completed', 'claims_completed');
      workflow.status = 'completed';
      await this.saveWorkflowState(workflow);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Claims phase failed');
      workflow.status = 'failed';
      await this.saveWorkflowState(workflow);
    }
  }

  private async transitionPhase(workflow: WorkflowState, toPhase: WorkflowPhase, trigger: string): Promise<void> {
    workflow.transitions.push({
      from: workflow.currentPhase,
      to: toPhase,
      timestamp: new Date(),
      trigger,
    });
    workflow.currentPhase = toPhase;
    workflow.updatedAt = new Date();
    await this.saveWorkflowState(workflow);
  }

  private async saveWorkflowState(workflow: WorkflowState): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO workflow_states (workflow_id, domain, patient_id, current_phase, status, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (workflow_id) DO UPDATE SET current_phase = $4, status = $5, data = $6, updated_at = $7`,
        [workflow.workflowId, workflow.domain, workflow.patientId, workflow.currentPhase, workflow.status, JSON.stringify(workflow.data), workflow.updatedAt]
      );
      await this.db.cacheSetJSON(`workflow:${workflow.workflowId}`, workflow, 3600);
    } catch (e) {
      logger.error('Failed to save state');
    }
  }

  async getWorkflow(workflowId: string): Promise<WorkflowState | null> {
    const cached = await this.db.cacheGetJSON<WorkflowState>(`workflow:${workflowId}`);
    if (cached) return cached;
    return this.activeWorkflows.get(workflowId) || null;
  }

  async getPatientWorkflows(patientId: string): Promise<WorkflowState[]> {
    const result = await this.db.query('SELECT * FROM workflow_states WHERE patient_id = $1', [patientId]);
    return result.rows;
  }

  async getStatistics(): Promise<any> {
    return { active: this.activeWorkflows.size };
  }

  private nlpSelectDepartment(symptoms: string[]): string {
    const map: Record<string, string> = {
      chest: 'cardiology', head: 'neurology', bone: 'orthopedics', joint: 'orthopedics'
    };
    for (const s of symptoms) {
      for (const k in map) {
        if (s.toLowerCase().includes(k)) return map[k];
      }
    }
    return 'general-practice';
  }
}
