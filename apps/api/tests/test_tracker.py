import pytest


@pytest.mark.asyncio
async def test_tracker_create_stage_patch_update_delete(authed_client):
    await authed_client.post("/admin/seed")
    opp_id = (await authed_client.get("/opportunities")).json()[0]["id"]

    created = await authed_client.post("/tracker/applications", json={"opportunity_id": opp_id})
    assert created.status_code == 200
    app_id = created.json()["id"]

    stage = await authed_client.patch(f"/tracker/applications/{app_id}/stage", json={"stage": "Interview"})
    assert stage.status_code == 200
    assert stage.json()["stage"] == "Interview"

    details = await authed_client.patch(
        f"/tracker/applications/{app_id}",
        json={"notes": "Reached recruiter", "deadline": "2026-03-10", "date_applied": "2026-02-01"},
    )
    assert details.status_code == 200
    assert details.json()["notes"] == "Reached recruiter"
    assert details.json()["deadline_date"] == "2026-03-10"

    deleted = await authed_client.delete(f"/tracker/applications/{app_id}")
    assert deleted.status_code == 200

    listing = await authed_client.get("/tracker/applications")
    assert listing.status_code == 200
    assert listing.json() == []
