# MASTERLINC Agent Routing & Runbook (Dev)

This doc assigns clear responsibilities (“who does what”), defines the routing contract (ports + endpoints), and provides a repeatable start/stop + workflow validation path.

## Quick Start (Recommended)

### 1) Start only what the workflow needs

```bash
cd /workspaces/masterlinc
SERVICES=claimlinc-api,policylinc-api MASTERLINC_BASE_PORT=9000 INSTALL_DEPS=0 ./scripts/start-services.sh
```

### 2) Run the end-to-end workflow smoke test

```bash
cd /workspaces/masterlinc
MASTERLINC_BASE_PORT=9000 FACILITY_ID=1 ./scripts/test-claim-workflow.sh
```

### 3) Stop everything

```bash
cd /workspaces/masterlinc
MASTERLINC_BASE_PORT=9000 ./scripts/stop-services.sh
```

## Routing Contract

### Base ports

- **Agent base port**: `MASTERLINC_BASE_PORT` (default `9000`)
- Agents are assigned as offsets from base to avoid SBS ports `8000–8003`.

| Agent | Port | Base URL | Health | Primary APIs |
|---|---:|---|---|---|
| MasterLinc (orchestrator) | `BASE+0` | `http://localhost:9000` | `GET /health` | `POST /execute` (generic) |
| ClaimLinc | `BASE+1` | `http://localhost:9001` | `GET /health` | `POST /api/v1/claims/submit`, `GET /api/v1/claims/{claim_id}` |
| DoctorLinc | `BASE+2` | `http://localhost:9002` | `GET /health` | patient/appointments APIs |
| PolicyLinc | `BASE+3` | `http://localhost:9003` | `GET /health` | `POST /api/v1/policies/validate` |
| Audit Service | `BASE+4` | `http://localhost:9004` | `GET /health` | audit/event ingestion |
| AuthLinc | `BASE+5` | `http://localhost:9005` | `GET /health` | auth APIs (JWT issuance/verify) |

### SBS (external stack)

These are **not** MASTERLINC agents. They are the SBS integration engine and run on fixed ports:

| SBS Service | Port | Base URL | Key route |
|---|---:|---|---|
| Normalizer | 8000 | `http://localhost:8000` | `POST /normalize` |
| Signer | 8001 | `http://localhost:8001` | `POST /sign` |
| Financial Rules | 8002 | `http://localhost:8002` | `POST /validate` |
| NPHIES Bridge | 8003 | `http://localhost:8003` | `POST /submit-claim` |

## “Who Owns What” (Delegation Rules)

This follows the same “agent catalog” style from `-awesome-brainsait-copilot`, but adapted to this repo’s runtime reality.

### ClaimLinc — Claim intake + tracking

**Owns**
- Accepting claim submissions from UI/workflow harness
- Persisting claim state (or mock-store in dev)
- Exposing claim status/detail

**Delegates to SBS**
- Code normalization (`SBS Normalizer`)
- CHI pricing / tier adjustments (`SBS Financial Rules`)
- Digital signature (`SBS Signer`)
- NPHIES submission (`SBS NPHIES Bridge`)

**Should not own**
- Payer eligibility coverage logic (PolicyLinc owns that)

### PolicyLinc — Eligibility/coverage validation

**Owns**
- `POST /api/v1/policies/validate` contract
- Coverage decisions + explanations

**Delegates**
- Future live payer connectivity (NPHIES eligibility / preauth) can be routed here, but keep ClaimLinc focused on claims.

### MasterLinc — Orchestration

**Owns**
- Workflow coordination between agents (when we move beyond shell scripts)
- Centralized “workflow status” and routing decisions

**Delegates**
- Domain execution to specialized agents

### AuthLinc — Authentication/authorization boundary

**Owns**
- JWT issuance/verification
- RBAC policy enforcement boundary (future)

**Delegates**
- Per-service authorization checks (services call AuthLinc or share middleware)

### DoctorLinc — Clinical/operational context

**Owns**
- Patient/appointment-facing APIs and future clinical context

**Delegates**
- Claim lifecycle to ClaimLinc

### Audit Service — Compliance logging

**Owns**
- Immutable-ish audit events in/out

## Workflow Payload Contract (SBS-sensitive)

### SBS financial pricing requires coding.system

SBS pricing is applied when the claim item coding system matches:

- `coding.system = http://sbs.sa/coding/services`

Both the browser harness (`apps/web/public/workflow-test.js`) and CLI script (`scripts/test-claim-workflow.sh`) enforce this.

### NPHIES bridge contract

`POST http://localhost:8003/submit-claim`

- Requires `facility_id`, `fhir_payload`, `signature`
- Include `resource_type: "Claim"`
- Treat `status=error` as failure even when HTTP is 200 (the bridge may report upstream connectivity/config issues this way)

## When to Start / When to Stop

### Start

- Start **SBS** first if you want real normalization/pricing/signing.
- Start **ClaimLinc + PolicyLinc** next.
- Start **frontend** last.

### Stop

- Stop agents via `./scripts/stop-services.sh`.
- Stop SBS via its own compose workflow (in `/workspaces/sbs`).

## Troubleshooting (fast)

- If `start-services.sh` can’t find `services/...`, you’re running it outside repo root. It’s now fixed to be CWD-independent.
- If NPHIES returns HTTP 200 but `status=error`, you likely need `NPHIES_BASE_URL` / `NPHIES_API_KEY` / outbound connectivity in SBS.
