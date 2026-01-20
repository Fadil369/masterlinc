/**
 * SBS Integration Service
 * Handles communication with SBS microservices (Normalizer, Signer, Financial Rules, NPHIES Bridge)
 */

import { apiConfig, sbsEndpoints } from "@/lib/config/api-config";

export interface ClaimNormalizationRequest {
  claimId: string;
  sourceSystem: string;
  sourceCode: string;
  targetSystem: string;
}

export interface ClaimNormalizationResponse {
  claimId: string;
  normalizedCode: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentSignRequest {
  documentId: string;
  content: string;
  signerInfo: {
    name: string;
    role: string;
    credentials: string;
  };
}

export interface DocumentSignResponse {
  documentId: string;
  signature: string;
  signedAt: string;
  certificate: string;
}

export interface FinancialRulesRequest {
  claimId: string;
  amount: number;
  serviceCode: string;
  patientInfo: Record<string, unknown>;
}

export interface FinancialRulesResponse {
  approved: boolean;
  approvedAmount: number;
  denialReason?: string;
  appliedRules: string[];
}

export interface NPHIESSubmissionRequest {
  claimId: string;
  claimData: Record<string, unknown>;
  signature: string;
}

export interface NPHIESSubmissionResponse {
  submissionId: string;
  status: "submitted" | "accepted" | "rejected" | "error";
  nphiesClaimId?: string;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatHttpError(response: Response, body: unknown): string {
  if (isRecord(body)) {
    const message =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      (typeof body.detail === "string" && body.detail) ||
      "";
    if (message) return `${response.status} ${response.statusText}: ${message}`;
  }
  return `${response.status} ${response.statusText}`;
}

/**
 * SBS Service Integration Class
 */
export class SBSService {
  private baseHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  /**
   * Normalize claim codes using AI-powered SBS Normalizer
   */
  async normalizeClaim(
    request: ClaimNormalizationRequest,
  ): Promise<ClaimNormalizationResponse> {
    if (!apiConfig.features.sbsIntegration) {
      throw new Error("SBS Integration is disabled");
    }

    const response = await fetch(sbsEndpoints.normalizer.normalize, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const body = await readJsonSafe(response);
      throw new Error(
        `Normalizer service error: ${formatHttpError(response, body)}`,
      );
    }

    return response.json();
  }

  /**
   * Translate medical codes between coding systems
   */
  async translateCode(
    sourceCode: string,
    sourceSystem: string,
    targetSystem: string,
  ): Promise<string> {
    const response = await fetch(sbsEndpoints.normalizer.codes, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify({ sourceCode, sourceSystem, targetSystem }),
    });

    if (!response.ok) {
      const body = await readJsonSafe(response);
      throw new Error(
        `Code translation error: ${formatHttpError(response, body)}`,
      );
    }

    const data = await response.json();
    return data.targetCode;
  }

  /**
   * Sign document digitally using SBS Signer
   */
  async signDocument(
    request: DocumentSignRequest,
  ): Promise<DocumentSignResponse> {
    const response = await fetch(sbsEndpoints.signer.sign, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const body = await readJsonSafe(response);
      throw new Error(
        `Signer service error: ${formatHttpError(response, body)}`,
      );
    }

    return response.json();
  }

  /**
   * Verify document signature
   */
  async verifySignature(
    documentId: string,
    signature: string,
  ): Promise<boolean> {
    const response = await fetch(sbsEndpoints.signer.verify, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify({ documentId, signature }),
    });

    if (!response.ok) {
      const body = await readJsonSafe(response);
      throw new Error(
        `Signature verification error: ${formatHttpError(response, body)}`,
      );
    }

    const data = await response.json();
    return data.valid;
  }

  /**
   * Apply CHI financial rules to claim
   */
  async applyFinancialRules(
    request: FinancialRulesRequest,
  ): Promise<FinancialRulesResponse> {
    const response = await fetch(sbsEndpoints.financialRules.apply, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const body = await readJsonSafe(response);
      throw new Error(
        `Financial rules error: ${formatHttpError(response, body)}`,
      );
    }

    return response.json();
  }

  /**
   * Validate claim against financial rules
   */
  async validateClaim(
    claimId: string,
    claimData: Record<string, unknown>,
  ): Promise<boolean> {
    const response = await fetch(sbsEndpoints.financialRules.validate, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify({ claimId, claimData }),
    });

    if (!response.ok) {
      const body = await readJsonSafe(response);
      throw new Error(
        `Claim validation error: ${formatHttpError(response, body)}`,
      );
    }

    const data = await response.json();
    return data.valid;
  }

  /**
   * Submit claim to NPHIES through bridge service
   */
  async submitToNPHIES(
    request: NPHIESSubmissionRequest,
  ): Promise<NPHIESSubmissionResponse> {
    const response = await fetch(sbsEndpoints.nphiesBridge.submit, {
      method: "POST",
      headers: this.baseHeaders,
      body: JSON.stringify(request),
    });

    const body = await readJsonSafe(response);

    if (!response.ok) {
      throw new Error(
        `NPHIES submission error: ${formatHttpError(response, body)}`,
      );
    }

    // SBS bridge may return HTTP 200 but `status=error` for upstream/config issues.
    if (isRecord(body) && typeof body.status === "string") {
      const statusValue = body.status.toLowerCase();
      if (statusValue === "error") {
        const message =
          (typeof body.error === "string" && body.error) ||
          (typeof body.message === "string" && body.message) ||
          (typeof body.detail === "string" && body.detail) ||
          "NPHIES bridge returned status=error";
        throw new Error(message);
      }
    }

    return (body ?? {}) as NPHIESSubmissionResponse;
  }

  /**
   * Check NPHIES claim status
   */
  async getNPHIESStatus(
    submissionId: string,
  ): Promise<NPHIESSubmissionResponse> {
    const response = await fetch(
      `${sbsEndpoints.nphiesBridge.status}/${submissionId}`,
      {
        method: "GET",
        headers: this.baseHeaders,
      },
    );

    if (!response.ok) {
      throw new Error(`NPHIES status check error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Complete SBS workflow: Normalize → Validate → Sign → Submit
   */
  async processClaimWorkflow(
    claimId: string,
    claimData: Record<string, unknown>,
  ): Promise<{
    normalized: ClaimNormalizationResponse;
    rulesApplied: FinancialRulesResponse;
    signed: DocumentSignResponse;
    submitted: NPHIESSubmissionResponse;
  }> {
    // Step 1: Normalize claim codes
    const normalized = await this.normalizeClaim({
      claimId,
      sourceSystem: "local",
      sourceCode: (claimData.code as string) || "",
      targetSystem: "CHI",
    });

    // Step 2: Apply financial rules
    const rulesApplied = await this.applyFinancialRules({
      claimId,
      amount: (claimData.amount as number) || 0,
      serviceCode: normalized.normalizedCode,
      patientInfo: claimData.patient as Record<string, unknown>,
    });

    if (!rulesApplied.approved) {
      throw new Error(`Claim denied: ${rulesApplied.denialReason}`);
    }

    // Step 3: Sign the claim document
    const signed = await this.signDocument({
      documentId: claimId,
      content: JSON.stringify(claimData),
      signerInfo: {
        name: "System",
        role: "ClaimProcessor",
        credentials: "auto",
      },
    });

    // Step 4: Submit to NPHIES
    const submitted = await this.submitToNPHIES({
      claimId,
      claimData,
      signature: signed.signature,
    });

    return { normalized, rulesApplied, signed, submitted };
  }

  /**
   * Health check for all SBS services
   */
  async healthCheck(): Promise<
    Record<string, { status: string; healthy: boolean }>
  > {
    const services = {
      normalizer: apiConfig.sbs.normalizer,
      signer: apiConfig.sbs.signer,
      financialRules: apiConfig.sbs.financialRules,
      nphiesBridge: apiConfig.sbs.nphiesBridge,
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
export const sbsService = new SBSService();
