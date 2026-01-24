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
}

export interface SbsClaim {
  claimId: string;
  patientOID: string;
  providerOID: string;
  facilityOID: string;
  services: SbsService[];
  totalAmount: number;
  status: ClaimStatus;
  nphiesId?: string;
  rejectionReason?: string;
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
  services: Omit<SbsService, 'totalPrice'>[];
}

export interface NphiesSubmissionResult {
  success: boolean;
  nphiesId?: string;
  message?: string;
  timestamp: string;
}
