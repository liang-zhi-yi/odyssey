/** Project types — matching backend app/projects/schemas.py */

export interface CreateProjectRequest {
  title: string;
  description?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  related_skill_id?: string | null;
  quest_submission_id?: string | null;
}

/** Nested: related skill info */
export interface RelatedSkillInfo {
  id: string;
  name: string;
  category: string;
}

/** Nested: related building info (via skill → building template → user building) */
export interface RelatedBuildingInfo {
  id: string;
  name: string;
  icon: string;
  level: number;
}

/** Nested: quest submission info with assessment grade */
export interface QuestSubmissionInfo {
  id: string;
  status: string;
  quest_title: string;
  quest_id: string;
  assessment_score: number | null;
  assessment_grade: string | null; // S / A / B / C / D
}

/** Nested: source learning path info */
export interface SourcePathInfo {
  id: string;
  title: string;
}

/** Enriched project — matching backend ProjectResponse */
export interface Project {
  id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  demo_url: string | null;
  created_at: string | null;

  // Enriched relations (null if not linked)
  related_skill: RelatedSkillInfo | null;
  related_building: RelatedBuildingInfo | null;
  quest_submission: QuestSubmissionInfo | null;
  source_path: SourcePathInfo | null;
}
