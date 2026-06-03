/** Submission API calls — /api/v1/submissions */

import { api } from "@/lib/api";
import type { SubmitRequest, SubmitResponse, SubmissionDetail } from "@/types/submission";

export const submissionService = {
  /** Submit work for an accepted quest */
  submit(data: SubmitRequest): Promise<SubmitResponse> {
    return api.post<SubmitResponse>("/submissions", data);
  },

  /** Get submission status and content */
  getSubmission(submissionId: string): Promise<SubmissionDetail> {
    return api.get<SubmissionDetail>(`/submissions/${submissionId}`);
  },
};
