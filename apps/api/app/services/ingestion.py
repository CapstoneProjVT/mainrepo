import csv
import io
import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Opportunity
from app.services.matching import embed_text


def _parse_date(v):
    if not v:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    return None


def _norm_row(r: dict) -> dict:
    tags = r.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    return {
        "title": (r.get("title") or "").strip(),
        "org": (r.get("org") or "").strip(),
        "description": (r.get("description") or "").strip(),
        "location": (r.get("location") or "").strip(),
        "tags_json": tags,
        "deadline_date": _parse_date(r.get("deadline") or r.get("deadline_date")),
        "url": (r.get("url") or "").strip() or None,
    }


from app.services.ml import extract_tags

async def import_rows(session: AsyncSession, rows: list[dict]) -> dict:
    inserted = 0
    updated = 0
    failures = []
    for raw in rows:
        try:
            row = _norm_row(raw)
            if not row["title"] or not row["org"]:
                raise ValueError("missing title/org")
            stmt = None
            if row["url"]:
                stmt = select(Opportunity).where(Opportunity.url == row["url"])
            else:
                stmt = select(Opportunity).where(
                    Opportunity.title == row["title"], Opportunity.org == row["org"], Opportunity.location == row["location"]
                )
            existing = (await session.execute(stmt)).scalar_one_or_none()
            embedding = embed_text(f"{row['title']} {row['org']} {row['description']} {' '.join(row['tags_json'])} {row['location']}")
            if existing:
                for k, v in row.items():
                    setattr(existing, k, v)
                existing.embedding_vector = embedding
                updated += 1
            else:
                session.add(Opportunity(**row, embedding_vector=embedding))
                inserted += 1
        except Exception as e:
            failures.append({"row": raw, "error": str(e)})
    await session.commit()
    return {"inserted": inserted, "updated": updated, "failures": failures}


def parse_upload(filename: str, content: bytes) -> list[dict]:
    if filename.lower().endswith(".json"):
        return json.loads(content.decode("utf-8"))
    if filename.lower().endswith(".csv"):
        return list(csv.DictReader(io.StringIO(content.decode("utf-8"))))
    raise ValueError("Unsupported file type")
