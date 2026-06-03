/** Project types — matching backend app/projects/schemas.py */

export interface CreateProjectRequest {
  title: string;
  description?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  related_skill_id?: string | null;
  quest_submission_id?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  demo_url: string | null;
}
