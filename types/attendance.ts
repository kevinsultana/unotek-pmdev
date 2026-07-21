export interface AttendanceStatus {
  attendance_state?: "checked_in" | "checked_out";
  employee?: {
    id: number;
    name: string;
    attendance_state: "checked_in" | "checked_out";
  };
  today: Array<{
    id: number;
    check_in: string;
    check_out: string | null;
    worked_hours: number | null;
    attendance_type?: "wfo" | "wfh" | "wfa" | null;
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
  attendance_type?: "wfo" | "wfh" | "wfa" | null;
  number?: string;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_photo_url?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_photo_url?: string | null;
}

export interface CheckInRequest {
  attendance_type: "wfo" | "wfh" | "wfa";
  latitude?: number;
  longitude?: number;
  photo_id?: number | null;
}

export interface CheckOutRequest {
  latitude?: number;
  longitude?: number;
  photo_id?: number | null;
}
