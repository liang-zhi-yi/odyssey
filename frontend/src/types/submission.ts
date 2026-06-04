/** Submission types — matching backend app/submissions/schemas.py */

import type { SubmissionStatus } from "./quest";

export interface SubmitRequest {
  quest_id: string;
  content?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
}

export interface SubmitResponse {
  submission_id: string;
  status: SubmissionStatus;
}

export interface SubmissionDetail {
  submission_id: string;
  quest_id: string;
  content: string | null;
  github_url: string | null;
  demo_url: string | null;
  status: SubmissionStatus;
}

export interface AssessmentResult {
  overall_score: number | null;
  knowledge_score: number | null;
  reasoning_score: number | null;
  application_score: number | null;
  creation_score: number | null;
  feedback: string | null;
  improvement_suggestions: string | null;
}

export interface SubmissionHistoryItem {
  submission_id: string;
  quest_id: string;
  quest_title: string;
  status: string;
  content: string | null;
  github_url: string | null;
  demo_url: string | null;
  assessment: AssessmentResult | null;
  submitted_at: string | null;
}
