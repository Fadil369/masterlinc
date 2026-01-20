"""AuthLinc API - Authentication and authorization agent."""
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, EmailStr
from typing import Dict, Any, Optional
import structlog
import hashlib
import secrets
import jwt

# Configure structured logging
logger = structlog.get_logger()

# JWT Configuration (use environment variables in production)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()

app = FastAPI(
    title="AuthLinc API",
    description="Authentication and authorization for MASTERLINC platform",
    version="1.0.0",
    docs_url="/api/v1/docs"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Models
class LoginRequest(BaseModel):
    """Login request."""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")


class LoginResponse(BaseModel):
    """Login response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(...,
                            description="Token expiration time in seconds")
    user_id: str = Field(..., description="User identifier")
    email: str = Field(..., description="User email")
    roles: list[str] = Field(..., description="User roles")


class TokenVerifyRequest(BaseModel):
    """Token verification request."""
    token: str = Field(..., description="JWT token to verify")


class TokenVerifyResponse(BaseModel):
    """Token verification response."""
    valid: bool = Field(..., description="Whether token is valid")
    user_id: Optional[str] = Field(None, description="User ID if valid")
    email: Optional[str] = Field(None, description="User email if valid")
    roles: list[str] = Field(default_factory=list,
                             description="User roles if valid")
    expires_at: Optional[datetime] = Field(
        None, description="Token expiration time")


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    service: str = "authlinc-api"


# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def hash_password(password: str) -> str:
    """Hash password using SHA-256 (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


# Endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow(),
        service="authlinc-api"
    )


@app.post("/api/v1/auth/login",
          response_model=LoginResponse,
          status_code=status.HTTP_200_OK,
          tags=["Authentication"])
async def login(request: LoginRequest):
    """
    Authenticate user and issue JWT access token.

    TODO: In production:
    - Query user database (PostgreSQL)
    - Verify password using bcrypt
    - Implement rate limiting
    - Add MFA support
    - Log authentication attempts
    - Integrate with SAML/OAuth providers
    """
    logger.info("login_attempt", email=request.email)

    # Mock authentication (replace with real DB query)
    # For demo: any email with password "password123" is valid
    if request.password != "password123":
        logger.warning("login_failed", email=request.email,
                       reason="invalid_credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate user ID and roles
    user_id = f"USR-{secrets.token_hex(6).upper()}"
    roles = ["user", "healthcare_provider"]

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user_id,
            "email": request.email,
            "roles": roles
        },
        expires_delta=access_token_expires
    )

    logger.info("login_successful", user_id=user_id, email=request.email)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user_id,
        email=request.email,
        roles=roles
    )


@app.post("/api/v1/auth/verify",
          response_model=TokenVerifyResponse,
          tags=["Authentication"])
async def verify_token_endpoint(request: TokenVerifyRequest):
    """
    Verify JWT token and return user information.
    """
    logger.info("token_verification_requested")

    try:
        payload = verify_token(request.token)

        logger.info("token_verified", user_id=payload.get("sub"))

        return TokenVerifyResponse(
            valid=True,
            user_id=payload.get("sub"),
            email=payload.get("email"),
            roles=payload.get("roles", []),
            expires_at=datetime.fromtimestamp(payload.get("exp"))
        )
    except HTTPException:
        logger.warning("token_verification_failed")
        return TokenVerifyResponse(
            valid=False,
            roles=[]
        )


@app.post("/api/v1/auth/logout", tags=["Authentication"])
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout user (token blacklisting).

    TODO: In production:
    - Add token to blacklist (Redis)
    - Clear user sessions
    - Log logout event
    """
    logger.info("logout_requested")
    return {"message": "Successfully logged out"}


@app.post("/execute", tags=["MasterLinc Integration"])
async def execute_task(task: Dict[str, Any]):
    """Generic task execution for MasterLinc orchestrator."""
    logger.info("task_execution_requested", task_type=task.get("type"))
    return {"status": "completed", "result": "AuthLinc task executed"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
