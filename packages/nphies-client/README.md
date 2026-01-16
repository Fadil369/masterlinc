# NPHIES Client Package

Python client library for Saudi Arabia's National Platform for Health Information Exchange (NPHIES).

## Installation

```bash
pip install -e .
```

## Features

- NPHIES API client with authentication
- Profile validation against NPHIES 1.0.0 specifications
- Automatic retry logic with exponential backoff
- Error code mapping (EN/AR)
- Mock server for testing

## Usage

```python
from nphies_client import NPHIESClient, NPHIESProfileValidator

# Initialize client
client = NPHIESClient(
    base_url="https://hsb.nphies.sa",
    license_key="your-license-key"
)

# Submit a claim
response = await client.submit_claim(claim_resource)

# Validate against NPHIES profile
validator = NPHIESProfileValidator()
issues = validator.validate_claim(claim_resource)
```

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest
```
