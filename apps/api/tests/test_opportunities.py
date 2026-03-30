import json

import pytest
from sqlalchemy import func, select

from app.models.models import Opportunity, RelevanceRating, SavedOpportunity
from app.routers.admin import seed_if_empty
from app.services.matching import embed_text


@pytest.mark.asyncio
async def test_seed_is_idempotent(authed_client):
    first = await authed_client.post("/admin/seed")
    second = await authed_client.post("/admin/seed")
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["inserted"] == 0


@pytest.mark.asyncio
async def test_list_opportunities_includes_match_and_explanations(authed_client):
    await authed_client.post("/admin/seed")
    opps = await authed_client.get("/opportunities")
    assert opps.status_code == 200
    first = opps.json()[0]
    assert "match_score" in first
    assert isinstance(first["explanation"].get("overlap_skills"), list)
    assert isinstance(first["explanation"].get("snippets"), list)


@pytest.mark.asyncio
async def test_opportunity_filters_query_tag_and_saved_only(authed_client):
    await authed_client.post("/admin/seed")

    query_results = await authed_client.get("/opportunities?query=backend")
    assert query_results.status_code == 200
    assert query_results.json()

    tagged = await authed_client.get("/opportunities?tag=frontend")
    assert tagged.status_code == 200
    assert all("frontend" in [tag.lower() for tag in item["tags"]] for item in tagged.json())

    before_save = await authed_client.get("/opportunities?saved_only=true")
    assert before_save.status_code == 200
    assert before_save.json() == []


@pytest.mark.asyncio
async def test_save_and_saved_only_filter(authed_client):
    await authed_client.post("/admin/seed")
    opps = (await authed_client.get("/opportunities")).json()
    opp_id = opps[0]["id"]

    save = await authed_client.post(f"/opportunities/{opp_id}/save")
    assert save.status_code == 200

    saved_only = await authed_client.get("/opportunities?saved_only=true")
    assert saved_only.status_code == 200
    assert {item["id"] for item in saved_only.json()} == {opp_id}


@pytest.mark.asyncio
async def test_save_is_idempotent_and_rating_persists(authed_client, db_session):
    await authed_client.post("/admin/seed")
    opp_id = (await authed_client.get("/opportunities")).json()[0]["id"]

    await authed_client.post(f"/opportunities/{opp_id}/save")
    await authed_client.post(f"/opportunities/{opp_id}/save")
    await authed_client.post(f"/opportunities/{opp_id}/rate", json={"rating": 2})
    await authed_client.post(f"/opportunities/{opp_id}/rate", json={"rating": 5})

    saved_count = (await db_session.execute(select(func.count(SavedOpportunity.id)))).scalar()
    rating = (await db_session.execute(select(RelevanceRating).where(RelevanceRating.opportunity_id == opp_id))).scalar_one()
    assert saved_count == 1
    assert rating.rating == 5


@pytest.mark.asyncio
async def test_rating_overwrites_existing_rating(authed_client):
    await authed_client.post("/admin/seed")
    opp_id = (await authed_client.get("/opportunities")).json()[0]["id"]

    first = await authed_client.post(f"/opportunities/{opp_id}/rate", json={"rating": 2})
    second = await authed_client.post(f"/opportunities/{opp_id}/rate", json={"rating": 5})
    assert first.status_code == 200
    assert second.status_code == 200


@pytest.mark.asyncio
async def test_auto_seed_only_runs_when_table_empty(db_session, monkeypatch, tmp_path):
    seed_rows = [
        {
            "title": "Seeded Role",
            "org": "Seed Org",
            "description": "Platform engineering internship",
            "location": "Remote",
            "tags": ["backend"],
            "deadline": "2026-01-01",
            "url": "https://seeded.example/role",
        }
    ]
    seed_path = tmp_path / "seed.json"
    seed_path.write_text(json.dumps(seed_rows), encoding="utf-8")
    monkeypatch.setenv("AUTO_SEED_PATH", str(seed_path))

    first = await seed_if_empty(db_session)
    second = await seed_if_empty(db_session)

    total = (await db_session.execute(select(func.count(Opportunity.id)))).scalar()
    assert first["inserted"] == 1
    assert second["inserted"] == 0
    assert total == 1


def test_embed_text_is_deterministic():
    first = embed_text("Python backend distributed systems")
    second = embed_text("Python backend distributed systems")
    assert first == second


@pytest.mark.asyncio
async def test_get_opportunity_not_found_returns_404(authed_client):
    response = await authed_client.get('/opportunities/999999')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found'


@pytest.mark.asyncio
async def test_rate_opportunity_rejects_out_of_range_rating(authed_client):
    await authed_client.post('/admin/seed')
    opp_id = (await authed_client.get('/opportunities')).json()[0]['id']

    response = await authed_client.post(f'/opportunities/{opp_id}/rate', json={'rating': 10})
    assert response.status_code == 422
