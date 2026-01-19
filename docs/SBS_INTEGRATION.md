# MASTERLINC + SBS Integration Configuration

## Overview

This configuration integrates MASTERLINC's healthcare AI platform with the Saudi Billing System (SBS) to enable comprehensive medical billing and claims processing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTERLINC Platform                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Frontend  │  │  Backend API │  │  Agent Services  │   │
│  │  (React)   │──│  (Node.js)   │──│  (Python FastAPI)│   │
│  │  :5173     │  │  :3000       │  │  :8000-9000     │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
│         │              │                     │              │
│         └──────────────┴─────────────────────┘              │
│                        │                                     │
│         ┌──────────────┴──────────────┐                    │
│         │  Infrastructure              │                    │
│         │  • PostgreSQL :5432          │                    │
│         │  • Redis :6379               │                    │
│         └──────────────┬───────────────┘                    │
└────────────────────────┼────────────────────────────────────┘
                         │
            Integration Layer (Shared DB & APIs)
                         │
┌────────────────────────┼────────────────────────────────────┐
│                  SBS Integration Engine                     │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Normalizer    │  │  Financial     │  │   Signer     │ │
│  │  (AI-Powered)  │  │  Rules Engine  │  │   Service    │ │
│  │  :8000         │  │  :8002         │  │   :8001      │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│         │                   │                    │          │
│         └───────────────────┴────────────────────┘          │
│                             │                                │
│                   ┌─────────┴─────────┐                     │
│                   │  NPHIES Bridge    │                     │
│                   │  :8003            │                     │
│                   └─────────┬─────────┘                     │
└──────────────────────────────┼──────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   NPHIES Platform   │
                    │  (Saudi Arabia)     │
                    └─────────────────────┘
```

## Service Ports

### MASTERLINC Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### SBS Services

- **Normalizer Service**: http://localhost:8000 (AI-powered code translation)
- **Signer Service**: http://localhost:8001 (Digital signing)
- **Financial Rules Engine**: http://localhost:8002 (CHI business rules)
- **NPHIES Bridge**: http://localhost:8003 (NPHIES communication)

### MASTERLINC Agent Services (Future)

- **AuthLinc API**: Port 13000
- **ClaimLinc API**: Port 14000
- **DoctorLinc API**: Port 15000
- **PolicyLinc API**: Port 16000
- **DevLinc API**: Port 17000
- **Audit Service**: Port 18000

## Integration Points

### 1. Shared Database

Both platforms can share the PostgreSQL instance at :5432 with separate schemas:

- `masterlinc_main` - MASTERLINC data
- `sbs_integration` - SBS data

### 2. API Integration

MASTERLINC agents can call SBS services for:

- Medical code normalization (Normalizer Service)
- Financial calculations (Financial Rules Engine)
- Document signing (Signer Service)
- NPHIES submissions (NPHIES Bridge)

### 3. Agent Workflow

```
1. MASTERLINC receives medical claim
2. ClaimLinc agent processes initial claim
3. Call SBS Normalizer to translate codes
4. Call SBS Financial Engine for calculations
5. Call SBS Signer for digital signature
6. Call SBS NPHIES Bridge for submission
7. Return status to MASTERLINC
```

## Environment Configuration

### MASTERLINC (.env)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masterlinc
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
```

### SBS (.env)

```bash
DB_NAME=sbs_integration
DB_USER=postgres
DB_PASSWORD=changeme
DB_HOST=localhost
DB_PORT=5432

# Gemini API for AI-powered normalization
GEMINI_API_KEY=your_gemini_api_key

# NPHIES Configuration
NPHIES_BASE_URL=https://hsb.nphies.sa
NPHIES_CLIENT_ID=your_client_id
NPHIES_CLIENT_SECRET=your_client_secret

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Quick Start

### Start All Services

```bash
cd /workspaces/masterlinc
chmod +x scripts/start-all-services.sh
./scripts/start-all-services.sh
```

### Stop All Services

```bash
cd /workspaces/masterlinc
chmod +x scripts/stop-all.sh
./scripts/stop-all.sh
```

### View Logs

```bash
# MASTERLINC Backend
tail -f /tmp/masterlinc-backend.log

# MASTERLINC Frontend
tail -f /tmp/masterlinc-frontend.log

# SBS Services
cd /workspaces/sbs && docker compose logs -f normalizer-service
cd /workspaces/sbs && docker compose logs -f financial-rules-engine
cd /workspaces/sbs && docker compose logs -f signer-service
cd /workspaces/sbs && docker compose logs -f nphies-bridge
```

## Agent Configuration

### Enable SBS Integration in Agents

Create `config/sbs-integration.yaml`:

```yaml
sbs:
  enabled: true
  services:
    normalizer:
      url: http://localhost:8000
      timeout: 30
    financial:
      url: http://localhost:8002
      timeout: 30
    signer:
      url: http://localhost:8001
      timeout: 15
    nphies:
      url: http://localhost:8003
      timeout: 60

  workflows:
    claim_submission:
      steps:
        - normalize_codes
        - apply_financial_rules
        - sign_payload
        - submit_to_nphies
```

### Example Agent Integration

```python
# claimlinc-api/main.py
import httpx
from fastapi import FastAPI

app = FastAPI()

SBS_CONFIG = {
    "normalizer": "http://localhost:8000",
    "financial": "http://localhost:8002",
    "signer": "http://localhost:8001",
    "nphies": "http://localhost:8003"
}

@app.post("/api/claims/submit")
async def submit_claim(claim_data: dict):
    # Step 1: Normalize codes
    async with httpx.AsyncClient() as client:
        normalized = await client.post(
            f"{SBS_CONFIG['normalizer']}/normalize",
            json=claim_data
        )

    # Step 2: Apply financial rules
    financial = await client.post(
        f"{SBS_CONFIG['financial']}/calculate",
        json=normalized.json()
    )

    # Step 3: Sign payload
    signed = await client.post(
        f"{SBS_CONFIG['signer']}/sign",
        json=financial.json()
    )

    # Step 4: Submit to NPHIES
    result = await client.post(
        f"{SBS_CONFIG['nphies']}/submit",
        json=signed.json()
    )

    return result.json()
```

## Health Checks

```bash
# Check all services
curl http://localhost:3000/health   # MASTERLINC Backend
curl http://localhost:8000/health   # SBS Normalizer
curl http://localhost:8001/health   # SBS Signer
curl http://localhost:8002/health   # SBS Financial
curl http://localhost:8003/health   # SBS NPHIES Bridge
```

## Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Find process using port
lsof -ti:3000

# Kill process
kill $(lsof -ti:3000)
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker exec -it masterlinc-postgres psql -U postgres -c '\l'

# Check SBS database
docker exec -it sbs-postgres psql -U postgres -d sbs_integration -c '\dt'
```

### Service Not Starting

```bash
# Check logs
docker compose logs normalizer-service
docker compose logs financial-rules-engine

# Restart specific service
docker compose restart normalizer-service
```

## Security Considerations

1. **Never commit credentials** - Use `.env` files and add them to `.gitignore`
2. **Use proper CORS configuration** - Only allow trusted origins
3. **Enable HTTPS in production** - Use reverse proxy (nginx/traefik)
4. **Rotate certificates regularly** - Digital signing certificates
5. **Monitor API usage** - Implement rate limiting
6. **Audit all NPHIES submissions** - Keep detailed logs

## Next Steps

1. ✅ Start all services
2. Configure SBS `.env` with real credentials
3. Test integration with sample claim
4. Configure MASTERLINC agents to use SBS
5. Deploy to production environment

---

**Documentation Version:** 1.0  
**Last Updated:** January 19, 2026  
**Maintained By:** MASTERLINC Team
