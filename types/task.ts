export interface TaskProject {
  id: number;
  name: string;
}

export interface TaskStage {
  id: number;
  name: string;
}

export interface TaskUser {
  id: number;
  name: string;
}

export interface TaskPartner {
  id: number;
  name: string;
}

export interface TaskTag {
  id: number;
  name: string;
}

export interface TaskParent {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  name: string;
  description?: string | null;
  project?: TaskProject | null;
  stage?: TaskStage | null;
  user_ids?: TaskUser[];
  partner_id?: TaskPartner | null;
  date_deadline?: string | null;
  date_assign?: string | null;
  priority: string;
  color: number;
  active: boolean;
  parent_id?: TaskParent | null;
  child_ids?: { id: number; name: string }[];
  tag_ids?: TaskTag[];
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
