import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.services.lm_studio_client import lm_studio_client


@pytest.mark.asyncio
async def test_loopback_restriction_blocks_lan_ip():
    """Non-loopback IPs (e.g. 192.168.1.50) must receive 403 Forbidden."""
    transport = ASGITransport(app=app, client=("192.168.1.50", 50000))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


@pytest.mark.asyncio
async def test_loopback_allows_local_ips():
    """Loopback client IPs (127.0.0.1) must be permitted."""
    transport = ASGITransport(app=app, client=("127.0.0.1", 50000))
    with patch("app.routers.api.lm_studio_client.check_health", new_callable=AsyncMock) as mock_chk:
        mock_chk.return_value = {
            "connected": True,
            "is_local": True,
            "base_url": "http://127.0.0.1:1234/v1",
            "configured_model": "qwen/qwen3-vl-4b",
            "model_available": True,
            "available_models": ["qwen/qwen3-vl-4b"],
            "error": None,
        }
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/health")
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_api_key_authentication():
    """When api_key is configured, X-ZoodSle-Key header must be validated."""
    orig_key = settings.api_key
    settings.api_key = "test-secret-key-12345"
    transport = ASGITransport(app=app, client=("127.0.0.1", 50000))

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Missing header -> 401
            res_missing = await client.get("/api/health")
            assert res_missing.status_code == 401
            assert "Unauthorized" in res_missing.json()["detail"]

            # 2. Invalid header -> 401
            res_invalid = await client.get("/api/health", headers={"X-ZoodSle-Key": "wrong-key"})
            assert res_invalid.status_code == 401

            # 3. Valid header -> 200
            with patch("app.routers.api.lm_studio_client.check_health", new_callable=AsyncMock) as mock_chk:
                mock_chk.return_value = {
                    "connected": True,
                    "is_local": True,
                    "base_url": "http://127.0.0.1:1234/v1",
                    "configured_model": "qwen/qwen3-vl-4b",
                    "model_available": True,
                    "available_models": [],
                    "error": None,
                }
                res_valid = await client.get("/api/health", headers={"X-ZoodSle-Key": "test-secret-key-12345"})
                assert res_valid.status_code == 200
    finally:
        settings.api_key = orig_key


@pytest.mark.asyncio
async def test_concurrency_semaphore_guard():
    """Verify that the semaphore limits concurrent vision model executions."""
    # Temporarily set concurrency to 1
    orig_concurrency = settings.max_concurrency
    settings.max_concurrency = 1
    # Reset semaphore
    lm_studio_client._semaphore = asyncio.Semaphore(1)

    # Acquire the single available slot
    await lm_studio_client.semaphore.acquire()

    try:
        # With slot held, next acquisition should time out or be blocked
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(lm_studio_client.semaphore.acquire(), timeout=0.1)
    finally:
        lm_studio_client.semaphore.release()
        settings.max_concurrency = orig_concurrency
        lm_studio_client._semaphore = None
