import type { XApiClient } from '../clients/xapi.js';
import { SendMessageSchema } from '../types/mcp-schemas.js';

export const sendMessageTool = {
  name: 'send_message',
  description: 'Send an SMS, WhatsApp, or live chat message via 3CX',
  inputSchema: {
    type: 'object' as const,
    properties: {
      from_extension: { type: 'string', description: 'Sender extension number' },
      to: { type: 'string', description: 'Recipient (phone number or extension)' },
      message: { type: 'string', description: 'Message content' },
      channel: { type: 'string', enum: ['sms', 'whatsapp', 'livechat'], description: 'Messaging channel (default: sms)' },
    },
    required: ['from_extension', 'to', 'message'],
  },
};

export async function handleSendMessage(args: unknown, xapi: XApiClient) {
  const { from_extension, to, message, channel } = SendMessageSchema.parse(args);
  await xapi.sendMessage(from_extension, to, message, channel);
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        from: from_extension,
        to,
        channel,
        message: `Message sent via ${channel} to ${to}`,
      }, null, 2),
    }],
  };
}
