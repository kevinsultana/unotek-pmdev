export interface Task {
  id: number;
  name: string;
  project_id?: number;
  description?: string;
  user_ids?: number[];
  date_deadline?: string;
  priority?: string;
  stage_id?: number;
  kanban_state?: string;
  parent_id?: number | null;
  tag_ids?: number[];
  active?: boolean;
}

export interface CreateTaskRequest {
  name: string;
  project_id?: number;
  description?: string;
  user_ids?: number[];
  date_deadline?: string;
  priority?: string;
  stage_id?: number;
  parent_id?: number | null;
  tag_ids?: number[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest> & {
  kanban_state?: string;
};
