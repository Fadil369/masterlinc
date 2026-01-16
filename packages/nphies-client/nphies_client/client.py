"""
NPHIES API Client
"""
import httpx
from typing import Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from pydantic import BaseModel


class NPHIESError(BaseModel):
    """NPHIES API error model."""
    code: str
    message: str
    message_ar: Optional[str] = None


class NPHIESClient:
    """
    Client for interacting with NPHIES API.
    
    Provides methods for claim submission, eligibility checking,
    prior authorization, and status queries.
    """
    
    def __init__(
        self,
        base_url: str = "https://hsb.nphies.sa",
        license_key: Optional[str] = None,
        payer_license: Optional[str] = None,
        provider_license: Optional[str] = None,
        timeout: int = 30,
    ):
        """Initialize NPHIES client."""
        self.base_url = base_url.rstrip("/")
        self.license_key = license_key
        self.payer_license = payer_license
        self.provider_license = provider_license
        self.timeout = timeout
        
        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers=self._get_headers()
        )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication."""
        headers = {
            "Content-Type": "application/fhir+json",
            "Accept": "application/fhir+json",
        }
        
        if self.license_key:
            headers["License-Key"] = self.license_key
        if self.payer_license:
            headers["Payer-License"] = self.payer_license
        if self.provider_license:
            headers["Provider-License"] = self.provider_license
        
        return headers
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def submit_claim(self, claim: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit a FHIR Claim to NPHIES.
        
        Args:
            claim: FHIR Claim resource
            
        Returns:
            ClaimResponse resource
        """
        response = await self.client.post(
            f"{self.base_url}/Claim",
            json=claim
        )
        response.raise_for_status()
        return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def check_eligibility(
        self,
        patient_id: str,
        payer_id: str
    ) -> Dict[str, Any]:
        """
        Check patient eligibility with a payer.
        
        Args:
            patient_id: Patient identifier
            payer_id: Payer/insurance identifier
            
        Returns:
            CoverageEligibilityResponse resource
        """
        eligibility_request = {
            "resourceType": "CoverageEligibilityRequest",
            "status": "active",
            "purpose": ["validation"],
            "patient": {"reference": f"Patient/{patient_id}"},
            "insurer": {"reference": f"Organization/{payer_id}"}
        }
        
        response = await self.client.post(
            f"{self.base_url}/CoverageEligibilityRequest",
            json=eligibility_request
        )
        response.raise_for_status()
        return response.json()
    
    async def get_claim_status(self, claim_id: str) -> Dict[str, Any]:
        """
        Get status of a submitted claim.
        
        Args:
            claim_id: Claim identifier
            
        Returns:
            ClaimResponse resource
        """
        response = await self.client.get(
            f"{self.base_url}/ClaimResponse?claim={claim_id}"
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
