# Odyssey World Evolution Roadmap

> **The definitive long-term vision for Odyssey.**
> Every feature decision must be traceable to one of the phases below.

---

## Core Identity

Odyssey is an **AI-Powered Capability Civilization Builder**（AI驱动的个人能力文明建造系统）.

```
传统产品:  学习知识 → 完成课程 → 获得证书 → 结束

Odyssey:  成长能力 → 证明能力 → 解锁文明 → 建设文明 → 扩张文明 → 创造文明
```

The ultimate goal: let users **see their own growth** — not as abstract numbers, but as a continuously expanding capability world.

---

## Immutable Design Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Capability First**（能力优先） | Never gamify for its own sake. Every feature must serve real capability growth. |
| 2 | **Assessment Before Reward**（先证明，再奖励） | Users must prove capability before receiving credentials or unlocks. |
| 3 | **Growth Must Be Earned**（成长必须通过挑战获得） | No passive accumulation. Growth comes only from completing real challenges. |
| 4 | **World Reflects Reality**（世界反映真实能力） | Every building/upgrade must correspond to real-world capability change. NOT check-in streaks. |
| 5 | **Visualize Progress**（让成长可见） | Abstract scores are not enough. Growth must have visible, tangible shape. |

### What Odyssey Should NEVER Become

- ❌ Course platform（课程平台）
- ❌ Quiz bank（题库平台）
- ❌ Exam platform（考试平台）
- ❌ Check-in platform（打卡平台）
- ❌ XP grinding game（经验值挂机游戏）
- ❌ RPG leveling game（RPG升级游戏）
- ❌ Fake growth system（虚假成长系统）

---

## World Architecture

The world is generated from user capabilities. The world is never manually edited.

```
User Growth → Capability → Building → Region → Civilization
```

### World Hierarchy

| Level | Entity | Represents |
|-------|--------|------------|
| 1 | **Civilization** | The user's entire growth journey |
| 2 | **Region** | A capability domain (Language, Knowledge, Automation, Agent, Engineering, Business, Creative) |
| 3 | **Building** | A specific skill (Prompt Engineering → Language Academy, RAG → Memory Library, etc.) |
| 4 | **Building Level** | Mastery depth (Foundation → Workshop → Academy → Institute → Citadel) |

### Core Principle

> **Reality First. World Second.**

```
✅ Correct:
Pass Capability Assessment → Upgrade Building
Complete Real Project → Expand Civilization

❌ Wrong:
Complete Daily Login → Upgrade Building
Watch Video → Gain Civilization Level
```

The virtual world must always reflect real-world capability growth.

---

## Phase 1 — Capability Tracker（能力记录器）✅ COMPLETE

### Purpose
Validate whether users are willing to record and verify their growth.

### Features Implemented
1. Authentication (JWT register/login/profile/password)
2. Skill Tree (4 skills, categorized visualization)
3. Quest Center (8 quests, 4 difficulties, filter/search)
4. Quest Submission (content + GitHub + demo URLs)
5. AI Assessment (4-dimension LLM evaluation, consistency retry, rubric-based)
6. Progress Tracking (growth curves, path aggregation, timeline)
7. Credential System (per-skill + compound credentials)
8. Capability Passport (radar, skills, credentials, projects, share)
9. Profile Management (nickname, bio, avatar, GitHub username)
10. Settings (i18n zh/en, per-user LLM config)
11. Quest Management (accept, abandon, retry, submission history)
12. Paths (select, progress tracking, node progression)
13. Projects (create, list, detail)
14. Bilingual Content (zh/en for skills, quests, paths)

### Core Loop
```
Goal → Path → Quest → Submission → Assessment → Capability Growth → Credential → Passport
```

### Visual Style
Professional, Minimal, Clean — GitHub-like, Linear-like. Dark mode. oklch() colors.

### Rendering Strategy
**Data Layer Only.** Scores, charts, progress bars, radar charts.

### Key Entity: UserSkill
4-dimension scoring (Knowledge, Reasoning, Application, Creation). Exponential moving average update. Deterministic rank calculation.

### Status: COMPLETE ✅
All 8 MVP steps work end-to-end: Register → Choose Path → Accept Quest → Submit → Assessment → Growth → Credential → Passport.

---

## Phase 2 — Capability Validator（能力验证系统）

### Purpose
Establish assessment credibility. Users must trust the assessment results.

### New Features

#### GitHub Integration
- GitHub OAuth login
- Repository analysis (stars, commits, README quality)
- Commit history assessment
- Code quality metrics

#### Project Assessment Enhancement
- Multi-file code review
- Architecture diagram analysis
- Documentation quality scoring
- Test coverage assessment

#### Assessment Explainability
- Detailed per-dimension justification display
- Score breakdown with evidence
- Comparison to benchmark
- Improvement roadmap generation

#### Capability History
- Full timeline of all growth events
- Before/after comparison for each assessment
- Skill evolution visualization
- Export capability report (PDF)

### Visual Upgrade
- **Skill Cards v2** — Rich visual cards with trend sparklines
- **Achievement Badges** — Visual badge system for milestones
- **Credential Showcase** — Public-facing credential page
- **World Dashboard (Cards)** — Card-based buildings, region panels

### Backend Technical Work
- GitHub OAuth flow (auth/router.py + github service)
- Repository analysis pipeline (new app/github/ module)
- Assessment explainability engine (enhance prompt_builder)
- PDF export endpoint (new app/export/ module)
- Enhanced progress querying with date ranges

### Frontend Technical Work
- GitHub connect button in settings
- Repository selector for project creation
- Enhanced assessment result page with per-dimension evidence
- Capability history timeline page
- Public credential showcase page
- Badge component library
- Skill card v2 with sparklines

### User Perception
"This is a capability verification platform."

### Core Question
Do users trust Odyssey's assessment results?

### Success Metric
Users proactively submit projects for assessment.

---

## Phase 3 — Capability World（能力世界）

### Purpose
Make growth visible. Abstract scores become tangible buildings.

### Core Concept
Each Skill = a Building in the user's world.

```
Prompt Engineering  → Language Academy（语言学院）
RAG                 → Memory Library（记忆图书馆）
Workflow            → Automation Factory（自动化工厂）
LangGraph           → Agent Laboratory（智能体实验室）
Docker              → Deployment Harbor（部署港）
```

### Dashboard Becomes
**"My World"（我的世界）** — an isometric 2.5D interactive map.

### Growth Logic
Master skill → Building upgrades → World expands.

### Assessment Result Shown As
"Language Academy Level Up" (not "Prompt +5").

### Building Evolution
| Level | Name | Visual | Score Required |
|-------|------|--------|-----------------|
| 1 | Foundation（基地） | Basic structure | 0-20 |
| 2 | Workshop（工坊） | Small facility | 21-40 |
| 3 | Academy（学院） | Medium institution | 41-60 |
| 4 | Institute（研究院） | Large complex | 61-80 |
| 5 | Citadel（堡垒） | Massive landmark | 81-100 |

### Region System
Regions unlock when first skill in domain reaches PRACTITIONER (≥40):

| Domain | Region | Unlock Condition |
|--------|--------|------------------|
| Prompt Engineering | Language Region（语言区） | Prompt skill ≥ 40 |
| RAG | Knowledge Region（知识区） | RAG skill ≥ 40 |
| Workflow | Automation Region（自动化区） | Workflow skill ≥ 40 |
| LangGraph | Agent Region（智能体区） | Agent skill ≥ 40 |
| Docker | Engineering Region（工程区） | Ops skill ≥ 40 |

### Backend Technical Work
- World/Region/Building data models + migration
- Building template system (BuildingTemplate model)
- Region unlock service (checks UserSkill thresholds)
- Building upgrade service (reacts to assessment events)
- World state API (aggregates entire world for a user)
- Region/Building detail endpoints

### Frontend Technical Work
- Isometric 2.5D rendering engine (Phaser.js or custom Canvas/SVG)
- Interactive world map with clickable buildings
- Building upgrade animations (particle effects, construction)
- Region expansion animations
- "My World" page replacing dashboard
- Building detail modal with skill stats

### User Perception
"I am building my own AI world."

### Success Metric
Users actively collect buildings.

---

## Phase 4 — Capability Civilization（能力文明）

### Purpose
Enable skill synergy. Combining skills unlocks advanced civilization structures.

### Core Concept
Combining skills unlocks advanced buildings.

```
Prompt Architect × RAG Engineer   → Knowledge Citadel（知识堡垒）
LangGraph      × Workflow         → Agent City（智能体之城）
Prompt × RAG   × Workflow         → AI Research Center（AI研究中心）
```

### New Systems

#### Technology Tree
- Prerequisite skill graph (DAG)
- Compound credential requirements
- Branching specialization paths
- Visual tech tree with unlock animations

#### Civilization Ranking
- Global leaderboard by civilization level
- Regional rankings by domain
- Achievement-based titles
- Seasonal rankings

#### World Events
- Time-limited assessment challenges
- Special quest opportunities
- Civilization milestones
- Community goals (non-social: personal only)

#### Capability Milestones
- Long-term progression markers
- Civilization age tracking
- Historical world snapshots
- Growth anniversary rewards

### Skill Synergy Rules
| Combination | Requirement | Result |
|-------------|-------------|--------|
| Prompt L3 + RAG L3 | Both ≥ 60 | Knowledge Institute |
| Workflow L3 + LangGraph L3 | Both ≥ 60 | Agent Factory |
| Prompt L4 + RAG L4 + Workflow L4 | All ≥ 80 | AI Research Center |

### Backend Technical Work
- Technology tree graph engine (DAG with topological sort)
- Synergy rules engine (evaluates skill combinations)
- Ranking system (global + per-domain leaderboards)
- World events system (scheduled challenges with templates)
- Civilization snapshot service (periodic state capture)
- Compound building unlock service

### Frontend Technical Work
- Interactive technology tree visualization (D3.js or Cytoscape.js)
- Synergy effect discovery UI
- Leaderboard page with filters
- World events dashboard
- Civilization timeline with snapshots
- Milestone celebration animations

### User Perception
"I am building a civilization."

### Success Metric
Users willingly maintain their world long-term.

---

## Phase 5 — AI Life Operating System（AI时代个人成长操作系统）

### Purpose
Become the user's lifelong growth companion.

### Expansion Beyond AI Skills
Programming, Product Design, Writing, Research, Business, Management, Language Learning, Fitness, Career Growth.

### Core Vision
```
Every Skill     → Building
Every Building  → Civilization
Every Civilization → Personal Identity
```

### Key Technical Work
- Extensible skill taxonomy (user-defined skills)
- Multi-domain assessment engines (pluggable rubric system)
- Life-long growth timeline (decade-scale visualization)
- Identity/portfolio system (public profile, export)
- Integration with external platforms (GitHub, LinkedIn, etc.)

### User Perception
"This is my second life."

---

## World Data Model (Phase 3+)

```
World
  id: UUID
  user_id: UUID (unique, 1:1)
  civilization_name: String
  civilization_level: Int
  total_buildings: Int
  total_regions: Int
  created_at: DateTime
  updated_at: DateTime

Region
  id: UUID
  world_id: UUID → World
  name: String
  type: RegionType (LANGUAGE, KNOWLEDGE, AUTOMATION, AGENT, ENGINEERING)
  status: RegionStatus (LOCKED, UNLOCKED, DEVELOPING, MATURE)
  unlock_condition: JSON
  created_at: DateTime

Building
  id: UUID
  region_id: UUID → Region
  skill_id: UUID → Skill
  template_id: UUID → BuildingTemplate
  name: String
  level: Int (1-5)
  progress: Float (0-100)
  state: BuildingState (CONSTRUCTING, STABLE, UPGRADING)
  created_at: DateTime
  upgraded_at: DateTime

BuildingTemplate
  id: UUID
  skill_type: String
  building_name: String
  building_name_en: String
  region_type: RegionType
  max_level: Int
  visual_key: String
  level_names: JSON (per-level name overrides)
```

---

## Building Upgrade Rules (Immutable)

Building upgrades **cannot** be purchased.
Building upgrades **cannot** be unlocked through login rewards.

**Only valid sources:**
- Assessment Success → Building progress +10
- Project Completion → Building progress +25
- Capability Validation → Building level up
- Milestone Achievement → Building level up + decoration

---

## Development Governance

After Phase 1 ships, each subsequent feature MUST be evaluated against:

1. **Which phase does it belong to?** (Phase 2 → 3 → 4 → 5 — sequential, no skipping)
2. **Does it violate any design principle?** (especially #1 Capability First, #4 World Reflects Reality)
3. **Is it on the "NEVER become" list?** (course, quiz, exam, check-in, XP grind, RPG, fake growth)

---

## Final Vision

When a user opens Odyssey, they should not see:

> Prompt 80, RAG 70, Workflow 60

They should see:

> A civilization built from their real capabilities.
> Every region represents knowledge.
> Every building represents mastery.
> Every expansion represents growth.

The civilization is not a game. The civilization is a mirror of the user.

---

*Version: 1.0 | Status: Living Document | Owner: Founder*
