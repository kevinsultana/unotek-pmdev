export interface ProblemCategory {
  id: number;
  name: string;
}

export interface MaintenanceAttachment {
  id: number;
  name: string;
  url: string;
}

export interface Equipment {
  id: number;
  name: string;
  code: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface MaintenanceStage {
  id: number;
  name: string;
  sequence?: number;
}

export interface MaintenanceTeam {
  id: number;
  name: string;
}

export interface MaintenanceRequest {
  id: number;
  asset_name: string;
  asset_code: string;
  category: "hardware" | "software" | "facility" | "other";
  title: string;
  description: string;
  urgency: "low" | "medium" | "high" | "critical";
  state: "draft" | "submitted" | "in_progress" | "done" | "refused";
  date: string; // YYYY-MM-DD
  notes?: string; // Technician reply or admin feedback
  images?: string[]; // Array of photo URIs
  equipment_id?: number;
  stage_id?: number;
  maintenance_team_id?: number;
  maintenance_type?: "corrective" | "preventive";
  problem_category_id?: number;
  problem_category_name?: string;
  attachments?: MaintenanceAttachment[];
}

export type CreateMaintenanceRequest = Omit<MaintenanceRequest, "id" | "state" | "date" | "notes">;
export type UpdateMaintenanceRequest = Partial<CreateMaintenanceRequest>;
