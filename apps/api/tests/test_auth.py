import pytest

from conftest import register_and_login


@pytest.mark.asyncio
async def test_register_login_me_and_cookie(client):
    register = await client.post("/auth/register", json={"email": "auth@test.com", "password": "password"})
    assert register.status_code == 200
    assert "internatlas_token" in register.headers.get("set-cookie", "")

    login = await client.post("/auth/login", json={"email": "auth@test.com", "password": "password"})
    assert login.status_code == 200
    assert "internatlas_token" in login.headers.get("set-cookie", "")

    me = await client.get("/me")
    assert me.status_code == 200
    assert me.json()["email"] == "auth@test.com"


@pytest.mark.asyncio
async def test_logout_clears_cookie(client):
    await register_and_login(client, email="logout@test.com")
    response = await client.post("/auth/logout")
    assert response.status_code == 200
    assert "internatlas_token=" in response.headers.get("set-cookie", "")


@pytest.mark.asyncio
async def test_duplicate_registration_fails(client):
    await register_and_login(client, email="dupe@test.com")
    dupe = await client.post("/auth/register", json={"email": "dupe@test.com", "password": "password"})
    assert dupe.status_code == 400


@pytest.mark.asyncio
async def test_long_password_register_login_me(client):
    long_password = "a" * 200

    register = await client.post(
        "/auth/register", json={"email": "longpass@test.com", "password": long_password}
    )
    assert register.status_code == 200
    assert "internatlas_token" in register.headers.get("set-cookie", "")

    login = await client.post(
        "/auth/login", json={"email": "longpass@test.com", "password": long_password}
    )
    assert login.status_code == 200
    assert "internatlas_token" in login.headers.get("set-cookie", "")

    me = await client.get("/me")
    assert me.status_code == 200
    assert me.json()["email"] == "longpass@test.com"


@pytest.mark.asyncio
async def test_rejects_absurdly_large_passwords(client):
    too_long_password = "🙂" * 260

    register = await client.post(
        "/auth/register", json={"email": "toolong@test.com", "password": too_long_password}
    )
    assert register.status_code == 400
    assert register.json()["detail"] == "Password too long"

    login = await client.post(
        "/auth/login", json={"email": "toolong@test.com", "password": too_long_password}
    )
    assert login.status_code == 400
    assert login.json()["detail"] == "Password too long"
