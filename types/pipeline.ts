export type PipelineStage = "Lead" | "Qualification" | "Proposal" | "Negotiation" | "Won" | "Lost";
export type PipelinePriority = "Low" | "Medium" | "High";

export interface PipelineAttachment {
  id: string;
  name: string;
  uri: string;
  type: "image" | "document";
  size?: string;
  createdAt: string;
}

export interface PipelineItem {
  id: string;
  title: string;
  client: string;
  amount: number;
  stage: PipelineStage;
  priority: PipelinePriority;
  probability: number; // percentage 0 - 100
  expectedCloseDate: string;
  notes?: string;
  attachments?: PipelineAttachment[];
  createdAt: string;
}

export interface PipelineListParams {
  search?: string;
  stage?: string;
}
