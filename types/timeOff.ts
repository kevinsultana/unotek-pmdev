export interface TimeOffHolidayStatus {
  id: number;
  name: string;
}

export interface TimeOffEmployee {
  id: number;
  name: string;
}

export interface TimeOffDepartment {
  id: number;
  name: string;
}

export interface TimeOff {
  id: number;
  name: string | null;
  state: string;
  state_label: string;
  holiday_status: TimeOffHolidayStatus;
  employee: TimeOffEmployee;
  date_from: string;
  date_to: string;
  number_of_days: number;
  department?: TimeOffDepartment;
}

export interface TimeOffType {
  id: number;
  name: string;
  description?: string;
}

export interface TimeOffBalanceItem {
  leave_type: TimeOffHolidayStatus;
  allocated: number;
  taken: number;
  remaining: number;
}

export interface TimeOffBalanceResponse {
  employee: TimeOffEmployee;
  balances: TimeOffBalanceItem[];
}

export interface CreateTimeOffRequest {
  holiday_status_id: number;
  date_from: string;
  date_to: string;
  name: string;
}

export type UpdateTimeOffRequest = Partial<CreateTimeOffRequest>;
