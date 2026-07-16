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
}

export type CreateMaintenanceRequest = Omit<MaintenanceRequest, "id" | "state" | "date" | "notes">;
export type UpdateMaintenanceRequest = Partial<CreateMaintenanceRequest>;
