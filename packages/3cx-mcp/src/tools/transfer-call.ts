import type { CallControlClient } from '../clients/call-control.js';
import { TransferCallSchema } from '../types/mcp-schemas.js';

export const transferCallTool = {
  name: 'transfer_call',
  description: 'Transfer an active call to another extension or number (blind or attended)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension handling the call' },
      participant_id: { type: 'string', description: 'Active participant ID' },
      destination: { type: 'string', description: 'Transfer destination (extension or phone number)' },
      type: { type: 'string', enum: ['blind', 'attended'], description: 'Transfer type (default: blind)' },
    },
    required: ['extension', 'participant_id', 'destination'],
  },
};

export async function handleTransferCall(args: unknown, client: CallControlClient) {
  const { extension, participant_id, destination, type } = TransferCallSchema.parse(args);

  if (type === 'attended') {
    await client.transferAttended(extension, participant_id, destination);
  } else {
    await client.transferBlind(extension, participant_id, destination);
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        extension,
        participantId: participant_id,
        destination,
        transferType: type,
        message: `${type} transfer initiated to ${destination}`,
      }, null, 2),
    }],
  };
}
