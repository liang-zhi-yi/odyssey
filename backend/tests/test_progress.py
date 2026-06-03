"""Tests for Progress APIs."""

from app.progress.models import ProgressLog
from uuid import uuid4


class TestGetProgress:
    def test_get_progress_empty(self, client, seeded_user, auth_headers):
        res = client.get("/api/v1/progress", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_get_progress_with_logs(self, client, db, seeded_user, seeded_skills, auth_headers):
        skill = seeded_skills["Prompt Engineering"]
        log = ProgressLog(
            id=uuid4(),
            user_id=seeded_user.id,
            skill_id=skill.id,
            previous_score=30,
            new_score=40,
            score_delta=10,
            reason="Prompt Quest 01 — Assessment",
        )
        db.add(log)
        db.commit()

        res = client.get("/api/v1/progress", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["previous"] == 30
        assert data[0]["current"] == 40
        assert data[0]["delta"] == 10

    def test_get_progress_limit(self, client, db, seeded_user, seeded_skills, auth_headers):
        skill = seeded_skills["Prompt Engineering"]
        for i in range(5):
            db.add(ProgressLog(
                id=uuid4(), user_id=seeded_user.id, skill_id=skill.id,
                previous_score=i * 10, new_score=(i + 1) * 10,
                score_delta=10, reason=f"Quest {i}",
            ))
        db.commit()

        # limit must be >= 5 (ge=5 validation)
        res = client.get("/api/v1/progress?limit=5", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 5


class TestSkillGrowth:
    def test_skill_growth_empty(self, client, seeded_skills, auth_headers):
        skill_id = "00000000-0000-0000-0000-000000000001"
        res = client.get(f"/api/v1/progress/skills/{skill_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        # Returns at least the current UserSkill state (may be empty if no UserSkill)
        assert isinstance(data, list)

    def test_skill_growth_with_data(self, client, db, seeded_user, seeded_skills, seeded_user_skills, auth_headers):
        skill = seeded_skills["Prompt Engineering"]
        db.add(ProgressLog(
            id=uuid4(), user_id=seeded_user.id, skill_id=skill.id,
            previous_score=30, new_score=40, score_delta=10,
            reason="Assessment",
        ))
        db.commit()

        res = client.get(f"/api/v1/progress/skills/{skill.id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
