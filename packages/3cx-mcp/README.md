# 3CX MCP Server for BrainSAIT LINC

Model Context Protocol (MCP) server that connects 3CX Cloud PBX to AI assistants (Claude, Cursor, Rovo, Copilot, Gemini) and BrainSAIT LINC agents for intelligent call handling and messaging.

## Features

### 🔧 10 MCP Tools
- **`make_call`** - Initiate outbound calls from extensions
- **`answer_call`** - Answer incoming ringing calls
- **`transfer_call`** - Blind or attended call transfers
- **`hold_call`** - Hold or resume active calls
- **`drop_call`** - Hang up calls
- **`send_message`** - Send SMS/WhatsApp/chat messages
- **`get_call_logs`** - Query CDR (Call Detail Records)
- **`get_extensions`** - List extensions with presence status
- **`get_presence`** - Check extension availability
- **`record_call`** - Start/stop call recording

### 📚 4 MCP Resources
- **`3cx://active-calls`** - Real-time active calls monitoring
- **`3cx://call-history`** - Recent call detail records
- **`3cx://extensions`** - Extension directory with presence
- **`3cx://messages`** - SMS/chat message history

### 🤖 AI Integration
- **Basma Voice Bridge** - Whisper STT → Claude AI → OpenAI TTS
- **MasterLinc Coordination** - Route calls to appropriate LINC agents

## Architecture

```
MCP Clients (Claude/Cursor/Rovo/Copilot/Gemini)
↓ stdio/HTTP
3CX MCP Server
├── REST API → 3CX Cloud PBX (https://1593.3cx.cloud)
├── WebSocket → Real-time call events
├── Twilio SIP Trunk → PSTN
└── AI Bridges
    ├── Basma (Voice AI)
    └── MasterLinc (Agent Router)
```

## Installation

### 1. Install Dependencies

```bash
cd /Users/fadil369/packages/3cx-mcp
npm install
```

### 2. Configure Environment

Create or update `.env`:

```bash
PBX_FQDN=1593.3cx.cloud
PBX_USERNAME=dr.mf.12298@gmail.com
PBX_PASSWORD=HFLC1rjZlPHNz6v7
PBX_DEFAULT_EXTENSION=12310

# Optional: For AI voice features
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: For LINC agent coordination
MASTERLINC_BASE_URL=https://brainsait-linc.workers.dev
```

### 3. Build

```bash
npm run build
```

## Configuration for AI Assistants

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "3cx": {
      "command": "node",
      "args": ["/Users/fadil369/packages/3cx-mcp/dist/index.js"],
      "env": {
        "PBX_FQDN": "1593.3cx.cloud",
        "PBX_USERNAME": "dr.mf.12298@gmail.com",
        "PBX_PASSWORD": "HFLC1rjZlPHNz6v7",
        "PBX_DEFAULT_EXTENSION": "12310"
      }
    }
  }
}
```

### Claude Code (Cursor)

Add to `.claude.json` or workspace settings:

```json
{
  "mcpServers": {
    "3cx": {
      "command": "npx",
      "args": ["tsx", "/Users/fadil369/packages/3cx-mcp/src/index.ts"],
      "env": {
        "PBX_FQDN": "1593.3cx.cloud",
        "PBX_USERNAME": "dr.mf.12298@gmail.com",
        "PBX_PASSWORD": "HFLC1rjZlPHNz6v7",
        "PBX_DEFAULT_EXTENSION": "12310"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "3cx-pbx": {
      "command": "node",
      "args": ["/Users/fadil369/packages/3cx-mcp/dist/index.js"],
      "env": {
        "PBX_FQDN": "1593.3cx.cloud",
        "PBX_USERNAME": "dr.mf.12298@gmail.com",
        "PBX_PASSWORD": "HFLC1rjZlPHNz6v7",
        "PBX_DEFAULT_EXTENSION": "12310"
      }
    }
  }
}
```

### GitHub Copilot

Add to `.github/copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "3cx": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/fadil369/packages/3cx-mcp/dist/index.js"],
      "environment": {
        "PBX_FQDN": "1593.3cx.cloud",
        "PBX_USERNAME": "dr.mf.12298@gmail.com",
        "PBX_PASSWORD": "HFLC1rjZlPHNz6v7",
        "PBX_DEFAULT_EXTENSION": "12310"
      }
    }
  }
}
```

### Rovo Dev

Add to `.rovodev/mcp-servers.json`:

```json
{
  "servers": {
    "3cx-telephony": {
      "command": "node",
      "args": ["/Users/fadil369/packages/3cx-mcp/dist/index.js"],
      "env": {
        "PBX_FQDN": "1593.3cx.cloud",
        "PBX_USERNAME": "dr.mf.12298@gmail.com",
        "PBX_PASSWORD": "HFLC1rjZlPHNz6v7",
        "PBX_DEFAULT_EXTENSION": "12310"
      }
    }
  }
}
```

### Google Gemini (AI Studio)

Add to `~/.config/gemini/mcp.json`:

```json
{
  "mcpServers": {
    "3cx": {
      "command": "node",
      "args": ["/Users/fadil369/packages/3cx-mcp/dist/index.js"],
      "env": {
        "PBX_FQDN": "1593.3cx.cloud",
        "PBX_USERNAME": "dr.mf.12298@gmail.com",
        "PBX_PASSWORD": "HFLC1rjZlPHNz6v7",
        "PBX_DEFAULT_EXTENSION": "12310"
      }
    }
  }
}
```

## Usage Examples

### Making a Call

```
Call +966501234567 from extension 12310
```

The AI assistant will use the `make_call` tool:
```json
{
  "extension": "12310",
  "destination": "+966501234567"
}
```

### Checking Active Calls

```
Show me all active calls
```

The AI will read the `3cx://active-calls` resource.

### Getting Call History

```
Show me calls from the last 24 hours for extension 12310
```

The AI will use the `get_call_logs` tool with appropriate filters.

### Transferring a Call

```
Transfer the current call on extension 12310 to extension 100
```

The AI will use the `transfer_call` tool.

## Development

### Run in Development Mode

```bash
npm run dev
```

### Type Check

```bash
npx tsc --noEmit
```

### Testing

Test the server manually:

```bash
# Start server
npm run dev

# In another terminal, test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## API Reference

### 3CX API Endpoints Used

- **OAuth2**: `POST /connect/token` - Password grant authentication
- **Call Control**: `POST /callcontrol/{ext}/makecall` - Initiate calls
- **XApi (OData)**: `GET /xapi/v1/Extensions` - Query extensions
- **WebSocket**: `WSS /ws` - Real-time call events

### Authentication

The server uses OAuth2 password grant flow:
1. Authenticates with username/password at startup
2. Caches token (60 min TTL)
3. Auto-refreshes 5 minutes before expiry
4. Handles 401 errors by re-authenticating

## Troubleshooting

### Authentication Fails (400/401)

- Verify credentials in `.env` are correct
- Check 3CX PBX is accessible: `curl https://1593.3cx.cloud`
- Verify extension 12310 exists and is registered
- Check user has appropriate permissions in 3CX Management Console

### WebSocket Connection Fails

- Check firewall allows WSS connections
- Verify token is valid (authentication succeeds first)
- WebSocket will auto-reconnect on failure

### Tools Not Showing in AI Assistant

- Restart the AI assistant application
- Check MCP server logs for startup errors: `npm run dev`
- Verify JSON configuration syntax is valid
- Ensure file paths are absolute and correct

## Security Notes

⚠️ **Credentials in Configuration**: The MCP server configuration includes plaintext credentials. Ensure:
- Configuration files are not committed to version control
- File permissions restrict access: `chmod 600 ~/.claude/claude_desktop_config.json`
- Consider using environment variable injection instead of hardcoding

## License

Private - BrainSAIT Internal Use Only

## Support

For issues or questions:
- Email: dr.mf.12298@gmail.com
- 3CX Extension: 12310
