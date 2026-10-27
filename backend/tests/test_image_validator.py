import io
import zlib
import struct
import pytest
from PIL import Image
from fastapi import HTTPException
from app.services.image_validator import validate_and_process_image, detect_magic_format


def create_test_png(w=32, h=32, color=(255, 0, 0)) -> bytes:
    """Generate minimal valid PNG bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", (w, h), color=color)
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_test_jpeg(w=32, h=32, color=(0, 255, 0)) -> bytes:
    """Generate minimal valid JPEG bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", (w, h), color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


def create_test_webp(w=32, h=32, color=(0, 0, 255)) -> bytes:
    """Generate minimal valid WebP bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", (w, h), color=color)
    img.save(buf, format="WEBP")
    return buf.getvalue()


def test_valid_png_validation():
    data = create_test_png(50, 60, (255, 0, 0))
    url, meta = validate_and_process_image(data, "test.png")
    assert url.startswith("data:image/png;base64,")
    assert meta["format"] == "PNG"
    assert meta["width"] == 50
    assert meta["height"] == 60
    assert meta["size_bytes"] == len(data)


def test_valid_jpeg_validation():
    data = create_test_jpeg(40, 40, (0, 255, 0))
    url, meta = validate_and_process_image(data, "photo.jpg")
    assert url.startswith("data:image/jpeg;base64,")
    assert meta["format"] == "JPEG"
    assert meta["width"] == 40
    assert meta["height"] == 40


def test_valid_webp_validation():
    data = create_test_webp(30, 30, (0, 0, 255))
    url, meta = validate_and_process_image(data, "photo.webp")
    assert url.startswith("data:image/webp;base64,")
    assert meta["format"] == "WEBP"


def test_empty_file_rejected():
    with pytest.raises(HTTPException) as exc_info:
        validate_and_process_image(b"", "empty.jpg")
    assert exc_info.value.status_code == 400


def test_oversized_file_rejected():
    # 11 MB dummy bytes
    big_data = b"\xff\xd8\xff" + b"\x00" * (11 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc_info:
        validate_and_process_image(big_data, "huge.jpg")
    assert exc_info.value.status_code == 413


def test_fake_image_rejected():
    # Text file disguised as jpg
    fake_data = b"This is just a plain text file, not a real image."
    with pytest.raises(HTTPException) as exc_info:
        validate_and_process_image(fake_data, "fake.jpg")
    assert exc_info.value.status_code in (400, 415)


def test_detect_magic_format():
    assert detect_magic_format(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01") == "JPEG"
    assert detect_magic_format(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR") == "PNG"
    assert detect_magic_format(b"RIFF\x12\x00\x00\x00WEBPVP8 ") == "WEBP"
    assert detect_magic_format(b"GIF89a\x01\x00\x01\x00") == ""
