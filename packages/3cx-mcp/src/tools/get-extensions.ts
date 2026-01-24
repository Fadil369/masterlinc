import type { XApiClient } from '../clients/xapi.js';
import { GetExtensionsSchema } from '../types/mcp-schemas.js';

export const getExtensionsTool = {
  name: 'get_extensions',
  description: 'List 3CX extensions with optional department filter and presence status',
  inputSchema: {
    type: 'object' as const,
    properties: {
      department: { type: 'string', description: 'Filter by department' },
      include_status: { type: 'boolean', description: 'Include presence status (default: false)' },
    },
    required: [],
  },
};

export async function handleGetExtensions(args: unknown, xapi: XApiClient) {
  const { department, include_status } = GetExtensionsSchema.parse(args);
  const extensions = await xapi.getExtensions(department);

  const result = extensions.map(ext => ({
    number: ext.Number,
    name: `${ext.FirstName} ${ext.LastName}`.trim(),
    email: ext.Email,
    department: ext.Department,
    registered: ext.Registered,
    ...(include_status ? { profile: ext.CurrentProfile } : {}),
  }));

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ count: result.length, extensions: result }, null, 2),
    }],
  };
}
