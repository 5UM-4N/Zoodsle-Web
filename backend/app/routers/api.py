import json
import base64
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Request, Security, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

from app.config import settings
from app.services.image_validator import validate_and_process_image, SUPPORTED_FORMATS, detect_magic_format
from app.services.lm_studio_client import lm_studio_client

logger = logging.getLogger("seevia.api")
router = APIRouter(prefix="/api", tags=["Seevia"])

api_key_header = APIKeyHeader(name="X-Seevia-Key", auto_error=False)


async def verify_client_access(
    request: Request,
    api_key: Optional[str] = Security(api_key_header)
) -> bool:
    """
    Security gate for local AI inference endpoints:
    1. If `api_key` is configured in settings, enforce that X-Seevia-Key matches.
    2. If `enforce_loopback_only` is active, verify that requests originate from loopback addresses.
    """
    if settings.api_key:
        if api_key != settings.api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Missing or invalid X-Seevia-Key header."
            )
        return True

    if settings.enforce_loopback_only:
        client_host = request.client.host if request.client else None
        if client_host and client_host not in ("127.0.0.1", "::1", "localhost", "testclient"):
            logger.warning("Blocked non-loopback request from host: %s", client_host)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Seevia local inference is restricted to loopback addresses. Connected from {client_host}."
            )

    return True


class HealthResponse(BaseModel):
    status: str
    connected: bool
    is_local: bool
    base_url: str
    configured_model: str
    model_available: bool
    available_models: List[str]
    max_upload_mb: int
    error: Optional[str] = None


class DescribeResponse(BaseModel):
    description: str
    mode: str
    metadata: Dict[str, Any]
    model: str
    is_local: bool
    privacy_notice: str
    image_data_url: str


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    image_data_url: str = Field(..., description="Base64 data URL of the previously uploaded photo")
    question: str = Field(..., min_length=1, max_length=1000, description="Follow-up question about the photo")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")


class ChatResponse(BaseModel):
    response: str
    model: str
    is_local: bool


@router.get("/health", response_model=HealthResponse, dependencies=[Depends(verify_client_access)])
async def get_health():
    """Health-check endpoint verifying backend status and LM Studio connection."""
    health_data = await lm_studio_client.check_health()
    return HealthResponse(
        status="ok" if health_data["connected"] else "degraded",
        connected=health_data["connected"],
        is_local=health_data["is_local"],
        base_url=health_data["base_url"],
        configured_model=health_data["configured_model"],
        model_available=health_data["model_available"],
        available_models=health_data["available_models"],
        max_upload_mb=settings.max_upload_mb,
        error=health_data["error"]
    )


@router.get("/models", dependencies=[Depends(verify_client_access)])
async def list_models():
    """List loaded models from LM Studio and explain configuration."""
    health_data = await lm_studio_client.check_health()
    return {
        "configured_model": settings.lm_studio_model,
        "model_available": health_data["model_available"],
        "available_models": health_data["available_models"],
        "connected": health_data["connected"],
        "error": health_data["error"],
        "guide": (
            "To use Seevia, download and load a vision-language model (such as qwen/qwen3-vl-4b) "
            "in LM Studio, and ensure the local server is started at " + settings.lm_studio_base_url
        )
    }


@router.post("/describe", response_model=DescribeResponse, dependencies=[Depends(verify_client_access)])
async def describe_photo(
    file: UploadFile = File(..., description="The photograph to analyze"),
    mode: str = Form("concise", description="Description mode: 'concise' or 'detailed'")
):
    """
    Upload and describe a photograph.
    Validates image integrity and sends it strictly to the local LM Studio model.
    """
    mode = mode.lower().strip()
    if mode not in ("concise", "detailed"):
        mode = "concise"

    file_bytes = await file.read()
    data_url, metadata = validate_and_process_image(file_bytes, filename=file.filename or "upload")

    # Send to LM Studio
    description = await lm_studio_client.describe_image(data_url, mode=mode)

    privacy_notice = (
        "Inference processed entirely on your local machine using LM Studio. "
        "Your photograph and text were not transmitted to any cloud or third-party server."
        if settings.is_local_endpoint
        else "Notice: The configured AI endpoint is not a localhost address. Remote transmission may occur."
    )

    return DescribeResponse(
        description=description,
        mode=mode,
        metadata=metadata,
        model=settings.lm_studio_model,
        is_local=settings.is_local_endpoint,
        privacy_notice=privacy_notice,
        image_data_url=data_url
    )


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_client_access)])
async def follow_up_chat(payload: ChatRequest):
    """
    Ask a follow-up question regarding the uploaded photograph.
    Maintains conversational visual context.
    """
    # Validate data URL format and safety
    if not payload.image_data_url.startswith("data:image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image context format. Must be a valid image data URL."
        )

    # Decode and validate size without writing to disk
    try:
        header, b64_data = payload.image_data_url.split(",", 1)
        raw_bytes = base64.b64decode(b64_data)
        if len(raw_bytes) > settings.max_upload_bytes:
            raise HTTPException(
                status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
                detail="Image context exceeds maximum size."
            )
        magic_format = detect_magic_format(raw_bytes)
        if not magic_format:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported image format in context."
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to decode image data URL."
        )

    clean_history = [
        {"role": turn.role, "content": turn.content}
        for turn in (payload.history or [])
    ]

    answer = await lm_studio_client.chat_with_image(
        image_data_url=payload.image_data_url,
        question=payload.question,
        history=clean_history
    )

    return ChatResponse(
        response=answer,
        model=settings.lm_studio_model,
        is_local=settings.is_local_endpoint
    )
