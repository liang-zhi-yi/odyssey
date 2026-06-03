"""Tests for Credential APIs."""

from app.credentials.models import UserCredential


class TestGetCredentials:
    def test_get_all_credentials(self, client, seeded_credentials, auth_headers):
        res = client.get("/api/v1/credentials", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 5
        names = {c["name"] for c in data}
        assert "Prompt Practitioner" in names
        assert "Agent Engineer" in names

    def test_get_credentials_no_auth(self, client):
        # FastAPI returns 422 for missing required Header
        res = client.get("/api/v1/credentials")
        assert res.status_code in (401, 422)


class TestGetUserCredentials:
    def test_get_user_credentials_empty(self, client, seeded_user, auth_headers):
        res = client.get("/api/v1/user-credentials", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_get_user_credentials_with_data(self, client, db, seeded_user, seeded_credentials, auth_headers):
        cred = seeded_credentials["Prompt Practitioner"]
        uc = UserCredential(user_id=seeded_user.id, credential_id=cred.id)
        db.add(uc)
        db.commit()

        res = client.get("/api/v1/user-credentials", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["name"] == "Prompt Practitioner"
        assert "issued_at" in data[0]
