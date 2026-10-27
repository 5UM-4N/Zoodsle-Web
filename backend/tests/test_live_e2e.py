import io
import pytest
from PIL import Image, ImageDraw
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.lm_studio_client import lm_studio_client


def generate_rich_sample_image() -> bytes:
    """
    Creates a sample image with identifiable features:
    - Blue sky top half, green grass bottom half
    - A yellow sun circle in the top right
    - A brown house with a red roof in the center
    - Clear visual landmarks for the vision model to detect.
    """
    w, h = 256, 256
    img = Image.new("RGB", (w, h), color=(135, 206, 235))  # Sky blue
    draw = ImageDraw.Draw(img)

    # Green grass bottom half
    draw.rectangle([0, 160, 256, 256], fill=(34, 139, 34))

    # Yellow sun in top-right
    draw.ellipse([180, 20, 230, 70], fill=(255, 215, 0))

    # House body (brown rectangle in center)
    draw.rectangle([70, 130, 150, 200], fill=(139, 69, 19))

    # House roof (red triangle)
    draw.polygon([(60, 130), (110, 80), (160, 130)], fill=(220, 20, 60))

    # Door
    draw.rectangle([95, 160, 125, 200], fill=(245, 245, 220))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_live_health_check():
    """Verify live connection to the user's running LM Studio server."""
    health = await lm_studio_client.check_health()
    if not health.get("connected"):
        pytest.skip(f"Live LM Studio server is not reachable: {health.get('error')}")
    assert health["connected"] is True
    assert health["model_available"] is True, f"Target model not found: {health.get('error')}"
    assert health["is_local"] is True


@pytest.mark.asyncio
async def test_live_describe_and_chat():
    """
    Upload real image, get description from live LM Studio model,
    and then ask a follow-up question.
    """
    health = await lm_studio_client.check_health()
    if not health.get("connected"):
        pytest.skip(f"Live LM Studio server is not reachable: {health.get('error')}")
    image_bytes = generate_rich_sample_image()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test", timeout=120.0) as client:
        # 1. Test concise description
        files = {"file": ("test_scene.png", image_bytes, "image/png")}
        data = {"mode": "concise"}
        res = await client.post("/api/describe", files=files, data=data)

        assert res.status_code == 200, f"Describe failed with {res.status_code}: {res.text}"
        res_json = res.json()
        assert "description" in res_json
        description = res_json["description"]
        assert len(description) > 10
        assert res_json["is_local"] is True
        image_data_url = res_json["image_data_url"]

        print(f"\n[LIVE TEST SUCCESS] Concise Description:\n{description}\n")

        # 2. Test follow-up question using the image context
        chat_payload = {
            "image_data_url": image_data_url,
            "question": "What color is the roof of the house?",
            "history": [
                {"role": "assistant", "content": description}
            ]
        }
        chat_res = await client.post("/api/chat", json=chat_payload)
        assert chat_res.status_code == 200, f"Chat failed with {chat_res.status_code}: {chat_res.text}"
        chat_json = chat_res.json()
        assert "response" in chat_json
        answer = chat_json["response"]
        assert len(answer) > 0
        print(f"[LIVE TEST SUCCESS] Follow-up Answer:\n{answer}\n")
