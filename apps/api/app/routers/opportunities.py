from __future__ import annotations
from __future__ import annotations
import time
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.models import Event, Opportunity, Profile, RelevanceRating, SavedOpportunity
from app.routers.deps import get_current_user
from app.schemas.common import RatingIn
from app.services.matching import (
    cosine,
    embed_text,
    extract_overlap,
    normalize_score,
    opportunity_text,
    snippets,
    user_profile_text,
)

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


async def _explain(db, user, opps):
    profile = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one_or_none()
    if profile is None:
        profile = Profile(user_id=user.id, skills_json=[], interests_text="", locations_json=[])
        db.add(profile)
        await db.flush()
        await db.commit()
    user_emb = embed_text(user_profile_text(profile))
    user_skills = profile.skills_json or []
    
    saved_ids = set((await db.execute(select(SavedOpportunity.opportunity_id).where(SavedOpportunity.user_id == user.id))).scalars().all())

    out = []
    for o in opps:
        sim = cosine(user_emb, o.embedding_vector or [])
        overlap = extract_overlap(user_skills, o.tags_json or [], o.description or "")
        out.append({
            "id": o.id,
            "title": o.title,
            "org": o.org,
            "description": o.description,
            "location": o.location,
            "tags": o.tags_json or [],
            "deadline_date": o.deadline_date,
            "url": o.url,
            "match_score": normalize_score(sim),
            "explanation": {"overlap_skills": overlap, "snippets": snippets(o.description, overlap)},
            "is_saved": o.id in saved_ids
        })
    return sorted(out, key=lambda x: x["match_score"], reverse=True)


from typing import Optional

@router.get("")
async def list_opps(
    request: Request,
    query: Optional[str] = None,
    tag: Optional[str] = None,
    location: Optional[str] = None,
    deadline_before: Optional[date] = None,
    saved_only: bool = False,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t0 = time.perf_counter()
    stmt = select(Opportunity)
    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where(and_(Opportunity.title.ilike(q) | Opportunity.description.ilike(q) | Opportunity.org.ilike(q)))
    if location:
        stmt = stmt.where(Opportunity.location.ilike(f"%{location}%"))
    if deadline_before:
        stmt = stmt.where(Opportunity.deadline_date <= deadline_before)
    opps = (await db.execute(stmt)).scalars().all()
    if tag:
        opps = [o for o in opps if tag.lower() in [t.lower() for t in (o.tags_json or [])]]
    if saved_only:
        saved_ids = set((await db.execute(select(SavedOpportunity.opportunity_id).where(SavedOpportunity.user_id == user.id))).scalars().all())
        opps = [o for o in opps if o.id in saved_ids]
    scored = await _explain(db, user, opps)
    ms = int((time.perf_counter() - t0) * 1000)
    db.add(Event(user_id=user.id, event_type="search_submitted", payload_json={"query": query or "", "latency_ms": ms}))
    await db.commit()
    return scored


@router.get("/{opp_id}")
async def get_opp(opp_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(Opportunity).where(Opportunity.id == opp_id))).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    db.add(Event(user_id=user.id, event_type="opportunity_viewed", payload_json={"opportunity_id": opp_id}))
    await db.commit()
    return (await _explain(db, user, [o]))[0]


@router.post("/{opp_id}/save")
async def save_opp(opp_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(SavedOpportunity).where(SavedOpportunity.user_id == user.id, SavedOpportunity.opportunity_id == opp_id))).scalar_one_or_none()
    if not existing:
        db.add(SavedOpportunity(user_id=user.id, opportunity_id=opp_id))
        db.add(Event(user_id=user.id, event_type="saved", payload_json={"opportunity_id": opp_id}))
        await db.commit()
    return {"ok": True}


@router.post("/{opp_id}/unsave")
async def unsave_opp(opp_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(SavedOpportunity).where(SavedOpportunity.user_id == user.id, SavedOpportunity.opportunity_id == opp_id))).scalar_one_or_none()
    if existing:
        await db.delete(existing)
        db.add(Event(user_id=user.id, event_type="unsaved", payload_json={"opportunity_id": opp_id}))
        await db.commit()
    return {"ok": True}


@router.post("/{opp_id}/rate")
async def rate_opp(opp_id: int, payload: RatingIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rr = (await db.execute(select(RelevanceRating).where(RelevanceRating.user_id == user.id, RelevanceRating.opportunity_id == opp_id))).scalar_one_or_none()
    if rr:
        rr.rating = payload.rating
    else:
        db.add(RelevanceRating(user_id=user.id, opportunity_id=opp_id, rating=payload.rating))
    
    db.add(Event(user_id=user.id, event_type="rated", payload_json={"opportunity_id": opp_id, "rating": payload.rating}))
    await db.commit()
    return {"ok": True}

from app.models.models import Profile

@router.get("/{opp_id}/ml-match")
async def ml_match(opp_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(Opportunity).where(Opportunity.id == opp_id))).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    profile = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one_or_none()
    from app.services.matching import user_profile_text, opportunity_text
    from app.services.ml import match_resume
    
    p_text = user_profile_text(profile) if profile else ""
    o_text = opportunity_text(o)
    
    try:
        data = await match_resume(p_text, o_text)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{opp_id}/cover-letter")
async def cover_letter(opp_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(Opportunity).where(Opportunity.id == opp_id))).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    profile = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one_or_none()
    from app.services.matching import user_profile_text, opportunity_text
    from app.services.ml import generate_cover_letter
    p_text = user_profile_text(profile) if profile else ""
    o_text = opportunity_text(o)
    try:
        data = await generate_cover_letter(p_text, o_text)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{opp_id}/interview-prep")
async def interview_prep(opp_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(Opportunity).where(Opportunity.id == opp_id))).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    profile = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one_or_none()
    from app.services.matching import user_profile_text, opportunity_text
    from app.services.ml import generate_interview_prep
    p_text = user_profile_text(profile) if profile else ""
    o_text = opportunity_text(o)
    try:
        data = await generate_interview_prep(p_text, o_text)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
