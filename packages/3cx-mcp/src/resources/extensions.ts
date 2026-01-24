import type { XApiClient } from '../clients/xapi.js';

export const extensionsResource = {
  uri: '3cx://extensions',
  name: 'Extensions',
  description: '3CX extension directory with registration and presence status',
  mimeType: 'application/json',
};

export async function readExtensions(xapi: XApiClient) {
  const extensions = await xapi.getExtensions();
  return {
    contents: [{
      uri: extensionsResource.uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        count: extensions.length,
        extensions: extensions.map(ext => ({
          number: ext.Number,
          firstName: ext.FirstName,
          lastName: ext.LastName,
          email: ext.Email,
          department: ext.Department,
          profile: ext.CurrentProfile,
          registered: ext.Registered,
        })),
        timestamp: new Date().toISOString(),
      }, null, 2),
    }],
  };
}
