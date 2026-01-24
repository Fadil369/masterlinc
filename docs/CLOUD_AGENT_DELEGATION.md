# Cloud Agent Delegation Guide

## Overview

The MasterLinc platform supports delegating tasks to cloud-based agents for automated processing, testing, deployment, and monitoring. This guide explains how to configure and use cloud agent delegation.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Cloud Agent Orchestrator              │
│              (MasterLinc API)                   │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    │            │            │              │
    ▼            ▼            ▼              ▼
┌────────┐  ┌────────┐  ┌────────┐    ┌────────┐
│ClaimLinc│ │DoctorLinc│ │PolicyLinc│  │DevLinc │
│ Agent  │  │ Agent   │  │ Agent   │   │ Agent  │
└────────┘  └────────┘  └────────┘    └────────┘
```

## Quick Start

### 1. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Cloud Agent Configuration
CLOUD_ORCHESTRATOR_URL=http://masterlinc-api:8000
CICD_AGENT_URL=http://devlinc-api:8004
MONITORING_AGENT_URL=http://prometheus:9090

# Optional API Keys
NPHIES_API_KEY=your-nphies-api-key
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 2. Start Services

```bash
# Using Docker Compose
docker-compose -f infrastructure/docker/docker-compose.agents.yml up -d

# Or using the start script
./scripts/start-all-services.sh
```

### 3. Delegate Tasks

```bash
# Check agent health
./scripts/delegate-to-cloud-agent.sh health

# Delegate a build task
./scripts/delegate-to-cloud-agent.sh build

# Delegate test execution
./scripts/delegate-to-cloud-agent.sh test

# Delegate deployment
./scripts/delegate-to-cloud-agent.sh deploy
```

## Agent Types

### MasterLinc Orchestrator
- **Purpose**: Central coordination and workflow management
- **Endpoint**: `http://masterlinc-api:8000`
- **Capabilities**: Task delegation, service coordination, resource allocation

### ClaimLinc Agent
- **Purpose**: Claims processing and validation
- **Endpoint**: `http://claimlinc-api:8001`
- **Capabilities**: Claim validation, pattern analysis, fraud detection

### DoctorLinc Agent
- **Purpose**: Clinical decision support
- **Endpoint**: `http://doctorlinc-api:8002`
- **Capabilities**: Diagnosis assistance, treatment recommendations

### PolicyLinc Agent
- **Purpose**: Policy interpretation and coverage verification
- **Endpoint**: `http://policylinc-api:8003`
- **Capabilities**: Policy interpretation, authorization lookup

### DevLinc Agent (CI/CD)
- **Purpose**: Development automation
- **Endpoint**: `http://devlinc-api:8004`
- **Capabilities**: Build automation, test execution, code quality checks

### AuthLinc Agent
- **Purpose**: Authentication and authorization
- **Endpoint**: `http://authlinc-api:8005`
- **Capabilities**: User authentication, RBAC, token management

## Configuration

### Cloud Agent Delegation Config

Configuration is stored in `config/cloud-agent-delegation.yaml`:

```yaml
cloud_agents:
  primary:
    name: "Cloud Orchestrator"
    endpoint: "${CLOUD_ORCHESTRATOR_URL}"
    type: "orchestration"
    enabled: true
```

### Delegation Rules

Tasks are automatically delegated based on triggers:

- **Commit**: Triggers CI/CD pipeline via DevLinc
- **Service Start**: Registers health checks with monitoring
- **Workflow Request**: Coordinates services via MasterLinc

### Retry Policy

Failed delegations are automatically retried:

```yaml
retry_policy:
  max_attempts: 3
  backoff_multiplier: 2
  initial_delay_seconds: 1
  max_delay_seconds: 60
```

## CI/CD Integration

### GitHub Actions

The production CI/CD pipeline automatically delegates tasks:

1. **Code Push** → DevLinc Agent (build & test)
2. **Tests Pass** → MasterLinc Orchestrator (staging deployment)
3. **Tag Release** → MasterLinc Orchestrator (production deployment)

### Manual Delegation

You can manually trigger delegation from GitHub Actions:

```yaml
- name: Delegate to Cloud Agent
  run: |
    ./scripts/delegate-to-cloud-agent.sh build
    ./scripts/delegate-to-cloud-agent.sh test
```

## API Examples

### Delegating a Task

```bash
curl -X POST http://masterlinc-api:8000/api/v1/delegate \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "build",
    "target_agent": "devlinc",
    "priority": "high",
    "parameters": {
      "branch": "main",
      "environment": "staging"
    }
  }'
```

### Checking Agent Status

```bash
curl http://masterlinc-api:8000/api/v1/agents/status
```

## Monitoring

### Health Checks

All agents expose `/health` endpoints:

```bash
curl http://masterlinc-api:8000/health
curl http://claimlinc-api:8001/health
curl http://doctorlinc-api:8002/health
```

### Metrics

Prometheus collects metrics from all agents:

- **Access**: http://localhost:9090
- **Dashboards**: http://localhost:3001 (Grafana)

## Troubleshooting

### Agent Not Responding

1. Check agent health: `./scripts/delegate-to-cloud-agent.sh health`
2. View logs: `docker logs <container-name>`
3. Restart service: `docker-compose restart <service-name>`

### Delegation Failures

1. Check retry attempts in logs
2. Verify network connectivity between services
3. Ensure environment variables are set correctly

### Missing API Keys

Optional API keys (NPHIES_API_KEY, GEMINI_API_KEY) can be left unset. Services will:
- Log a warning on startup
- Disable related features gracefully
- Continue normal operation

## Best Practices

1. **Always check agent health** before delegating critical tasks
2. **Use priority levels** to ensure important tasks are processed first
3. **Monitor delegation metrics** to identify bottlenecks
4. **Set appropriate timeouts** for long-running tasks
5. **Enable retry policies** for transient failures

## Security

### Authentication

- All inter-agent communication uses JWT tokens
- Tokens are managed by AuthLinc Agent
- Token expiration: 1 hour (configurable)

### Network Security

- Agents communicate within private Docker network
- External access requires API Gateway (Kong)
- TLS/SSL enabled in production

### Audit Logging

All delegation activities are logged to the Audit Service:

```bash
curl http://audit-service:8006/api/v1/logs?type=delegation
```

## Support

For issues or questions:
- Check logs in `/var/log/masterlinc/`
- Review documentation in `/docs/`
- Contact: support@masterlinc.health
