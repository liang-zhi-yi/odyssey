# Odyssey API Design V1

Version: 1.0

Status: MVP

---

# Overview

Backend Framework:

FastAPI

Base URL:

/api/v1

Response Format:

JSON

---

# Authentication

## Register

POST

/auth/register

### Request

{
"email": "[user@example.com](mailto:user@example.com)",
"username": "alice",
"password": "password123"
}

### Response

{
"user_id": "uuid",
"token": "jwt_token"
}

---

## Login

POST

/auth/login

### Request

{
"email": "[user@example.com](mailto:user@example.com)",
"password": "password123"
}

### Response

{
"token": "jwt_token"
}

---

## Current User

GET

/auth/me

### Response

{
"id": "uuid",
"username": "alice",
"email": "[user@example.com](mailto:user@example.com)"
}

---

# Path APIs

## Get Available Paths

GET

/paths

### Response

[
{
"id": "path_1",
"name": "Agent Engineer",
"description": "...",
"difficulty": 3
}
]

---

## Select Path

POST

/user-paths

### Request

{
"path_id": "path_1"
}

### Response

{
"status": "ACTIVE"
}

---

## Get User Path

GET

/user-paths/current

### Response

{
"path_id": "path_1",
"name": "Agent Engineer",
"progress": 32
}

---

# Skill APIs

## Get Skill Tree

GET

/skills

### Response

[
{
"id": "skill_prompt",
"name": "Prompt Engineering"
}
]

---

## Get User Skills

GET

/user-skills

### Response

[
{
"skill_id": "prompt",
"knowledge": 70,
"reasoning": 65,
"application": 60,
"creation": 45,
"overall": 60,
"rank": "Practitioner"
}
]

---

## Get Skill Detail

GET

/user-skills/{skill_id}

### Response

{
"skill": "Prompt Engineering",
"knowledge": 70,
"reasoning": 65,
"application": 60,
"creation": 45,
"overall": 60,
"rank": "Practitioner"
}

---

# Quest APIs

## Get Quest List

GET

/quests

### Query

skill_id

difficulty

status

### Response

[
{
"id": "quest_1",
"title": "Prompt Classification",
"difficulty": "LEVEL_2",
"type": "APPLICATION"
}
]

---

## Get Quest Detail

GET

/quests/{quest_id}

### Response

{
"id": "quest_1",
"title": "...",
"description": "...",
"deliverable": "PROMPT"
}

---

## Accept Quest

POST

/quests/{quest_id}/accept

### Response

{
"status": "ACCEPTED"
}

---

## Get User Quests

GET

/user-quests

### Response

[
{
"quest_id": "quest_1",
"status": "IN_PROGRESS"
}
]

---

# Submission APIs

## Submit Quest

POST

/submissions

### Request

{
"quest_id": "quest_1",
"content": "my answer",
"github_url": "https://github.com/...",
"demo_url": "https://..."
}

### Response

{
"submission_id": "sub_1",
"status": "SUBMITTED"
}

---

## Get Submission

GET

/submissions/{submission_id}

### Response

{
"submission_id": "sub_1",
"status": "ASSESSED"
}

---

# Assessment APIs

## Trigger Assessment (Async)

POST

/assessments/run

This endpoint is ASYNCHRONOUS.
It creates an Assessment record with status PROCESSING and returns immediately.
The frontend must poll GET /assessments/{assessment_id} every 3 seconds
until status changes to COMPLETED or FAILED.

### Request

{
"submission_id": "sub_1"
}

### Response

{
"assessment_id": "assessment_1",
"status": "PROCESSING"
}

---

## Get Assessment Status / Result

GET

/assessments/{assessment_id}

### Response (while processing)

{
"assessment_id": "assessment_1",
"status": "PROCESSING"
}

### Response (completed)

{
"assessment_id": "assessment_1",
"status": "COMPLETED",
"knowledge": 75,
"reasoning": 70,
"application": 80,
"creation": 55,
"overall": 72,
"feedback": "...",
"suggestions": "..."
}

### Response (failed)

{
"assessment_id": "assessment_1",
"status": "FAILED",
"error": "LLM_TIMEOUT",
"retry_url": "/assessments/run"
}

### Timeout rule

If the LLM does not respond within 60 seconds, the assessment transitions
to status FAILED with error code LLM_TIMEOUT. The user may retry by calling
POST /assessments/run again with the same submission_id.

---

# Progress APIs

## Get Progress Logs

GET

/progress

### Response

[
{
"skill": "Prompt",
"previous": 60,
"current": 68,
"delta": 8
}
]

---

## Get Skill Growth

GET

/progress/skills/{skill_id}

### Response

[
{
"date": "2025-01-01",
"score": 40
},
{
"date": "2025-02-01",
"score": 60
}
]

---

# Credential APIs

## Get Credentials

GET

/credentials

### Response

[
{
"name": "Prompt Practitioner"
}
]

---

## Get User Credentials

GET

/user-credentials

### Response

[
{
"name": "Prompt Practitioner",
"issued_at": "..."
}
]

---

# Passport APIs

## Get Capability Passport

GET

/passport

### Response

{
"user": "alice",

"skills": [
{
"name": "Prompt",
"rank": "Practitioner",
"score": 68
}
],

"credentials": [
"Prompt Practitioner"
],

"projects": [
{
"title": "Prompt Feedback Classifier"
}
]
}

---

# Project APIs

## Create Project

POST

/projects

### Request

{
"title": "My Agent",
"description": "...",
"github_url": "...",
"demo_url": "..."
}

---

## Get Projects

GET

/projects

### Response

[
{
"title": "AI Research Assistant"
}
]

---

# Health Check

GET

/health

### Response

{
"status": "ok"
}

---

# Error Format

{
"error": {
"code": "QUEST_NOT_FOUND",
"message": "Quest not found"
}
}

---

# MVP Endpoint Summary

Auth

4 APIs

---

Path

3 APIs

---

Skill

3 APIs

---

Quest

4 APIs

---

Submission

2 APIs

---

Assessment

2 APIs

---

Progress

2 APIs

---

Credential

2 APIs

---

Passport

1 API

---

Project

2 APIs

---

Total

25 APIs

足够支撑 MVP。
