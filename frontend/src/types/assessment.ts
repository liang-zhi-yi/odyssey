/** Assessment types — matching backend app/assessments/schemas.py */

export type AssessmentStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface RunAssessmentRequest {
  submission_id: string;
}

export interface RunAssessmentResponse {
  assessment_id: string;
  status: AssessmentStatus;
}

/** Returned while assessment is still PROCESSING */
export interface AssessmentProcessing {
  assessment_id: string;
  status: "PROCESSING";
}

/** Returned when assessment COMPLETED successfully */
export interface AssessmentCompleted {
  assessment_id: string;
  status: "COMPLETED";
  knowledge: number;
  reasoning: number;
  application: number;
  creation: number;
  overall: number;
  feedback: string | null;
  suggestions: string | null;
}

/** Returned when assessment FAILED */
export interface AssessmentFailed {
  assessment_id: string;
  status: "FAILED";
  error: string | null;
  retry_url: string | null;
}

/** Discriminated union of all assessment states */
export type AssessmentResult =
  | AssessmentProcessing
  | AssessmentCompleted
  | AssessmentFailed;

/** Four-dimension score breakdown */
export interface DimensionScores {
  knowledge: number;
  reasoning: number;
  application: number;
  creation: number;
}

export const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  knowledge: "知识",
  reasoning: "推理",
  application: "应用",
  creation: "创造",
};

export const DIMENSION_WEIGHTS: Record<keyof DimensionScores, number> = {
  knowledge: 0.2,
  reasoning: 0.25,
  application: 0.35,
  creation: 0.2,
};
