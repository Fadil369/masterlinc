/**
 * SBS Claims Management Integration
 * Handles claims processing, NPHIES submission, billing, and payments
 */

import axios from 'axios';
import { pino } from 'pino';
import type { DatabaseManager } from '../data/database.js';
import type { ServiceRegistry } from './service-registry.js';

const logger = pino({ name: 'sbs-integration' });

export interface Service {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  providerId: string;
  date: Date;
}

export interface Claim {
  claimId: string;
  patientOID: string;
  providerOID: string;
  facilityOID: string;
  services: Service[];
  totalAmount: number;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'partially_approved'
    | 'rejected'
    | 'paid';
  submittedAt?: Date;
  reviewedAt?: Date;
  paidAt?: Date;
  nphiesId?: string;
  rejectionReason?: string;
}

export interface PreAuthorization {
  preAuthId: string;
  claimId: string;
  patientOID: string;
  services: Service[];
  requestedAmount: number;
  approvedAmount?: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  validUntil?: Date;
  denialReason?: string;
}

export interface Payment {
  paymentId: string;
  claimId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'card' | 'insurance' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
}

export class SBSIntegration {
  private sbsUrl: string;
  private embedded: boolean;

  constructor(
    private registry: ServiceRegistry,
    private db?: DatabaseManager,
  ) {
    const sbsService = registry.getService('sbs-claims');
    this.sbsUrl = process.env.SBS_URL || sbsService?.url || '';
    this.embedded = process.env.SBS_EMBEDDED === 'true';
  }

  /**
   * Create new claim
   */
  async createClaim(params: {
    patientOID: string;
    providerOID: string;
    facilityOID: string;
    services: Service[];
    diagnosisCode?: string;
    scenario?: string;
  }): Promise<Claim> {
    logger.info({ patientOID: params.patientOID }, 'Creating claim');

    if (this.embedded && this.db) {
      const claimId = `claim_${Date.now()}`;
      const normalizationConfidence = Math.random() * (1 - 0.85) + 0.85;

      const services = params.services.map((s) => ({
        ...s,
        totalPrice: s.totalPrice ?? s.quantity * s.unitPrice,
        date: s.date ?? new Date(),
      }));

      const totalAmount = services.reduce((sum, s) => sum + Number(s.totalPrice), 0);

      await this.db.query(
        `INSERT INTO claims (claim_id, patient_oid, provider_oid, facility_oid, diagnosis_code, normalization_confidence, scenario, total_amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          claimId,
          params.patientOID,
          params.providerOID,
          params.facilityOID,
          params.diagnosisCode || null,
          normalizationConfidence,
          params.scenario || 'success',
          totalAmount,
          'draft',
        ],
      );

      for (const s of services) {
        await this.db.query(
          `INSERT INTO claim_services (claim_id, code, description, quantity, unit_price, total_price, provider_id, service_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [claimId, s.code, s.description, s.quantity, s.unitPrice, s.totalPrice, s.providerId, s.date],
        );
      }

      return {
        claimId,
        patientOID: params.patientOID,
        providerOID: params.providerOID,
        facilityOID: params.facilityOID,
        services,
        totalAmount,
        status: 'draft',
      };
    }

    try {
      const response = await axios.post(`${this.sbsUrl}/api/claims/create`, params, {
        timeout: 15000,
      });

      logger.info({ claimId: response.data.claimId }, 'Claim created successfully');
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create claim');
      throw new Error(`Failed to create claim: ${error.message}`);
    }
  }

  /**
   * Submit claim to NPHIES
   */
  async submitClaimToNPHIES(claimId: string): Promise<{
    success: boolean;
    nphiesId?: string;
    message?: string;
  }> {
    logger.info({ claimId }, 'Submitting claim to NPHIES');

    if (this.embedded && this.db) {
      const claimResult = await this.db.query(`SELECT claim_id, scenario FROM claims WHERE claim_id = $1`, [claimId]);
      const claim = claimResult.rows?.[0];
      if (!claim) {
        return { success: false, message: 'Claim not found' };
      }

      const scenario = claim.scenario || 'success';
      let status: Claim['status'] = 'submitted';
      let rejectionReason: string | null = null;

      if (scenario === 'nphies_rejected') {
        status = 'rejected';
        rejectionReason = 'Invalid diagnosis code for procedure';
      } else if (scenario === 'validation_error') {
        return { success: false, message: 'Validation Error: Missing provider signature' };
      } else if (scenario === 'requires_preauth') {
        status = 'under_review';
      }

      const nphiesId = `NPH-${Math.random().toString(36).substring(7).toUpperCase()}`;

      await this.db.query(
        `UPDATE claims SET status = $1, nphies_id = $2, submitted_at = NOW(), rejection_reason = $3 WHERE claim_id = $4`,
        [status, nphiesId, rejectionReason, claimId],
      );

      return {
        success: status !== 'rejected',
        nphiesId,
        message: `Claim processed with scenario: ${scenario}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.sbsUrl}/api/claims/${claimId}/submit-nphies`,
        {},
        { timeout: 30000 }, // NPHIES can be slow
      );

      logger.info({ claimId, nphiesId: response.data.nphiesId }, 'Claim submitted to NPHIES');
      return {
        success: true,
        nphiesId: response.data.nphiesId,
      };
    } catch (error: any) {
      logger.error({ error: error.message, claimId }, 'Failed to submit to NPHIES');
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Check claim status from NPHIES
   */
  async checkClaimStatus(nphiesId: string): Promise<{
    status: Claim['status'];
    approvedAmount?: number;
    rejectionReason?: string;
  }> {
    logger.info({ nphiesId }, 'Checking claim status with NPHIES');

    try {
      const response = await axios.get(`${this.sbsUrl}/api/nphies/claim-status/${nphiesId}`, {
        timeout: 15000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to check claim status');
      throw new Error(`Failed to check claim status: ${error.message}`);
    }
  }

  /**
   * Request pre-authorization
   */
  async requestPreAuth(params: {
    patientOID: string;
    services: Service[];
    expectedDate: Date;
  }): Promise<PreAuthorization> {
    logger.info({ patientOID: params.patientOID }, 'Requesting pre-authorization');

    try {
      const response = await axios.post(`${this.sbsUrl}/api/preauth/request`, params, {
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to request pre-authorization');
      throw new Error(`Failed to request pre-authorization: ${error.message}`);
    }
  }

  /**
   * Check pre-authorization status
   */
  async checkPreAuthStatus(preAuthId: string): Promise<PreAuthorization> {
    logger.info({ preAuthId }, 'Checking pre-authorization status');

    try {
      const response = await axios.get(`${this.sbsUrl}/api/preauth/${preAuthId}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to check pre-auth status');
      throw new Error(`Failed to check pre-auth status: ${error.message}`);
    }
  }

  /**
   * Process payment
   */
  async processPayment(params: {
    claimId: string;
    amount: number;
    method: Payment['method'];
    currency?: string;
  }): Promise<Payment> {
    logger.info({ claimId: params.claimId, amount: params.amount }, 'Processing payment');

    try {
      const response = await axios.post(
        `${this.sbsUrl}/api/payments/process`,
        {
          ...params,
          currency: params.currency || 'SAR',
        },
        { timeout: 15000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to process payment');
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Get claim details
   */
  async getClaimDetails(claimId: string): Promise<Claim> {
    logger.info({ claimId }, 'Fetching claim details');

    if (this.embedded && this.db) {
      const claimResult = await this.db.query(`SELECT * FROM claims WHERE claim_id = $1`, [claimId]);
      const claimRow = claimResult.rows?.[0];
      if (!claimRow) {
        throw new Error('Claim not found');
      }

      const servicesResult = await this.db.query(
        `SELECT code, description, quantity, unit_price, total_price, provider_id, service_date FROM claim_services WHERE claim_id = $1 ORDER BY service_date ASC`,
        [claimId],
      );

      const services: Service[] = (servicesResult.rows || []).map((r: any) => ({
        code: r.code,
        description: r.description,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unit_price),
        totalPrice: Number(r.total_price),
        providerId: r.provider_id,
        date: new Date(r.service_date),
      }));

      return {
        claimId: claimRow.claim_id,
        patientOID: claimRow.patient_oid,
        providerOID: claimRow.provider_oid,
        facilityOID: claimRow.facility_oid,
        services,
        totalAmount: Number(claimRow.total_amount),
        status: claimRow.status,
        nphiesId: claimRow.nphies_id || undefined,
        rejectionReason: claimRow.rejection_reason || undefined,
        submittedAt: claimRow.submitted_at || undefined,
        reviewedAt: claimRow.reviewed_at || undefined,
        paidAt: claimRow.paid_at || undefined,
      };
    }

    try {
      const response = await axios.get(`${this.sbsUrl}/api/claims/${claimId}`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch claim details');
      throw new Error(`Failed to fetch claim details: ${error.message}`);
    }
  }

  /**
   * Get patient claims history
   */
  async getPatientClaims(patientOID: string): Promise<Claim[]> {
    logger.info({ patientOID }, 'Fetching patient claims history');

    if (this.embedded && this.db) {
      const claimResult = await this.db.query(
        `SELECT claim_id, patient_oid, provider_oid, facility_oid, total_amount, status, nphies_id, rejection_reason, submitted_at, reviewed_at, paid_at
         FROM claims WHERE patient_oid = $1 ORDER BY created_at DESC`,
        [patientOID],
      );

      return (claimResult.rows || []).map((r: any) => ({
        claimId: r.claim_id,
        patientOID: r.patient_oid,
        providerOID: r.provider_oid,
        facilityOID: r.facility_oid,
        services: [],
        totalAmount: Number(r.total_amount),
        status: r.status,
        nphiesId: r.nphies_id || undefined,
        rejectionReason: r.rejection_reason || undefined,
        submittedAt: r.submitted_at || undefined,
        reviewedAt: r.reviewed_at || undefined,
        paidAt: r.paid_at || undefined,
      }));
    }

    try {
      const response = await axios.get(`${this.sbsUrl}/api/claims/patient/${patientOID}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch patient claims');
      return [];
    }
  }

  /**
   * Generate invoice
   */
  async generateInvoice(claimId: string): Promise<{ invoiceUrl: string; invoiceNumber: string }> {
    logger.info({ claimId }, 'Generating invoice');

    try {
      const response = await axios.post(
        `${this.sbsUrl}/api/claims/${claimId}/generate-invoice`,
        {},
        { timeout: 10000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate invoice');
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * Get billing statistics
   */
  async getBillingStatistics(params: {
    startDate: Date;
    endDate: Date;
    facilityOID?: string;
  }): Promise<any> {
    logger.info({ startDate: params.startDate, endDate: params.endDate }, 'Fetching billing stats');

    try {
      const response = await axios.get(`${this.sbsUrl}/api/statistics/billing`, {
        params,
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch billing statistics');
      return null;
    }
  }
}
