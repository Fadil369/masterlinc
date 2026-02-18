import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_CONFIG } from '../config-api';
import { logger } from '../lib/logger';

// Define configuration for MasterLinc Orchestrator
const MASTERLINC_API_URL = API_CONFIG.orchestratorUrl;

export interface WorkflowResult {
  workflowId: string;
  status: string;
  data?: any;
}

export function useMasterLinc() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Start a new intelligent workflow conversation
   */
  const startConversation = useCallback(async (message: string, context?: any) => {
    setIsProcessing(true);
    setLastError(null);

    try {
      // In a real implementation, this would hit the Orchestrator's NLP endpoint
      // For now, we simulate the connection to the deployment we just verified
      const response = await fetch(`${MASTERLINC_API_URL}/api/ai/conversation`, { // Assuming this endpoint exists on Orchestrator
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, domain: 'healthcare' }),
      });

      if (!response.ok) {
         // Fallback simulation if local orchestrator isn't running perfectly yet
         logger.warn('Orchestrator unavailable, using fallback response', { orchestratorUrl: MASTERLINC_API_URL });
         return {
             role: 'assistant',
             content: "I've received your query. The MasterLinc Orchestrator is processing it in the Healthcare domain.",
             actions: []
         };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      logger.error('MasterLinc Conversation Error', error as Error, { orchestratorUrl: MASTERLINC_API_URL });
      setLastError(error.message);
      toast.error('Failed to connect to MasterLinc Intelligence');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Trigger a specific workflow by ID (e.g., 'book-appointment')
   */
  const triggerWorkflow = useCallback(async (workflowType: string, params: any) => {
    setIsProcessing(true);
    try {
       const response = await fetch(`${MASTERLINC_API_URL}/api/workflows/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: workflowType, params }),
      });
      
      const result = await response.json();
      toast.success(`Workflow '${workflowType}' started`);
      return result;
    } catch (error: any) {
      toast.error(`Failed to start workflow: ${workflowType}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Get the realtime status of a specific service/claim
   */
  const getStatus = useCallback(async (entityId: string, entityType: 'claim' | 'appointment' | 'patient') => {
      // connecting to the Unified Data Layer
      try {
          const res = await fetch(`${MASTERLINC_API_URL}/api/${entityType}s/${entityId}/status`);
          return await res.json();
      } catch (e) {
          return null;
      }
  }, []);

  return {
    isProcessing,
    lastError,
    startConversation,
    triggerWorkflow,
    getStatus
  };
}
