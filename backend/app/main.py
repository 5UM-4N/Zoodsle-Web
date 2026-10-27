import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.api import router

# Configure safe logging (never log image data or prompts containing base64)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("zoodsle")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ZoodSle backend...")
    logger.info("Configured LM Studio Base URL: %s", settings.lm_studio_base_url)
    logger.info("Configured Target Model: %s", settings.lm_studio_model)
    logger.info("Local-only mode active: %s", settings.is_local_endpoint)
    if not settings.is_local_endpoint:
        logger.warning(
            "ALERT: LM_STUDIO_BASE_URL is configured to a non-local address! "
            "Local privacy guarantee is NOT active."
        )
    yield
    logger.info("Shutting down ZoodSle backend...")
    from app.services.lm_studio_client import lm_studio_client
    await lm_studio_client.aclose()


app = FastAPI(
    title="ZoodSle",
    description="Privacy-first, local-inference visual accessibility API for blind and visually impaired users.",
    version="1.0.0",
    lifespan=lifespan
)

# Restrict CORS to trusted local frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def read_root():
    return {
        "app": "ZoodSle",
        "version": "1.0.0",
        "local_ai": settings.is_local_endpoint,
        "model": settings.lm_studio_model,
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
