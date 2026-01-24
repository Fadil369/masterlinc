import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Config } from './config.js';
import { TokenManager } from './auth/token-manager.js';
import { CallControlClient } from './clients/call-control.js';
import { XApiClient } from './clients/xapi.js';
import { PBXWebSocket } from './clients/websocket.js';
import { MasterLincCoordinator } from './orchestration/masterlinc-coordinator.js';
import { BasmaEnhanced } from './orchestration/basma-enhanced.js';
import { AutomationEngine } from './workflows/automation-engine.js';

import { makeCallTool, handleMakeCall } from './tools/make-call.js';
import { answerCallTool, handleAnswerCall } from './tools/answer-call.js';
import { transferCallTool, handleTransferCall } from './tools/transfer-call.js';
import { holdCallTool, handleHoldCall } from './tools/hold-call.js';
import { dropCallTool, handleDropCall } from './tools/drop-call.js';
import { sendMessageTool, handleSendMessage } from './tools/send-message.js';
import { getCallLogsTool, handleGetCallLogs } from './tools/get-call-logs.js';
import { getExtensionsTool, handleGetExtensions } from './tools/get-extensions.js';
import { getPresenceTool, handleGetPresence } from './tools/get-presence.js';
import { recordCallTool, handleRecordCall } from './tools/record-call.js';

import { activeCallsResource, readActiveCalls } from './resources/active-calls.js';
import { callHistoryResource, readCallHistory } from './resources/call-history.js';
import { extensionsResource, readExtensions } from './resources/extensions.js';
import { messagesResource, readMessages } from './resources/messages.js';

import {
  MakeCallSchema, AnswerCallSchema, TransferCallSchema,
  HoldCallSchema, DropCallSchema, SendMessageSchema,
  GetCallLogsSchema, GetExtensionsSchema, GetPresenceSchema,
  RecordCallSchema,
} from './types/mcp-schemas.js';

export function createServer(config: Config): McpServer {
  const tokenManager = new TokenManager(config.PBX_FQDN, config.PBX_USERNAME, config.PBX_PASSWORD);
  const callControl = new CallControlClient(config.PBX_FQDN, tokenManager);
  const xapi = new XApiClient(config.PBX_FQDN, tokenManager);
  const wsClient = new PBXWebSocket(config.PBX_FQDN, tokenManager, config.PBX_DEFAULT_EXTENSION);
  
  // Initialize orchestration layer
  const masterlinc = new MasterLincCoordinator(config, callControl, xapi);
  const basma = new BasmaEnhanced(config);
  const automation = new AutomationEngine(config, masterlinc, basma, callControl, xapi);
  
  console.log('[3CX MCP] Orchestration initialized:', {
    agents: masterlinc.getAllAgents().length,
    workflows: masterlinc.getAllWorkflows().length,
    pipelines: automation.getAllPipelines().length,
  });

  const server = new McpServer({
    name: '3cx-mcp',
    version: '1.0.0',
  });

  // --- Register Tools ---

  server.tool(
    makeCallTool.name,
    makeCallTool.description,
    MakeCallSchema.shape,
    async (args) => handleMakeCall(args, callControl),
  );

  server.tool(
    answerCallTool.name,
    answerCallTool.description,
    AnswerCallSchema.shape,
    async (args) => handleAnswerCall(args, callControl),
  );

  server.tool(
    transferCallTool.name,
    transferCallTool.description,
    TransferCallSchema.shape,
    async (args) => handleTransferCall(args, callControl),
  );

  server.tool(
    holdCallTool.name,
    holdCallTool.description,
    HoldCallSchema.shape,
    async (args) => handleHoldCall(args, callControl),
  );

  server.tool(
    dropCallTool.name,
    dropCallTool.description,
    DropCallSchema.shape,
    async (args) => handleDropCall(args, callControl),
  );

  server.tool(
    sendMessageTool.name,
    sendMessageTool.description,
    SendMessageSchema.shape,
    async (args) => handleSendMessage(args, xapi),
  );

  server.tool(
    getCallLogsTool.name,
    getCallLogsTool.description,
    GetCallLogsSchema.shape,
    async (args) => handleGetCallLogs(args, xapi),
  );

  server.tool(
    getExtensionsTool.name,
    getExtensionsTool.description,
    GetExtensionsSchema.shape,
    async (args) => handleGetExtensions(args, xapi),
  );

  server.tool(
    getPresenceTool.name,
    getPresenceTool.description,
    GetPresenceSchema.shape,
    async (args) => handleGetPresence(args, xapi),
  );

  server.tool(
    recordCallTool.name,
    recordCallTool.description,
    RecordCallSchema.shape,
    async (args) => handleRecordCall(args, callControl),
  );

  // --- Register Resources ---

  server.resource(
    activeCallsResource.name,
    activeCallsResource.uri,
    { description: activeCallsResource.description, mimeType: activeCallsResource.mimeType },
    async () => readActiveCalls(callControl, config.PBX_DEFAULT_EXTENSION),
  );

  server.resource(
    callHistoryResource.name,
    callHistoryResource.uri,
    { description: callHistoryResource.description, mimeType: callHistoryResource.mimeType },
    async () => readCallHistory(xapi),
  );

  server.resource(
    extensionsResource.name,
    extensionsResource.uri,
    { description: extensionsResource.description, mimeType: extensionsResource.mimeType },
    async () => readExtensions(xapi),
  );

  server.resource(
    messagesResource.name,
    messagesResource.uri,
    { description: messagesResource.description, mimeType: messagesResource.mimeType },
    async () => readMessages(xapi),
  );

  // --- WebSocket event logging ---
  wsClient.on('*', (event) => {
    console.error(`[3CX Event] ${event.event}:`, JSON.stringify(event.data));
  });

  // Connect WebSocket in background (non-blocking)
  wsClient.connect().catch(err => {
    console.error('[3CX WS] Initial connection failed (will retry):', err.message);
  });

  // Cleanup on process exit
  process.on('SIGINT', () => {
    wsClient.disconnect();
    tokenManager.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    wsClient.disconnect();
    tokenManager.destroy();
    process.exit(0);
  });

  return server;
}
