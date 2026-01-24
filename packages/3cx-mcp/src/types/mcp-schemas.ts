import { z } from 'zod';

export const MakeCallSchema = z.object({
  extension: z.string().describe('Source extension number (e.g. "12310")'),
  destination: z.string().describe('Number to call (e.g. "+966501234567" or extension "100")'),
});

export const AnswerCallSchema = z.object({
  extension: z.string().describe('Extension number'),
  participant_id: z.string().describe('Participant ID of the ringing call'),
});

export const TransferCallSchema = z.object({
  extension: z.string().describe('Extension handling the call'),
  participant_id: z.string().describe('Active participant ID'),
  destination: z.string().describe('Transfer destination (extension or phone number)'),
  type: z.enum(['blind', 'attended']).default('blind').describe('Transfer type'),
});

export const HoldCallSchema = z.object({
  extension: z.string().describe('Extension number'),
  participant_id: z.string().describe('Active participant ID'),
  action: z.enum(['hold', 'resume']).describe('Hold or resume the call'),
});

export const DropCallSchema = z.object({
  extension: z.string().describe('Extension number'),
  participant_id: z.string().describe('Participant ID to drop'),
});

export const SendMessageSchema = z.object({
  from_extension: z.string().describe('Sender extension number'),
  to: z.string().describe('Recipient (phone number or extension)'),
  message: z.string().describe('Message content'),
  channel: z.enum(['sms', 'whatsapp', 'livechat']).default('sms').describe('Messaging channel'),
});

export const GetCallLogsSchema = z.object({
  extension: z.string().optional().describe('Filter by extension'),
  direction: z.enum(['Inbound', 'Outbound', 'Internal']).optional().describe('Call direction'),
  start_date: z.string().optional().describe('Start date ISO 8601'),
  end_date: z.string().optional().describe('End date ISO 8601'),
  limit: z.number().min(1).max(100).default(20).describe('Max results'),
});

export const GetExtensionsSchema = z.object({
  department: z.string().optional().describe('Filter by department'),
  include_status: z.boolean().default(false).describe('Include presence status'),
});

export const GetPresenceSchema = z.object({
  extension: z.string().describe('Extension number to check'),
});

export const RecordCallSchema = z.object({
  extension: z.string().describe('Extension number'),
  participant_id: z.string().describe('Active participant ID'),
  action: z.enum(['start', 'stop']).describe('Start or stop recording'),
});
