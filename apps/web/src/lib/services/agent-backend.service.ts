/**
 * Agent Backend Service
 * Handles communication with MASTERLINC agent microservices
 */

import { apiConfig, agentEndpoints } from "@/lib/config/api-config";
import type { Agent, Message, Workflow } from "@/lib/types";

export interface ClaimSubmission {
  claimId: string;
  patientId: string;
  providerId: string;
  services: Array<{
    code: string;
    description: string;
    amount: number;
  }>;
  totalAmount: number;
}

export interface ClaimStatus {
  claimId: string;
  status: "pending" | "processing" | "approved" | "rejected";
  updatedAt: string;
  statusMessage?: string;
}

export interface PatientRecord {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  contactInfo: Record<string, string>;
}

export interface PolicyValidation {
  policyId: string;
  valid: boolean;
  coverageDetails?: Record<string, unknown>;
  validationErrors?: string[];
}

/**
 * Agent Backend Service Class
 */
export class AgentBackendService {
  private baseHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  /**
   * ClaimLinc Agent Methods
   */
  async submitClaim(
    claim: ClaimSubmission,
  ): Promise<{ claimId: string; status: string }> {
    const response = await fetch(agentEndpoints.claimlinc.submit, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(claim),
    });

    if (!response.ok) {
      throw new Error(`Claim submission failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getClaimStatus(claimId: string): Promise<ClaimStatus> {
    const response = await fetch(
      `${agentEndpoints.claimlinc.status}/${claimId}`,
      {
        method: "GET",
        headers: this.baseHeaders,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get claim status: ${response.statusText}`);
    }

    return response.json();
  }

  async listClaims(filters?: {
    status?: string;
    providerId?: string;
  }): Promise<ClaimSubmission[]> {
    const params = new URLSearchParams(filters as Record<string, string>);
    const response = await fetch(`${agentEndpoints.claimlinc.list}?${params}`, {
      method: "GET",
      headers: this.baseHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to list claims: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * DoctorLinc Agent Methods
   */
  async getPatient(patientId: string): Promise<PatientRecord> {
    const response = await fetch(
      `${agentEndpoints.doctorlinc.patients}/${patientId}`,
      {
        method: "GET",
        headers: this.baseHeaders,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get patient: ${response.statusText}`);
    }

    return response.json();
  }

  async listPatients(): Promise<PatientRecord[]> {
    const response = await fetch(agentEndpoints.doctorlinc.patients, {
      method: "GET",
      headers: this.baseHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to list patients: ${response.statusText}`);
    }

    return response.json();
  }

  async createAppointment(appointment: {
    patientId: string;
    doctorId: string;
    dateTime: string;
    reason: string;
  }): Promise<{ appointmentId: string }> {
    const response = await fetch(agentEndpoints.doctorlinc.appointments, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(appointment),
    });

    if (!response.ok) {
      throw new Error(`Failed to create appointment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * PolicyLinc Agent Methods
   */
  async validatePolicy(
    policyId: string,
    claimData: Record<string, unknown>,
  ): Promise<PolicyValidation> {
    const response = await fetch(agentEndpoints.policylinc.validate, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify({ policyId, claimData }),
    });

    if (!response.ok) {
      throw new Error(`Policy validation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getPolicyCoverage(policyId: string): Promise<Record<string, unknown>> {
    const response = await fetch(
      `${agentEndpoints.policylinc.coverage}/${policyId}`,
      {
        method: "GET",
        headers: this.baseHeaders,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get coverage: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * AuthLinc Agent Methods
   */
  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const response = await fetch(agentEndpoints.authlinc.login, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    return response.json();
  }

  async verifyToken(
    token: string,
  ): Promise<{ valid: boolean; userId?: string }> {
    const response = await fetch(agentEndpoints.authlinc.verify, {
      method: "POST",
      headers: {
        ...this.baseHeaders,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  }

  /**
   * MasterLinc Orchestrator Methods
   */
  async listAgents(): Promise<Agent[]> {
    const response = await fetch(agentEndpoints.masterlinc.agents, {
      method: "GET",
      headers: this.baseHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`);
    }

    return response.json();
  }

  async getAgent(agentId: string): Promise<Agent> {
    const response = await fetch(
      `${agentEndpoints.masterlinc.agents}/${agentId}`,
      {
        method: "GET",
        headers: this.baseHeaders,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get agent: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(
    message: Omit<Message, "message_id" | "timestamp">,
  ): Promise<Message> {
    const response = await fetch(agentEndpoints.masterlinc.messages, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  async createWorkflow(
    workflow: Omit<Workflow, "workflow_id" | "created_at">,
  ): Promise<Workflow> {
    const response = await fetch(agentEndpoints.masterlinc.workflows, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async runWorkflow(
    workflowId: string,
  ): Promise<{ status: string; executionId: string }> {
    const response = await fetch(
      `${agentEndpoints.masterlinc.workflows}/${workflowId}/run`,
      {
        method: "POST",
        headers: this.baseHeaders,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to run workflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check for all agent services
   */
  async healthCheck(): Promise<
    Record<string, { status: string; healthy: boolean }>
  > {
    const services = {
      backend: apiConfig.backend.baseUrl,
      authlinc: apiConfig.agents.authlinc,
      claimlinc: apiConfig.agents.claimlinc,
      doctorlinc: apiConfig.agents.doctorlinc,
      policylinc: apiConfig.agents.policylinc,
      masterlinc: apiConfig.agents.masterlinc,
    };

    const results: Record<string, { status: string; healthy: boolean }> = {};

    for (const [name, baseUrl] of Object.entries(services)) {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        results[name] = {
          status: response.ok ? "healthy" : "unhealthy",
          healthy: response.ok,
        };
      } catch (error) {
        results[name] = {
          status: `error: ${error}`,
          healthy: false,
        };
      }
    }

    return results;
  }
}

// Export singleton instance
export const agentBackendService = new AgentBackendService();
