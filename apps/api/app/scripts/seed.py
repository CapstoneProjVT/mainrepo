import asyncio
import json
from pathlib import Path
from app.core.db import SessionLocal
from app.services.ingestion import import_rows


async def run():
    seed_path = Path("/data/seed_opportunities.json")
    if not seed_path.exists():
        seed_path = Path(__file__).resolve().parents[4] / "data" / "seed_opportunities.json"
    rows = json.loads(seed_path.read_text())
    async with SessionLocal() as s:
        res = await import_rows(s, rows)
        print(res)


if __name__ == "__main__":
    asyncio.run(run())
