import io
import base64
import logging
from typing import Tuple, Dict, Any
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("zoodsle.validator")

# Supported image formats and corresponding MIME types
SUPPORTED_FORMATS = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


def detect_magic_format(data: bytes) -> str:
    """Inspect the first few bytes of binary data to identify file magic."""
    if len(data) < 12:
        return ""
    if data[:3] == b"\xff\xd8\xff":
        return "JPEG"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "PNG"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "WEBP"
    return ""


def validate_and_process_image(file_bytes: bytes, filename: str = "upload") -> Tuple[str, Dict[str, Any]]:
    """
    Validates uploaded image byte contents:
    1. Validates file size against max_upload_mb.
    2. Validates magic bytes (JPEG, PNG, WebP).
    3. Verifies integrity using Pillow parser.
    4. Extracts image metadata (width, height, format, size).
    5. Returns (base64_data_url, metadata).

    Does NOT write files to disk. Does NOT log image content or base64 data.
    """
    size_bytes = len(file_bytes)

    # 1. Size validation
    if size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a valid photo."
        )

    if size_bytes > settings.max_upload_bytes:
        raise HTTPException(
            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
            detail=f"Image size ({size_bytes / (1024 * 1024):.1f} MB) exceeds maximum allowed limit of {settings.max_upload_mb} MB."
        )

    # 2. Magic byte inspection
    magic_format = detect_magic_format(file_bytes)
    if not magic_format:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image format. ZoodSle accepts only JPEG, PNG, or WebP images."
        )

    # 3. Deep image integrity check with Pillow
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            detected_format = (img.format or "").upper()
            if detected_format not in SUPPORTED_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Invalid image format '{detected_format}'. Supported formats are JPEG, PNG, and WebP."
                )
            # Reconcile detected format
            if detected_format == "JPEG" and magic_format != "JPEG":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File header does not match expected JPEG format."
                )

            width, height = img.size
            if width <= 0 or height <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image contains invalid dimensions."
                )

            # Extra integrity verification
            img.verify()
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or unrecognizable image file. Please provide an uncorrupted JPEG, PNG, or WebP."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Pillow validation failed for uploaded file: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to parse or decode image data."
        )

    # 4. Generate base64 data URL for OpenAI-compatible payload
    mime_type = SUPPORTED_FORMATS[detected_format]
    b64_content = base64.b64encode(file_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64_content}"

    if width > height:
        orientation = "landscape"
    elif height > width:
        orientation = "portrait"
    else:
        orientation = "square"

    metadata = {
        "format": detected_format,
        "mime_type": mime_type,
        "width": width,
        "height": height,
        "size_bytes": size_bytes,
        "filename": filename,
        "orientation": orientation,
    }

    # Safe log: never log image data or base64 strings!
    logger.info(
        "Successfully validated image: format=%s, dims=%dx%d, size=%d bytes",
        detected_format, width, height, size_bytes
    )

    return data_url, metadata
