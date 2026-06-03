"""Tests for Project APIs."""


class TestCreateProject:
    def test_create_project_minimal(self, client, auth_headers):
        res = client.post("/api/v1/projects", json={
            "title": "My First Agent",
        }, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "My First Agent"
        assert "id" in data

    def test_create_project_full(self, client, auth_headers):
        res = client.post("/api/v1/projects", json={
            "title": "AI Research Assistant",
            "description": "An agent that helps with research.",
            "github_url": "https://github.com/user/agent",
            "demo_url": "https://agent.demo.com",
            "related_skill_id": "00000000-0000-0000-0000-000000000001",
        }, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "AI Research Assistant"
        assert data["github_url"] == "https://github.com/user/agent"

    def test_create_project_no_auth(self, client):
        res = client.post("/api/v1/projects", json={"title": "Test"})
        assert res.status_code in (401, 422)


class TestGetProjects:
    def test_get_projects_empty(self, client, auth_headers):
        res = client.get("/api/v1/projects", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_get_projects_with_data(self, client, auth_headers):
        client.post("/api/v1/projects", json={"title": "Project A"}, headers=auth_headers)
        client.post("/api/v1/projects", json={"title": "Project B"}, headers=auth_headers)

        res = client.get("/api/v1/projects", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 2
        titles = {p["title"] for p in data}
        assert titles == {"Project A", "Project B"}

    def test_link_unpassed_submission_fails(self, client, seeded_quest, auth_headers):
        # Accept and submit
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        submit_res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "test",
        }, headers=auth_headers)
        submission_id = submit_res.json()["submission_id"]

        # Try to link — should fail because submission is SUBMITTED, not PASSED
        res = client.post("/api/v1/projects", json={
            "title": "Linked Project",
            "quest_submission_id": submission_id,
        }, headers=auth_headers)
        assert res.status_code == 409
