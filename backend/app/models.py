"""
Central import point for ALL ORM models.

Alembic's `env.py` imports `Base` from `app.models` so that
`Base.metadata` reflects every table.  Import order accounts for
cross-model relationship resolution.
"""
from sqlalchemy.orm import configure_mappers

# Infrastructure
from app.database import Base  # noqa: F401
from app.settings.models import UserSettings  # noqa: F401

# Leaf entities first (no FK/relationship references to other app tables)
from app.auth.models import User  # noqa: F401
from app.paths.models import Path, PathSkill, UserPath  # noqa: F401
from app.quests.models import Quest  # noqa: F401
from app.submissions.models import QuestSubmission  # noqa: F401
from app.assessments.models import Assessment  # noqa: F401
from app.progress.models import ProgressLog  # noqa: F401
from app.credentials.models import Credential, UserCredential  # noqa: F401
from app.projects.models import Project  # noqa: F401

# Entities with cross-model relationships (import last so all targets exist)
from app.skills.models import Skill, UserSkill  # noqa: F401

# Force all mappers to configure now that every model is registered
configure_mappers()
