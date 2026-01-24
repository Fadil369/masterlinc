"""
Integration tests for MASTERLINC backend services.

This test suite validates health endpoints for all MASTERLINC services.
"""
import os
import httpx
import pytest


# Base URLs from environment or defaults
MASTERLINC_URL = os.getenv("MASTERLINC_URL", "http://localhost:8000")
CLAIMLINC_URL = os.getenv("CLAIMLINC_URL", "http://localhost:8001")
DOCTORLINC_URL = os.getenv("DOCTORLINC_URL", "http://localhost:8002")
POLICYLINC_URL = os.getenv("POLICYLINC_URL", "http://localhost:8003")
AUTHLINC_URL = os.getenv("AUTHLINC_URL", "http://localhost:8005")


@pytest.mark.asyncio
async def test_masterlinc_health():
    """Test MasterLinc API health endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MASTERLINC_URL}/health", timeout=10.0)
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("MasterLinc service not available")


@pytest.mark.asyncio
async def test_claimlinc_health():
    """Test ClaimLinc API health endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CLAIMLINC_URL}/health", timeout=10.0)
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("ClaimLinc service not available")


@pytest.mark.asyncio
async def test_doctorlinc_health():
    """Test DoctorLinc API health endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{DOCTORLINC_URL}/health", timeout=10.0)
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("DoctorLinc service not available")


@pytest.mark.asyncio
async def test_policylinc_health():
    """Test PolicyLinc API health endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{POLICYLINC_URL}/health", timeout=10.0)
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("PolicyLinc service not available")


@pytest.mark.asyncio
async def test_authlinc_health():
    """Test AuthLinc API health endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{AUTHLINC_URL}/health", timeout=10.0)
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("AuthLinc service not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
