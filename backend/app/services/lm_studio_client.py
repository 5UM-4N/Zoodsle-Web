import asyncio
import logging
from typing import List, Dict, Any, Optional
import httpx
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("zoodsle.lm_studio")

# Core accessibility system prompts
SYSTEM_PROMPT_CONCISE = (
    "You are ZoodSle, an accessibility assistant specifically helping blind and visually impaired people "
    "understand photographs sent by family and friends.\n\n"
    "Generate a CONCISE, natural verbal description of the photograph in 2 to 4 sentences:\n"
    "1. State the central subject and overall scene immediately.\n"
    "2. Mention key spatial relationships (left, right, center, foreground, background) and prominent colors.\n"
    "3. If any text or writing is visible and legible, transcribe it directly inside quotation marks.\n"
    "4. ACCURACY AND HONESTY: If any detail, background, or object is blurry, dim, cropped, or ambiguous, "
    "explicitly acknowledge this uncertainty (e.g., 'The background is in soft focus and difficult to distinguish', "
    "'It appears to be a pet, though lighting obscures the species'). NEVER invent or hallucinate details.\n"
    "5. NO FACIAL RECOGNITION: Do not attempt to identify or name specific people. If people are in the photograph, "
    "describe them respectfully by general visual attributes (e.g., clothing, approximate age group, facial expression, posture, activity)."
)

SYSTEM_PROMPT_DETAILED = (
    "You are ZoodSle, an expert accessibility assistant providing a comprehensive, structured description "
    "of photographs for blind and visually impaired individuals.\n\n"
    "Provide a thorough, well-organized description divided into the following clear sections:\n\n"
    "### Overview\n"
    "A concise 1-2 sentence description of what the photograph captures, the setting, and the primary focus.\n\n"
    "### Primary Subjects & People\n"
    "Describe the key subjects in detail. If people are present, describe their actions, expressions, clothing, "
    "and relative positioning. (CRITICAL: Do NOT attempt facial recognition or guess people's names).\n\n"
    "### Spatial Layout & Composition\n"
    "Explain what is in the foreground, center, background, left, and right areas of the photo.\n\n"
    "### Colors, Lighting & Atmosphere\n"
    "Describe the color palette, lighting quality (e.g., bright sunlight, warm indoor light, shadows), and overall mood.\n\n"
    "### Visible Text & Notable Objects\n"
    "Quote any legible text verbatim in quotation marks. Mention distinctive objects, signs, or artifacts.\n\n"
    "### Ambiguities & Uncertainties\n"
    "Explicitly highlight any elements that are unclear, partially obscured, cropped out, or out of focus. "
    "Never make assumptions beyond the visual evidence."
)

SYSTEM_PROMPT_CHAT = (
    "You are ZoodSle, an accessibility assistant answering follow-up questions from a blind or visually impaired user "
    "about the photograph they uploaded.\n\n"
    "- Answer the user's question directly, clearly, and concisely based strictly on the visual content of the photograph.\n"
    "- Use spatial descriptions (e.g., 'to your left', 'in the top-right corner') when helpful.\n"
    "- If the requested information is not visible, partially hidden, blurry, or cannot be determined from the image, "
    "clearly state that it is not visible rather than guessing.\n"
    "- Do NOT attempt facial recognition or claim to know who people are."
)


class LMStudioClient:
    def __init__(self):
        self.base_url = settings.lm_studio_base_url.rstrip("/")
        self.timeout = httpx.Timeout(120.0, connect=10.0)
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Returns or creates a reusable, keep-alive AsyncClient instance to prevent socket exhaustion."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def aclose(self) -> None:
        """Closes the persistent HTTP client on application shutdown."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    @property
    def semaphore(self) -> asyncio.Semaphore:
        """Lazily initialize semaphore on the active event loop."""
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.max_concurrency)
        return self._semaphore

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if settings.lm_studio_api_key:
            headers["Authorization"] = f"Bearer {settings.lm_studio_api_key}"
        return headers

    async def check_health(self) -> Dict[str, Any]:
        """Check LM Studio connectivity and verify model status."""
        endpoint = f"{self.base_url}/models"
        is_local = settings.is_local_endpoint

        try:
            response = await self.client.get(endpoint, headers=self._get_headers())

            if response.status_code != 200:
                return {
                    "connected": False,
                    "is_local": is_local,
                    "base_url": self.base_url,
                    "configured_model": settings.lm_studio_model,
                    "model_available": False,
                    "available_models": [],
                    "error": f"LM Studio responded with HTTP status {response.status_code}: {response.text[:200]}"
                }

            data = response.json()
            model_items = data.get("data", [])
            model_ids = [m.get("id") for m in model_items if isinstance(m, dict) and "id" in m]

            model_available = settings.lm_studio_model in model_ids
            # Also check if any model ID contains the model name or matches base name
            if not model_available:
                target_base = settings.lm_studio_model.lower().split("/")[-1]
                for mid in model_ids:
                    if target_base in mid.lower():
                        model_available = True
                        break

            return {
                "connected": True,
                "is_local": is_local,
                "base_url": self.base_url,
                "configured_model": settings.lm_studio_model,
                "model_available": model_available,
                "available_models": model_ids,
                "error": None if model_available else (
                    f"Configured model '{settings.lm_studio_model}' is not currently loaded in LM Studio. "
                    f"Available models: {', '.join(model_ids) if model_ids else 'None'}. "
                    f"Please load the model in LM Studio."
                )
            }

        except httpx.ConnectError:
            return {
                "connected": False,
                "is_local": is_local,
                "base_url": self.base_url,
                "configured_model": settings.lm_studio_model,
                "model_available": False,
                "available_models": [],
                "error": f"Cannot connect to LM Studio server at {self.base_url}. Please ensure LM Studio is running and the local server is started."
            }
        except httpx.TimeoutException:
            return {
                "connected": False,
                "is_local": is_local,
                "base_url": self.base_url,
                "configured_model": settings.lm_studio_model,
                "model_available": False,
                "available_models": [],
                "error": f"Connection timed out when reaching LM Studio at {self.base_url}."
            }
        except Exception as e:
            logger.error("Health check error: %s", str(e))
            return {
                "connected": False,
                "is_local": is_local,
                "base_url": self.base_url,
                "configured_model": settings.lm_studio_model,
                "model_available": False,
                "available_models": [],
                "error": f"Unexpected error checking LM Studio: {str(e)}"
            }

    async def describe_image(self, image_data_url: str, mode: str = "concise") -> str:
        """Send image and prompt to LM Studio for initial description."""
        system_prompt = SYSTEM_PROMPT_DETAILED if mode == "detailed" else SYSTEM_PROMPT_CONCISE
        user_prompt = (
            "Please provide a comprehensive visual accessibility description of this image."
            if mode == "detailed"
            else "Please provide a concise accessibility description of this image."
        )

        payload = {
            "model": settings.lm_studio_model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": image_data_url}}
                    ]
                }
            ],
            "max_tokens": 800 if mode == "detailed" else 350,
            "temperature": 0.2
        }

        return await self._execute_chat_completion(payload)

    async def chat_with_image(
        self,
        image_data_url: str,
        question: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Send a follow-up question about the uploaded image, maintaining conversational context.
        history format: list of {"role": "user"|"assistant", "content": string}
        """
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT_CHAT}
        ]

        # The first turn must provide the image context
        first_user_content: List[Dict[str, Any]] = [
            {"type": "text", "text": "Here is the photograph I am asking about. Please keep this visual context in mind."},
            {"type": "image_url", "image_url": {"url": image_data_url}}
        ]

        if not history:
            # Single follow-up question
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": image_data_url}}
                ]
            })
        else:
            # First turn anchors the image
            messages.append({
                "role": "user",
                "content": first_user_content
            })
            messages.append({
                "role": "assistant",
                "content": "I have examined the photograph. What would you like to know about it?"
            })

            # Append previous dialog turns
            for turn in history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

            # Append current question
            messages.append({"role": "user", "content": question})

        payload = {
            "model": settings.lm_studio_model,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.2
        }

        return await self._execute_chat_completion(payload)

    async def _execute_chat_completion(self, payload: Dict[str, Any]) -> str:
        """Executes the chat completion request against LM Studio with safe error handling and hardware concurrency gating."""
        endpoint = f"{self.base_url}/chat/completions"

        # Hardware DoS protection: acquire concurrency semaphore with timeout
        try:
            await asyncio.wait_for(self.semaphore.acquire(), timeout=10.0)
        except asyncio.TimeoutError:
            logger.warning("Local AI concurrency limit reached (%d max concurrent requests)", settings.max_concurrency)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Local AI vision model is busy with another image request. Please try again in a few moments."
            )

        try:
            # Log request metadata without logging raw payload or image data!
            num_messages = len(payload.get("messages", []))
            logger.info(
                "Dispatching inference request to LM Studio model '%s' (messages=%d, max_tokens=%d)",
                payload.get("model"), num_messages, payload.get("max_tokens", 0)
            )

            try:
                response = await self.client.post(endpoint, json=payload, headers=self._get_headers())

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if not choices:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="The local model responded with an empty completion."
                        )
                    content = choices[0].get("message", {}).get("content", "")
                    if not content:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail="The model generated no descriptive text."
                        )
                    return content.strip()

                # Handle specific error status codes from LM Studio
                error_text = response.text[:300]
                logger.error("LM Studio returned HTTP %d: %s", response.status_code, error_text)

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Model '{settings.lm_studio_model}' not found in LM Studio. Please verify that the model is loaded."
                    )

                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"LM Studio error ({response.status_code}): {error_text}"
                )

            except httpx.ConnectError:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Cannot reach local LM Studio server at {self.base_url}. Please ensure LM Studio is running."
                )
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Local AI inference timed out. Your model may be busy or your computer is processing at capacity."
                )
            except HTTPException:
                raise
            except Exception as e:
                logger.exception("Unexpected error communicating with LM Studio: %s", str(e))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Inference error: {str(e)}"
                )
        finally:
            self.semaphore.release()


lm_studio_client = LMStudioClient()
