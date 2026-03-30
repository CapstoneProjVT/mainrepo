from sqlalchemy import func, select
from app.models.models import Event, RelevanceRating, Application


async def compute_krs(session):
    ratings_avg = (await session.execute(select(func.avg(RelevanceRating.rating)))).scalar() or 0
    apps_count = (await session.execute(select(func.count(Application.id)))).scalar() or 0
    tracked_events = (await session.execute(select(func.count(Event.id)).where(Event.event_type == "added_to_tracker"))).scalar() or 0
    pct_tracked = (tracked_events / apps_count * 100) if apps_count else 0

    latencies = [
        e.payload_json.get("latency_ms", 0)
        for e in (await session.execute(select(Event).where(Event.event_type == "search_submitted").order_by(Event.created_at.desc()).limit(200))).scalars()
    ]
    latencies = sorted([l for l in latencies if isinstance(l, (int, float))])
    p95 = latencies[int(0.95 * (len(latencies) - 1))] if latencies else 0

    events = (await session.execute(select(Event).where(Event.event_type.in_(["search_submitted", "saved"])).order_by(Event.created_at))).scalars().all()
    first_search = next((e for e in events if e.event_type == "search_submitted"), None)
    saved = [e for e in events if e.event_type == "saved"]
    tts10 = None
    if first_search and len(saved) >= 10:
        tts10 = (saved[9].created_at - first_search.created_at).total_seconds()

    return {
        "time_to_shortlist_10": tts10,
        "tracked_pct": round(pct_tracked, 2),
        "match_latency_p95": p95,
        "relevance_avg": round(float(ratings_avg), 2),
    }
