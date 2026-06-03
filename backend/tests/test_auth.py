"""Tests for Auth APIs: register, login, me."""


class TestRegister:
    def test_register_success(self, client):
        res = client.post("/api/v1/auth/register", json={
            "email": "new@odyssey.dev",
            "username": "newuser",
            "password": "password123",
        })
        assert res.status_code == 201
        data = res.json()
        assert "user_id" in data
        assert "token" in data

    def test_register_duplicate_email(self, client, seeded_user):
        res = client.post("/api/v1/auth/register", json={
            "email": "test@odyssey.dev",
            "username": "another",
            "password": "password123",
        })
        assert res.status_code == 409

    def test_register_missing_fields(self, client):
        res = client.post("/api/v1/auth/register", json={"email": "x@x.com"})
        assert res.status_code == 422


class TestLogin:
    def test_login_success(self, client, seeded_user):
        res = client.post("/api/v1/auth/login", json={
            "email": "test@odyssey.dev",
            "password": "password123",
        })
        assert res.status_code == 200
        assert "token" in res.json()

    def test_login_wrong_password(self, client, seeded_user):
        res = client.post("/api/v1/auth/login", json={
            "email": "test@odyssey.dev",
            "password": "wrong",
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post("/api/v1/auth/login", json={
            "email": "nobody@odyssey.dev",
            "password": "password",
        })
        assert res.status_code == 401


class TestMe:
    def test_me_authenticated(self, client, seeded_user, auth_headers):
        res = client.get("/api/v1/auth/me", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "test@odyssey.dev"
        assert data["username"] == "testuser"

    def test_me_no_token(self, client):
        # FastAPI returns 422 for missing required Header param
        res = client.get("/api/v1/auth/me")
        assert res.status_code in (401, 422)

    def test_me_bad_token(self, client):
        res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bad.token.here"})
        assert res.status_code == 401
