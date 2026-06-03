"""Tests for Quest APIs."""


class TestGetQuests:
    def test_get_all_quests(self, client, seeded_quest, auth_headers):
        res = client.get("/api/v1/quests", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
        quest = data[0]
        assert quest["title"] == "Write a Translation Prompt"

    def test_get_quest_detail(self, client, seeded_quest, auth_headers):
        res = client.get(f"/api/v1/quests/{seeded_quest.id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["title"] == "Write a Translation Prompt"

    def test_get_quest_not_found(self, client, auth_headers):
        res = client.get("/api/v1/quests/00000000-0000-0000-0000-999999999999", headers=auth_headers)
        assert res.status_code == 404


class TestAcceptQuest:
    def test_accept_quest(self, client, seeded_quest, auth_headers):
        res = client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "ACCEPTED"

    def test_accept_duplicate(self, client, seeded_quest, auth_headers):
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        res = client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        assert res.status_code == 409

    def test_get_user_quests(self, client, seeded_quest, auth_headers):
        client.post(f"/api/v1/quests/{seeded_quest.id}/accept", headers=auth_headers)
        res = client.get("/api/v1/user-quests", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["status"] == "ACCEPTED"
