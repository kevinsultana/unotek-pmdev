export interface AttendanceStatus {
  employee: {
    id: number;
    name: string;
    attendance_state: "checked_in" | "checked_out";
  };
  today: Array<{
    id: number;
    check_in: string;
    check_out: string | null;
    worked_hours: number | null;
  }>;
  total_worked_hours: number;
}

export interface AttendanceRecord {
  id: number;
  check_in: string;
  check_out?: string;
  date?: string;
  photo_selfie?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  worked_hours?: number;
}

export interface CheckInRequest {
  photo?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  work_type?: "WFA" | "WFO" | "WFH";
}

export type CheckOutRequest = CheckInRequest;
