import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.models import Profile, Resume
from app.routers.deps import get_current_user
from app.schemas.common import ProfileIn

router = APIRouter(tags=["profile"])

MAX_RESUME_BYTES = 5 * 1024 * 1024  # 5 MB


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}


@router.get("/me/profile")
async def get_profile(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one()
    has_resume = (await db.execute(select(Resume).where(Resume.user_id == user.id))).scalar_one_or_none() is not None
    return {
        "skills": p.skills_json,
        "interests": p.interests_text,
        "locations": p.locations_json,
        "grad_year": p.grad_year,
        "has_resume": has_resume,
    }


@router.put("/me/profile")
async def put_profile(payload: ProfileIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one()
    p.skills_json = payload.skills
    p.interests_text = payload.interests
    p.locations_json = payload.locations
    p.grad_year = payload.grad_year
    await db.commit()
    return payload


@router.post("/me/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 5 MB limit")

    try:
        from pypdf import PdfReader
    except ImportError:
        raise HTTPException(status_code=500, detail="pypdf is not installed on the server")

    try:
        reader = PdfReader(io.BytesIO(content))
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse PDF: {e}")

    if not text:
        raise HTTPException(status_code=400, detail="No text found in PDF — make sure it's not a scanned image")

    existing = (await db.execute(select(Resume).where(Resume.user_id == user.id))).scalar_one_or_none()
    if existing:
        existing.resume_text = text
        existing.filename = file.filename
    else:
        db.add(Resume(user_id=user.id, resume_text=text, filename=file.filename))
    await db.commit()
    return {"ok": True, "characters": len(text)}


@router.delete("/me/resume")
async def delete_resume(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(Resume).where(Resume.user_id == user.id))).scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
    return {"ok": True}
