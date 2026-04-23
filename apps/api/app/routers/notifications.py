from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import Application, User
from app.routers.deps import get_current_user
from app.services.email import send_email

router = APIRouter(prefix="/notifications", tags=["notifications"])

REMINDER_DAYS = 7


@router.get("/upcoming-deadlines")
async def upcoming_deadlines(
    days: int = REMINDER_DAYS,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    cutoff = today + timedelta(days=days)
    apps = (
        await db.execute(
            select(Application).where(
                Application.user_id == user.id,
                Application.deadline_date is not None,
                Application.deadline_date >= today,
                Application.deadline_date <= cutoff,
            )
        )
    ).scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title_snapshot,
            "org": a.org_snapshot,
            "deadline_date": str(a.deadline_date),
            "stage": a.stage,
            "days_left": (a.deadline_date - today).days,
        }
        for a in apps
        if a.deadline_date is not None
    ]


@router.post("/send-deadline-reminder")
async def send_deadline_reminder(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    cutoff = today + timedelta(days=REMINDER_DAYS)
    apps = (
        await db.execute(
            select(Application).where(
                Application.user_id == user.id,
                Application.deadline_date is not None,
                Application.deadline_date >= today,
                Application.deadline_date <= cutoff,
            )
        )
    ).scalars().all()
    upcoming = [a for a in apps if a.deadline_date is not None]

    if not upcoming:
        return {"sent": False, "reason": "No deadlines in the next 7 days"}

    user_obj = (
        await db.execute(select(User).where(User.id == user.id))
    ).scalar_one()

    rows = "".join(
        f"<tr>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee'><strong>{a.title_snapshot}</strong><br>"
        f"<span style='color:#666;font-size:13px'>{a.org_snapshot}</span></td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:center'>{a.deadline_date}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:center'>"
        f"{(a.deadline_date - today).days} days</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:center'>{a.stage}</td>"
        f"</tr>"
        for a in sorted(upcoming, key=lambda x: x.deadline_date)
    )

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">⏰ Upcoming Application Deadlines</h2>
      <p>Hi {user_obj.email},</p>
      <p>You have <strong>{len(upcoming)}</strong> application deadline(s) coming up in the next {REMINDER_DAYS} days:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f5f3ff;text-align:left">
            <th style="padding:8px 12px">Role</th>
            <th style="padding:8px 12px;text-align:center">Deadline</th>
            <th style="padding:8px 12px;text-align:center">Days Left</th>
            <th style="padding:8px 12px;text-align:center">Stage</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="color:#666;font-size:13px">Log in to InternAtlas to update your applications.</p>
    </div>
    """

    sent = await send_email(
        user_obj.email,
        f"⏰ {len(upcoming)} Deadline(s) Coming Up — InternAtlas",
        html,
    )
    if not sent:
        return {"sent": False, "reason": "Email not configured on this server"}
    return {"sent": True, "count": len(upcoming)}
