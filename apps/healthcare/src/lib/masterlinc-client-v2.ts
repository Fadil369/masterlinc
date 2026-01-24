import { API_CONFIG } from '../config/api-config';
import { Appointment, CallLog, Visitor, Lead, ProactiveTask } from '../types';

export const MasterLincClient = {
  // --- Orchestrator Integration ---
  orchestrator: {
    startWorkflow: async (callId: string, from: string, domain: 'healthcare'|'business'|'tech'|'personal' = 'healthcare') => {
      const res = await fetch(`${API_CONFIG.orchestratorUrl}/api/workflows/start-from-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, from, domain }),
      });
      return res.json();
    },
    getWorkflow: async (workflowId: string) => {
        const res = await fetch(`${API_CONFIG.orchestratorUrl}/api/workflows/${workflowId}`);
        return res.json();
    }
  },

  // --- SBS Dynamic Worker Integration ---
  sbs: {
    createClaim: async (claimData: any) => {
      const res = await fetch(`${API_CONFIG.sbsUrl}/api/claims/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      });
      return res.json();
    },
    getClaim: async (claimId: string) => {
        const res = await fetch(`${API_CONFIG.sbsUrl}/api/claims/${claimId}`);
        return res.json();
    }
  },

  // --- Legacy / Spark Integrations ---
  // These wrappers ensure we can easily swap them for dynamic services later
  
  appointment: {
    create: async (apt: Partial<Appointment>): Promise<Appointment> => {
        // Currently points to Orchestrator or Healthcare Service
        const res = await fetch(`${API_CONFIG.orchestratorUrl}/api/appointments`, { // Proxy through orchestrator for now
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apt),
        });
        return res.json();
    }
  },
  
  logs: {
      create: async (log: Partial<CallLog>) => {
          // Logs centralize in MasterLinc
           const res = await fetch(`${API_CONFIG.orchestratorUrl}/api/logs`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
        });
        return res.json();
      }
  }
};
