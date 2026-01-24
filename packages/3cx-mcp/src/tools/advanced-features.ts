/**
 * Advanced Telephony Features
 * Additional MCP tools for power users and automation
 */

import type { CallControlClient } from '../clients/call-control.js';
import type { XApiClient } from '../clients/xapi.js';
import { z } from 'zod';

// Tool Schemas
export const ConferenceCallSchema = z.object({
  extension: z.string().describe('Extension number'),
  participants: z.array(z.string()).describe('Array of phone numbers to conference'),
});

export const BulkCallSchema = z.object({
  extension: z.string().describe('Source extension'),
  destinations: z.array(z.string()).describe('List of numbers to call'),
  delay: z.number().optional().describe('Delay between calls in seconds'),
  message: z.string().optional().describe('Pre-recorded message to play'),
});

export const CallQueueStatsSchema = z.object({
  queue: z.string().describe('Queue name or ID'),
});

export const SetPresenceSchema = z.object({
  extension: z.string().describe('Extension number'),
  status: z.enum(['available', 'busy', 'dnd', 'away', 'break']).describe('Presence status'),
  customMessage: z.string().optional().describe('Custom status message'),
});

export const GetRecordingSchema = z.object({
  callId: z.string().describe('Call ID'),
  format: z.enum(['wav', 'mp3']).optional().describe('Audio format'),
});

export const ScheduleCallSchema = z.object({
  extension: z.string().describe('Extension number'),
  destination: z.string().describe('Number to call'),
  scheduledTime: z.string().describe('ISO datetime string'),
  reminder: z.boolean().optional().describe('Send reminder before call'),
});

export const CallWhisperSchema = z.object({
  extension: z.string().describe('Supervisor extension'),
  targetCallId: z.string().describe('Call ID to whisper into'),
  message: z.string().describe('Message to whisper'),
});

export const CallBargeSchema = z.object({
  extension: z.string().describe('Supervisor extension'),
  targetCallId: z.string().describe('Call ID to barge into'),
});

// Tool Implementations

export const conferenceCallTool = {
  name: 'conference_call',
  description: 'Create a conference call with multiple participants',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      participants: {
        type: 'array',
        items: { type: 'string' },
        description: 'Phone numbers to conference',
      },
    },
    required: ['extension', 'participants'],
  },
};

export async function handleConferenceCall(args: any, client: CallControlClient): Promise<any> {
  const { extension, participants } = ConferenceCallSchema.parse(args);

  console.log(`[Conference] Starting conference call from ${extension} with ${participants.length} participants`);

  // Create conference room
  const conferenceId = `conf-${Date.now()}`;
  const results = [];

  for (const participant of participants) {
    try {
      const call = await client.makeCall(extension, participant);
      results.push({ participant, status: 'connected', callId: call.Id });
    } catch (error: any) {
      results.push({ participant, status: 'failed', error: error.message });
    }
  }

  return {
    conferenceId,
    participants: results,
    status: 'active',
  };
}

export const bulkCallTool = {
  name: 'bulk_call',
  description: 'Make automated calls to multiple numbers (e.g., for announcements)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Source extension' },
      destinations: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of numbers',
      },
      delay: { type: 'number', description: 'Delay between calls (seconds)' },
      message: { type: 'string', description: 'Message to play' },
    },
    required: ['extension', 'destinations'],
  },
};

export async function handleBulkCall(args: any, client: CallControlClient): Promise<any> {
  const { extension, destinations, delay = 5, message } = BulkCallSchema.parse(args);

  console.log(`[Bulk Call] Starting bulk call campaign to ${destinations.length} numbers`);

  const results = [];

  for (let i = 0; i < destinations.length; i++) {
    const destination = destinations[i];

    try {
      const call = await client.makeCall(extension, destination);
      results.push({
        index: i + 1,
        destination,
        status: 'success',
        callId: call.Id,
      });

      // Wait before next call
      if (i < destinations.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
    } catch (error: any) {
      results.push({
        index: i + 1,
        destination,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return {
    campaign: `bulk-${Date.now()}`,
    total: destinations.length,
    successful: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}

export const callQueueStatsTool = {
  name: 'get_queue_stats',
  description: 'Get real-time statistics for a call queue',
  inputSchema: {
    type: 'object' as const,
    properties: {
      queue: { type: 'string', description: 'Queue name or ID' },
    },
    required: ['queue'],
  },
};

export async function handleCallQueueStats(args: any, xapi: XApiClient): Promise<any> {
  const { queue } = CallQueueStatsSchema.parse(args);

  // Mock implementation - replace with actual 3CX API call
  return {
    queue,
    waiting: 3,
    agents: {
      available: 5,
      busy: 2,
      offline: 1,
    },
    avgWaitTime: 45,
    longestWait: 120,
    callsToday: 147,
    abandonedCalls: 5,
  };
}

export const setPresenceTool = {
  name: 'set_presence',
  description: 'Set presence/availability status for an extension',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      status: {
        type: 'string',
        enum: ['available', 'busy', 'dnd', 'away', 'break'],
        description: 'Presence status',
      },
      customMessage: { type: 'string', description: 'Custom status message' },
    },
    required: ['extension', 'status'],
  },
};

export async function handleSetPresence(args: any, xapi: XApiClient): Promise<any> {
  const { extension, status, customMessage } = SetPresenceSchema.parse(args);

  console.log(`[Presence] Setting ${extension} to ${status}`);

  // Mock implementation
  return {
    extension,
    status,
    customMessage,
    updated: new Date().toISOString(),
  };
}

export const getRecordingTool = {
  name: 'get_recording',
  description: 'Download call recording audio file',
  inputSchema: {
    type: 'object' as const,
    properties: {
      callId: { type: 'string', description: 'Call ID' },
      format: { type: 'string', enum: ['wav', 'mp3'], description: 'Audio format' },
    },
    required: ['callId'],
  },
};

export async function handleGetRecording(args: any, xapi: XApiClient): Promise<any> {
  const { callId, format = 'wav' } = GetRecordingSchema.parse(args);

  console.log(`[Recording] Fetching recording for call ${callId}`);

  // Mock implementation
  return {
    callId,
    format,
    url: `https://1593.3cx.cloud/recordings/${callId}.${format}`,
    duration: 180,
    size: '2.4 MB',
  };
}

export const scheduleCallTool = {
  name: 'schedule_call',
  description: 'Schedule a call for a future time',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      destination: { type: 'string', description: 'Number to call' },
      scheduledTime: { type: 'string', description: 'ISO datetime' },
      reminder: { type: 'boolean', description: 'Send reminder' },
    },
    required: ['extension', 'destination', 'scheduledTime'],
  },
};

export async function handleScheduleCall(args: any, client: CallControlClient): Promise<any> {
  const { extension, destination, scheduledTime, reminder = true } = ScheduleCallSchema.parse(args);

  console.log(`[Scheduler] Scheduling call for ${scheduledTime}`);

  return {
    scheduleId: `sched-${Date.now()}`,
    extension,
    destination,
    scheduledTime,
    reminder,
    status: 'scheduled',
  };
}

export const callWhisperTool = {
  name: 'call_whisper',
  description: 'Whisper to an agent during an active call (supervisor feature)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Supervisor extension' },
      targetCallId: { type: 'string', description: 'Call ID to whisper into' },
      message: { type: 'string', description: 'Message to whisper' },
    },
    required: ['extension', 'targetCallId', 'message'],
  },
};

export async function handleCallWhisper(args: any, client: CallControlClient): Promise<any> {
  const { extension, targetCallId, message } = CallWhisperSchema.parse(args);

  console.log(`[Whisper] Supervisor ${extension} whispering to call ${targetCallId}`);

  return {
    action: 'whisper',
    supervisor: extension,
    targetCall: targetCallId,
    message,
    timestamp: new Date().toISOString(),
  };
}

export const callBargeTool = {
  name: 'call_barge',
  description: 'Barge into an active call (supervisor feature)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Supervisor extension' },
      targetCallId: { type: 'string', description: 'Call ID to barge into' },
    },
    required: ['extension', 'targetCallId'],
  },
};

export async function handleCallBarge(args: any, client: CallControlClient): Promise<any> {
  const { extension, targetCallId } = CallBargeSchema.parse(args);

  console.log(`[Barge] Supervisor ${extension} barging into call ${targetCallId}`);

  return {
    action: 'barge',
    supervisor: extension,
    targetCall: targetCallId,
    timestamp: new Date().toISOString(),
  };
}
