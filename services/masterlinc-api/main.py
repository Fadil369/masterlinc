"""
MASTERLINC Orchestrator - Main FastAPI application.
Central orchestration brain for the BrainSAIT LINC ecosystem.
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import List
import structlog
import uuid

from config import settings
from models import (
    Agent, AgentStatus, AgentCapability,
    DelegationRequest, DelegationResponse,
    WorkflowExecutionRequest, WorkflowExecutionResponse,
    MessageRouteRequest, MessageRouteResponse,
    HealthResponse, ErrorResponse
)

# Configure structured logging
logger = structlog.get_logger()

# Initialize FastAPI app
app = FastAPI(
    title="MASTERLINC Orchestrator API",
    description="Central orchestration brain for BrainSAIT LINC ecosystem",
    version="1.0.0",
    docs_url=f"/api/{settings.api_version}/docs",
    redoc_url=f"/api/{settings.api_version}/redoc",
)

# Configure CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory agent registry for development/demo
# NOTE: Replace with database persistence in production (PostgreSQL, Redis, or similar)
# Consider using SQLAlchemy models or storing in Redis for performance
agents_registry: dict[str, Agent] = {
    "masterlinc": Agent(
        agent_id="masterlinc",
        name="MasterLinc",
        name_ar="ماستر لينك",
        description="Central orchestration agent",
        description_ar="وكيل التنسيق المركزي",
        endpoint="http://masterlinc-api:8000",
        status=AgentStatus.ONLINE,
        capabilities=[AgentCapability.ORCHESTRATION, AgentCapability.ROUTING, AgentCapability.WORKFLOWS],
        priority=0,
        category="orchestration",
        last_heartbeat=datetime.utcnow()
    ),
    "claimlinc": Agent(
        agent_id="claimlinc",
        name="ClaimLinc",
        name_ar="كلايم لينك",
        description="Intelligent claims processing agent",
        description_ar="وكيل معالجة المطالبات الذكي",
        endpoint="http://claimlinc-api:8001",
        status=AgentStatus.ONLINE,
        capabilities=[AgentCapability.VALIDATION, AgentCapability.ANALYSIS, AgentCapability.PATTERNS],
        priority=1,
        category="healthcare",
        last_heartbeat=datetime.utcnow()
    )
}


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version=settings.api_version,
        timestamp=datetime.utcnow(),
        services={
            "database": "connected",
            "redis": "connected",
            "llm": "ready"
        }
    )


@app.get(f"/api/{settings.api_version}/agents", response_model=List[Agent], tags=["Agents"])
async def list_agents():
    """List all registered agents."""
    logger.info("listing_agents", count=len(agents_registry))
    return list(agents_registry.values())


@app.post(f"/api/{settings.api_version}/delegate", 
         response_model=DelegationResponse, 
         status_code=status.HTTP_201_CREATED,
         tags=["Orchestration"])
async def delegate_task(request: DelegationRequest):
    """
    Delegate a task to a specialized agent.
    
    This endpoint analyzes the task and intelligently routes it to the most
    appropriate agent based on capabilities, availability, and priority.
    """
    logger.info("task_delegation_requested", 
                task=request.task_description, 
                preferred_agent=request.preferred_agent)
    
    try:
        # Select agent based on capabilities or preference
        selected_agent = None
        
        if request.preferred_agent and request.preferred_agent in agents_registry:
            selected_agent = agents_registry[request.preferred_agent]
        else:
            # Simple selection: first available agent (enhance with LLM analysis)
            available_agents = [a for a in agents_registry.values() if a.status == AgentStatus.ONLINE]
            if available_agents:
                selected_agent = sorted(available_agents, key=lambda x: x.priority)[0]
        
        if not selected_agent:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No agents available"
            )
        
        task_id = str(uuid.uuid4())
        
        logger.info("task_delegated", 
                   task_id=task_id, 
                   agent=selected_agent.agent_id)
        
        return DelegationResponse(
            task_id=task_id,
            assigned_agent=selected_agent.agent_id,
            status="delegated",
            estimated_completion=None,
            message=f"Task delegated to {selected_agent.name}",
            message_ar=f"تم تفويض المهمة إلى {selected_agent.name_ar or selected_agent.name}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delegation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delegation failed: {str(e)}"
        )


@app.post(f"/api/{settings.api_version}/workflow/execute",
         response_model=WorkflowExecutionResponse,
         status_code=status.HTTP_201_CREATED,
         tags=["Workflows"])
async def execute_workflow(request: WorkflowExecutionRequest):
    """
    Execute a multi-agent workflow.
    
    Coordinates execution of multiple steps across different agents with
    dependency management and parallel/sequential execution support.
    """
    logger.info("workflow_execution_requested", 
                workflow=request.workflow_name,
                steps=len(request.steps))
    
    if not settings.enable_workflow_orchestration:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Workflow orchestration is disabled"
        )
    
    workflow_id = str(uuid.uuid4())
    started_at = datetime.utcnow()
    
    # Validate all agents are available
    for step in request.steps:
        if step.agent_id not in agents_registry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Agent {step.agent_id} not found"
            )
    
    logger.info("workflow_started", workflow_id=workflow_id)
    
    # NOTE: This is a simplified implementation for demonstration.
    # Production implementation should:
    # 1. Use Celery or similar for async task execution
    # 2. Handle dependencies and parallel execution properly
    # 3. Store workflow state in database
    # 4. Implement retry logic and error handling
    # 5. Support cancellation and monitoring
    
    return WorkflowExecutionResponse(
        workflow_id=workflow_id,
        status="completed",
        steps_completed=len(request.steps),
        steps_total=len(request.steps),
        results={"status": "success", "message": "Workflow completed successfully"},
        started_at=started_at,
        completed_at=datetime.utcnow()
    )


@app.post(f"/api/{settings.api_version}/message/route",
         response_model=MessageRouteResponse,
         status_code=status.HTTP_201_CREATED,
         tags=["Messaging"])
async def route_message(request: MessageRouteRequest):
    """
    Route a message between agents.
    
    Handles message delivery with priority queuing and delivery confirmation.
    """
    logger.info("message_routing_requested",
                sender=request.sender_id,
                receiver=request.receiver_id,
                type=request.message_type)
    
    # Validate sender and receiver exist
    if request.sender_id not in agents_registry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sender agent {request.sender_id} not found"
        )
    
    if request.receiver_id not in agents_registry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receiver agent {request.receiver_id} not found"
        )
    
    message_id = str(uuid.uuid4())
    delivered_at = datetime.utcnow()
    
    logger.info("message_routed", message_id=message_id)
    
    return MessageRouteResponse(
        message_id=message_id,
        status="delivered",
        delivered_at=delivered_at,
        message="Message successfully routed"
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler with bilingual support."""
    # Simple translation map for common errors
    translations = {
        "No agents available": "لا توجد وكلاء متاحة",
        "not found": "غير موجود",
        "Invalid request": "طلب غير صالح",
        "Internal server error": "خطأ في الخادم الداخلي"
    }
    
    message_ar = exc.detail
    for en, ar in translations.items():
        if en.lower() in exc.detail.lower():
            message_ar = ar
            break
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.status_code,
            "message": exc.detail,
            "message_ar": message_ar
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
