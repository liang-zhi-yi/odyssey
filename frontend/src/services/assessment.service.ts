/** Assessment API calls — /api/v1/assessments */

import { api } from "@/lib/api";
import type {
  RunAssessmentRequest,
  RunAssessmentResponse,
  AssessmentResult,
} from "@/types/assessment";

export const assessmentService = {
  /** Trigger an async assessment for a submitted quest */
  runAssessment(data: RunAssessmentRequest): Promise<RunAssessmentResponse> {
    return api.post<RunAssessmentResponse>("/assessments/run", data);
  },

  /** Poll assessment status / retrieve result */
  getAssessment(assessmentId: string): Promise<AssessmentResult> {
    return api.get<AssessmentResult>(`/assessments/${assessmentId}`);
  },
};
