from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.security import hash_password, verify_password, create_token
from app.models.models import User, Profile
from app.schemas.common import AuthIn

router = APIRouter(prefix="/auth", tags=["auth"])
MAX_PASSWORD_BYTES = 1024


def _validate_password_size(password: str) -> None:
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise HTTPException(status_code=400, detail="Password too long")


@router.post("/register")
async def register(payload: AuthIn, response: Response, db: AsyncSession = Depends(get_db)):
    _validate_password_size(payload.password)
    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    user = User(email=payload.email, password_hash=hash_password(payload.password), is_admin=user_count == 0)
    db.add(user)
    await db.flush()
    db.add(Profile(user_id=user.id, skills_json=[], interests_text="", locations_json=[]))
    await db.commit()
    token = create_token(user.id)
    response.set_cookie("internatlas_token", token, httponly=True, samesite="lax")
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}


@router.post("/login")
async def login(payload: AuthIn, response: Response, db: AsyncSession = Depends(get_db)):
    _validate_password_size(payload.password)
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    response.set_cookie("internatlas_token", create_token(user.id), httponly=True, samesite="lax")
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("internatlas_token")
    return {"ok": True}
