"""Tests for Skill APIs."""


class TestGetSkills:
    def test_get_all_skills(self, client, seeded_skills, auth_headers):
        res = client.get("/api/v1/skills", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 4
        names = {s["name"] for s in data}
        assert "Prompt Engineering" in names
        assert "RAG" in names

    def test_get_skills_no_auth(self, client):
        # GET /skills is public (no auth required)
        res = client.get("/api/v1/skills")
        assert res.status_code == 200


class TestUserSkills:
    def test_get_user_skills_empty(self, client, seeded_user, auth_headers):
        res = client.get("/api/v1/user-skills", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_get_user_skills_with_data(self, client, seeded_user, seeded_skills, seeded_user_skills, auth_headers):
        res = client.get("/api/v1/user-skills", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 4
        for entry in data:
            assert entry["rank"] == "BEGINNER"
            assert entry["overall"] == 30

    def test_get_single_user_skill(self, client, seeded_user, seeded_skills, seeded_user_skills, auth_headers):
        skill_id = "00000000-0000-0000-0000-000000000001"
        res = client.get(f"/api/v1/user-skills/{skill_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["skill_name"] == "Prompt Engineering"

    def test_get_user_skill_not_found(self, client, auth_headers):
        res = client.get("/api/v1/user-skills/00000000-0000-0000-0000-999999999999", headers=auth_headers)
        assert res.status_code == 404
