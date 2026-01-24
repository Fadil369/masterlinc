// Shared TypeScript types for BrainSAIT monorepo

// ============================================
// Agent Types
// ============================================

export type AgentStatus = 'online' | 'offline' | 'degraded' | 'maintenance';

export type AgentCapability =
  | 'orchestration'
  | 'routing'
  | 'workflows'
  | 'validation'
  | 'analysis'
  | 'patterns'
  | 'clinical_support'
  | 'policy_interpretation'
  | 'code_generation'
  | 'authentication';

export interface Agent {
  agentId: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  endpoint: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  priority: number;
  version: string;
  category: string;
  metadata?: Record<string, unknown>;
  lastHeartbeat?: Date;
}

// ============================================
// Task Delegation Types
// ============================================

export interface DelegationRequest {
  taskDescription: string;
  taskDescriptionAr?: string;
  context?: Record<string, unknown>;
  preferredAgent?: string;
  priority?: number;
  timeout?: number;
}

export interface DelegationResponse {
  taskId: string;
  assignedAgent: string;
  status: string;
  estimatedCompletion?: Date;
  message: string;
  messageAr?: string;
}

// ============================================
// Workflow Types
// ============================================

export interface WorkflowStep {
  stepId: string;
  agentId: string;
  action: string;
  inputData?: Record<string, unknown>;
  dependsOn?: string[];
  timeout?: number;
}

export interface WorkflowExecutionRequest {
  workflowName: string;
  workflowDescription: string;
  steps: WorkflowStep[];
  executionMode: 'sequential' | 'parallel' | 'mixed';
  context?: Record<string, unknown>;
}

export interface WorkflowExecutionResponse {
  workflowId: string;
  status: string;
  stepsCompleted: number;
  stepsTotal: number;
  results: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
}

// ============================================
// Claim Types
// ============================================

export interface ValidationLayer {
  layer: string;
  passed: boolean;
  issues: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface ClaimValidationRequest {
  claimResource: Record<string, unknown>;
  validationLevel?: 'basic' | 'standard' | 'full';
}

export interface ClaimValidationResponse {
  validationId: string;
  isValid: boolean;
  layers: ValidationLayer[];
  summary: string;
  summaryAr?: string;
  timestamp: Date;
}

export interface RejectionAnalysisRequest {
  claimId: string;
  rejectionCode: string;
  rejectionDescription?: string;
  claimData?: Record<string, unknown>;
}

export interface RejectionAnalysisResponse {
  analysisId: string;
  rootCause: string;
  rootCauseAr?: string;
  recommendations: string[];
  recommendationsAr?: string[];
  confidenceScore: number;
  estimatedFixTime?: number;
}

// ============================================
// Eligibility Types
// ============================================

export interface EligibilityCheckRequest {
  patientId: string;
  payerId: string;
  serviceDate?: string;
  serviceType?: string;
}

export interface EligibilityCheckResponse {
  eligibilityId: string;
  isEligible: boolean;
  coverageDetails: Record<string, unknown>;
  coverageDetailsAr?: Record<string, unknown>;
}

// ============================================
// Health Check Types
// ============================================

export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  timestamp: Date;
  services?: Record<string, string>;
}

// ============================================
// Error Types
// ============================================

export interface ErrorResponse {
  error: string;
  message: string;
  messageAr?: string;
  details?: Record<string, unknown>;
}

// ============================================
// FHIR Types (Minimal)
// ============================================

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface FHIRClaim extends FHIRResource {
  resourceType: 'Claim';
  status: string;
  type: {
    coding: Array<{
      system: string;
      code: string;
    }>;
  };
  patient: {
    reference: string;
  };
  provider: {
    reference: string;
  };
  insurer?: {
    reference: string;
  };
  total?: {
    value: number;
    currency: string;
  };
}

// ============================================
// Audit Types
// ============================================

export interface AuditEvent {
  eventId: string;
  timestamp: Date;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  actorRole: string;
  outcome: 'success' | 'failure' | 'error';
  details?: Record<string, unknown>;
}

