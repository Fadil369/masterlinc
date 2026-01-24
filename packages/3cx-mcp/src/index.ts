#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { createServer } from './server.js';

async function main() {
  const config = loadConfig();
  const server = createServer(config);
  const transport = new StdioServerTransport();

  console.error('3CX MCP Server starting...');
  console.error(`  PBX: ${config.PBX_FQDN}`);
  console.error(`  Extension: ${config.PBX_DEFAULT_EXTENSION}`);

  await server.connect(transport);
  console.error('3CX MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
