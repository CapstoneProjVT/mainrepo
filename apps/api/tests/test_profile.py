import pytest


@pytest.mark.asyncio
async def test_profile_put_get_roundtrip(authed_client):
    payload = {
        "skills": ["python", "sql", "fastapi"],
        "interests": "backend engineering",
        "locations": ["Remote", "Dublin"],
        "grad_year": 2027,
    }
    put_response = await authed_client.put("/me/profile", json=payload)
    assert put_response.status_code == 200

    profile = await authed_client.get("/me/profile")
    assert profile.status_code == 200
    assert profile.json() == {**payload, "has_resume": False}


@pytest.mark.asyncio
async def test_profile_skills_consistent_order(authed_client):
    payload = {"skills": ["go", "python", "go"], "interests": "", "locations": [], "grad_year": None}
    await authed_client.put("/me/profile", json=payload)
    profile = await authed_client.get("/me/profile")
    assert profile.json()["skills"] == ["go", "python", "go"]
