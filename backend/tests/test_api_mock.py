import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "Seevia"
    assert data["local_ai"] is True


@pytest.mark.asyncio
async def test_health_endpoint_connected():
    transport = ASGITransport(app=app)
    mock_health = {
        "connected": True,
        "is_local": True,
        "base_url": "http://127.0.0.1:1234/v1",
        "configured_model": "qwen/qwen3-vl-4b",
        "model_available": True,
        "available_models": ["qwen/qwen3-vl-4b"],
        "error": None
    }
    with patch("app.routers.api.lm_studio_client.check_health", new_callable=AsyncMock) as mock_chk:
        mock_chk.return_value = mock_health
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/health")
        assert res.status_code == 200
        json_data = res.json()
        assert json_data["connected"] is True
        assert json_data["model_available"] is True


@pytest.mark.asyncio
async def test_health_endpoint_disconnected():
    transport = ASGITransport(app=app)
    mock_health = {
        "connected": False,
        "is_local": True,
        "base_url": "http://127.0.0.1:1234/v1",
        "configured_model": "qwen/qwen3-vl-4b",
        "model_available": False,
        "available_models": [],
        "error": "Cannot connect to LM Studio"
    }
    with patch("app.routers.api.lm_studio_client.check_health", new_callable=AsyncMock) as mock_chk:
        mock_chk.return_value = mock_health
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/health")
        assert res.status_code == 200
        json_data = res.json()
        assert json_data["connected"] is False
        assert json_data["status"] == "degraded"
        assert "Cannot connect" in json_data["error"]
