import type { XApiClient } from '../clients/xapi.js';
import { GetCallLogsSchema } from '../types/mcp-schemas.js';

export const getCallLogsTool = {
  name: 'get_call_logs',
  description: 'Query call detail records (CDR) from 3CX with optional filters',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Filter by extension' },
      direction: { type: 'string', enum: ['Inbound', 'Outbound', 'Internal'], description: 'Call direction' },
      start_date: { type: 'string', description: 'Start date ISO 8601' },
      end_date: { type: 'string', description: 'End date ISO 8601' },
      limit: { type: 'number', description: 'Max results (1-100, default 20)' },
    },
    required: [],
  },
};

export async function handleGetCallLogs(args: unknown, xapi: XApiClient) {
  const { extension, direction, start_date, end_date, limit } = GetCallLogsSchema.parse(args);
  const logs = await xapi.getCallLogs({
    extension,
    direction,
    startDate: start_date,
    endDate: end_date,
    limit,
  });

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        count: logs.length,
        logs: logs.map(l => ({
          id: l.Id,
          caller: l.Caller,
          callee: l.Callee,
          direction: l.Direction,
          status: l.Status,
          duration: l.Duration,
          startTime: l.StartTime,
          extension: l.Extension,
        })),
      }, null, 2),
    }],
  };
}
