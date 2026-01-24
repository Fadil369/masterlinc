#!/usr/bin/env node
/**
 * HTTP Server Entry Point
 * Provides REST API endpoints for web dashboard and service interfaces
 */

import 'dotenv/config';
import http from 'http';
import { loadConfig } from './config.js';
import { createServer } from './server.js';
import { DashboardAPI } from './api/dashboard-api.js';
import { TokenManager } from './auth/token-manager.js';
import { CallControlClient } from './clients/call-control.js';
import { XApiClient } from './clients/xapi.js';
import { MasterLincCoordinator } from './orchestration/masterlinc-coordinator.js';
import { BasmaEnhanced } from './orchestration/basma-enhanced.js';
import { EnhancedIntelligence } from './ai/enhanced-intelligence.js';

async function main() {
  try {
    const config = loadConfig();
    
    // Initialize clients
    const tokenManager = new TokenManager(config.PBX_FQDN, config.PBX_USERNAME, config.PBX_PASSWORD);
    const callControl = new CallControlClient(config.PBX_FQDN, tokenManager);
    const xapi = new XApiClient(config.PBX_FQDN, tokenManager);
    const coordinator = new MasterLincCoordinator(config, callControl, xapi);
    const basma = new BasmaEnhanced(config);
    const intelligence = new EnhancedIntelligence(config);
    
    // Initialize Dashboard API
    const dashboardAPI = new DashboardAPI(callControl, xapi, coordinator);

    // Create MCP Server (for stdio transport)
    const mcpServer = createServer(config);

    // Create HTTP Server
    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://${req.headers.host}`);

      try {
        // Health check endpoint
        if (url.pathname === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
          return;
        }

        // Dashboard API
        if (url.pathname === '/api/dashboard') {
          const data = await dashboardAPI.getDashboardData();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
          return;
        }

        // MCP Tools endpoint
        if (url.pathname === '/api/mcp/tools') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            tools: [
              'make_call', 'answer_call', 'transfer_call', 'hold_call', 'drop_call',
              'send_message', 'get_call_logs', 'get_extensions', 'get_presence', 'record_call',
              'conference_call', 'bulk_call', 'get_queue_stats', 'set_presence',
              'get_recording', 'schedule_call', 'call_whisper', 'call_barge'
            ]
          }));
          return;
        }

        // AI Conversation endpoint
        if (url.pathname === '/api/ai/conversation' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            const { message, sessionId, userId } = JSON.parse(body);
            const result = await intelligence.continueConversation(message, sessionId, userId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          });
          return;
        }

        // Workflow execution endpoint
        if (url.pathname.startsWith('/api/workflows/') && req.method === 'POST') {
          const workflowId = url.pathname.split('/').pop();
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            const context = JSON.parse(body);
            const result = await coordinator.executeWorkflow(workflowId!, context);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          });
          return;
        }

        // Metrics endpoint (Prometheus format)
        if (url.pathname === '/metrics') {
          const analytics = await coordinator.getAnalytics();
          const metrics = `# HELP 3cx_active_calls_total Active calls on the PBX
# TYPE 3cx_active_calls_total gauge
3cx_active_calls_total 0

# HELP 3cx_calls_total Total calls processed
# TYPE 3cx_calls_total counter
3cx_calls_total ${analytics.totalCalls}

# HELP 3cx_agents_available Available agents
# TYPE 3cx_agents_available gauge
3cx_agents_available ${coordinator.getAllAgents().filter(a => a.status === 'idle').length}

# HELP 3cx_call_duration_seconds Average call duration
# TYPE 3cx_call_duration_seconds gauge
3cx_call_duration_seconds ${analytics.avgDuration}
`;
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(metrics);
          return;
        }

        // 404 Not Found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));

      } catch (error: any) {
        console.error('Request error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    const PORT = process.env.HTTP_PORT || 3000;
    server.listen(PORT, () => {
      console.log(`[3CX MCP HTTP Server] Running on http://localhost:${PORT}`);
      console.log(`[3CX MCP HTTP Server] Dashboard: http://localhost:${PORT}/api/dashboard`);
      console.log(`[3CX MCP HTTP Server] Health: http://localhost:${PORT}/health`);
      console.log(`[3CX MCP HTTP Server] Metrics: http://localhost:${PORT}/metrics`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[3CX MCP HTTP Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[3CX MCP HTTP Server] Server closed');
        process.exit(0);
      });
    });

  } catch (error: any) {
    console.error('[3CX MCP HTTP Server] Fatal error:', error.message);
    process.exit(1);
  }
}

main();
