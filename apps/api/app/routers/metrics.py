from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.routers.deps import get_current_user
from app.services.metrics import compute_krs

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/krs")
async def krs(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await compute_krs(db)
