import type { CallControlClient } from '../clients/call-control.js';
import { HoldCallSchema } from '../types/mcp-schemas.js';

export const holdCallTool = {
  name: 'hold_call',
  description: 'Hold or resume an active call on a 3CX extension',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      participant_id: { type: 'string', description: 'Active participant ID' },
      action: { type: 'string', enum: ['hold', 'resume'], description: 'Hold or resume the call' },
    },
    required: ['extension', 'participant_id', 'action'],
  },
};

export async function handleHoldCall(args: unknown, client: CallControlClient) {
  const { extension, participant_id, action } = HoldCallSchema.parse(args);

  if (action === 'hold') {
    await client.holdCall(extension, participant_id);
  } else {
    await client.resumeCall(extension, participant_id);
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        extension,
        participantId: participant_id,
        action,
        message: `Call ${action === 'hold' ? 'placed on hold' : 'resumed'}`,
      }, null, 2),
    }],
  };
}
