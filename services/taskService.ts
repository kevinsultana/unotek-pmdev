import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStageItem,
  TaskTagItem,
} from "../types/task";

export const taskService = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    project_id?: number;
    user_id?: number;
    stage_id?: number;
    priority?: string;
    my_tasks?: boolean;
  }) => api.get<{ success: boolean; data: Task[]; pagination: { page: number; per_page: number; total: number; total_pages: number } }>("/tasks", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Task>>(`/tasks/${id}`),

  create: (data: CreateTaskRequest) =>
    api.post<ApiResponse<Task>>("/tasks", data),

  update: (id: number, data: UpdateTaskRequest) =>
    api.put<ApiResponse<Task>>(`/tasks/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`),

  listStages: (params?: { project_id?: number }) =>
    api.get<ApiResponse<TaskStageItem[]>>("/tasks/stages", { params }),

  listTags: () =>
    api.get<ApiResponse<TaskTagItem[]>>("/tasks/tags"),
};
