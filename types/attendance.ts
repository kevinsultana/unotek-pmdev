export interface AttendanceStatus {
  checked_in: boolean;
  check_in_time?: string;
  check_out_time?: string;
  date: string;
  total_worked_hours?: number;
}

export interface AttendanceRecord {
  id: number;
  check_in: string;
  check_out?: string;
  date: string;
  photo_selfie?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  total_worked_hours?: number;
}

export interface CheckInRequest {
  photo?: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export type CheckOutRequest = CheckInRequest;
