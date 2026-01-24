# MasterLinc Integration Tests

This directory contains integration tests for the MasterLinc agent ecosystem.

## Overview

The integration tests verify:
- Health endpoints for all services
- API endpoint functionality
- Inter-service communication
- Workflow orchestration

## Prerequisites

Before running integration tests, ensure:
1. Docker and Docker Compose are installed
2. All services are running via `docker-compose`

## Running Tests

### Using Docker Compose

```bash
# Start all services
cd /path/to/masterlinc
docker-compose -f infrastructure/docker/docker-compose.agents.yml up -d

# Wait for services to be healthy (30-60 seconds)
sleep 30

# Run integration tests
./tests/integration/test-services.sh
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Base URL for services | `http://localhost` |
| `TIMEOUT` | Request timeout in seconds | `5` |

### Example with Custom Base URL

```bash
BASE_URL=http://your-host ./tests/integration/test-services.sh
```

## Test Coverage

### Health Checks
- MasterLinc API (port 8000)
- ClaimLinc API (port 8001)
- DoctorLinc API (port 8002)
- PolicyLinc API (port 8003)
- DevLinc API (port 8004)
- AuthLinc API (port 8005)
- Audit Service (port 8006)

### API Endpoints
- MasterLinc: Agent listing, task delegation
- ClaimLinc: Claim validation, rejection analysis
- PolicyLinc: Eligibility check, coverage verification
- DoctorLinc: Diagnosis assistance

## Adding New Tests

To add new tests, use the helper functions in `test-services.sh`:

```bash
# GET endpoint
test_endpoint "Test Name" "http://url" "expected_status"

# POST endpoint
test_post_endpoint "Test Name" "http://url" '{"json":"data"}' "expected_status"
```

## Troubleshooting

### Services Not Responding
1. Check if containers are running: `docker ps`
2. Check container logs: `docker logs <container_name>`
3. Verify network connectivity

### Test Failures
1. Check service health: `curl http://localhost:PORT/health`
2. Review API documentation at `http://localhost:PORT/api/v1/docs`
3. Check service logs for errors
