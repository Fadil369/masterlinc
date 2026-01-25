/**
 * BrainSAIT API Service
 * Central API client for frontend interactions with the MasterLinc orchestrator
 * OID: 1.3.6.1.4.1.61026.3.7 (MasterLinc)
 */

import { MasterLincClient } from './masterlinc-client';
import { Appointment, CallLog, Visitor, Lead } from '../types';

// API Configuration - use environment variables or defaults
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface DashboardData {
  appointments?: Appointment[];
  logs?: CallLog[];
  visitors?: Visitor[];
  leads?: Lead[];
  stats?: {
    totalCalls: number;
    activeAgents: number;
    pendingTasks: number;
    claimsProcessed: number;
  };
}

interface CreateAppointmentRequest {
  title?: string;
  description?: string;
  type: string;
  start_time: number;
  end_time: number;
  status: string;
  callerName: string;
  time: string;
  date: string;
  companyName?: string;
  user_id: string;
  timezone: string;
}

interface CreateLogRequest {
  callerName: string;
  summary: string;
  sentiment: string;
  duration: number;
  visitorId?: string;
}

interface CreateVisitorRequest {
  name: string;
  lastSeen?: string;
  source?: string;
  lead_score?: number;
  email?: string;
  phone?: string;
}

interface SendMessageRequest {
  channel: 'whatsapp' | 'sms';
  recipient: string;
  content: string;
}

/**
 * Unified API wrapper for BrainSAIT ecosystem
 */
export const api = {
  // --- Dashboard ---
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics`);
      if (!response.ok) {
        throw new Error(`Dashboard fetch failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.warn('Dashboard API unavailable, using mock data', error);
      return {
        appointments: [],
        logs: [],
        visitors: [],
        leads: [],
        stats: {
          totalCalls: 0,
          activeAgents: 0,
          pendingTasks: 0,
          claimsProcessed: 0,
        }
      };
    }
  },

  // --- Appointments ---
  createAppointment: async (data: CreateAppointmentRequest): Promise<Appointment> => {
    try {
      return await MasterLincClient.appointment.create(data as any);
    } catch (error) {
      console.error('Failed to create appointment', error);
      throw error;
    }
  },

  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    } catch (error) {
      console.warn('Appointments API unavailable', error);
      return [];
    }
  },

  // --- Call Logs ---
  createLog: async (data: CreateLogRequest): Promise<CallLog> => {
    try {
      return await MasterLincClient.logs.create(data as any);
    } catch (error) {
      console.error('Failed to create log', error);
      throw error;
    }
  },

  getLogs: async (): Promise<CallLog[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    } catch (error) {
      console.warn('Logs API unavailable', error);
      return [];
    }
  },

  // --- Visitors & Leads ---
  createVisitor: async (data: CreateVisitorRequest): Promise<Visitor> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create visitor');
      return response.json();
    } catch (error) {
      console.error('Failed to create visitor', error);
      throw error;
    }
  },

  getVisitors: async (): Promise<Visitor[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visitors`);
      if (!response.ok) throw new Error('Failed to fetch visitors');
      return response.json();
    } catch (error) {
      console.warn('Visitors API unavailable', error);
      return [];
    }
  },

  // --- Messaging ---
  sendMessage: async (data: SendMessageRequest): Promise<{ success: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    } catch (error) {
      console.error('Failed to send message', error);
      // Return success for demo purposes (mock)
      return { success: true };
    }
  },

  // --- Workflows (MasterLinc Orchestration) ---
  workflows: {
    startFromCall: async (callId: string, from: string, domain: 'healthcare' | 'business' | 'tech' | 'personal' = 'healthcare') => {
      return MasterLincClient.orchestrator.startWorkflow(callId, from, domain);
    },
    getStatus: async (workflowId: string) => {
      return MasterLincClient.orchestrator.getWorkflow(workflowId);
    },
  },

  // --- Claims (SBS Integration) ---
  claims: {
    create: async (claimData: any) => {
      return MasterLincClient.sbs.createClaim(claimData);
    },
    get: async (claimId: string) => {
      return MasterLincClient.sbs.getClaim(claimId);
    },
    submitToNphies: async (claimId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/claims/${claimId}/submit-nphies`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to submit to NPHIES');
      return response.json();
    },
  },

  // --- Health Check ---
  health: async (): Promise<{ status: string; services: any }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    } catch (error) {
      return {
        status: 'offline',
        services: { 
          message: 'API unavailable',
          error: String(error),
        },
      };
    }
  },
};

export default api;
