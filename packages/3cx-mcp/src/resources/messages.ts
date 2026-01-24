import type { XApiClient } from '../clients/xapi.js';

export const messagesResource = {
  uri: '3cx://messages',
  name: 'Messages',
  description: 'SMS, WhatsApp, and live chat message history from 3CX',
  mimeType: 'application/json',
};

export async function readMessages(xapi: XApiClient) {
  const messages = await xapi.getMessages({ limit: 50 });
  return {
    contents: [{
      uri: messagesResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        count: messages.length,
        messages: messages.map(m => ({
          id: m.Id,
          from: m.From,
          to: m.To,
          body: m.Body,
          channel: m.Channel,
          direction: m.Direction,
          timestamp: m.Timestamp,
          status: m.Status,
        })),
        timestamp: new Date().toISOString(),
      }, null, 2),
    }],
  };
}
