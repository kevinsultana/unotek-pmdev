export type PipelineStage = "Lead" | "Qualification" | "Proposal" | "Negotiation" | "Won" | "Lost" | "Opportunity" | string;
export type PipelinePriority = "Low" | "Medium" | "High";

export interface CrmStage {
  id: number | string;
  name: string;
  sequence?: number;
  is_won?: boolean;
}

export interface CrmLostReason {
  id: number;
  name: string;
}

export interface PipelineAttachment {
  id: string;
  name: string;
  uri: string;
  type: "image" | "document";
  size?: string;
  createdAt: string;
}

export interface CrmLead {
  id: number | string;
  name: string;
  type?: "lead" | "opportunity";
  contact_name?: string;
  partner_id?: number | null;
  partner_name?: string;
  email_from?: string;
  phone?: string;
  mobile?: string;
  expected_revenue?: number;
  probability?: number;
  priority?: string | number; // "0" (Low), "1" (Normal/Medium), "2" (High), "3" (Urgent)
  stage_id?: number | string;
  stage_name?: string;
  stage?: CrmStage | string;
  team_id?: number | null;
  team_name?: string;
  user_id?: number | null;
  user_name?: string;
  date_deadline?: string;
  description?: string;
  won_status?: "pending" | "won" | "lost";
  lost_reason_id?: number | null;
  lost_reason?: CrmLostReason | string | null;
  lost_feedback?: string;
  attachments?: PipelineAttachment[];
  created_at?: string;
}

export interface CrmLeadCreatePayload {
  name: string;
  type?: "lead" | "opportunity";
  contact_name?: string;
  email_from?: string;
  phone?: string;
  mobile?: string;
  partner_id?: number | null;
  expected_revenue?: number;
  probability?: number;
  priority?: string | number;
  stage_id?: number | string;
  team_id?: number | null;
  user_id?: number | null;
  date_deadline?: string;
  description?: string;
  tag_ids?: number[];
}

export interface CrmLeadUpdatePayload {
  name?: string;
  type?: "lead" | "opportunity";
  contact_name?: string;
  email_from?: string;
  phone?: string;
  mobile?: string;
  partner_id?: number | null;
  expected_revenue?: number;
  probability?: number;
  priority?: string | number;
  stage_id?: number | string;
  team_id?: number | null;
  user_id?: number | null;
  date_deadline?: string;
  description?: string;
  tag_ids?: number[];
}

export interface PipelineItem {
  id: string;
  title: string;
  client: string;
  email_from?: string;
  phone?: string;
  amount: number;
  stage: PipelineStage;
  stageId?: number | string;
  priority: PipelinePriority;
  probability: number;
  expectedCloseDate: string;
  notes?: string;
  attachments?: PipelineAttachment[];
  createdAt: string;
  wonStatus?: "pending" | "won" | "lost";
  lost_reason_id?: number | null;
  lostReason?: string;
  lost_feedback?: string;
}

export interface PipelineListParams {
  search?: string;
  stage?: string;
  stage_id?: number | string;
  type?: "lead" | "opportunity";
  priority?: string | number;
  won_status?: "pending" | "won" | "lost";
  page?: number;
  per_page?: number;
}
