/**
 * Basma Voice Chat Integration
 * Handles call routing, IVR, voice AI, and 3CX integration
 */

import axios from 'axios';
import { pino } from 'pino';
import type { ServiceRegistry } from './service-registry.js';

const logger = pino({ name: 'basma-integration' });

export interface CallData {
  callId: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: 'ringing' | 'answered' | 'ended';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recording?: string;
  transcript?: string;
}

export interface CallRouting {
  callId: string;
  targetExtension?: string;
  targetDepartment?: string;
  priority: 'emergency' | 'urgent' | 'routine';
  reason: string;
}

export class BasmaIntegration {
  private basemaUrl: string;

  constructor(private registry: ServiceRegistry) {
    const basmaService = registry.getService('basma-voice');
    this.basemaUrl = basmaService?.url || '';
  }

  /**
   * Initiate outbound call
   */
  async makeCall(params: {
    from: string;
    to: string;
    message?: string;
  }): Promise<CallData> {
    logger.info({ to: params.to }, 'Initiating outbound call');

    try {
      const response = await axios.post(`${this.basemaUrl}/api/calls/make`, params, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to make call');
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  /**
   * Route incoming call based on AI analysis
   */
  async routeCall(callId: string, context: Record<string, any>): Promise<CallRouting> {
    logger.info({ callId, context }, 'Routing call with AI');

    try {
      const response = await axios.post(
        `${this.basemaUrl}/api/calls/${callId}/route`,
        { context },
        { timeout: 5000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message, callId }, 'Failed to route call');
      
      // Fallback to default routing
      return {
        callId,
        targetDepartment: 'reception',
        priority: 'routine',
        reason: 'AI routing failed, using default',
      };
    }
  }

  /**
   * Get call transcript
   */
  async getCallTranscript(callId: string): Promise<string> {
    logger.info({ callId }, 'Fetching call transcript');

    try {
      const response = await axios.get(`${this.basemaUrl}/api/calls/${callId}/transcript`, {
        timeout: 5000,
      });

      return response.data.transcript;
    } catch (error: any) {
      logger.error({ error: error.message, callId }, 'Failed to fetch transcript');
      return '';
    }
  }

  /**
   * Analyze call intent using AI
   */
  async analyzeCallIntent(transcript: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    logger.info('Analyzing call intent');

    try {
      const response = await axios.post(
        `${this.basemaUrl}/api/ai/analyze-intent`,
        { transcript },
        { timeout: 10000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to analyze intent');
      return {
        intent: 'unknown',
        confidence: 0,
        entities: {},
      };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(params: { to: string; message: string }): Promise<boolean> {
    logger.info({ to: params.to }, 'Sending SMS notification');

    try {
      await axios.post(`${this.basemaUrl}/api/sms/send`, params, {
        timeout: 5000,
      });

      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to send SMS');
      return false;
    }
  }

  /**
   * Get call statistics
   */
  async getCallStatistics(params: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    logger.info('Fetching call statistics');

    try {
      const response = await axios.get(`${this.basemaUrl}/api/calls/statistics`, {
        params,
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch statistics');
      return null;
    }
  }
}
