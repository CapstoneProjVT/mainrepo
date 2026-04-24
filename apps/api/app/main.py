import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import SessionLocal, engine
from app.models.base import Base
from app.routers import admin, auth, insights, metrics, opportunities, profile, tracker
from app.routers.admin import sync_seed_data


def should_auto_seed() -> bool:
    configured = os.getenv("AUTO_SEED")
    if configured is not None:
        return configured.lower() == "true"
    return bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — wrapped in try/except so Vercel serverless doesn't crash
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        if should_auto_seed():
            async with SessionLocal() as session:
                await sync_seed_data(session)
    except Exception as e:
        import logging
        logging.warning(f"Lifespan startup error (may be expected on serverless): {e}")
    
    yield
    # Shutdown (nothing needed)


app = FastAPI(title="InternAtlas API", lifespan=lifespan)
_allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Add Vercel frontend origin if set, otherwise allow all .vercel.app origins
_vercel_url = os.getenv("VERCEL_URL")  # auto-set by Vercel
_frontend_url = os.getenv("FRONTEND_URL")  # explicit override
if _frontend_url:
    _allowed_origins.append(_frontend_url)
if _vercel_url:
    _allowed_origins.append(f"https://{_vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins if _frontend_url or _vercel_url else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(opportunities.router)
app.include_router(tracker.router)
app.include_router(admin.router)
app.include_router(insights.router)
app.include_router(metrics.router)


@app.get("/")
async def root():
    return {"name": "InternAtlas"}
