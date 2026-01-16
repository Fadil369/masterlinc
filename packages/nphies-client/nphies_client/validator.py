"""
NPHIES Profile Validator
"""
from typing import List, Dict, Any
from pydantic import BaseModel


class ValidationIssue(BaseModel):
    """Validation issue model."""
    severity: str  # error, warning, info
    code: str
    message: str
    message_ar: str
    path: str


class NPHIESProfileValidator:
    """
    Validator for NPHIES 1.0.0 profiles.
    
    Validates FHIR resources against Saudi-specific NPHIES requirements.
    """
    
    def validate_claim(self, claim: Dict[str, Any]) -> List[ValidationIssue]:
        """
        Validate a FHIR Claim against NPHIES profile.
        
        Args:
            claim: FHIR Claim resource
            
        Returns:
            List of validation issues
        """
        issues = []
        
        # Check required fields for NPHIES
        if "identifier" not in claim:
            issues.append(ValidationIssue(
                severity="error",
                code="NPHIES-001",
                message="Claim identifier is required for NPHIES",
                message_ar="معرف المطالبة مطلوب لـ NPHIES",
                path="Claim.identifier"
            ))
        
        if "patient" not in claim:
            issues.append(ValidationIssue(
                severity="error",
                code="NPHIES-002",
                message="Patient reference is required",
                message_ar="مرجع المريض مطلوب",
                path="Claim.patient"
            ))
        
        if "provider" not in claim:
            issues.append(ValidationIssue(
                severity="error",
                code="NPHIES-003",
                message="Provider reference is required",
                message_ar="مرجع مقدم الخدمة مطلوب",
                path="Claim.provider"
            ))
        
        # Check Saudi-specific requirements
        if "extension" in claim:
            # Validate Saudi extensions
            pass
        
        return issues
    
    def validate_patient(self, patient: Dict[str, Any]) -> List[ValidationIssue]:
        """
        Validate a FHIR Patient against NPHIES profile.
        
        Args:
            patient: FHIR Patient resource
            
        Returns:
            List of validation issues
        """
        issues = []
        
        # Check for national ID
        identifiers = patient.get("identifier", [])
        has_national_id = any(
            id.get("system") == "http://nphies.sa/identifier/national-id"
            for id in identifiers
        )
        
        if not has_national_id:
            issues.append(ValidationIssue(
                severity="warning",
                code="NPHIES-101",
                message="National ID is recommended for Saudi patients",
                message_ar="يوصى بالهوية الوطنية للمرضى السعوديين",
                path="Patient.identifier"
            ))
        
        return issues
