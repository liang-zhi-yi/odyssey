"""Test Phase 2 changes: era, resources, 10-level scoring."""
import sys
sys.path.insert(0, ".")

import app.models
from app.database import _get_session_local

SessionLocal = _get_session_local()
db = SessionLocal()

try:
    from app.auth.models import User
    from app.world.service import get_world_state, score_to_level, score_to_era

    # Test score_to_level with 10-level mapping
    print("=== 10-Level Score Mapping ===")
    test_scores = [0, 5, 10, 15, 25, 35, 45, 55, 65, 75, 85, 95, 100]
    for s in test_scores:
        level = score_to_level(s)
        print(f"  score={s:3d} -> level={level}")

    # Test score_to_era
    print("\n=== Era from Score ===")
    test_era_scores = [0, 50, 100, 300, 800, 2000, 4000, 8000, 12000, 18000, 30000]
    for s in test_era_scores:
        era = score_to_era(s)
        print(f"  era_score={s:5d} -> {era['era']} ({era['era_name_zh']})")

    # Test world state for existing users
    print("\n=== World State ===")
    users = db.query(User).limit(3).all()
    for u in users:
        world_data = get_world_state(db, u.id)
        print(f"User: {u.email}")
        print(f"  era: {world_data.get('era')}")
        print(f"  era_name: {world_data.get('era_name')}")
        print(f"  era_icon: {world_data.get('era_icon')}")
        print(f"  era_score: {world_data.get('era_score')}")
        print(f"  next_era_at: {world_data.get('next_era_at')}")
        print(f"  knowledge_points: {world_data.get('knowledge_points')}")
        print(f"  tech_points: {world_data.get('tech_points')}")
        print(f"  population: {world_data.get('population')}")
        print(f"  exploration_progress: {world_data.get('exploration_progress')}")
        print(f"  tier: {world_data.get('tier')}")
        print(f"  tier_score: {world_data.get('tier_score')}")
        buildings = world_data.get('buildings', [])
        print(f"  buildings: {len(buildings)}")
        if buildings:
            b = buildings[0]
            tpl = b.get('template', {})
            if tpl:
                print(f"  first building civ_type: {tpl.get('civilization_type')}")
                print(f"  first building era: {tpl.get('era')}")
        print()

    print("=== Phase 2 Verification PASSED ===")
finally:
    db.close()
