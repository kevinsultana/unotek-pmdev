import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type { Project, ProjectListParams } from "../types/project";

export const projectService = {
  list: (params?: ProjectListParams) =>
    api.get<ApiResponse<Project[]>>("/projects", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),
};
