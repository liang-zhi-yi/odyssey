# Odyssey

**AI-Powered Capability Civilization Builder**（AI驱动的个人能力文明建造系统）

Odyssey maps abstract, real-world capability growth onto a tangible, evolving personal civilization. Every skill mastered becomes a building. Every building forms a civilization. Every civilization reflects the user's true identity.

> Odyssey is NOT a learning platform, course platform, exam platform, or quiz bank. It is a capability growth tool.

---

## MVP Core Loop

```
Goal → Path → Quest → Submission → Assessment → Capability Growth → Credential → Passport
```

1. Register an account
2. Choose a learning path (e.g., Agent Engineer)
3. Accept a quest
4. Submit your work (prompt, architecture, code, workflow)
5. Receive AI-powered multi-dimensional assessment
6. See your capability growth reflected in your skill scores
7. Earn credentials when your skills reach the threshold
8. View your capability passport — a verified record of what you can do

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| LLM | Multi-provider — OpenAI, DeepSeek, 阿里百炼, 智谱, Moonshot, OpenRouter, custom compatible APIs |

---

## Project Structure

```
odyssey/
├── frontend/          # Next.js 14 App Router
│   ├── src/
│   │   ├── app/       # 17 pages, 20 components
│   │   ├── hooks/     # useAuth, SWR hooks
│   │   ├── services/  # API client services
│   │   ├── lib/       # Utilities, auth helpers
│   │   └── types/     # TypeScript interfaces
│   └── next.config.mjs
├── backend/           # FastAPI
│   ├── app/
│   │   ├── main.py    # FastAPI entry point
│   │   ├── models.py  # Central ORM model registry
│   │   ├── config.py  # Pydantic Settings
│   │   ├── database.py
│   │   ├── seed/      # 5 idempotent seed scripts
│   │   ├── assessments/  # 9-step AI assessment engine
│   │   ├── auth/      # JWT auth
│   │   ├── skills/    # Skill tree
│   │   ├── quests/    # Quest system
│   │   ├── paths/     # Learning paths
│   │   ├── progress/  # Progress tracking
│   │   ├── credentials/ # Credential system
│   │   ├── passport/  # Capability passport
│   │   └── projects/  # Project submissions
│   ├── alembic/       # Database migrations
│   ├── tests/         # 11 test files (SQLite in-memory)
│   └── docker-compose.yml
└── docs/
    ├── vision.md                  # Product vision v2.0
    └── world-evolution-roadmap.md # 5-phase evolution
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **Python** >= 3.12
- **Docker Desktop** (for PostgreSQL) or a local PostgreSQL 16 instance

### 1. Start PostgreSQL

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL 16 on port 5432 with:
- User: `postgres`
- Password: `postgres`
- Database: `odyssey`

### 2. Configure Backend

```bash
cd backend

# Copy the example env file
cp .env.example .env

# Edit .env — at minimum set:
#   LLM_PROVIDER=your-chosen-provider  (openai | deepseek | bailian | ...)
#   LLM_API_KEY=your-api-key
```

### 3. Install & Run Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Load seed data (skills, quests, paths, credentials)
python run_seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Verify: open http://localhost:8000/api/v1/health

### 4. Install & Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000

### 5. Development Mode (Frontend-Only Preview)

To preview the UI without a running backend, the frontend supports a dev bypass mode:

```bash
# .env.local (already configured)
NEXT_PUBLIC_SKIP_AUTH=true
```

This lets you browse all pages with a mock user — no backend required.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+psycopg2://postgres:postgres@localhost:5432/odyssey` | PostgreSQL connection |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRE_MINUTES` | `10080` (7 days) | Token expiry |
| `LLM_PROVIDER` | `openai` | Provider preset (see table below) |
| `LLM_API_KEY` | *(required)* | API key for the chosen provider |
| `LLM_BASE_URL` | *(provider default)* | Override the provider's API endpoint |
| `LLM_MODEL` | `gpt-4o` | Model name (provider-specific) |
| `LLM_TEMPERATURE` | `0.0` | Deterministic assessment |
| `LLM_TIMEOUT_SECONDS` | `60` | API timeout per call |
| `DB_ECHO` | `false` | SQL query logging |

#### LLM Provider Presets

| Preset | Provider | Base URL | Structured Output | Get API Key |
|--------|----------|----------|-------------------|-------------|
| `openai` | OpenAI | `api.openai.com` | ✅ json_schema (strict) | [platform.openai.com](https://platform.openai.com/api-keys) |
| `deepseek` | DeepSeek | `api.deepseek.com` | ✅ json_object | [platform.deepseek.com](https://platform.deepseek.com) |
| `bailian` | 阿里百炼 (Qwen) | `dashscope.aliyuncs.com` | ✅ json_object | [bailian.console.aliyun.com](https://bailian.console.aliyun.com) |
| `zhipu` | 智谱AI (GLM) | `open.bigmodel.cn` | ✅ json_object | [open.bigmodel.cn](https://open.bigmodel.cn) |
| `moonshot` | 月之暗面 (Kimi) | `api.moonshot.cn` | ✅ json_object | [platform.moonshot.cn](https://platform.moonshot.cn) |
| `openrouter` | OpenRouter | `openrouter.ai` | ✅ json_object | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `claude` | Anthropic Claude ⚠️ | `api.anthropic.com` | ❌ 非 OpenAI 兼容 | *(需通过 OpenRouter 使用)* |
| `custom` | 自定义 | *(set LLM_BASE_URL)* | ✅ json_object | — |

> **Note:** All providers use OpenAI-compatible APIs. The Anthropic native API is **not** compatible — to use Claude models, set `LLM_PROVIDER=openrouter` and `LLM_MODEL=anthropic/claude-sonnet-4-6`.

#### Structured Output Modes

| Mode | Used By | How It Works |
|------|---------|--------------|
| `json_schema` (strict) | OpenAI only | API enforces exact JSON Schema — most reliable |
| `json_object` | DeepSeek, Bailian, Zhipu, Moonshot, OpenRouter, Custom | API enforces JSON, prompt instructs exact format — highly reliable |
| text + JSON extraction | *(fallback, none currently)* | Model asked to output JSON; regex extracts `{...}` from response |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SKIP_AUTH` | `false` | Bypass backend auth for UI preview |

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. The frontend proxies `/api/*` → `http://localhost:8000/api/*` via Next.js rewrites.

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /register`, `POST /login`, `GET /me` |
| **Skills** | `GET /skills`, `GET /user-skills`, `GET /skills/:id` |
| **Paths** | `GET /paths`, `POST /user-paths`, `GET /user-paths/current` |
| **Quests** | `GET /quests`, `GET /quests/:id`, `POST /quests/:id/accept` |
| **Submissions** | `POST /submissions`, `GET /submissions/:id` |
| **Assessments** | `POST /submissions/:id/assess`, `GET /assessments/:id` |
| **Progress** | `GET /progress`, `GET /progress/:skill_id` |
| **Credentials** | `GET /credentials`, `GET /user-credentials` |
| **Passport** | `GET /passport` |
| **Projects** | `CRUD /projects` |

---

## Testing

### Backend

```bash
cd backend
pytest                    # All tests (SQLite in-memory, no DB needed)
pytest -v                 # Verbose output
pytest tests/test_auth.py # Single test file
```

### Frontend

```bash
cd frontend
npx tsc --noEmit    # Type check
npx next build      # Build check
```

---

## Design Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Capability First** | Never gamify for its own sake. Every feature must serve real capability growth. |
| 2 | **Assessment Before Reward** | Users must prove capability before receiving credentials or unlocks. |
| 3 | **Growth Must Be Earned** | Growth comes only from completing real challenges. No passive accumulation. |
| 4 | **World Reflects Reality** | Every building/upgrade must correspond to real-world capability change. |
| 5 | **Visualize Progress** | Abstract scores are not enough. Growth must have visible, tangible shape. |

---

## License

Proprietary — all rights reserved.
