export interface ProjectPartner {
  id: number;
  name: string;
}

export interface ProjectUser {
  id: number;
  name: string;
}

export interface ProjectStage {
  id: number;
  name: string;
}

export interface ProjectCompany {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  partner?: ProjectPartner | null;
  user?: ProjectUser | null;
  date_start?: string | null;
  date?: string | null;
  task_count: number;
  color: number;
  active: boolean;
  stage_id?: ProjectStage | null;
  company?: ProjectCompany | null;
}

export interface ProjectListParams {
  page?: number;
  per_page?: number;
  search?: string;
  active?: boolean;
}
