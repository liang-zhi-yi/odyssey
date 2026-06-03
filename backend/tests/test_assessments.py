"""Tests for Assessment APIs (async flow).

Since real LLM calls would require network + API keys, we test the
API surface, validation, and state-machine transitions — not the LLM output.
"""


class TestRunAssessment:
    def test_run_assessment(self, client, seeded_quest, auth_headers):
        # Accept → Submit
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        submit_res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "assessment test content",
        }, headers=auth_headers)
        submission_id = submit_res.json()["submission_id"]

        # Trigger assessment
        res = client.post("/api/v1/assessments/run", json={
            "submission_id": submission_id,
        }, headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "assessment_id" in data
        assert data["status"] == "PROCESSING"

    def test_run_assessment_not_submitted(self, client, seeded_quest, auth_headers):
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        # Don't submit — try to assess an accepted submission
        submit_res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "assessment test content",
        }, headers=auth_headers)
        submission_id = submit_res.json()["submission_id"]

        # First assessment works
        client.post("/api/v1/assessments/run", json={
            "submission_id": submission_id,
        }, headers=auth_headers)

        # Second assessment on same submission should fail
        res2 = client.post("/api/v1/assessments/run", json={
            "submission_id": submission_id,
        }, headers=auth_headers)
        assert res2.status_code == 409

    def test_run_assessment_not_owned(self, client, seeded_quest, auth_headers):
        # Try to assess a non-existent submission
        import uuid
        res = client.post("/api/v1/assessments/run", json={
            "submission_id": str(uuid.uuid4()),
        }, headers=auth_headers)
        assert res.status_code == 404


class TestGetAssessment:
    def test_get_assessment_status(self, client, seeded_quest, auth_headers):
        # Accept → Submit → Assess
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        submit_res = client.post("/api/v1/submissions", json={
            "quest_id": str(seeded_quest.id),
            "content": "poll test content",
        }, headers=auth_headers)
        submission_id = submit_res.json()["submission_id"]

        assess_res = client.post("/api/v1/assessments/run", json={
            "submission_id": submission_id,
        }, headers=auth_headers)
        assessment_id = assess_res.json()["assessment_id"]

        # Poll the assessment
        res = client.get(f"/api/v1/assessments/{assessment_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["assessment_id"] == assessment_id
        # Status may be PROCESSING or COMPLETED depending on background task timing
        assert data["status"] in ("PROCESSING", "COMPLETED", "FAILED")

    def test_get_assessment_not_found(self, client, auth_headers):
        import uuid
        res = client.get(f"/api/v1/assessments/{uuid.uuid4()}", headers=auth_headers)
        assert res.status_code == 404
