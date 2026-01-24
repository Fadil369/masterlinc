import type { XApiClient } from '../clients/xapi.js';

export const callHistoryResource = {
  uri: '3cx://call-history',
  name: 'Call History',
  description: 'Recent call detail records (CDR) from 3CX PBX',
  mimeType: 'application/json',
};

export async function readCallHistory(xapi: XApiClient) {
  const logs = await xapi.getCallLogs({ limit: 50 });
  return {
    contents: [{
      uri: callHistoryResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        count: logs.length,
        records: logs.map(l => ({
          id: l.Id,
          callId: l.CallId,
          caller: l.Caller,
          callee: l.Callee,
          direction: l.Direction,
          status: l.Status,
          duration: l.Duration,
          startTime: l.StartTime,
          endTime: l.EndTime,
          extension: l.Extension,
          recordingUrl: l.RecordingUrl,
        })),
        timestamp: new Date().toISOString(),
      }, null, 2),
    }],
  };
}
