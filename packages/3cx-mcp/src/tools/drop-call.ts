import type { CallControlClient } from '../clients/call-control.js';
import { DropCallSchema } from '../types/mcp-schemas.js';

export const dropCallTool = {
  name: 'drop_call',
  description: 'Hang up / drop an active call on a 3CX extension',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      participant_id: { type: 'string', description: 'Participant ID to drop' },
    },
    required: ['extension', 'participant_id'],
  },
};

export async function handleDropCall(args: unknown, client: CallControlClient) {
  const { extension, participant_id } = DropCallSchema.parse(args);
  await client.dropCall(extension, participant_id);
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        extension,
        participantId: participant_id,
        message: `Call dropped on extension ${extension}`,
      }, null, 2),
    }],
  };
}
