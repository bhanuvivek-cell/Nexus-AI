import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_username_registration_and_login_flow():
    unique_uname = f"student_{uuid.uuid4().hex[:6]}"
    password = "SecurePassword123!"

    # 1. Register with username only
    res = client.post("/api/v1/auth/register", json={
        "username": unique_uname,
        "password": password,
        "confirm_password": password,
        "full_name": "Test Student"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == unique_uname
    token = data["access_token"]

    # 2. Duplicate registration fails
    dup_res = client.post("/api/v1/auth/register", json={
        "username": unique_uname,
        "password": password,
    })
    assert dup_res.status_code == 409

    # 3. Invalid login fails
    bad_login = client.post("/api/v1/auth/login", json={
        "username": unique_uname,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 4. Correct login succeeds
    good_login = client.post("/api/v1/auth/login", json={
        "username": unique_uname,
        "password": password
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()

    # 5. /me endpoint returns student identity
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == unique_uname

