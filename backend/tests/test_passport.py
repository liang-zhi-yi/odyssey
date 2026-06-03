"""Tests for Passport API."""


class TestGetPassport:
    def test_get_passport_empty(self, client, seeded_user, auth_headers):
        res = client.get("/api/v1/passport", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["user"] == "testuser"
        assert data["skills"] == []
        assert data["credentials"] == []
        assert data["projects"] == []

    def test_get_passport_with_skills(self, client, seeded_user, seeded_skills, seeded_user_skills, auth_headers):
        res = client.get("/api/v1/passport", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data["skills"]) == 4
        skill_names = {s["name"] for s in data["skills"]}
        assert "Prompt Engineering" in skill_names

    def test_get_passport_no_auth(self, client):
        res = client.get("/api/v1/passport")
        assert res.status_code in (401, 422)

    def test_get_passport_full(self, client, db, seeded_user, seeded_skills, seeded_user_skills, seeded_credentials, auth_headers):
        # Award a credential
        from app.credentials.models import UserCredential
        cred = seeded_credentials["Prompt Practitioner"]
        db.add(UserCredential(user_id=seeded_user.id, credential_id=cred.id))
        db.commit()

        res = client.get("/api/v1/passport", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["user"] == "testuser"
        assert len(data["skills"]) == 4
        assert len(data["credentials"]) == 1
        assert data["credentials"][0]["name"] == "Prompt Practitioner"
