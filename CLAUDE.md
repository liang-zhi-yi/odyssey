# CLAUDE.md — Odyssey Project Guidance

> **Primary source of truth for all development.** Read this before writing any code.

## Product Evolution: Agent-First Progressive Path

> Odyssey is being redefined as a **「学习与成长的第二大脑 / 专属 AI 助理」** (second brain / personal AI assistant for learning and growth).
> The fixed 5-phase roadmap has been replaced with an evolutionary A→B→C/D model that validates assumptions at each stage before committing to the next.

### Current: A — Agent Sidebar（智能体侧边栏）

Agent as a collapsible sidebar companion across all authenticated pages.

- **Module:** `backend/app/agent/` — chat endpoint, conversation history, persona, context builder
- **Frontend:** `AgentSidebar`, `AgentMessage`, `AgentAvatar` components + `useAgent` hook
- **Agent Identity:** Odyssey (奥德赛) — domain-specific growth companion, NOT a general-purpose chatbot
- **Capabilities (A1):** Read-only — explain progress, analyze assessments, show world state
- **Capabilities (A2):** Recommend quests/paths, detect stagnation, proactive notifications

### Next: B — Agent as Interface（对话核心）

If conversational interaction is validated, restructure UI so chat becomes the primary interaction paradigm.

- Full-screen chat with card-based rendering (skill cards, quest cards, world cards)
- SSE streaming for agent responses
- Traditional navbar weakened, pages become card "fullscreen" views

### Long-Term: C/D — Local Sovereign + Growth Network

- **C:** Tauri desktop app with local LLM (Ollama), SQLite, data sovereignty
- **D:** Passive capability tracking from GitHub, VS Code, calendar integrations

### Key Design Principle

Odyssey Agent is NOT a general-purpose chatbot — it's a **domain-specific growth companion** focused exclusively on capability tracking, verification, and visualization. Every response must reference real user data and suggest concrete growth actions.


## Coding Principles

- Prefer simplicity. Avoid premature optimization. Avoid over-engineering.
- Clean architecture: keep business logic in services, keep routes thin.
- Typed interfaces everywhere (TypeScript strict, Python type hints).
- Follow existing patterns — match the surrounding code's density, naming, and idiom.

---

## Development Operations (from .learnings/)

### Before debugging any backend error
1. **Check migrations first**: `cd backend && alembic current` → verify head matches. Missing migrations are the #1 cause of 500 errors. [[LRN-20260604-005]]
2. **If API returns stale data but DB is correct**: kill all Python processes and restart fresh. `--reload` doesn't guarantee clean state — zombie processes survive across restarts. [[LRN-20260605-001]]
   ```powershell
   Get-Process -Name "python*" | Stop-Process -Force
   cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### After parallel subagent development
Run this verification sequence before declaring work complete: [[LRN-20260605-002]]
1. `cd frontend && .\node_modules\.bin\tsc.cmd --noEmit` — zero errors required
2. `node -e "require('./src/locales/en.json'); require('./src/locales/zh.json')"` — JSON valid
3. Kill all Python + restart backend fresh
4. Test 3+ API endpoints via HTTP (not just Python import)
5. Test 3+ frontend pages via HTTP

### Windows-specific
- Use `$env:PYTHONIOENCODING = "utf-8"` before running Python scripts with emoji [[LRN-20260604-003]]
- Use PowerShell here-strings (`@""@`) for inline multi-line Python [[LRN-20260605-003]]
- Standalone Python scripts must `import app.models` before ORM operations [[LRN-20260604-004]]

---

## Future Development Rule

Each subsequent feature MUST be evaluated against:

1. **Which evolution stage does it belong to?** (A → B → C/D — progressive, validate before committing)
2. **Does it violate any design principle?** (especially #1 Capability First, #4 World Reflects Reality)
3. **Is it on the "NEVER become" list?** (course, quiz, exam, check-in, XP grind, RPG, fake growth, general-purpose chatbot)

When in doubt, re-read `docs/vision.md`.

The ultimate vision: **when users open Odyssey, they see a civilization built by their own capabilities — and an Agent that knows their growth story.**
