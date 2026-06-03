/** Project API calls — /api/v1/projects */

import { api } from "@/lib/api";
import type { CreateProjectRequest, Project } from "@/types/project";

export const projectService = {
  /** Create a new portfolio project */
  createProject(data: CreateProjectRequest): Promise<Project> {
    return api.post<Project>("/projects", data);
  },

  /** List all projects for the current user */
  listProjects(): Promise<Project[]> {
    return api.get<Project[]>("/projects");
  },
};
