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

export interface SubmissionHistoryItem {
  submission_id: string;
  quest_id: string;
  quest_title: string;
  status: string;
  content_preview: string | null;
  submitted_at: string | null;
}
