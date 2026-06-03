# Odyssey Data Model V1

## Design Philosophy

Odyssey 的核心资产不是课程。

不是任务。

不是学习记录。

而是：

User Capability Graph

（用户能力图谱）

系统本质是在持续维护：

用户当前拥有哪些能力。

能力处于什么等级。

能力如何成长。

因此：

UserSkill 是整个系统最核心的数据实体。

---

# Core Entity Relationship

User

↓

Path

↓

Skill

↓

Quest

↓

Assessment

↓

Progress

↓

Credential

---

数据库核心关系：

User

↓

UserPath

↓

UserSkill

↓

QuestSubmission

↓

Assessment

↓

ProgressLog

---

# Entity: User

用户信息

## Fields

id

UUID

主键

---

email

String

邮箱

---

username

String

用户名

---

avatar_url

String

头像

---

bio

Text

个人简介

---

created_at

Datetime

创建时间

---

updated_at

Datetime

更新时间

---

# Entity: Path

成长路径

例如：

Agent Engineer

AI Product Manager

Frontend Engineer

## Fields

id

UUID

---

name

String

路径名称

---

description

Text

路径描述

---

difficulty

Integer

难度等级

---

is_official

Boolean

是否官方路径

---

created_at

Datetime

---

# Entity: Skill

能力节点

## Fields

id

UUID

---

name

String

例如：

Prompt

RAG

Workflow

LangGraph

---

description

Text

---

category

String

AI

Engineering

Product

---

max_score

Integer

默认100

---

created_at

Datetime

---

# Entity: PathSkill

路径与技能映射

## Fields

id

UUID

---

path_id

FK

---

skill_id

FK

---

stage_order

Integer

学习顺序

---

required_score

Integer

解锁下一阶段所需分数

---

Example

Agent Engineer

↓

Prompt

order = 1

---

Agent Engineer

↓

RAG

order = 2

---

# Entity: UserPath

用户选择的成长路径

MVP constraint: single path only.
One ACTIVE UserPath per user at any time.
Enforced via unique constraint: UNIQUE(user_id) WHERE status = 'ACTIVE'.

## Fields

id

UUID

---

user_id

FK

---

path_id

FK

---

status

Enum

ACTIVE

PAUSED

COMPLETED

---

started_at

Datetime

---

completed_at

Datetime

---

# Entity: UserSkill

⭐ 最核心表

记录用户能力状态

## Fields

id

UUID

---

user_id

FK

---

skill_id

FK

---

knowledge_score

Integer

0-100

---

reasoning_score

Integer

0-100

---

application_score

Integer

0-100

---

creation_score

Integer

0-100

---

overall_score

Integer

0-100

---

rank

Enum

NOVICE

BEGINNER

PRACTITIONER

ENGINEER

ARCHITECT

Rank is auto-calculated whenever overall_score updates.
Rules:
  0–20:   NOVICE
  21–40:  BEGINNER
  41–60:  PRACTITIONER
  61–80:  ENGINEER
  81–100: ARCHITECT

---

last_assessed_at

Datetime

---

Example

Prompt

Knowledge = 80

Reasoning = 75

Application = 70

Creation = 50

Overall = 69

Rank = Engineer

---

# Entity: Quest

任务库

## Fields

id

UUID

---

title

String

---

description

Text

---

skill_id

FK

---

difficulty

Enum

LEVEL_1

LEVEL_2

LEVEL_3

LEVEL_4

---

quest_type

Enum

KNOWLEDGE

APPLICATION

PROJECT

MASTERY

---

expected_deliverable

Enum

PROMPT

ARCHITECTURE

WORKFLOW

CODE

REPORT

---

created_at

Datetime

---

# Entity: QuestSubmission

用户提交记录

## Fields

id

UUID

---

user_id

FK

---

quest_id

FK

---

submission_content

Text

用户回答

---

submission_url

String

GitHub

Demo

文件链接

---

status

Enum

ACCEPTED

IN_PROGRESS

SUBMITTED

ASSESSING

PASSED

FAILED

Note: QuestSubmission record is created when user accepts a quest.
submission_content is null until the user actually submits.
Quest itself has no status field — it is a template. All per-user tracking lives on QuestSubmission.
State machine: ACCEPTED → IN_PROGRESS → SUBMITTED → ASSESSING → PASSED | FAILED
ASSESSED is removed (redundant with PASSED/FAILED).

---

submitted_at

Datetime

---

# Entity: Assessment

AI评估结果

## Fields

id

UUID

---

submission_id

FK

---

knowledge_score

Integer

---

reasoning_score

Integer

---

application_score

Integer

---

creation_score

Integer

---

overall_score

Integer

---

feedback

Text

AI评语

---

improvement_suggestions

Text

改进建议

---

assessed_at

Datetime

---

# Entity: ProgressLog

成长记录

记录每次能力变化

## Fields

id

UUID

---

user_id

FK

---

skill_id

FK

---

previous_score

Integer

---

new_score

Integer

---

score_delta

Integer

---

reason

String

例如：

Prompt Quest 03

通过

---

created_at

Datetime

---

Example

Prompt

60

↓

67

+7

Reason

Prompt Quest 05

---

# Entity: Credential

认证体系

## Fields

id

UUID

---

name

String

---

skill_id

FK

---

required_score

Integer

---

description

Text

---

Example

Prompt Practitioner

Prompt Engineer

RAG Practitioner

Agent Engineer

---

# Entity: UserCredential

用户获得的认证

## Fields

id

UUID

---

user_id

FK

---

credential_id

FK

---

issued_at

Datetime

---

# Entity: Project

项目作品

用户能力证明

Project is user-created manually.
It can optionally link to a passed QuestSubmission via quest_submission_id FK.
This allows proven work to serve as capability evidence in Passport.

## Fields

id

UUID

---

user_id

FK

---

title

String

---

description

Text

---

github_url

String

---

demo_url

String

---

related_skill_id

FK

---

quest_submission_id

FK (nullable)

References QuestSubmission.id. Must reference a submission with status PASSED.
Allows linking a project to proven quest work as evidence.

---

created_at

Datetime

---

# Entity: Capability Passport

能力护照

说明：

此表不单独存储。

通过：

User

*

UserSkill

*

Credential

*

Project

动态生成。

---

Passport Example

Prompt Engineer

Score 74

Projects 3

Credentials 2

---

RAG Practitioner

Score 58

Projects 1

Credentials 1

---

Workflow Beginner

Score 33

---

# MVP Required Tables

User

Path

Skill

PathSkill

UserPath

UserSkill

Quest

QuestSubmission

Assessment

ProgressLog

Credential

UserCredential

Project

共13张表。

足以支撑 Odyssey MVP。

---

# Future Tables (V2)

Memory

NPC

World

Achievement

Guild

Marketplace

Community Quest

Mentor

暂不开发。
