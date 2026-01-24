import type { XApiClient } from '../clients/xapi.js';
import { GetPresenceSchema } from '../types/mcp-schemas.js';

export const getPresenceTool = {
  name: 'get_presence',
  description: 'Get the presence/availability status of a 3CX extension',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number to check' },
    },
    required: ['extension'],
  },
};

export async function handleGetPresence(args: unknown, xapi: XApiClient) {
  const { extension } = GetPresenceSchema.parse(args);
  const presence = await xapi.getPresence(extension);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        extension: presence.Extension,
        status: presence.Status,
        statusText: presence.StatusText,
        onCall: presence.OnCall,
      }, null, 2),
    }],
  };
}
