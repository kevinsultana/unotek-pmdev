export interface TimeOff {
  id: number;
  holiday_status_id: number;
  name?: string;
  date_from: string;
  date_to: string;
  state?: 'draft' | 'confirm' | 'validate1' | 'validate' | 'refuse';
  user_id?: number;
}

export interface TimeOffType {
  id: number;
  name: string;
  description?: string;
}

export interface TimeOffBalance {
  holiday_status_id: number;
  name: string;
  allocated: number;
  taken: number;
  remaining: number;
}

export interface CreateTimeOffRequest {
  holiday_status_id: number;
  date_from: string;
  date_to: string;
  name: string;
}

export type UpdateTimeOffRequest = Partial<CreateTimeOffRequest>;
