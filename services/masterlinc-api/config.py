"""
Configuration module for MASTERLINC Orchestrator API.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # General
    environment: str = "development"
    log_level: str = "info"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_version: str = "v1"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Database
    database_url: str = "postgresql://masterlinc:changeme@postgres:5432/masterlinc"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    # AI/LLM
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    openai_temperature: float = 0.7
    openai_max_tokens: int = 2000
    
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-sonnet-20240229"
    
    # Security
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    
    # Service Endpoints
    claimlinc_api_url: str = "http://claimlinc-api:8001"
    doctorlinc_api_url: str = "http://doctorlinc-api:8002"
    policylinc_api_url: str = "http://policylinc-api:8003"
    devlinc_api_url: str = "http://devlinc-api:8004"
    authlinc_api_url: str = "http://authlinc-api:8005"
    audit_service_url: str = "http://audit-service:8006"
    
    # Feature Flags
    enable_workflow_orchestration: bool = True
    enable_ai_analysis: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
