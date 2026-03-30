from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.security import decode_token
from app.models.models import User


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    token = request.cookies.get("internatlas_token")
    uid = decode_token(token) if token else None
    
    if uid:
        user = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
        if user:
            return user

    # Fallback to demo user if no valid token
    demo_email = "demo@internatlas.com"
    demo_user = (await db.execute(select(User).where(User.email == demo_email))).scalar_one_or_none()
    
    if not demo_user:
        from app.core.security import hash_password
        from app.models.models import Profile
        demo_user = User(email=demo_email, password_hash=hash_password("demo123"), is_admin=True)
        db.add(demo_user)
        await db.flush()
        db.add(Profile(user_id=demo_user.id, skills_json=["Python", "React", "Machine Learning"], interests_text="AI, Startups", locations_json=["Remote"]))
        await db.commit()
        await db.refresh(demo_user)
        
    return demo_user
