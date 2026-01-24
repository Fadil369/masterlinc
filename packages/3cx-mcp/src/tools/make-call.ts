import type { CallControlClient } from '../clients/call-control.js';
import { MakeCallSchema } from '../types/mcp-schemas.js';

export const makeCallTool = {
  name: 'make_call',
  description: 'Initiate an outbound call from a 3CX extension to a destination number',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Source extension number (e.g. "12310")' },
      destination: { type: 'string', description: 'Number to call (e.g. "+966501234567" or extension "100")' },
    },
    required: ['extension', 'destination'],
  },
};

export async function handleMakeCall(args: unknown, client: CallControlClient) {
  const { extension, destination } = MakeCallSchema.parse(args);
  const result = await client.makeCall(extension, destination);
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        extension,
        destination,
        participantId: result.participantId,
        message: `Call initiated from ${extension} to ${destination}`,
      }, null, 2),
    }],
  };
}
