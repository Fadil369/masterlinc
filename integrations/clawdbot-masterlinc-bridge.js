/**
 * MasterLinc Bridge - Routes Clawdbot messages to MasterLinc Coordinator
 * Enables unified orchestration across messaging platforms
 */

const http = require('http');

module.exports = {
  name: 'masterlinc-bridge',
  description: 'Bridge to MasterLinc orchestration system',
  version: '1.0.0',
  
  // Trigger patterns
  triggers: [
    /^@bot\s+(.+)/i,
    /^!radiology\s+(.+)/i,
    /^\/analyze\s+(.+)/i
  ],
  
  async handler(message, context) {
    try {
      const command = message.text.replace(/^(@bot|!radiology|\/analyze)\s+/i, '').trim();
      
      console.log('[MasterLinc Bridge] Processing:', command);
      
      // Forward to MasterLinc coordinator
      const response = await this.forwardToMasterLinc({
        source: 'clawdbot',
        platform: message.platform || 'whatsapp',
        user: message.from,
        command: command,
        rawMessage: message.text,
        timestamp: Date.now(),
        context: {
          userName: message.sender?.name || 'Unknown',
          chatId: message.chat?.id
        }
      });
      
      return response.message;
      
    } catch (error) {
      console.error('[MasterLinc Bridge] Error:', error);
      return `❌ Error: ${error.message}. MasterLinc coordinator may be offline.`;
    }
  },
  
  async forwardToMasterLinc(payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/process',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          'X-Source': 'clawdbot',
          'Authorization': `Bearer ${process.env.MASTERLINC_API_KEY || 'dev-key'}`
        },
        timeout: 30000 // 30 second timeout
      };
      
      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            // Fallback if coordinator returns plain text
            resolve({ message: responseData });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('MasterLinc coordinator timeout'));
      });
      
      req.write(data);
      req.end();
    });
  },
  
  // Health check - called by Clawdbot on startup
  async init() {
    try {
      const health = await this.forwardToMasterLinc({ 
        command: 'health', 
        source: 'clawdbot-init' 
      });
      console.log('[MasterLinc Bridge] ✅ Connected to MasterLinc:', health);
      return true;
    } catch (error) {
      console.warn('[MasterLinc Bridge] ⚠️ MasterLinc coordinator not available:', error.message);
      console.warn('[MasterLinc Bridge] Will retry on first message');
      return false; // Don't fail Clawdbot startup
    }
  }
};
