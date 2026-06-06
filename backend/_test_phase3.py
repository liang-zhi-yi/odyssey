"""Test Phase 3: Path ↔ Skill ↔ World Deep Integration."""
import sys
sys.path.insert(0, ".")

import app.models
from app.database import _get_session_local

db = _get_session_local()()

try:
    from app.auth.models import User
    from app.world.path_bridge import (
        get_path_building_targets,
        recommend_skills_for_locked_buildings,
        get_unlocked_buildings_summary,
    )
    from app.learning_paths.models import LearningPath

    # Test 1: get_unlocked_buildings_summary for a user
    print("=== 1. Buildings Summary ===")
    user = db.query(User).first()
    if user:
        summary = get_unlocked_buildings_summary(db, user.id)
        print(f"  Total buildings: {summary['total_buildings']}")
        print(f"  Total unlocked: {summary['total_unlocked']}")
        print(f"  Civ types: {list(summary['by_civilization_type'].keys())[:5]}")
        print(f"  Eras: {list(summary['by_era'].keys())}")
        recs = summary.get('locked_skill_recommendations', [])
        print(f"  Recommendations: {len(recs)}")
        if recs:
            print(f"  First rec: {recs[0]['skill_name']} -> {recs[0]['building_name']}")

    # Test 2: get_path_building_targets for a user path
    print("\n=== 2. Path Building Targets ===")
    if user:
        path = db.query(LearningPath).filter(
            LearningPath.user_id == user.id
        ).first()
        if path:
            targets = get_path_building_targets(db, path.id)
            print(f"  Path: {path.title}")
            print(f"  Targets: {len(targets)}")
            for t in targets[:3]:
                print(f"    {t['building_icon']} {t['building_name']} ({t['skill_name']})")
        else:
            print("  No paths found for user")

    # Test 3: recommend_skills_for_locked_buildings
    print("\n=== 3. Locked Building Recommendations ===")
    if user:
        recs = recommend_skills_for_locked_buildings(db, user.id, limit=5)
        print(f"  Found {len(recs)} recommendations")
        for r in recs[:3]:
            print(f"    {r['building_icon']} {r['skill_name']} -> {r['building_name']}")

    # Test 4: LearningPathResponse schema has targeted_buildings
    print("\n=== 4. Schema Check ===")
    from app.learning_paths.schemas import LearningPathResponse
    fields = list(LearningPathResponse.model_fields.keys())
    assert 'targeted_buildings' in fields, "targeted_buildings missing from LearningPathResponse!"
    print(f"  LearningPathResponse has targeted_buildings: True")

    # Test 5: buildings-summary endpoint exists
    print("\n=== 5. Router Check ===")
    from app.world.router import get_buildings_summary
    print(f"  get_buildings_summary endpoint exists: True")

    print("\n=== Phase 3 Verification PASSED ===")
finally:
    db.close()
