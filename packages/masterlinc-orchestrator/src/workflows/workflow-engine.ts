/**
 * Workflow Orchestration Engine
 * Manages end-to-end patient journey workflows from call to claims submission
 */

import { pino } from 'pino';
import type { BasmaIntegration } from '../services/basma-integration.js';
import type { HealthcareIntegration, Patient, Appointment } from '../services/healthcare-integration.js';
import type { OIDIntegration } from '../services/oid-integration.js';
import type { SBSIntegration, Claim } from '../services/sbs-integration.js';
import type { DatabaseManager } from '../data/database.js';

const logger = pino({ name: 'workflow-engine' });

export type WorkflowPhase = 'intake' | 'triage' | 'booking' | 'service' | 'claims' | 'completed';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowState {
  workflowId: string;
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
  ) {}

  /**
   * Start new workflow from incoming call
   */
  async startWorkflowFromCall(callId: string, from: string): Promise<WorkflowState> {
    logger.info({ callId, from }, 'Starting new workflow from call');

    const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow: WorkflowState = {
      workflowId,
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

    // Save to database
    await this.saveWorkflowState(workflow);

    // Start intake phase
    await this.executeIntakePhase(workflow);

    return workflow;
  }

  /**
   * Phase 1: Intake - Call routing and patient identification
   */
  private async executeIntakePhase(workflow: WorkflowState): Promise<void> {
    logger.info({ workflowId: workflow.workflowId }, 'Executing intake phase');

    try {
      const { callId, from } = workflow.data.call!;

      // Get call transcript
      const transcript = await this.basma.getCallTranscript(callId);
      workflow.data.call!.transcript = transcript;

      // Analyze intent
      const intentAnalysis = await this.basma.analyzeCallIntent(transcript);
      workflow.data.call!.intent = intentAnalysis.intent;

      // Lookup or create patient
      let patient = await this.healthcare.getPatientByPhone(from);
      
      if (!patient) {
        logger.info({ phone: from }, 'New patient - creating record');
        patient = await this.healthcare.upsertPatient({
          phone: from,
          firstName: 'New',
          lastName: 'Patient',
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other',
        });
      }

      workflow.patientId = patient.id;
      workflow.patientOID = patient.oid;

      // Ensure patient has OID
      if (!workflow.patientOID) {
        const oidRecord = await this.oid.generateOID({
          entityType: 'patient',
          entityId: patient.id,
          metadata: { phone: from },
        });
        workflow.patientOID = oidRecord.oid;
        
        // Update patient with OID
        await this.healthcare.upsertPatient({
          ...patient,
          oid: oidRecord.oid,
        });
      }

      // Route call based on intent
      const routing = await this.basma.routeCall(callId, {
        intent: intentAnalysis.intent,
        patientId: patient.id,
      });

      logger.info({ routing }, 'Call routed successfully');

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
   * Phase 2: Triage - Symptom assessment and severity determination
   */
  private async executeTriagePhase(workflow: WorkflowState): Promise<void> {
    logger.info({ workflowId: workflow.workflowId }, 'Executing triage phase');

    try {
      const transcript = workflow.data.call?.transcript || '';
      
      // Extract symptoms from transcript (simplified)
      const symptoms = this.extractSymptoms(transcript);

      // Perform AI triage
      const triageResult = await this.healthcare.performTriage({
        patientId: workflow.patientId!,
        symptoms,
        chiefComplaint: transcript.substring(0, 200),
      });

      workflow.data.triage = {
        symptoms: triageResult.symptoms,
        severity: triageResult.severity,
        assessment: triageResult.assessment,
      };

      logger.info({ severity: triageResult.severity }, 'Triage assessment completed');

      // Send SMS notification
      await this.basma.sendSMS({
        to: workflow.data.call!.from,
        message: `Triage complete. Severity: ${triageResult.severity}. ${triageResult.recommendedAction}`,
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
      const department = this.selectDepartment(workflow.data.triage?.symptoms || []);

      // Check availability
      const availableSlots = await this.healthcare.checkAvailability({
        department,
        date: new Date(),
        duration: 30,
      });

      if (availableSlots.length === 0) {
        logger.warn('No available slots found');
        workflow.status = 'failed';
        await this.saveWorkflowState(workflow);
        return;
      }

      // Book appointment
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

      logger.info({ appointmentId: appointment.id }, 'Appointment booked successfully');

      // Send confirmation SMS
      await this.basma.sendSMS({
        to: workflow.data.call!.from,
        message: `Appointment confirmed for ${appointment.datetime.toLocaleString()} at ${department}`,
      });

      // Transition to service (waiting for appointment)
      await this.transitionPhase(workflow, 'service', 'booking_completed');
      
      // Workflow pauses here until service is completed
      workflow.status = 'pending';
      await this.saveWorkflowState(workflow);

    } catch (error: any) {
      logger.error({ error: error.message }, 'Booking phase failed');
      workflow.status = 'failed';
      await this.saveWorkflowState(workflow);
    }
  }

  /**
   * Phase 4: Service - Medical service delivery (triggered externally)
   */
  async completeServicePhase(workflowId: string, services: Array<{
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>): Promise<void> {
    logger.info({ workflowId }, 'Completing service phase');

    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      logger.error({ workflowId }, 'Workflow not found');
      return;
    }

    workflow.status = 'in_progress';
    await this.transitionPhase(workflow, 'claims', 'service_completed');
    await this.executeClaimsPhase(workflow, services);
  }

  /**
   * Phase 5: Claims - Claims generation and NPHIES submission
   */
  private async executeClaimsPhase(workflow: WorkflowState, services: any[]): Promise<void> {
    logger.info({ workflowId: workflow.workflowId }, 'Executing claims phase');

    try {
      // Prepare service data
      const serviceData = services.map((s) => ({
        ...s,
        totalPrice: s.quantity * s.unitPrice,
        providerId: 'provider-001',
        date: new Date(),
      }));

      // Create claim
      const claim = await this.sbs.createClaim({
        patientOID: workflow.patientOID!,
        providerOID: 'provider-oid-001',
        facilityOID: 'facility-oid-001',
        services: serviceData,
      });

      workflow.data.claim = {
        claimId: claim.claimId,
        amount: claim.totalAmount,
        status: claim.status,
      };

      logger.info({ claimId: claim.claimId }, 'Claim created');

      // Submit to NPHIES
      const nphiesResult = await this.sbs.submitClaimToNPHIES(claim.claimId);
      
      if (nphiesResult.success) {
        workflow.data.claim.nphiesId = nphiesResult.nphiesId;
        logger.info({ nphiesId: nphiesResult.nphiesId }, 'Claim submitted to NPHIES');

        // Generate invoice
        const invoice = await this.sbs.generateInvoice(claim.claimId);
        
        // Send SMS with invoice
        await this.basma.sendSMS({
          to: workflow.data.call!.from,
          message: `Your invoice #${invoice.invoiceNumber} is ready. Total: ${claim.totalAmount} SAR`,
        });
      }

      // Transition to completed
      await this.transitionPhase(workflow, 'completed', 'claims_completed');
      workflow.status = 'completed';
      await this.saveWorkflowState(workflow);

      logger.info({ workflowId: workflow.workflowId }, 'Workflow completed successfully');

    } catch (error: any) {
      logger.error({ error: error.message }, 'Claims phase failed');
      workflow.status = 'failed';
      await this.saveWorkflowState(workflow);
    }
  }

  /**
   * Transition between phases
   */
  private async transitionPhase(
    workflow: WorkflowState,
    toPhase: WorkflowPhase,
    trigger: string,
  ): Promise<void> {
    const transition = {
      from: workflow.currentPhase,
      to: toPhase,
      timestamp: new Date(),
      trigger,
    };

    workflow.transitions.push(transition);
    workflow.currentPhase = toPhase;
    workflow.updatedAt = new Date();

    logger.info({ transition }, 'Phase transition');
    await this.saveWorkflowState(workflow);
  }

  /**
   * Save workflow state to database
   */
  private async saveWorkflowState(workflow: WorkflowState): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO workflow_states (workflow_id, patient_id, current_phase, status, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (workflow_id) 
         DO UPDATE SET current_phase = $3, status = $4, data = $5, updated_at = $7`,
        [
          workflow.workflowId,
          workflow.patientId,
          workflow.currentPhase,
          workflow.status,
          JSON.stringify(workflow.data),
          workflow.createdAt,
          workflow.updatedAt,
        ],
      );

      // Also cache in Redis for fast access
      await this.db.cacheSetJSON(`workflow:${workflow.workflowId}`, workflow, 3600);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to save workflow state');
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowState | null> {
    // Try cache first
    const cached = await this.db.cacheGetJSON<WorkflowState>(`workflow:${workflowId}`);
    if (cached) return cached;

    // Try active workflows
    const active = this.activeWorkflows.get(workflowId);
    if (active) return active;

    // Query database
    try {
      const result = await this.db.query(
        'SELECT * FROM workflow_states WHERE workflow_id = $1',
        [workflowId],
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          workflowId: row.workflow_id,
          patientId: row.patient_id,
          currentPhase: row.current_phase,
          status: row.status,
          data: row.data,
          transitions: [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch workflow');
    }

    return null;
  }

  /**
   * Get all workflows for a patient
   */
  async getPatientWorkflows(patientId: string): Promise<WorkflowState[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM workflow_states WHERE patient_id = $1 ORDER BY created_at DESC',
        [patientId],
      );

      return result.rows.map((row: any) => ({
        workflowId: row.workflow_id,
        patientId: row.patient_id,
        currentPhase: row.current_phase,
        status: row.status,
        data: row.data,
        transitions: [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch patient workflows');
      return [];
    }
  }

  /**
   * Helper: Extract symptoms from transcript
   */
  private extractSymptoms(transcript: string): string[] {
    const commonSymptoms = [
      'fever', 'cough', 'headache', 'pain', 'nausea', 'vomiting',
      'diarrhea', 'fatigue', 'shortness of breath', 'chest pain',
      'dizziness', 'rash', 'swelling'
    ];

    const found = commonSymptoms.filter((symptom) =>
      transcript.toLowerCase().includes(symptom),
    );

    return found.length > 0 ? found : ['general discomfort'];
  }

  /**
   * Helper: Select department based on symptoms
   */
  private selectDepartment(symptoms: string[]): string {
    if (symptoms.some((s) => s.includes('chest') || s.includes('heart'))) {
      return 'cardiology';
    }
    if (symptoms.some((s) => s.includes('head') || s.includes('brain'))) {
      return 'neurology';
    }
    if (symptoms.some((s) => s.includes('bone') || s.includes('joint'))) {
      return 'orthopedics';
    }
    return 'general-practice';
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT 
          current_phase,
          status,
          COUNT(*) as count
        FROM workflow_states
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY current_phase, status
      `);

      return {
        totalActive: this.activeWorkflows.size,
        last24Hours: result.rows,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch statistics');
      return null;
    }
  }
}
