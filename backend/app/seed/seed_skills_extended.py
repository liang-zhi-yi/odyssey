"""Seed 12 new skills across domains beyond AI — Programming, Product, Design, etc."""

from sqlalchemy.orm import Session

from app.skills.models import Skill

# UUIDs chosen to not conflict with existing seed skills (0001-0004)
SEED_SKILLS_EXTENDED = [
    # ── PROGRAMMING ──────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-000000000010",
        "name": "Python",
        "name_en": "Python",
        "description": "Master Python programming from fundamentals to advanced features including async, typing, and ecosystem libraries.",
        "description_en": "Master Python programming from fundamentals to advanced features including async, typing, and ecosystem libraries.",
        "category": "Programming",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000011",
        "name": "JavaScript",
        "name_en": "JavaScript",
        "description": "Build modern JavaScript applications with ES6+, async patterns, module systems, and runtime environments.",
        "description_en": "Build modern JavaScript applications with ES6+, async patterns, module systems, and runtime environments.",
        "category": "Programming",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000012",
        "name": "System Design",
        "name_en": "System Design",
        "description": "Design scalable distributed systems with load balancing, caching, database sharding, and microservices architecture.",
        "description_en": "Design scalable distributed systems with load balancing, caching, database sharding, and microservices architecture.",
        "category": "Programming",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000013",
        "name": "Algorithms",
        "name_en": "Algorithms",
        "description": "Analyze and implement fundamental algorithms and data structures with emphasis on complexity analysis and optimization.",
        "description_en": "Analyze and implement fundamental algorithms and data structures with emphasis on complexity analysis and optimization.",
        "category": "Programming",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    # ── PRODUCT ──────────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-000000000014",
        "name": "Product Strategy",
        "name_en": "Product Strategy",
        "description": "Define product vision, strategy, and roadmap. Master prioritization frameworks and product-market fit analysis.",
        "description_en": "Define product vision, strategy, and roadmap. Master prioritization frameworks and product-market fit analysis.",
        "category": "Product",
        "domain": "PRODUCT",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000015",
        "name": "User Research",
        "name_en": "User Research",
        "description": "Conduct user interviews, usability testing, and data-driven research to inform product decisions.",
        "description_en": "Conduct user interviews, usability testing, and data-driven research to inform product decisions.",
        "category": "Product",
        "domain": "PRODUCT",
        "max_score": 100,
    },
    # ── DESIGN ───────────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-000000000016",
        "name": "UI Design",
        "name_en": "UI Design",
        "description": "Create intuitive, accessible, and visually polished user interfaces with design systems and component libraries.",
        "description_en": "Create intuitive, accessible, and visually polished user interfaces with design systems and component libraries.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000017",
        "name": "Design Systems",
        "name_en": "Design Systems",
        "description": "Build and maintain scalable design systems with tokens, components, patterns, and documentation.",
        "description_en": "Build and maintain scalable design systems with tokens, components, patterns, and documentation.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    # ── WRITING ──────────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-000000000018",
        "name": "Technical Writing",
        "name_en": "Technical Writing",
        "description": "Write clear, concise, and well-structured technical documentation, API references, and engineering guides.",
        "description_en": "Write clear, concise, and well-structured technical documentation, API references, and engineering guides.",
        "category": "Writing",
        "domain": "WRITING",
        "max_score": 100,
    },
    # ── RESEARCH ─────────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-000000000019",
        "name": "Data Analysis",
        "name_en": "Data Analysis",
        "description": "Analyze data with statistical methods, visualization, and exploratory analysis to extract actionable insights.",
        "description_en": "Analyze data with statistical methods, visualization, and exploratory analysis to extract actionable insights.",
        "category": "Research",
        "domain": "RESEARCH",
        "max_score": 100,
    },
    # ── MANAGEMENT ───────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-00000000001a",
        "name": "Leadership",
        "name_en": "Leadership",
        "description": "Develop team leadership capabilities including mentoring, delegation, conflict resolution, and strategic communication.",
        "description_en": "Develop team leadership capabilities including mentoring, delegation, conflict resolution, and strategic communication.",
        "category": "Management",
        "domain": "MANAGEMENT",
        "max_score": 100,
    },
    # ── CAREER ───────────────────────────────────────────────
    {
        "id": "00000000-0000-0000-0000-00000000001b",
        "name": "Career Planning",
        "name_en": "Career Planning",
        "description": "Design and execute a strategic career path with skill mapping, opportunity assessment, and personal brand building.",
        "description_en": "Design and execute a strategic career path with skill mapping, opportunity assessment, and personal brand building.",
        "category": "Career",
        "domain": "CAREER",
        "max_score": 100,
    },
]


def run(db: Session) -> dict[str, str]:
    """Insert extended skills. Returns a mapping of skill name → UUID string."""
    mapping: dict[str, str] = {}
    for data in SEED_SKILLS_EXTENDED:
        existing = db.query(Skill).filter(Skill.name == data["name"]).first()
        if existing:
            # Update domain if this is an existing skill that was seeded before domain existed
            if existing.domain == "AI" and data["domain"] != "AI":
                existing.domain = data["domain"]
            mapping[data["name"]] = str(existing.id)
            continue
        skill = Skill(**data)
        db.add(skill)
        mapping[data["name"]] = str(skill.id)
    db.commit()
    return mapping
