from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.models import Application, Event, Opportunity
from app.routers.deps import get_current_user
from app.schemas.common import AppIn, AppPatch, StagePatch

router = APIRouter(prefix="/tracker", tags=["tracker"])


@router.get("/applications")
async def list_apps(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return (await db.execute(select(Application).where(Application.user_id == user.id))).scalars().all()


@router.post("/applications")
async def create_app(payload: AppIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    title_snapshot = payload.title_snapshot
    org_snapshot = payload.org_snapshot
    url_snapshot = payload.url_snapshot

    if payload.opportunity_id:
        opp = (await db.execute(select(Opportunity).where(Opportunity.id == payload.opportunity_id))).scalar_one_or_none()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        title_snapshot = title_snapshot or opp.title
        org_snapshot = org_snapshot or opp.org
        url_snapshot = url_snapshot or opp.url

    if not title_snapshot or not org_snapshot:
        raise HTTPException(status_code=422, detail="title_snapshot and org_snapshot are required")

    a = Application(
        user_id=user.id,
        opportunity_id=payload.opportunity_id,
        title_snapshot=title_snapshot,
        org_snapshot=org_snapshot,
        url_snapshot=url_snapshot,
        stage=payload.stage,
        notes=payload.notes,
        deadline_date=payload.deadline,
        date_applied=payload.date_applied,
    )
    db.add(a)
    db.add(Event(user_id=user.id, event_type="added_to_tracker", payload_json={"title": payload.title_snapshot}))
    await db.commit()
    await db.refresh(a)
    return a


@router.patch("/applications/{app_id}/stage")
async def patch_stage(app_id: int, payload: StagePatch, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Application).where(Application.id == app_id, Application.user_id == user.id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404)
    a.stage = payload.stage
    db.add(Event(user_id=user.id, event_type="stage_changed", payload_json={"app_id": app_id, "stage": payload.stage.value}))
    await db.commit()
    return a


@router.patch("/applications/{app_id}")
async def patch_app(app_id: int, payload: AppPatch, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Application).where(Application.id == app_id, Application.user_id == user.id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404)
    if payload.title_snapshot is not None:
        title = payload.title_snapshot.strip()
        if not title:
            raise HTTPException(status_code=422, detail="title_snapshot cannot be empty")
        a.title_snapshot = title
    if payload.org_snapshot is not None:
        org = payload.org_snapshot.strip()
        if not org:
            raise HTTPException(status_code=422, detail="org_snapshot cannot be empty")
        a.org_snapshot = org
    if payload.notes is not None:
        a.notes = payload.notes
    if payload.deadline is not None:
        a.deadline_date = payload.deadline
        db.add(Event(user_id=user.id, event_type="deadline_set", payload_json={"app_id": app_id}))
    if payload.date_applied is not None:
        a.date_applied = payload.date_applied
    await db.commit()
    return a


@router.delete("/applications/{app_id}")
async def delete_app(app_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Application).where(Application.id == app_id, Application.user_id == user.id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404)
    await db.delete(a)
    await db.commit()
    return {"ok": True}
