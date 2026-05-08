from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from config import settings
from firebase_client import get_db
from simulation.manager import SimulationManager
from routers import forecast, chat, disease, recommend

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_manager: SimulationManager | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _manager
    db = get_db()
    _manager = SimulationManager(db)
    await _manager.start()
    logger.info("Simulation started: %d engines", _manager.active_count)
    yield
    if _manager:
        _manager.stop()


app = FastAPI(title="Growy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router)
app.include_router(chat.router)
app.include_router(disease.router)
app.include_router(recommend.router)


@app.get("/health")
async def health():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_host}/api/tags")
            ollama_ok = resp.status_code == 200
    except Exception:
        pass
    active = _manager.active_count if _manager else 0
    from ai.registry import registry
    return {
        "status": "ok",
        "ollama": "connected" if ollama_ok else "unavailable",
        "simulation": f"{active} engines running",
        "ai_models": registry.status(),
    }
