"""
Data models for MASTERLINC Orchestrator API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class AgentStatus(str, Enum):
    """Agent status enum."""
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"


class AgentCapability(str, Enum):
    """Agent capability enum."""
    ORCHESTRATION = "orchestration"
    ROUTING = "routing"
    WORKFLOWS = "workflows"
    VALIDATION = "validation"
    ANALYSIS = "analysis"
    PATTERNS = "patterns"
    CLINICAL_SUPPORT = "clinical_support"
    POLICY_INTERPRETATION = "policy_interpretation"
    CODE_GENERATION = "code_generation"
    AUTHENTICATION = "authentication"


class Agent(BaseModel):
    """Agent model."""
    agent_id: str = Field(..., description="Unique agent identifier")
    name: str = Field(..., description="Agent name")
    name_ar: Optional[str] = Field(None, description="Agent name in Arabic")
    description: str = Field(..., description="Agent description")
    description_ar: Optional[str] = Field(None, description="Agent description in Arabic")
    endpoint: str = Field(..., description="Agent API endpoint")
    status: AgentStatus = Field(default=AgentStatus.ONLINE, description="Agent status")
    capabilities: List[AgentCapability] = Field(default_factory=list, description="Agent capabilities")
    priority: int = Field(default=10, description="Agent priority (lower = higher priority)")
    version: str = Field(default="1.0.0", description="Agent version")
    category: str = Field(..., description="Agent category")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    last_heartbeat: Optional[datetime] = Field(None, description="Last heartbeat timestamp")


class DelegationRequest(BaseModel):
    """Task delegation request."""
    task_description: str = Field(..., description="Description of the task to delegate")
    task_description_ar: Optional[str] = Field(None, description="Task description in Arabic")
    context: Dict[str, Any] = Field(default_factory=dict, description="Task context")
    preferred_agent: Optional[str] = Field(None, description="Preferred agent ID")
    priority: int = Field(default=5, description="Task priority (1-10)")
    timeout: int = Field(default=300, description="Timeout in seconds")


class DelegationResponse(BaseModel):
    """Task delegation response."""
    task_id: str = Field(..., description="Unique task identifier")
    assigned_agent: str = Field(..., description="Agent ID assigned to the task")
    status: str = Field(..., description="Delegation status")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")
    message: str = Field(..., description="Status message")
    message_ar: Optional[str] = Field(None, description="Status message in Arabic")


class WorkflowStep(BaseModel):
    """Workflow step definition."""
    step_id: str = Field(..., description="Unique step identifier")
    agent_id: str = Field(..., description="Agent to execute this step")
    action: str = Field(..., description="Action to perform")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data for the step")
    depends_on: List[str] = Field(default_factory=list, description="Step dependencies")
    timeout: int = Field(default=300, description="Step timeout in seconds")


class WorkflowExecutionRequest(BaseModel):
    """Workflow execution request."""
    workflow_name: str = Field(..., description="Workflow name")
    workflow_description: str = Field(..., description="Workflow description")
    steps: List[WorkflowStep] = Field(..., description="Workflow steps")
    execution_mode: Literal["sequential", "parallel", "mixed"] = Field(
        default="sequential", description="Execution mode"
    )
    context: Dict[str, Any] = Field(default_factory=dict, description="Workflow context")


class WorkflowExecutionResponse(BaseModel):
    """Workflow execution response."""
    workflow_id: str = Field(..., description="Unique workflow identifier")
    status: str = Field(..., description="Workflow status")
    steps_completed: int = Field(default=0, description="Number of completed steps")
    steps_total: int = Field(..., description="Total number of steps")
    results: Dict[str, Any] = Field(default_factory=dict, description="Workflow results")
    started_at: datetime = Field(..., description="Workflow start time")
    completed_at: Optional[datetime] = Field(None, description="Workflow completion time")


class MessageRouteRequest(BaseModel):
    """Message routing request."""
    sender_id: str = Field(..., description="Sender agent ID")
    receiver_id: str = Field(..., description="Receiver agent ID")
    message_type: str = Field(..., description="Message type")
    content: Dict[str, Any] = Field(..., description="Message content")
    priority: int = Field(default=5, description="Message priority")


class MessageRouteResponse(BaseModel):
    """Message routing response."""
    message_id: str = Field(..., description="Unique message identifier")
    status: str = Field(..., description="Routing status")
    delivered_at: Optional[datetime] = Field(None, description="Delivery timestamp")
    message: str = Field(..., description="Status message")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(..., description="Current timestamp")
    services: Dict[str, str] = Field(default_factory=dict, description="Connected services status")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    message_ar: Optional[str] = Field(None, description="Error message in Arabic")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
