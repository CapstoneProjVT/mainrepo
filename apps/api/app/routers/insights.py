import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from collections import Counter
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.models import Application, Event, StageEnum
from app.routers.deps import get_current_user

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/funnel")
async def funnel(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    counts = {s.value: 0 for s in StageEnum}
    rows = (await db.execute(select(Application.stage, func.count(Application.id)).where(Application.user_id == user.id).group_by(Application.stage))).all()
    for stage, count in rows:
        counts[stage.value] = count
    applied = counts["Applied"] or 1
    return {
        "counts": counts,
        "response_rate": round((counts["Interview"] / applied) * 100, 2),
        "interview_rate": round((counts["Offer"] / max(1, counts["Interview"])) * 100, 2),
    }


@router.get("/apps_per_week")
async def apps_per_week(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    apps = (await db.execute(select(Application).where(Application.user_id == user.id))).scalars().all()
    ctr = Counter(a.created_at.strftime('%Y-%W') for a in apps)
    return [{"week": w, "count": c} for w, c in sorted(ctr.items())]


@router.get("/export.csv")
async def export_csv(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    apps = (await db.execute(select(Application).where(Application.user_id == user.id))).scalars().all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "title", "org", "stage", "deadline", "date_applied", "notes"])
    for a in apps:
        writer.writerow([a.id, a.title_snapshot, a.org_snapshot, a.stage.value, a.deadline_date, a.date_applied, a.notes])
    db.add(Event(user_id=user.id, event_type="export_csv", payload_json={}))
    await db.commit()
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tracker.csv"})
