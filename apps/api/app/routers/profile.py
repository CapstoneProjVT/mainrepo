from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.models import Profile
from app.routers.deps import get_current_user
from app.schemas.common import ProfileIn

router = APIRouter(tags=["profile"])


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}


@router.get("/me/profile")
async def get_profile(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one()
    return {"skills": p.skills_json, "interests": p.interests_text, "locations": p.locations_json, "grad_year": p.grad_year}


@router.put("/me/profile")
async def put_profile(payload: ProfileIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one()
    p.skills_json = payload.skills
    p.interests_text = payload.interests
    p.locations_json = payload.locations
    p.grad_year = payload.grad_year
    await db.commit()
    return payload
