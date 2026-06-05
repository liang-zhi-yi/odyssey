# Odyssey — Product Vision

Version: 2.0
Status: Living Document
Owner: Founder

---

## 1. What Odyssey Is

Odyssey is an **AI-Powered Capability Civilization Builder**（AI驱动的个人能力文明建造系统）.

It is NOT a learning platform, course platform, exam platform, or quiz bank.

Odyssey maps abstract, real-world capability growth onto a tangible, evolving personal civilization. Every skill mastered becomes a building. Every building forms a civilization. Every civilization reflects the user's true identity.

### Core Philosophy

```
Traditional:  Learn → Complete Course → Get Certificate → End

Odyssey:      Grow Capability → Prove Capability → Unlock Civilization
                  → Build Civilization → Expand Civilization → Create Civilization
```

The ultimate goal: let users **see their own growth** — not as abstract scores, but as a continuously expanding world.

---

## 2. The User Problem

Current learning products track:

- Time spent studying
- Check-in streaks
- Course completion rates

But they cannot answer:

- **Have I really learned this?** (Not "did I watch the video?")
- **What level am I really at?** (Not "how many points do I have?")
- **What should I learn next?** (Not "what's the next course in the catalog?")
- **How do I prove my capability?** (Not "here's a PDF certificate anyone can fake")

Odyssey answers these questions through **real assessment of real work**.

---

## 3. Core Value Proposition

| Pillar | Meaning |
|--------|---------|
| **Capability Verification**（能力验证） | Prove what you can do, not what you've watched |
| **Capability Growth**（能力成长） | Real growth through real challenges, not passive accumulation |
| **Capability Credentialing**（能力认证） | Credentials backed by assessment evidence, not course completion |
| **Capability Accumulation**（能力沉淀） | Every assessment builds your permanent capability history |

### Core Loop

```
Goal → Path → Quest → Submission → Assessment → Capability Growth → Credential
                                                                        ↓
                                                                  Higher Quests
```

---

## 4. Form Factor Evolution

**This is the key architectural insight of Odyssey.**

Odyssey's delivery model evolves alongside its feature set. It is not a static web app — it grows closer to the user over time, from a URL they visit to an agent that lives on their machine.

### Phase 1–2: Web Application（Web 应用）

```
┌──────────────────────────────────────────┐
│              BROWSER                      │
│  ┌────────────────────────────────────┐   │
│  │        Next.js Frontend            │   │
│  │   (Vercel / Static Hosting)        │   │
│  └──────────────┬─────────────────────┘   │
│                 │ HTTPS                    │
│  ┌──────────────▼─────────────────────┐   │
│  │        FastAPI Backend              │   │
│  │   (Railway / Cloud Server)          │   │
│  │   ┌──────────────────────────┐     │   │
│  │   │   PostgreSQL + LLM API   │     │   │
│  │   └──────────────────────────┘     │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Why web first:**
- Zero-friction onboarding — no install required
- Fast iteration — deploy fixes instantly, no client update needed
- Broad reach — any device with a browser
- Validate the core loop before investing in local infrastructure
- Lower barrier to first assessment — critical for MVP validation

**User's relationship:** "I visit Odyssey to track my growth."

### Phase 3–4: Hybrid（混合架构）

```
┌──────────────────────────────────────────────┐
│            WEB APP (Primary)                  │
│  ┌────────────────────────────────────────┐   │
│  │   2.5D Isometric World Renderer        │   │
│  │   Civilization Map + Tech Tree         │   │
│  └────────────────────────────────────────┘   │
│                   │                            │
│  ┌────────────────────────────────────────┐   │
│  │   OPTIONAL: Local Desktop Shell        │   │
│  │   (Electron / Tauri)                   │   │
│  │   - Local file system access           │   │
│  │   - Offline capability cache           │   │
│  │   - System notification integration    │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Why hybrid:**
- Rich 2.5D rendering demands more client-side GPU power
- Users begin to expect persistent presence — not just a browser tab
- Optional desktop shell begins the transition toward full local ownership
- Data still synced to cloud, but local-first experience starts to emerge
- Desktop shell enables: local project file access, offline mode, system-level notifications

**User's relationship:** "I'm building my world — it's always there."

### Phase 5: Personal AI Growth Agent（个人 AI 成长智能体）

```
┌─────────────────────────────────────────────────────────┐
│                 USER'S LOCAL MACHINE                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           ODYSSEY AGENT (Local)                   │   │
│  │                                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │ Growth   │  │ Skill    │  │ Assessment   │   │   │
│  │  │ Tracker  │  │ Mapper   │  │ Engine       │   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │ Project  │  │ Learning │  │ Civilization │   │   │
│  │  │ Analyzer │  │ Planner  │  │ World Engine  │   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘   │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │         AI Model Layer (Dual-Mode)          │   │   │
│  │  │                                            │   │   │
│  │  │  ┌──────────────┐  ┌──────────────────┐   │   │   │
│  │  │  │ LOCAL MODE   │  │  CLOUD MODE       │   │   │   │
│  │  │  │              │  │                   │   │   │   │
│  │  │  │ Ollama       │  │ OpenAI API        │   │   │   │
│  │  │  │ llama.cpp    │  │ Anthropic API     │   │   │   │
│  │  │  │ TextGen WebUI│  │ Azure OpenAI      │   │   │   │
│  │  │  │ LM Studio    │  │ Any OpenAI-compat │   │   │   │
│  │  │  │              │  │ endpoint          │   │   │   │
│  │  │  │ Privacy: 100%│  │ User configures:  │   │   │   │
│  │  │  │ Cost: $0     │  │ URL + API Key     │   │   │   │
│  │  │  └──────────────┘  └──────────────────┘   │   │   │
│  │  │                                            │   │   │
│  │  │  Local Vector DB (LanceDB / ChromaDB)      │   │   │
│  │  │  Local Relational DB (SQLite)              │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │     OPTIONAL: Cloud Sync Layer              │   │   │
│  │  │     (E2E encrypted backup + multi-device)   │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              DAILY INTEGRATIONS                   │   │
│  │  GitHub · VS Code · Terminal · Obsidian          │   │
│  │  Calendar · Health Apps · Writing Tools          │   │
│  │  Project Tools · Design Tools · Browser          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Why local agent is the ultimate form:**

| Reason | Impact |
|--------|--------|
| **Privacy** | Capability data reveals strengths, weaknesses, knowledge gaps — more sensitive than browsing history. Must belong to the user. |
| **Data ownership** | If Odyssey's servers go down, your growth history dies. Local = forever yours. |
| **Context depth** | Cloud only sees what you upload. A local agent observes your real work across tools, projects, and time. |
| **Always-on presence** | Not a tab you open — a companion that grows alongside you every day. |
| **Model flexibility** | Local models for privacy + zero cost. Cloud models for power + convenience. Switch anytime — your data stays yours regardless. |
| **Lifelong persistence** | The agent survives job changes, device upgrades, and life phases. It accumulates decades of growth data. |

**User's relationship:** "Odyssey is my second life — it knows me, grows with me, and shows me who I'm becoming."

### Dual-Model Architecture（双模型架构）

The Odyssey Agent's AI layer is designed as a **dual-mode system** — users freely choose between local and cloud models at any time.

```
                    ┌─────────────────────────────┐
                    │      ODYSSEY AGENT           │
                    │                              │
                    │  ┌───────────────────────┐   │
                    │  │   Model Router         │   │
                    │  │   (auto-selects based  │   │
                    │  │    on task + config)   │   │
                    │  └─────────┬─────────────┘   │
                    │            │                  │
                    │     ┌──────┴──────┐           │
                    │     │             │           │
                    │  ┌──▼──┐    ┌────▼────┐      │
                    │  │Local│    │ Cloud   │      │
                    │  │Mode │    │ Mode    │      │
                    │  └─────┘    └─────────┘      │
                    └─────────────────────────────┘
```

#### Local Mode（本地模式）

| Attribute | Value |
|-----------|-------|
| **Engines** | Ollama, llama.cpp, LM Studio, Text Generation WebUI |
| **Models** | Llama, Qwen, DeepSeek, Mistral, Gemma, Phi — anything the user downloads |
| **Privacy** | 100% local. Zero data leaves the machine. |
| **Cost** | $0 after initial hardware. |
| **Latency** | Sub-50ms on capable hardware. |
| **Best for** | Privacy-sensitive assessments, offline use, rapid iteration. |

#### Cloud Mode（云端模式）

| Attribute | Value |
|-----------|-------|
| **Providers** | OpenAI, Anthropic, Azure OpenAI, DeepSeek, Moonshot, ZhipuAI, and any OpenAI-compatible endpoint |
| **Configuration** | User provides: **Base URL** + **API Key** + **Model Name** |
| **Privacy** | User chooses provider based on their trust model. |
| **Cost** | Per-token pricing, paid directly to provider (Odyssey takes no cut). |
| **Latency** | Network-dependent (typically 200ms–2s). |
| **Best for** | Complex assessments requiring frontier models, users without local GPU. |

#### Model Configuration Interface

```
Settings → AI Model

  ┌─────────────────────────────────────────────┐
  │  Model Mode:  ○ Local    ● Cloud            │
  │                                              │
  │  Provider:     [OpenAI           ▾]          │
  │  Base URL:     [https://api.openai.com/v1   ]│
  │  API Key:      [••••••••••••••••••          ]│
  │  Model:        [gpt-4o            ▾]         │
  │                                              │
  │  [Test Connection]     [Save]                │
  │                                              │
  │  ── Local Models ────────────────────────    │
  │                                              │
  │  Provider:     [Ollama             ▾]        │
  │  Base URL:     [http://localhost:11434      ]│
  │  Model:        [qwen3:14b          ▾]        │
  │                                              │
  │  [Detect Local Models]  [Save]               │
  └─────────────────────────────────────────────┘
```

**Design principles for model configuration:**

1. **No lock-in.** Users can switch between local and cloud at any time. The agent works the same way regardless of which model is selected.
2. **Bring your own key.** Odyssey never proxies or stores API keys on its servers. Keys are encrypted locally.
3. **Provider-agnostic.** Any OpenAI-compatible endpoint works. This includes Anthropic (via compatible proxy), Azure, DeepSeek, Moonshot, ZhipuAI, Ollama, and hundreds of others.
4. **Task-aware routing.** Simple assessments can be routed to local models; complex multi-dimensional evaluations can use cloud models — all configurable by the user.
5. **Offline-first.** If no cloud model is configured, the agent runs entirely on local models. No feature is gated behind cloud API access.

### Evolution Map

```
Phase 1          Phase 2          Phase 3           Phase 4           Phase 5
Capability       Capability       Capability        Capability        AI Life
Tracker          Validator        World             Civilization      OS
─────●──────────────●────────────────●──────────────────●────────────────●──→

Web App          Web App          Hybrid            Hybrid            Local Agent
(Cloud-only)     (Cloud-only)     (Web + Desktop)   (Desktop-first)   (Local-first)

User visits      User connects    User installs     User lives in     Agent lives
a URL            GitHub           desktop app       the world         with the user
```

---

## 5. What the Local Agent Is — and Is NOT

### The Agent IS:
- A **growth companion** that observes, assesses, and maps your capability growth over time
- A **mirror** reflecting who you're becoming through the work you do
- A **permanent record** of your capability evolution across years and decades
- A **local-first application** — your data lives on your machine, under your control

### The Agent is NOT:
- ❌ A general-purpose chatbot（通用聊天机器人）— Odyssey Agent is a domain-specific growth companion that maps real capabilities, not a general Q&A tool
- ❌ A code completion tool (like GitHub Copilot)
- ❌ A note-taking app (like Obsidian)
- ❌ A task manager (like Notion / Todoist)
- ❌ A course platform (like Coursera / Udemy)
- ❌ An exam / quiz system
- ❌ A gamified habit tracker

The Odyssey Agent doesn't do the work for you. It shows you who you're becoming through the work you do.

---

## 6. Design Principles (Immutable)

These apply regardless of form factor — cloud web app or local agent.

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Capability First**（能力优先） | Never gamify for its own sake. Every feature must serve real capability growth. |
| 2 | **Assessment Before Reward**（先证明，再奖励） | Users must prove capability before receiving credentials or unlocks. |
| 3 | **Growth Must Be Earned**（成长必须通过挑战获得） | No passive accumulation. Growth comes only from completing real challenges. |
| 4 | **World Reflects Reality**（世界反映真实能力） | Every building/upgrade must correspond to real-world capability change. NOT streaks or check-ins. |
| 5 | **Visualize Progress**（让成长可见） | Abstract scores are not enough. Growth must have visible, tangible shape. |

---

## 7. What Odyssey Should NEVER Become

- ❌ Course platform（课程平台）
- ❌ Quiz bank（题库平台）
- ❌ Exam platform（考试平台）
- ❌ Check-in platform（打卡平台）
- ❌ XP grinding game（经验值挂机游戏）
- ❌ RPG leveling game（RPG 升级游戏）
- ❌ Fake growth system（虚假成长系统）
- ❌ General-purpose chatbot（通用聊天机器人）— Odyssey Agent is a domain-specific growth companion for capability tracking and growth, not a general Q&A tool
- ❌ Code completion tool（代码补全工具）

---

## 8. Technical Trajectory

### Current — Phase 1 MVP (Web App)
```
Frontend:   Next.js 14 (App Router) + TypeScript + TailwindCSS
Backend:    FastAPI + Python 3.12 + SQLAlchemy + Alembic
Database:   PostgreSQL
Auth:       JWT (python-jose + bcrypt)
LLM:        OpenAI API (gpt-4o)
Deploy:     Vercel (frontend) + Railway (backend)
```

### Mid-Term — Phase 3–4 (Hybrid)
```
Shell:      Tauri (Rust core + React UI)
Rendering:  WebGL/WebGPU 2.5D isometric engine
Backend:    Embedded Rust service (replace FastAPI)
Database:   SQLite (local) + optional cloud sync
LLM:        Hybrid (cloud OpenAI + local Ollama fallback)
Auth:       Local identity (no server required)
```

### Long-Term — Phase 5 (Local Agent)
```
Runtime:    Tauri desktop app (Rust core + React UI)
AI:         Dual-mode — Local (Ollama/llama.cpp) + Cloud (OpenAI/Anthropic/compatible)
Database:   SQLite + LanceDB (local vector store for RAG)
Sync:       E2E encrypted, P2P (optional, for multi-device)
Plugins:    VS Code extension, Obsidian plugin, GitHub integration
RAG:        Local embedding + retrieval over user's personal work history
```

### Key Technical Decisions by Phase

| Decision | Phase 1-2 | Phase 3-4 | Phase 5 |
|----------|-----------|-----------|---------|
| **Where does code run?** | Server (Vercel/Railway) | Server + Client | Client only |
| **Where does data live?** | Cloud PostgreSQL | SQLite local + cloud backup | SQLite local only |
| **Where does LLM run?** | OpenAI API (cloud) | Hybrid (cloud + local) | User's choice: local model or cloud API (configurable) |
| **How do users access?** | Browser URL | Desktop app + web fallback | Desktop app |
| **Is internet required?** | Yes, always | Mostly, offline-capable | No, fully offline-capable |
| **Who owns the data?** | Platform + User | User (with cloud backup) | User (fully sovereign) |

---

## 9. The Ultimate Vision

When a user opens Odyssey (Phase 5), they don't see:

```
Prompt Engineering: 80
RAG: 75
Workflow: 60
LangGraph: 55
```

They see:

```
A living civilization built from their own capabilities.

Language Academy    — risen from Prompt Engineering mastery
Memory Library      — constructed from RAG expertise
Automation Factory  — forged through Workflow skills
Agent Laboratory    — built upon LangGraph knowledge

Knowledge Citadel   — unlocked when Prompt × RAG combine
Agent City          — created when LangGraph × Workflow unite

Every building corresponds to real capability.
Every upgrade reflects real growth.
Every new structure marks a genuine achievement.

The civilization expands as the user grows —
not through check-ins, not through XP, not through course completion.
Through real capability, proven through real work.
```

**Odyssey's ultimate purpose is not to record growth.**

**It is to give growth a shape.**

**To give capability a world.**

**To turn learning into the act of building a civilization.**

**And to place that civilization entirely in the user's hands — on their machine, under their control, for their whole life.**

---

## 10. Founder's Note

```
Odyssey 的本质不是学习产品。

Odyssey 的最终形态不是 Web 应用。

Odyssey 是一个随用户成长的本地智能体 —
将现实世界中抽象的能力成长，
映射为一个持续演化的个人文明。

Web 应用是起点，不是终点。
本地智能体是终局，不是备选。

短期：通过 Web 应用验证核心假设 — 用户是否愿意记录和验证成长？
中期：通过混合架构让成长可视化 — 用户是否愿意建设自己的世界？
长期：通过本地智能体实现终身陪伴 — 用户是否将 Odyssey 视为第二个自己？

用户成长的不是角色。
成长的是自己。

文明只是成长的镜子。
Agent 是那面镜子的持有者 —
永远在用户身边，
永远在用户自己的机器上，
永远属于用户自己。
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](../CLAUDE.md) | Active development guidance (operating manual) |
| [Product Principles](./product-principles.md) | Detailed design philosophy |
| [System Architecture](./system-architecture.md) | Current technical architecture |
