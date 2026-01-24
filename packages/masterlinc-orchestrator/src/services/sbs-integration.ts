/**
 * SBS Claims Management Integration
 * Handles claims processing, NPHIES submission, billing, and payments
 */

import axios from 'axios';
import { pino } from 'pino';
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

  constructor(private registry: ServiceRegistry) {
    const sbsService = registry.getService('sbs-claims');
    this.sbsUrl = sbsService?.url || '';
  }

  /**
   * Create new claim
   */
  async createClaim(params: {
    patientOID: string;
    providerOID: string;
    facilityOID: string;
    services: Service[];
  }): Promise<Claim> {
    logger.info({ patientOID: params.patientOID }, 'Creating claim');

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
