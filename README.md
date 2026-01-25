# 🧠 MasterLinc - BrainSAIT Ultimate Integration

**AI-Powered Medical Imaging Platform with Multi-Channel Communication**

A comprehensive orchestration framework integrating DeepSeek AI, RadioLinc Agent, Orthanc PACS, OHIF Viewer, and multi-channel communication (WhatsApp, Telegram, Phone, Voice AI) for intelligent radiology workflows.

---

## 🎯 Overview

MasterLinc is the central nervous system of the BrainSAIT radiology platform, providing:

- **🤖 AI-Powered Analysis**: DeepSeek V3.2 for intelligent DICOM study analysis
- **📱 Multi-Channel Communication**: WhatsApp, Telegram, Phone (3CX), Voice (Basma)
- **🏥 RadioLinc Agent**: Intelligent patient/provider workflow coordination
- **🔄 Unified Orchestration**: Central API coordinating all services
- **🌍 Public Access**: Secure Tailscale VPN connectivity

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  BRAINSAIT ULTIMATE PLATFORM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │WhatsApp  │  │Telegram  │  │ Phone    │  │ Voice    │       │
│  │(Clawdbot)│  │(Clawdbot)│  │(3CX PBX) │  │ (Basma)  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │             │             │
│       └─────────────┼──────────────┼─────────────┘             │
│                     │              │                           │
│            ┌────────▼──────────────▼────────┐                  │
│            │   MasterLinc Coordinator       │                  │
│            │  (Central Orchestration API)   │                  │
│            └────────┬───────────────────────┘                  │
│                     │                                          │
│        ┌────────────┼────────────┐                             │
│        │            │            │                             │
│   ┌────▼─────┐ ┌───▼────┐  ┌───▼─────────┐                    │
│   │RadioLinc │ │DeepSeek│  │   Basma     │                    │
│   │  Agent   │ │AI V3.2 │  │ Voice AI    │                    │
│   └────┬─────┘ └───┬────┘  └─────────────┘                    │
│        │           │                                           │
│        └───────────┼───────────────┐                           │
│                    │               │                           │
│           ┌────────▼───────┐  ┌───▼──────┐                    │
│           │  Orthanc PACS  │  │   3CX    │                    │
│           │  OHIF Viewer   │  │   PBX    │                    │
│           └────────────────┘  └──────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Packages

### Core Services

- **`packages/masterlinc-coordinator/`** - Central orchestration API (Express.js)
- **`packages/deepseek-radiology/`** - AI-powered DICOM analysis using DeepSeek V3.2
- **`packages/radiolinc-agent/`** - Patient/provider communication agent

### Integrations

- **`integrations/clawdbot-*.js`** - WhatsApp/Telegram bot skills
- **`integrations/clawd/`** - AI agent framework documentation
- **`integrations/viewers-configs/`** - OHIF viewer configurations & Arabic localization

### Documentation & Scripts

- **`docs/deployment/`** - Deployment guides and status reports
- **`scripts/`** - Deployment, testing, and setup scripts
- **`config/`** - Configuration templates and nginx configs

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd masterlinc
npm install
```

### 2. Build All Packages

```bash
# Build in correct order
cd packages/deepseek-radiology && npm install && npm run build
cd ../radiolinc-agent && npm install && npm run build
cd ../masterlinc-coordinator && npm install && npm run build
```

### 3. Configure Environment

```bash
cp config/masterlinc.env.example ~/.masterlinc.env
# Edit ~/.masterlinc.env with your API keys and settings
```

### 4. Start Services

```bash
# Start MasterLinc Coordinator
cd packages/masterlinc-coordinator
nohup node dist/index.js > ~/logs/masterlinc.log 2>&1 &

# Or use Docker Compose (includes all services)
docker-compose -f scripts/docker-compose-unified.yml up -d
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl http://localhost:4000/health

# Run full test suite
bash scripts/test-public-access.sh
```

---

## 🌍 Public Access

The platform is accessible via **Tailscale VPN** at: `100.122.153.63`

**Endpoints:**
- **MasterLinc API**: `http://100.122.153.63:4000`
- **Orthanc PACS**: `http://100.122.153.63:8042`
- **OHIF Viewer**: `http://100.122.153.63:3000`

Access from any device with Tailscale installed (iPhone, iPad, Mac, PC).

---

## 📱 Usage Examples

### WhatsApp/Telegram Commands

```
@bot status              → System health check
@bot studies today       → List today's DICOM studies
@bot analyze study <ID>  → AI-powered study analysis
@bot triage <ID>         → RadioLinc intelligent triage
```

### API Usage

```bash
# Process a command
curl -X POST http://100.122.153.63:4000/api/process \
  -H "Content-Type: application/json" \
  -d '{"source":"api","command":"health"}'

# Triage a study
curl -X POST http://100.122.153.63:4000/api/radiolinc/triage \
  -H "Content-Type: application/json" \
  -d '{"studyId":"STUDY-12345"}'

# Analyze with DeepSeek AI
curl -X POST http://100.122.153.63:4000/api/deepseek/analyze \
  -H "Content-Type: application/json" \
  -d '{"studyId":"STUDY-12345","modality":"CT"}'
```

---

## 🔧 Configuration

### MasterLinc Coordinator

Configure via `~/.masterlinc.env`:

```bash
SYNTHETIC_API_KEY=your_deepseek_api_key
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
COORDINATOR_PORT=4000
```

### Clawdbot Skills

Install skills for WhatsApp/Telegram integration:

```bash
cp integrations/clawdbot-masterlinc-bridge.js ~/.clawdbot/skills/
cp integrations/clawdbot-brainsait-radiology.js ~/.clawdbot/skills/
```

### OHIF Viewer

Deploy viewer configurations:

```bash
cp integrations/viewers-configs/*.js /path/to/ohif/public/config/
```

---

## 📚 Documentation

- **[Deployment Guide](docs/deployment/DEPLOYMENT-COMPLETE.txt)** - Complete deployment summary
- **[Integration Plan](docs/deployment/ULTIMATE-INTEGRATION-PLAN.md)** - Architecture & workflows
- **[API Documentation](docs/deployment/FINAL-DEPLOYMENT-STATUS.md)** - API endpoints & usage
- **[Public Access Setup](docs/deployment/PUBLIC-API-SETUP.md)** - Tailscale VPN configuration

---

## 🏥 Features

### DeepSeek AI Integration
- ✅ DICOM study analysis and classification
- ✅ Natural language medical queries
- ✅ Automated report generation
- ✅ Quality assessment and recommendations

### RadioLinc Agent
- ✅ Intelligent study triage and prioritization
- ✅ Patient/provider communication routing
- ✅ Multi-channel workflow coordination
- ⏳ Phone call integration (3CX PBX)
- ⏳ Voice AI commands (Basma)

### Multi-Channel Communication
- ✅ WhatsApp bot (Clawdbot)
- ✅ Telegram bot (Clawdbot)
- ✅ REST API (MasterLinc Coordinator)
- ⏳ Phone calls (3CX + Twilio)
- ⏳ Voice commands (Basma Voice AI)

### PACS Integration
- ✅ Orthanc DICOM storage
- ✅ OHIF web-based viewer
- ✅ RESTful API access
- ✅ Arabic localization support

---

## 🔒 Security

- **Tailscale VPN**: Military-grade WireGuard encryption
- **Authentication**: JWT tokens, Basic Auth for Orthanc
- **HIPAA Compliance**: On-premises data storage, audit logging
- **Privacy**: Patient data anonymized in chat responses

---

## 🛠️ Development

### Project Structure

```
masterlinc/
├── packages/
│   ├── deepseek-radiology/      # AI analysis package
│   ├── radiolinc-agent/          # Communication agent
│   └── masterlinc-coordinator/   # Central API
├── integrations/
│   ├── clawdbot-*.js             # Bot skills
│   ├── clawd/                    # AI framework docs
│   └── viewers-configs/          # OHIF configs
├── docs/deployment/              # Documentation
├── scripts/                      # Deployment scripts
└── config/                       # Configuration files
```

### Building Packages

Each package is built independently:

```bash
cd packages/<package-name>
npm install
npm run build
```

### Testing

```bash
# Run test script
bash scripts/test-public-access.sh

# Manual testing
curl http://localhost:4000/health
```

---

## 📊 Deployment Status

**Current State:**
- ✅ MasterLinc Coordinator: Running (PID 281990, Port 4000)
- ✅ DeepSeek AI: Integrated & Operational
- ✅ RadioLinc Agent: Built & Integrated
- ✅ Orthanc PACS: Running (2+ days uptime)
- ✅ OHIF Viewer: Running (Port 3000)
- ✅ Tailscale VPN: Active (100.122.153.63)
- ✅ Public Access: Fully Functional

---

## 🚀 Next Steps

### Immediate Enhancements
- [ ] Deploy 3CX MCP server for phone integration
- [ ] Integrate Basma Voice AI for voice commands
- [ ] Enable Orthanc webhook plugin for auto-triage
- [ ] Set up Prometheus + Grafana monitoring

### Future Features
- [ ] Mobile app (iOS/Android)
- [ ] Web dashboard UI
- [ ] Advanced AI reporting with reasoning chains
- [ ] Multi-language support expansion

---

## 📞 Support

- **Documentation**: See `docs/deployment/` directory
- **Issues**: Create GitHub issues
- **API Status**: `curl http://100.122.153.63:4000/health`

---

## 📄 License

Proprietary - BrainSAIT Medical Imaging Platform

---

## 🎉 Acknowledgments

Built with:
- **DeepSeek V3.2** - Advanced AI reasoning
- **Orthanc** - DICOM PACS server
- **OHIF** - Medical imaging viewer
- **Clawdbot** - Multi-platform messaging
- **3CX** - VoIP PBX system
- **Tailscale** - Secure networking

---

**BrainSAIT Ultimate Integration - Powering the Future of Radiology** 🧠✨
