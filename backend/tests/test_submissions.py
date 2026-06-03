"""Tests for Submission APIs."""

from uuid import uuid4


class TestSubmitQuest:
    def test_submit_quest(self, client, seeded_quest, auth_headers):
        # Accept first
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        # Submit
        res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "This is my prompt submission content.",
        }, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUBMITTED"
        assert "submission_id" in data

    def test_submit_not_accepted(self, client, seeded_quest, auth_headers):
        res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "no accept",
        }, headers=auth_headers)
        assert res.status_code == 404

    def test_submit_duplicate(self, client, seeded_quest, auth_headers):
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "first submit",
        }, headers=auth_headers)
        res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "second submit",
        }, headers=auth_headers)
        assert res.status_code == 409

    def test_submit_with_urls(self, client, seeded_quest, auth_headers):
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "with links",
            "github_url": "https://github.com/user/repo",
            "demo_url": "https://demo.example.com",
        }, headers=auth_headers)
        assert res.status_code == 200


class TestGetSubmission:
    def test_get_submission(self, client, seeded_quest, auth_headers):
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        submit_res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "content here",
        }, headers=auth_headers)
        submission_id = submit_res.json()["submission_id"]

        res = client.get(f"/api/v1/submissions/{submission_id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "SUBMITTED"

    def test_get_submission_not_found(self, client, auth_headers):
        res = client.get(f"/api/v1/submissions/{uuid4()}", headers=auth_headers)
        assert res.status_code == 404
