import pytest


@pytest.mark.asyncio
async def test_funnel_export_and_metrics(authed_client):
    await authed_client.post("/admin/seed")
    opp_id = (await authed_client.get("/opportunities")).json()[0]["id"]
    await authed_client.post("/tracker/applications", json={"opportunity_id": opp_id, "stage": "Applied"})

    funnel = await authed_client.get("/insights/funnel")
    assert funnel.status_code == 200
    assert "counts" in funnel.json()
    assert "Applied" in funnel.json()["counts"]

    export = await authed_client.get("/insights/export.csv")
    assert export.status_code == 200
    header = export.text.splitlines()[0]
    assert header == "id,title,org,stage,deadline,date_applied,notes"

    metrics = await authed_client.get("/metrics/krs")
    assert metrics.status_code == 200
    body = metrics.json()
    assert isinstance(body["time_to_shortlist_10"], (int, float)) or body["time_to_shortlist_10"] is None
    assert isinstance(body["tracked_pct"], (int, float))
    assert isinstance(body["match_latency_p95"], (int, float))
    assert isinstance(body["relevance_avg"], (int, float))
