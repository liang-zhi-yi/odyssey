"""
Odyssey API — FastAPI application entry point.

Base URL: /api/v1
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.exceptions import AppException, app_exception_handler, generic_exception_handler

# ── Import all routers ────────────────────────────────────────────
from app.health.router import router as health_router
from app.auth.router import router as auth_router
from app.skills.router import router as skills_router
from app.quests.router import router as quests_router
from app.submissions.router import router as submissions_router
from app.assessments.router import router as assessments_router
from app.progress.router import router as progress_router
from app.credentials.router import router as credentials_router
from app.passport.router import router as passport_router
from app.projects.router import router as projects_router
from app.settings.router import router as settings_router
from app.badges.router import router as badges_router
from app.world.router import router as world_router
from app.analytics.router import router as analytics_router
from app.notifications.router import router as notifications_router
from app.export.router import router as export_router
from app.learning_paths.router import router as learning_paths_router
from app.agent.router import router as agent_router

app = FastAPI(
    title="Odyssey API",
    version="0.1.0",
    description="AI Capability Growth Operating System — MVP",
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ── Routers ───────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(skills_router, prefix=API_PREFIX)
app.include_router(quests_router, prefix=API_PREFIX)
app.include_router(submissions_router, prefix=API_PREFIX)
app.include_router(assessments_router, prefix=API_PREFIX)
app.include_router(progress_router, prefix=API_PREFIX)
app.include_router(credentials_router, prefix=API_PREFIX)
app.include_router(passport_router, prefix=API_PREFIX)
app.include_router(projects_router, prefix=API_PREFIX)
app.include_router(settings_router, prefix=API_PREFIX)
app.include_router(badges_router, prefix=API_PREFIX)
app.include_router(world_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(notifications_router, prefix=API_PREFIX)
app.include_router(export_router, prefix=API_PREFIX)
app.include_router(learning_paths_router, prefix=API_PREFIX)
app.include_router(agent_router, prefix=API_PREFIX)

# ── Static files (avatars, exports) ────────────────────────────────
uploads_dir = settings.upload_dir
avatars_dir = os.path.join(uploads_dir, "avatars")
os.makedirs(avatars_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=uploads_dir), name="static")
