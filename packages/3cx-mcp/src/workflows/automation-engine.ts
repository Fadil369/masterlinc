/**
 * Workflow Automation Engine
 * Handles automated pipelines for call processing, routing, and follow-up
 */

import type { Config } from '../config.js';
import type { CallControlClient } from '../clients/call-control.js';
import type { XApiClient } from '../clients/xapi.js';
import { MasterLincCoordinator } from '../orchestration/masterlinc-coordinator.js';
import { BasmaEnhanced } from '../orchestration/basma-enhanced.js';

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule?: {
    type: 'cron' | 'interval' | 'event';
    value: string;
  };
  triggers: PipelineTrigger[];
  actions: PipelineAction[];
}

export interface PipelineTrigger {
  type: 'call_event' | 'time' | 'manual' | 'webhook';
  condition: any;
}

export interface PipelineAction {
  id: string;
  type: string;
  params: Record<string, any>;
  retries?: number;
  timeout?: number;
}

export class AutomationEngine {
  private pipelines: Map<string, Pipeline> = new Map();
  private runningPipelines: Map<string, any> = new Map();

  constructor(
    private config: Config,
    private coordinator: MasterLincCoordinator,
    private basma: BasmaEnhanced,
    private callControl: CallControlClient,
    private xapi: XApiClient,
  ) {
    this.initializeDefaultPipelines();
  }

  private initializeDefaultPipelines() {
    // Pipeline 1: Daily Call Summary Report
    this.pipelines.set('daily-summary', {
      id: 'daily-summary',
      name: 'Daily Call Summary Report',
      description: 'Generate and send daily analytics report',
      enabled: true,
      schedule: {
        type: 'cron',
        value: '0 18 * * *', // 6 PM daily
      },
      triggers: [{ type: 'time', condition: { hour: 18 } }],
      actions: [
        {
          id: 'fetch-analytics',
          type: 'analytics',
          params: { period: '24h' },
        },
        {
          id: 'generate-report',
          type: 'report',
          params: { format: 'pdf' },
        },
        {
          id: 'send-email',
          type: 'notify',
          params: {
            channel: 'email',
            recipients: ['dr.mf.12298@gmail.com'],
          },
        },
      ],
    });

    // Pipeline 2: Auto-callback for Missed Calls
    this.pipelines.set('auto-callback', {
      id: 'auto-callback',
      name: 'Automated Callback for Missed Calls',
      description: 'Automatically call back customers who were not answered',
      enabled: true,
      triggers: [
        {
          type: 'call_event',
          condition: { event: 'missed_call', waitTime: 300 },
        },
      ],
      actions: [
        {
          id: 'wait-5min',
          type: 'delay',
          params: { seconds: 300 },
        },
        {
          id: 'initiate-callback',
          type: 'make_call',
          params: { extension: '12310' },
          retries: 3,
          timeout: 60,
        },
        {
          id: 'log-callback',
          type: 'log',
          params: { message: 'Callback completed' },
        },
      ],
    });

    // Pipeline 3: VIP Customer Greeting
    this.pipelines.set('vip-greeting', {
      id: 'vip-greeting',
      name: 'VIP Customer Personalized Greeting',
      description: 'Play personalized greeting for VIP callers',
      enabled: true,
      triggers: [
        {
          type: 'call_event',
          condition: { event: 'inbound_call', vip: true },
        },
      ],
      actions: [
        {
          id: 'play-greeting',
          type: 'tts',
          params: {
            text: 'Welcome back! Thank you for being a valued customer.',
          },
        },
        {
          id: 'priority-routing',
          type: 'transfer',
          params: { destination: '100', type: 'attended' },
        },
      ],
    });

    // Pipeline 4: After-hours Auto-response
    this.pipelines.set('after-hours', {
      id: 'after-hours',
      name: 'After Hours Automation',
      description: 'Handle calls outside business hours with AI assistant',
      enabled: true,
      triggers: [
        {
          type: 'call_event',
          condition: {
            event: 'inbound_call',
            businessHours: false,
          },
        },
      ],
      actions: [
        {
          id: 'activate-ai',
          type: 'ai_conversation',
          params: {
            greeting: 'Thank you for calling. Our office is currently closed.',
            options: ['leave message', 'schedule callback', 'emergency'],
          },
        },
        {
          id: 'process-response',
          type: 'conditional',
          params: {
            if_emergency: { type: 'transfer', params: { destination: 'oncall' } },
            if_message: { type: 'voicemail', params: { extension: '12310' } },
            if_callback: { type: 'schedule', params: { nextBusinessDay: true } },
          },
        },
      ],
    });

    // Pipeline 5: Quality Assurance Sampling
    this.pipelines.set('qa-sampling', {
      id: 'qa-sampling',
      name: 'Quality Assurance Call Sampling',
      description: 'Randomly record and analyze calls for QA',
      enabled: true,
      schedule: {
        type: 'interval',
        value: '3600', // Every hour
      },
      triggers: [{ type: 'time', condition: { interval: 3600 } }],
      actions: [
        {
          id: 'select-random-calls',
          type: 'analytics',
          params: { action: 'sample', percentage: 10 },
        },
        {
          id: 'enable-recording',
          type: 'record',
          params: { action: 'start', notify: false },
        },
        {
          id: 'transcribe-analyze',
          type: 'ai_analysis',
          params: {
            features: ['sentiment', 'compliance', 'quality_score'],
          },
        },
        {
          id: 'flag-issues',
          type: 'conditional',
          params: {
            if_quality_low: {
              type: 'notify',
              params: { channel: 'slack', message: 'QA Alert' },
            },
          },
        },
      ],
    });

    // Pipeline 6: Customer Journey Tracking
    this.pipelines.set('journey-tracking', {
      id: 'journey-tracking',
      name: 'Customer Journey Analytics',
      description: 'Track and analyze multi-touchpoint customer interactions',
      enabled: true,
      triggers: [{ type: 'call_event', condition: { event: 'call_ended' } }],
      actions: [
        {
          id: 'extract-journey',
          type: 'analytics',
          params: { action: 'build_journey_map', lookback: '30d' },
        },
        {
          id: 'calculate-metrics',
          type: 'analytics',
          params: {
            metrics: ['contact_frequency', 'resolution_rate', 'satisfaction'],
          },
        },
        {
          id: 'update-crm',
          type: 'webhook',
          params: {
            url: process.env.CRM_WEBHOOK_URL,
            method: 'POST',
          },
        },
      ],
    });

    // Pipeline 7: Emergency Escalation Flow
    this.pipelines.set('emergency-flow', {
      id: 'emergency-flow',
      name: 'Emergency Call Escalation',
      description: 'Multi-level escalation for urgent calls',
      enabled: true,
      triggers: [
        {
          type: 'call_event',
          condition: { event: 'inbound_call', priority: 'urgent' },
        },
      ],
      actions: [
        {
          id: 'alert-level-1',
          type: 'notify',
          params: {
            channel: 'sms',
            recipients: ['oncall-primary'],
            message: 'Emergency call - Level 1',
          },
        },
        {
          id: 'transfer-oncall',
          type: 'transfer',
          params: { destination: 'oncall-primary', timeout: 30 },
        },
        {
          id: 'escalate-level-2',
          type: 'conditional',
          params: {
            if_no_answer: {
              type: 'notify',
              params: { channel: 'push', recipients: ['oncall-secondary'] },
            },
          },
        },
        {
          id: 'log-emergency',
          type: 'log',
          params: { severity: 'high', category: 'emergency' },
        },
      ],
    });
  }

  /**
   * Execute a pipeline
   */
  async executePipeline(pipelineId: string, context: any = {}): Promise<any> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    if (!pipeline.enabled) {
      console.log(`[Automation] Pipeline ${pipelineId} is disabled`);
      return { status: 'disabled' };
    }

    console.log(`[Automation] Executing pipeline: ${pipeline.name}`);
    const executionId = `${pipelineId}-${Date.now()}`;
    this.runningPipelines.set(executionId, { pipeline, context, startTime: Date.now() });

    const results = [];

    for (const action of pipeline.actions) {
      console.log(`[Automation] Executing action: ${action.id} (${action.type})`);

      try {
        const result = await this.executeAction(action, context);
        results.push({ action: action.id, success: true, result });

        // Update context with action results
        context[action.id] = result;
      } catch (error: any) {
        console.error(`[Automation] Action ${action.id} failed:`, error.message);
        results.push({ action: action.id, success: false, error: error.message });

        // Retry logic
        if (action.retries && action.retries > 0) {
          console.log(`[Automation] Retrying action ${action.id}...`);
          for (let i = 0; i < action.retries; i++) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
              const retryResult = await this.executeAction(action, context);
              results.push({ action: action.id, success: true, result: retryResult, retry: i + 1 });
              break;
            } catch (retryError: any) {
              console.error(`[Automation] Retry ${i + 1} failed:`, retryError.message);
            }
          }
        }
      }
    }

    this.runningPipelines.delete(executionId);

    return {
      pipelineId,
      executionId,
      status: 'completed',
      results,
      duration: Date.now() - context.startTime,
    };
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: PipelineAction, context: any): Promise<any> {
    switch (action.type) {
      case 'make_call':
        return await this.callControl.makeCall(
          action.params.extension || this.config.PBX_DEFAULT_EXTENSION,
          context.caller || action.params.destination,
        );

      case 'transfer':
        return await this.callControl.transferCall(
          action.params.extension || this.config.PBX_DEFAULT_EXTENSION,
          context.callId,
          action.params.destination,
          action.params.type || 'blind',
        );

      case 'record':
        return await this.callControl.recordCall(
          action.params.extension || this.config.PBX_DEFAULT_EXTENSION,
          context.callId,
          action.params.action,
        );

      case 'analytics':
        return await this.coordinator.getAnalytics();

      case 'ai_conversation':
        return await this.basma.startConversation(context.callId, context.caller, action.params);

      case 'ai_analysis':
        // Implement AI analysis logic
        return { analyzed: true };

      case 'notify':
        return await this.sendNotification(action.params);

      case 'delay':
        await new Promise((resolve) => setTimeout(resolve, action.params.seconds * 1000));
        return { delayed: action.params.seconds };

      case 'log':
        console.log(`[Pipeline Log] ${action.params.message}`);
        return { logged: true };

      case 'webhook':
        return await this.callWebhook(action.params);

      case 'conditional':
        return await this.handleConditional(action.params, context);

      case 'tts':
        return { tts: action.params.text };

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(params: any): Promise<any> {
    console.log(`[Automation] Sending ${params.channel} notification`);
    return { sent: true, channel: params.channel };
  }

  /**
   * Call webhook
   */
  private async callWebhook(params: any): Promise<any> {
    const res = await fetch(params.url, {
      method: params.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data || {}),
    });

    return {
      status: res.status,
      body: res.ok ? await res.json() : await res.text(),
    };
  }

  /**
   * Handle conditional logic
   */
  private async handleConditional(params: any, context: any): Promise<any> {
    for (const [condition, action] of Object.entries(params)) {
      if (condition.startsWith('if_')) {
        const conditionKey = condition.replace('if_', '');
        if (context[conditionKey]) {
          return await this.executeAction(action as PipelineAction, context);
        }
      }
    }
    return { skipped: true };
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(pipelineId: string): Pipeline | undefined {
    return this.pipelines.get(pipelineId);
  }

  /**
   * Get all pipelines
   */
  getAllPipelines(): Pipeline[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Add custom pipeline
   */
  addPipeline(pipeline: Pipeline): void {
    this.pipelines.set(pipeline.id, pipeline);
    console.log(`[Automation] Added pipeline: ${pipeline.name}`);
  }

  /**
   * Enable/disable pipeline
   */
  togglePipeline(pipelineId: string, enabled: boolean): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (pipeline) {
      pipeline.enabled = enabled;
      console.log(`[Automation] Pipeline ${pipelineId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get running pipelines
   */
  getRunningPipelines(): any[] {
    return Array.from(this.runningPipelines.entries()).map(([id, data]) => ({
      executionId: id,
      pipeline: data.pipeline.name,
      startTime: data.startTime,
      duration: Date.now() - data.startTime,
    }));
  }
}
