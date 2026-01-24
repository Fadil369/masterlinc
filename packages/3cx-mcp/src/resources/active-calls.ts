import type { CallControlClient } from '../clients/call-control.js';

export const activeCallsResource = {
  uri: '3cx://active-calls',
  name: 'Active Calls',
  description: 'Real-time list of active calls across all monitored extensions',
  mimeType: 'application/json',
};

export async function readActiveCalls(client: CallControlClient, extension: string) {
  const calls = await client.getActiveCalls(extension);
  return {
    contents: [{
      uri: activeCallsResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        extension,
        activeCalls: calls.map(c => ({
          id: c.Id,
          participantId: c.ParticipantId,
          caller: c.Caller,
          callee: c.Callee,
          status: c.Status,
          direction: c.Direction,
          duration: c.Duration,
          startTime: c.StartTime,
        })),
        timestamp: new Date().toISOString(),
      }, null, 2),
    }],
  };
}
