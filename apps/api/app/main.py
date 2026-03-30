import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import SessionLocal, engine
from app.models.base import Base
from app.routers import admin, auth, insights, metrics, opportunities, profile, tracker
from app.routers.admin import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if os.getenv("AUTO_SEED", "false").lower() == "true":
        async with SessionLocal() as session:
            await seed_if_empty(session)
    
    yield
    # Shutdown (nothing needed)


app = FastAPI(title="InternAtlas API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
