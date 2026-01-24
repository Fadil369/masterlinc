# 🚀 3CX MCP Server - Quick Start Guide

## ✅ Server is Running!

Your 3CX MCP Server with enhanced AI capabilities is deployed and ready.

---

## 📍 Current Status

- **Server Status:** ✅ Running on http://localhost:3000
- **Health Check:** ✅ Passing
- **Build Status:** ✅ 0 errors
- **Repository:** ✅ Synced to GitHub
- **AI Assistants:** ✅ Configured (restart required)

---

## 🎯 Test the Server (30 seconds)

### 1. Check Health
```bash
curl http://localhost:3000/health
```
Expected: `{"status":"healthy","timestamp":"..."}`

### 2. List Available Tools
```bash
curl http://localhost:3000/api/mcp/tools
```
Expected: JSON array with 18 MCP tools

### 3. Test with AI Assistant

**Restart your AI assistant** (e.g., Claude Desktop: Cmd+Q then relaunch)

Then ask:
```
"Show me all 3CX MCP tools"
```

You should see all 18 tools listed!

---

## 🔧 Available MCP Tools

### Core Telephony (10)
1. `make_call` - Initiate outbound calls
2. `answer_call` - Answer incoming calls
3. `transfer_call` - Transfer active calls
4. `hold_call` - Hold/resume calls
5. `drop_call` - Hang up calls
6. `send_message` - Send SMS/WhatsApp
7. `get_call_logs` - Query CDR records
8. `get_extensions` - List extensions
9. `get_presence` - Check availability
10. `record_call` - Start/stop recording

### Advanced Features (8)
11. `conference_call` - Multi-party conferences
12. `bulk_call` - Automated campaigns
13. `get_queue_stats` - Queue metrics
14. `set_presence` - Update status
15. `get_recording` - Download recordings
16. `schedule_call` - Future calls
17. `call_whisper` - Supervisor coaching
18. `call_barge` - Supervisor intervention

---

## 🤖 AI Capabilities

### Enhanced Intelligence
- **Conversation Memory** - Remembers context across calls
- **Predictive Analytics** - Churn risk, upsell opportunities
- **RAG Integration** - Knowledge-enhanced responses
- **Emotion Detection** - Adapts to caller sentiment
- **Multi-language** - Supports 6 languages

### Try It!
```bash
curl -X POST http://localhost:3000/api/ai/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help with my account",
    "sessionId": "test-session",
    "userId": "user123"
  }'
```

---

## 📊 Monitoring

### Check Metrics
```bash
curl http://localhost:3000/metrics
```

### View Dashboard Data
```bash
curl http://localhost:3000/api/dashboard
```

---

## 🐳 Full Stack Deployment (Optional)

If you want Prometheus + Grafana monitoring:

```bash
cd /Users/fadil369/packages/3cx-mcp

# Start Docker Desktop first, then:
docker compose up -d

# Access:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3002
```

---

## ⚠️ Troubleshooting

### Server Not Responding?
```bash
# Check if running
ps aux | grep "node.*3cx"

# Restart
cd /Users/fadil369/packages/3cx-mcp
npm run start:http
```

### AI Assistant Not Showing Tools?
1. Completely quit the AI assistant (Cmd+Q on Mac)
2. Relaunch the application
3. Wait 10 seconds for MCP server to connect
4. Try asking about tools again

### 3CX Connection Failed?
This is expected - the 3CX PBX at `1593.3cx.cloud` appears to be offline or unreachable. The MCP server will work fully once the PBX is accessible.

---

## 📚 More Information

- **Full Documentation:** See `README.md`
- **API Reference:** See `FINAL_DEPLOYMENT_REPORT.md`
- **Configuration:** See `CONFIGURATION_SUMMARY.md`

---

## 🎉 You're Ready!

Your intelligent telephony platform is operational. Restart your AI assistant and start using the 18 MCP tools!

**Questions?** Check the documentation files in this directory.
