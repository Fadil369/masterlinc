import type { CallControlClient } from '../clients/call-control.js';
import { RecordCallSchema } from '../types/mcp-schemas.js';

export const recordCallTool = {
  name: 'record_call',
  description: 'Start or stop recording an active call on a 3CX extension',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      participant_id: { type: 'string', description: 'Active participant ID' },
      action: { type: 'string', enum: ['start', 'stop'], description: 'Start or stop recording' },
    },
    required: ['extension', 'participant_id', 'action'],
  },
};

export async function handleRecordCall(args: unknown, client: CallControlClient) {
  const { extension, participant_id, action } = RecordCallSchema.parse(args);

  if (action === 'start') {
    await client.startRecording(extension, participant_id);
  } else {
    await client.stopRecording(extension, participant_id);
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        extension,
        participantId: participant_id,
        action,
        message: `Recording ${action === 'start' ? 'started' : 'stopped'}`,
      }, null, 2),
    }],
  };
}
