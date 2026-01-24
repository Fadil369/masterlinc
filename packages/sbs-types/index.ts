/**
 * SBS Unified Types
 * Shared between SBS Worker, MasterLinc Orchestrator, and Frontend
 */

export type ClaimStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'partially_approved' 
  | 'rejected' 
  | 'paid';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'insurance' 
  | 'bank_transfer';

export interface SbsService {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  providerId: string;
  date: string; // ISO string
  normalizationScore?: number;
  bundleApplied?: string; // ID of the bundle if applicable
}

export interface BundleDefinition {
  id: string;
  name: string;
  services: string[]; // List of service codes
  price: number;
  savings: number;
}

export interface SbsClaim {
  claimId: string;
  patientOID: string;
  providerOID: string;
  facilityOID: string;
  diagnosisCode: string; // ICD-10
  diagnosisDisplay?: string;
  services: SbsService[];
  totalAmount: number;
  status: ClaimStatus;
  nphiesId?: string;
  rejectionReason?: string;
  digitalSignature?: string;
  normalizationConfidence?: number;
  scenario?: 'success' | 'normalization_failed' | 'bundle_applied' | 'high_value_claim' | 'multi_service' | 'requires_preauth' | 'validation_error' | 'nphies_rejected';
  submittedAt?: string;
  reviewedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SbsPayment {
  paymentId: string;
  claimId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
}

export interface ClaimCreateRequest {
  patientOID: string;
  providerOID: string;
  facilityOID: string;
  diagnosisCode: string;
  scenario?: SbsClaim['scenario']; // For testing/simulation
  services: Omit<SbsService, 'totalPrice' | 'date'>[];
}

export interface NphiesSubmissionResult {
  success: boolean;
  nphiesId?: string;
  message?: string;
  timestamp: string;
}
