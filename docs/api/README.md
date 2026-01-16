# BrainSAIT MASTERLINC API Overview

## Base URLs

- **Development:** http://localhost:8000
- **Production:** https://api.masterlinc.example.com

## Authentication

All endpoints require JWT authentication except health checks.

```bash
# Get token
curl -X POST http://localhost:8005/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Use token
curl -X GET http://localhost:8000/api/v1/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Services Overview

| Service | Port | Purpose | Documentation |
|---------|------|---------|---------------|
| MasterLinc API | 8000 | Orchestration | http://localhost:8000/api/v1/docs |
| ClaimLinc API | 8001 | Claims Processing | http://localhost:8001/api/v1/docs |
| DoctorLinc API | 8002 | Clinical Support | http://localhost:8002/api/v1/docs |
| PolicyLinc API | 8003 | Policy Interpretation | http://localhost:8003/api/v1/docs |
| DevLinc API | 8004 | Dev Automation | http://localhost:8004/api/v1/docs |
| AuthLinc API | 8005 | Authentication | http://localhost:8005/api/v1/docs |
| Audit Service | 8006 | Audit Logging | http://localhost:8006/api/v1/docs |
| FHIR Server | 8080 | FHIR Resources | http://localhost:8080/fhir |

## Common Patterns

### Task Delegation

```bash
curl -X POST http://localhost:8000/api/v1/delegate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "task_description": "Validate a healthcare claim",
    "context": {
      "claim_id": "claim-123"
    },
    "priority": 5
  }'
```

### Claim Validation

```bash
curl -X POST http://localhost:8001/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "claim_resource": {
      "resourceType": "Claim",
      "status": "active",
      "type": {"coding": [{"code": "institutional"}]},
      "use": "claim",
      "patient": {"reference": "Patient/123"},
      "provider": {"reference": "Organization/456"}
    },
    "validation_level": "full"
  }'
```

### Workflow Execution

```bash
curl -X POST http://localhost:8000/api/v1/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "claim-processing",
    "workflow_description": "End-to-end claim processing",
    "steps": [
      {
        "step_id": "step-1",
        "agent_id": "claimlinc",
        "action": "validate",
        "input_data": {"claim_id": "123"}
      },
      {
        "step_id": "step-2",
        "agent_id": "policylinc",
        "action": "check_coverage",
        "input_data": {"patient_id": "456"},
        "depends_on": ["step-1"]
      }
    ],
    "execution_mode": "sequential"
  }'
```

## Error Responses

All errors follow this format:

```json
{
  "error": "400",
  "message": "Invalid request",
  "message_ar": "طلب غير صالح",
  "details": {
    "field": "claim_resource",
    "issue": "Required field missing"
  }
}
```

## Rate Limits

| Service | Requests/Minute | Requests/Hour |
|---------|-----------------|---------------|
| MasterLinc | 100 | 5,000 |
| ClaimLinc | 200 | 10,000 |
| FHIR Server | 500 | 20,000 |
| Audit Service | 1,000 | 50,000 |

## Health Checks

All services provide `/health` endpoints:

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-16T18:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "llm": "ready"
  }
}
```

## Bilingual Support

All text responses include both English and Arabic:

```json
{
  "message": "Task delegated successfully",
  "message_ar": "تم تفويض المهمة بنجاح"
}
```

## FHIR Resources

Access FHIR resources at http://localhost:8080/fhir

```bash
# Get FHIR metadata
curl http://localhost:8080/fhir/metadata

# Search patients
curl http://localhost:8080/fhir/Patient?name=Ahmed

# Create claim
curl -X POST http://localhost:8080/fhir/Claim \
  -H "Content-Type: application/fhir+json" \
  -d @claim.json
```

## NPHIES Integration

ClaimLinc validates against NPHIES 1.0.0 profiles:

```bash
# Validate NPHIES compliance
curl -X POST http://localhost:8001/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "claim_resource": { ... },
    "validation_level": "full"
  }'
```

## Development

### Local Testing

```bash
# Start services
docker-compose -f docker-compose.agents.yml up -d

# Run tests
pytest services/masterlinc-api/tests/

# Check logs
docker-compose -f docker-compose.agents.yml logs -f masterlinc-api
```

### Interactive API Docs

FastAPI provides interactive Swagger UI:

- http://localhost:8000/api/v1/docs (Swagger)
- http://localhost:8000/api/v1/redoc (ReDoc)

## Support

- Documentation: https://github.com/Fadil369/masterlinc/tree/main/docs
- Issues: https://github.com/Fadil369/masterlinc/issues
