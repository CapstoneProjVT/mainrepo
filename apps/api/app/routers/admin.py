import json
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import Opportunity
from app.routers.deps import get_current_user
from app.services.ingestion import import_rows, parse_upload

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(user):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="admin only")


def resolve_seed_path() -> Path:
    configured_path = os.getenv("AUTO_SEED_PATH")
    if configured_path:
        return Path(configured_path)
    bundled_seed_path = Path(__file__).resolve().parents[2] / "data" / "seed_opportunities.json"
    if bundled_seed_path.exists():
        return bundled_seed_path
    docker_seed_path = Path("/data/seed_opportunities.json")
    if docker_seed_path.exists():
        return docker_seed_path
    return Path(__file__).resolve().parents[4] / "data" / "seed_opportunities.json"


def load_seed_rows() -> list[dict]:
    return json.loads(resolve_seed_path().read_text())


async def sync_seed_data(db: AsyncSession) -> dict:
    return await import_rows(db, load_seed_rows())


async def seed_if_empty(db: AsyncSession) -> dict:
    count = (await db.execute(select(func.count(Opportunity.id)))).scalar() or 0
    if count:
        return {"inserted": 0, "updated": 0, "failures": []}
    return await sync_seed_data(db)


@router.post("/import")
async def import_file(file: UploadFile = File(...), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    rows = parse_upload(file.filename, await file.read())
    return await import_rows(db, rows)


@router.post("/seed")
async def seed(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    return await sync_seed_data(db)

from pydantic import BaseModel

class ScrapeRequest(BaseModel):
    url: str

@router.post("/scrape")
async def scrape_url(payload: ScrapeRequest, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    from app.services.ml import scrape_opportunity
    try:
        data = await scrape_opportunity(payload.url)
        return await import_rows(db, [data])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
