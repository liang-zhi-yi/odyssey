# CLAUDE.md — Odyssey Project Guidance

> **Primary source of truth for all development.** Read this before writing any code.

---

## Project Identity

Odyssey is **NOT** a learning platform. Not a course platform. Not an exam platform.

Odyssey is an **AI-Powered Capability Civilization Builder**（AI驱动的个人能力文明建造系统）.

### Core Philosophy

```
传统产品:  学习知识 → 完成课程 → 获得证书 → 结束

Odyssey:  成长能力 → 证明能力 → 解锁文明 → 建设文明 → 扩张文明 → 创造文明
```

The ultimate goal: let users **see their own growth** — not as abstract numbers, but as a continuously expanding capability world.

### What Odyssey Should NEVER Become

- ❌ 课程平台 (Course platform)
- ❌ 题库平台 (Quiz bank)
- ❌ 考试平台 (Exam platform)
- ❌ 打卡平台 (Check-in platform)
- ❌ 经验值挂机游戏 (XP grinding game)
- ❌ RPG 升级游戏 (RPG leveling game)
- ❌ 虚假成长系统 (Fake growth system)

---

## Product Evolution Roadmap (5 Phases)

> Source: `docs/world-evolution-roadmap.md` — the definitive long-term vision.
> Every feature decision must be traceable to one of these phases.

### Phase 1 — Capability Tracker（能力记录器）← **CURRENT MVP**

**Purpose:** Validate whether users are willing to record and verify their growth.

**Features:** Skill Tree, Quest, Assessment, Progress, Credential, Passport

**Visual Style:** Professional, Minimal, Clean — GitHub-like, Linear-like

**User Perception:** "This is a capability growth tool."

**Success Metric:** Users complete Quests, accept AI assessments, receive growth feedback.

### Phase 2 — Capability Validator（能力验证系统）

**Purpose:** Establish assessment credibility.

**New Features:** Project Assessment, GitHub Assessment, Code Review Assessment, Capability History, Assessment Explainability

**Visual Upgrade:** Skill Cards, Achievement Badges, Credential Showcase

**User Perception:** "This is a capability verification platform."

**Core Question:** Do users trust Odyssey's assessment results?

**Success Metric:** Users proactively submit projects for assessment.

### Phase 3 — Capability World（能力世界）

**Purpose:** Make growth visual.

**Core Concept:** Each Skill = a Building in the user's world.

```
Prompt Engineering  → Language Academy（语言学院）
RAG                 → Memory Library（记忆图书馆）
Workflow            → Automation Factory（自动化工厂）
LangGraph           → Agent Laboratory（智能体实验室）
```

**Dashboard becomes:** "My World"（我的世界）— an isometric 2.5D interactive map.

**Growth Logic:** Master skill → Building upgrades → World expands.

**Assessment result shown as:** "Language Academy Level Up" (not "Prompt +5").

**User Perception:** "I am building my own AI world."

**Success Metric:** Users actively collect buildings.

### Phase 4 — Capability Civilization（能力文明）

**Purpose:** Enable skill synergy.

**Core Concept:** Combining skills unlocks advanced buildings.

```
Prompt Architect × RAG Engineer   → Knowledge Citadel（知识堡垒）
LangGraph      × Workflow         → Agent City（智能体之城）
```

**New Systems:** Technology Tree, Civilization Ranking, World Events, Capability Milestones

**User Perception:** "I am building a civilization."

**Success Metric:** Users willingly maintain their world long-term.

### Phase 5 — AI Life Operating System（AI时代个人成长操作系统）

**Purpose:** Become the user's lifelong growth companion.

Expands beyond AI skills to: Programming, Product Design, Writing, Research, Business, Management, Language Learning, Fitness, Career Growth.

```
Every Skill     → Building
Every Building  → Civilization
Every Civilization → Personal Identity
```

**User Perception:** "This is my second life."

---

## Design Principles (Immutable)

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Capability First**（能力优先） | Never gamify for its own sake. Every feature must serve real capability growth. |
| 2 | **Assessment Before Reward**（先证明，再奖励） | Users must prove capability before receiving credentials or unlocks. |
| 3 | **Growth Must Be Earned**（成长必须通过挑战获得） | No passive accumulation. Growth comes only from completing real challenges. |
| 4 | **World Reflects Reality**（世界反映真实能力） | Every building/upgrade must correspond to real-world capability change. NOT check-in streaks. |
| 5 | **Visualize Progress**（让成长可见） | Abstract scores are not enough. Growth must have visible, tangible shape. |

---

## MVP Scope (Phase 1 — Current)

### Objective

Validate: **Users are willing to use AI-generated assessments and challenges to verify capability growth.**

Do NOT optimize for: scale, monetization, social features.

Only optimize for: **Quest → Assessment → Capability Growth**.

### Core Loop

```
Goal → Path → Quest → Submission → Assessment → Capability Growth → Credential
```

### Key Entity: UserSkill

UserSkill is the **most important entity** in the system. The system's entire purpose is updating UserSkill. All features should ultimately affect UserSkill.

### MVP Feature List (Exhaustive)

1. Authentication
2. Skill Tree
3. Quest Center
4. Quest Submission
5. AI Assessment
6. Progress Tracking
7. Credential System
8. Capability Passport

**Do NOT implement anything outside this list.** Features from Phase 2+ belong to future iterations.

### Explicitly Out of Scope for MVP

- Community / Guild / Marketplace
- NPC / Game World
- Memory System / Multi-Agent System
- Chat Assistant
- Quest Generator / Recommendation Engine
- Social features of any kind

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | FastAPI, Python 3.12, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Auth | JWT (python-jose + bcrypt) |
| LLM | OpenAI API (gpt-4o) |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Critical Business Rules

### Assessment Engine (Most Important Module)

```
Submission → Build Rubric → LLM Evaluation → Generate Scores → Update UserSkill → Generate Progress Log → Check Credentials
```

**LLM Scoring Safeguards:**
1. `temperature = 0` — deterministic output
2. Structured JSON output enforcement
3. Full rubric embedded in every evaluation prompt
4. Per-dimension justification required — schema must reject missing justifications
5. Consistency retry — if any dimension score delta > 20 across attempts, retry up to 2× (max 3 total), take median

### UserSkill Update Formula

Per-dimension independent update (exponential moving average):

```
new_knowledge   = old_knowledge   × 0.8 + assessment_knowledge   × 0.2
new_reasoning   = old_reasoning   × 0.8 + assessment_reasoning   × 0.2
new_application = old_application × 0.8 + assessment_application × 0.2
new_creation    = old_creation    × 0.8 + assessment_creation    × 0.2

overall = knowledge × 0.2 + reasoning × 0.25 + application × 0.35 + creation × 0.2
```

### Rank Calculation (Deterministic, NOT LLM-assessed)

| Overall Score | Rank |
|---------------|------|
| 0–20 | NOVICE |
| 21–40 | BEGINNER |
| 41–60 | PRACTITIONER |
| 61–80 | ENGINEER |
| 81–100 | ARCHITECT |

### Credential Rules

All four dimensions must each ≥ 60 to earn a credential. Compound credentials (e.g., Agent Engineer) require ALL constituent skills to meet this threshold.

---

## UI Philosophy

```
GitHub + Duolingo Progress + Linear

NOT World of Warcraft
```

- Simple, minimal, professional
- No gamification flourishes
- No fantasy/RPG aesthetics
- oklch() color space, Inter font
- Semantic color tokens (--primary, --secondary, --muted)
- Dark mode from day one

---

## Coding Principles

- Prefer simplicity. Avoid premature optimization. Avoid over-engineering.
- Clean architecture: keep business logic in services, keep routes thin.
- Typed interfaces everywhere (TypeScript strict, Python type hints).
- Follow existing patterns — match the surrounding code's density, naming, and idiom.

---

## When MVP is Complete

Stop building features when a user can:

1. Register → 2. Choose a path → 3. Accept a quest → 4. Submit a solution → 5. Receive AI assessment → 6. Gain capability growth → 7. Unlock a credential → 8. View capability passport

**Once these 8 steps work end-to-end: STOP. Ship the product.**

---

## Future Development Rule

After MVP ships, each subsequent feature MUST be evaluated against:

1. **Which phase does it belong to?** (Phase 2 → 3 → 4 → 5 — sequential, no skipping)
2. **Does it violate any design principle?** (especially #1 Capability First, #4 World Reflects Reality)
3. **Is it on the "NEVER become" list?** (course, quiz, exam, check-in, XP grind, RPG, fake growth)

When in doubt, re-read `docs/world-evolution-roadmap.md`.

The ultimate vision: **when users open Odyssey, they see a civilization built by their own capabilities — not a list of scores.**
