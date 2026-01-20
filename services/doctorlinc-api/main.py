"""
DoctorLinc API - Clinical decision support agent.
Provides diagnosis assistance, treatment recommendations, and drug interaction checking.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import structlog

logger = structlog.get_logger()

app = FastAPI(
    title="DoctorLinc API",
    description="Clinical decision support agent",
    version="1.0.0",
    docs_url="/api/v1/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    service: str = "doctorlinc-api"


class PatientResponse(BaseModel):
    """Patient information."""
    patient_id: str = Field(..., description="Patient identifier")
    name: str = Field(..., description="Patient name")
    date_of_birth: str = Field(..., description="Date of birth")
    gender: str = Field(..., description="Gender")
    policy_number: Optional[str] = Field(
        None, description="Insurance policy number")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    contact_email: Optional[str] = Field(None, description="Contact email")


class PatientListResponse(BaseModel):
    """Patient list response."""
    patients: List[PatientResponse] = Field(...,
                                            description="List of patients")
    total: int = Field(..., description="Total number of patients")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Page size")


class AppointmentRequest(BaseModel):
    """Appointment creation request."""
    patient_id: str = Field(..., description="Patient identifier")
    provider_id: str = Field(..., description="Provider identifier")
    appointment_date: str = Field(...,
                                  description="Appointment date (ISO format)")
    appointment_type: str = Field(..., description="Appointment type")
    notes: Optional[str] = Field(None, description="Additional notes")


class AppointmentResponse(BaseModel):
    """Appointment response."""
    appointment_id: str = Field(..., description="Appointment identifier")
    patient_id: str = Field(..., description="Patient identifier")
    provider_id: str = Field(..., description="Provider identifier")
    appointment_date: str = Field(..., description="Appointment date")
    appointment_type: str = Field(..., description="Appointment type")
    status: str = Field(..., description="Appointment status")
    created_at: datetime = Field(..., description="Creation timestamp")


class DiagnosisRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of symptoms")
    patient_history: Optional[Dict[str, Any]] = Field(
        None, description="Patient history")


class DiagnosisResponse(BaseModel):
    diagnosis_id: str
    possible_diagnoses: List[Dict[str, Any]]
    confidence_scores: List[float]
    recommendations: List[str]


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow(),
        service="doctorlinc-api"
    )


@app.get("/api/v1/patients/{patient_id}", response_model=PatientResponse, tags=["Patients"])
async def get_patient(patient_id: str):
    """Get patient information by ID."""
    logger.info("patient_info_requested", patient_id=patient_id)

    return PatientResponse(
        patient_id=patient_id,
        name="Ahmad Al-Saud",
        date_of_birth="1985-05-15",
        gender="male",
        policy_number="POL-12345",
        contact_phone="+966501234567",
        contact_email="ahmad.alsaud@example.com"
    )


@app.get("/api/v1/patients", response_model=PatientListResponse, tags=["Patients"])
async def list_patients(page: int = 1, page_size: int = 20, search: Optional[str] = None):
    """List all patients with pagination."""
    logger.info("patients_list_requested", page=page, page_size=page_size)

    import uuid
    mock_patients = [
        PatientResponse(
            patient_id=f"PAT-{i:05d}",
            name=f"Patient {i}",
            date_of_birth="1980-01-01",
            gender="male" if i % 2 == 0 else "female",
            policy_number=f"POL-{i:05d}",
            contact_phone=f"+96650{i:07d}",
            contact_email=f"patient{i}@example.com"
        )
        for i in range(1, min(page_size + 1, 6))
    ]

    return PatientListResponse(
        patients=mock_patients,
        total=250,
        page=page,
        page_size=page_size
    )


@app.post("/api/v1/appointments", response_model=AppointmentResponse, tags=["Appointments"])
async def create_appointment(request: AppointmentRequest):
    """Create a new appointment."""
    import uuid
    logger.info("appointment_creation_requested",
                patient_id=request.patient_id)

    appointment_id = f"APT-{uuid.uuid4().hex[:12].upper()}"

    return AppointmentResponse(
        appointment_id=appointment_id,
        patient_id=request.patient_id,
        provider_id=request.provider_id,
        appointment_date=request.appointment_date,
        appointment_type=request.appointment_type,
        status="scheduled",
        created_at=datetime.utcnow()
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow()
    )


@app.post("/api/v1/diagnose", response_model=DiagnosisResponse, tags=["Clinical Support"])
async def diagnose(request: DiagnosisRequest):
    """Provide diagnosis assistance based on symptoms."""
    logger.info("diagnosis_requested", symptoms_count=len(request.symptoms))

    # Placeholder response
    return DiagnosisResponse(
        diagnosis_id="diag_001",
        possible_diagnoses=[
            {"code": "J00",
                "name": "Acute nasopharyngitis (common cold)", "system": "ICD-10"}
        ],
        confidence_scores=[0.75],
        recommendations=["Rest and hydration", "Monitor symptoms for 48 hours"]
    )


@app.post("/execute", tags=["MasterLinc Integration"])
async def execute_task(task: Dict[str, Any]):
    """Generic task execution for MasterLinc."""
    return {"status": "completed", "result": "DoctorLinc task executed"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
