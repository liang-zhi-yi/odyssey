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

  /** Get a single project by ID with full enriched relations */
  getProject(projectId: string): Promise<Project> {
    return api.get<Project>(`/projects/${projectId}`);
  },

  /** Delete a project by ID */
  deleteProject(projectId: string): Promise<void> {
    return api.delete(`/projects/${projectId}`);
  },
};
