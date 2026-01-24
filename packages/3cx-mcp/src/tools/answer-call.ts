import type { CallControlClient } from '../clients/call-control.js';
import { AnswerCallSchema } from '../types/mcp-schemas.js';

export const answerCallTool = {
  name: 'answer_call',
  description: 'Answer an incoming ringing call on a 3CX extension',
  inputSchema: {
    type: 'object' as const,
    properties: {
      extension: { type: 'string', description: 'Extension number' },
      participant_id: { type: 'string', description: 'Participant ID of the ringing call' },
    },
    required: ['extension', 'participant_id'],
  },
};

export async function handleAnswerCall(args: unknown, client: CallControlClient) {
  const { extension, participant_id } = AnswerCallSchema.parse(args);
  await client.answerCall(extension, participant_id);
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        extension,
        participantId: participant_id,
        message: `Call answered on extension ${extension}`,
      }, null, 2),
    }],
  };
}
