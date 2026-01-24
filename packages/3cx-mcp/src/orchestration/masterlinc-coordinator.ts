/**
 * MasterLinc Coordination Layer
 * Orchestrates call flows, agent routing, and workflow automation
 */

import type { Config } from '../config.js';
import type { ActiveCall, CallLogEntry, Extension } from '../types/3cx-api.js';
import type { CallControlClient } from '../clients/call-control.js';
import type { XApiClient } from '../clients/xapi.js';

export interface Agent {
  id: string;
  name: string;
  type: 'voice' | 'chat' | 'workflow' | 'analytics' | 'supervisor';
  capabilities: string[];
  status: 'idle' | 'busy' | 'offline';
  currentLoad: number;
  maxCapacity: number;
}

export interface CallContext {
  callId: string;
  caller: string;
  callee: string;
  extension: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  metadata: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: 'call' | 'transfer' | 'record' | 'transcribe' | 'analyze' | 'notify' | 'ai_assist';
  params: Record<string, any>;
  condition?: (context: CallContext) => boolean;
  onSuccess?: string; // next step id
  onFailure?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: 'inbound_call' | 'outbound_call' | 'missed_call' | 'voicemail' | 'manual';
  conditions: Record<string, any>;
  steps: WorkflowStep[];
}

export class MasterLincCoordinator {
  private agents: Map<string, Agent> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private activeContexts: Map<string, CallContext> = new Map();
  private config: Config;

  constructor(
    config: Config,
    private callControl: CallControlClient,
    private xapi: XApiClient,
  ) {
    this.config = config;
    this.initializeAgents();
    this.initializeWorkflows();
  }

  private initializeAgents() {
    // Voice AI Agent (Basma)
    this.agents.set('basma-voice', {
      id: 'basma-voice',
      name: 'Basma Voice Assistant',
      type: 'voice',
      capabilities: ['stt', 'tts', 'conversation', 'sentiment_analysis', 'language_detection'],
      status: 'idle',
      currentLoad: 0,
      maxCapacity: 10,
    });

    // Chat Agent
    this.agents.set('chat-handler', {
      id: 'chat-handler',
      name: 'Chat Message Handler',
      type: 'chat',
      capabilities: ['sms', 'whatsapp', 'webchat', 'auto_reply'],
      status: 'idle',
      currentLoad: 0,
      maxCapacity: 50,
    });

    // Workflow Automation Agent
    this.agents.set('workflow-engine', {
      id: 'workflow-engine',
      name: 'Workflow Automation Engine',
      type: 'workflow',
      capabilities: ['routing', 'scheduling', 'followup', 'escalation'],
      status: 'idle',
      currentLoad: 0,
      maxCapacity: 100,
    });

    // Analytics Agent
    this.agents.set('analytics', {
      id: 'analytics',
      name: 'Call Analytics & Insights',
      type: 'analytics',
      capabilities: ['cdr_analysis', 'pattern_detection', 'reporting', 'forecasting'],
      status: 'idle',
      currentLoad: 0,
      maxCapacity: 1000,
    });

    // Supervisor Agent
    this.agents.set('supervisor', {
      id: 'supervisor',
      name: 'Call Center Supervisor',
      type: 'supervisor',
      capabilities: ['monitoring', 'barging', 'coaching', 'quality_assurance'],
      status: 'idle',
      currentLoad: 0,
      maxCapacity: 20,
    });
  }

  private initializeWorkflows() {
    // Workflow 1: Intelligent Inbound Routing
    this.workflows.set('intelligent-routing', {
      id: 'intelligent-routing',
      name: 'Intelligent Inbound Call Routing',
      description: 'Routes incoming calls based on caller ID, time, and agent availability',
      trigger: 'inbound_call',
      conditions: {},
      steps: [
        {
          id: 'identify-caller',
          type: 'analyze',
          params: { action: 'lookup_caller_history' },
          onSuccess: 'check-vip-status',
        },
        {
          id: 'check-vip-status',
          type: 'analyze',
          params: { action: 'check_vip_flag' },
          condition: (ctx) => ctx.metadata.isVIP === true,
          onSuccess: 'route-to-priority',
          onFailure: 'check-business-hours',
        },
        {
          id: 'route-to-priority',
          type: 'transfer',
          params: { destination: '100', type: 'attended' },
        },
        {
          id: 'check-business-hours',
          type: 'analyze',
          params: { action: 'check_business_hours' },
          onSuccess: 'route-to-agent',
          onFailure: 'activate-ai-assistant',
        },
        {
          id: 'route-to-agent',
          type: 'transfer',
          params: { destination: 'queue:sales', type: 'blind' },
        },
        {
          id: 'activate-ai-assistant',
          type: 'ai_assist',
          params: { agent: 'basma-voice', mode: 'full_service' },
        },
      ],
    });

    // Workflow 2: Automated Follow-up
    this.workflows.set('missed-call-followup', {
      id: 'missed-call-followup',
      name: 'Missed Call Follow-up',
      description: 'Automatically sends SMS and schedules callback for missed calls',
      trigger: 'missed_call',
      conditions: {},
      steps: [
        {
          id: 'send-sms',
          type: 'notify',
          params: {
            channel: 'sms',
            template: 'missed_call_notification',
          },
          onSuccess: 'log-followup',
        },
        {
          id: 'log-followup',
          type: 'analyze',
          params: { action: 'create_followup_task' },
        },
      ],
    });

    // Workflow 3: Call Recording & Transcription
    this.workflows.set('record-transcribe', {
      id: 'record-transcribe',
      name: 'Record and Transcribe',
      description: 'Records calls and generates AI transcripts with sentiment analysis',
      trigger: 'inbound_call',
      conditions: { record_enabled: true },
      steps: [
        {
          id: 'start-recording',
          type: 'record',
          params: { action: 'start' },
          onSuccess: 'monitor-call',
        },
        {
          id: 'monitor-call',
          type: 'analyze',
          params: { action: 'real_time_sentiment' },
          onSuccess: 'stop-recording',
        },
        {
          id: 'stop-recording',
          type: 'record',
          params: { action: 'stop' },
          onSuccess: 'transcribe',
        },
        {
          id: 'transcribe',
          type: 'transcribe',
          params: { provider: 'whisper', language: 'auto' },
          onSuccess: 'analyze-transcript',
        },
        {
          id: 'analyze-transcript',
          type: 'analyze',
          params: {
            action: 'extract_insights',
            features: ['sentiment', 'keywords', 'action_items', 'summary'],
          },
        },
      ],
    });

    // Workflow 4: Emergency Escalation
    this.workflows.set('emergency-escalation', {
      id: 'emergency-escalation',
      name: 'Emergency Call Escalation',
      description: 'Immediately routes urgent calls to on-call staff',
      trigger: 'inbound_call',
      conditions: { emergency: true },
      steps: [
        {
          id: 'alert-supervisor',
          type: 'notify',
          params: { channel: 'push', target: 'supervisor', priority: 'urgent' },
          onSuccess: 'find-oncall',
        },
        {
          id: 'find-oncall',
          type: 'analyze',
          params: { action: 'get_oncall_staff' },
          onSuccess: 'transfer-emergency',
        },
        {
          id: 'transfer-emergency',
          type: 'transfer',
          params: { type: 'attended', priority: 'high' },
        },
      ],
    });
  }

  /**
   * Route an incoming call to the appropriate agent/workflow
   */
  async routeCall(call: ActiveCall): Promise<{ agent: string; workflow: string; action: string }> {
    const context: CallContext = {
      callId: call.Id,
      caller: call.Participants?.[0]?.Dn || 'unknown',
      callee: call.Participants?.[1]?.Dn || '',
      extension: this.config.PBX_DEFAULT_EXTENSION,
      direction: 'inbound',
      duration: 0,
      metadata: {},
    };

    this.activeContexts.set(call.Id, context);

    // Check for emergency keywords in caller ID or metadata
    if (context.metadata.emergency) {
      return this.executeWorkflow('emergency-escalation', context);
    }

    // Default to intelligent routing
    return this.executeWorkflow('intelligent-routing', context);
  }

  /**
   * Execute a workflow for a given call context
   */
  async executeWorkflow(
    workflowId: string,
    context: CallContext,
  ): Promise<{ agent: string; workflow: string; action: string }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    console.log(`[MasterLinc] Executing workflow: ${workflow.name} for call ${context.callId}`);

    for (const step of workflow.steps) {
      // Check step condition if present
      if (step.condition && !step.condition(context)) {
        console.log(`[MasterLinc] Skipping step ${step.id} - condition not met`);
        continue;
      }

      console.log(`[MasterLinc] Executing step: ${step.id} (${step.type})`);

      try {
        await this.executeStep(step, context);
      } catch (error: any) {
        console.error(`[MasterLinc] Step ${step.id} failed:`, error.message);
        if (step.onFailure) {
          console.log(`[MasterLinc] Following failure path to ${step.onFailure}`);
          // In production, implement proper step navigation
        }
      }
    }

    return {
      agent: 'basma-voice',
      workflow: workflowId,
      action: 'completed',
    };
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, context: CallContext): Promise<void> {
    switch (step.type) {
      case 'call':
        // Handled by call control client
        break;

      case 'transfer':
        await this.callControl.transferCall(
          context.extension,
          context.callId,
          step.params.destination,
          step.params.type || 'blind',
        );
        break;

      case 'record':
        const action = step.params.action === 'start' ? 'start' : 'stop';
        await this.callControl.recordCall(context.extension, context.callId, action);
        break;

      case 'transcribe':
        // Integrate with Basma Bridge for transcription
        console.log('[MasterLinc] Transcription requested - delegating to Basma');
        break;

      case 'analyze':
        await this.analyzeCallContext(context, step.params);
        break;

      case 'notify':
        await this.sendNotification(context, step.params);
        break;

      case 'ai_assist':
        await this.activateAIAssistant(context, step.params);
        break;

      default:
        console.warn(`[MasterLinc] Unknown step type: ${step.type}`);
    }
  }

  /**
   * Analyze call context (caller history, sentiment, etc.)
   */
  private async analyzeCallContext(context: CallContext, params: any): Promise<void> {
    switch (params.action) {
      case 'lookup_caller_history':
        const logs = await this.xapi.getCallLogs({ limit: 10 });
        const callerLogs = logs.filter((log) => log.Caller === context.caller);
        context.metadata.callHistory = callerLogs;
        context.metadata.callCount = callerLogs.length;
        context.metadata.isVIP = callerLogs.length > 10;
        break;

      case 'check_vip_flag':
        // Check CRM or database for VIP status
        break;

      case 'check_business_hours':
        const now = new Date();
        const hour = now.getHours();
        context.metadata.businessHours = hour >= 9 && hour < 17;
        break;

      case 'real_time_sentiment':
        // Real-time sentiment analysis during call
        break;

      case 'extract_insights':
        // Post-call analysis
        break;

      default:
        console.warn(`[MasterLinc] Unknown analysis action: ${params.action}`);
    }
  }

  /**
   * Send notification (SMS, email, push)
   */
  private async sendNotification(context: CallContext, params: any): Promise<void> {
    console.log(`[MasterLinc] Sending ${params.channel} notification for call ${context.callId}`);
    // Integrate with notification service
  }

  /**
   * Activate AI assistant for a call
   */
  private async activateAIAssistant(context: CallContext, params: any): Promise<void> {
    const agent = this.agents.get(params.agent);
    if (!agent) {
      throw new Error(`Agent not found: ${params.agent}`);
    }

    console.log(`[MasterLinc] Activating ${agent.name} for call ${context.callId}`);
    agent.currentLoad++;
    agent.status = 'busy';

    // Delegate to Basma Bridge for voice AI
    // This will handle STT, conversation, and TTS
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Add custom workflow
   */
  addWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    console.log(`[MasterLinc] Added workflow: ${workflow.name}`);
  }

  /**
   * Get call context
   */
  getCallContext(callId: string): CallContext | undefined {
    return this.activeContexts.get(callId);
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(): Promise<any> {
    const logs = await this.xapi.getCallLogs({ limit: 100 });
    const totalCalls = logs.length;
    const inboundCalls = logs.filter((l) => l.Direction === 'Inbound').length;
    const outboundCalls = logs.filter((l) => l.Direction === 'Outbound').length;
    const avgDuration =
      logs.reduce((sum, l) => sum + (l.DurationSeconds || 0), 0) / totalCalls || 0;

    return {
      totalCalls,
      inboundCalls,
      outboundCalls,
      avgDuration: Math.round(avgDuration),
      agents: this.getAllAgents().map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        load: `${a.currentLoad}/${a.maxCapacity}`,
      })),
      workflows: this.getAllWorkflows().map((w) => ({
        id: w.id,
        name: w.name,
        trigger: w.trigger,
      })),
    };
  }
}
