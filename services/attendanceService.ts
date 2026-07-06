import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  AttendanceStatus,
  AttendanceRecord,
  CheckInRequest,
  CheckOutRequest,
} from "../types/attendance";
import type { PaginationParams } from "../types/api";

export const attendanceService = {
  uploadPhoto: (formData: FormData) =>
    api.post<ApiResponse<{ photo_id: number; photo_url?: string }>>(
      "/attendance/upload-photo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),

  checkIn: (data: CheckInRequest) =>
    api.post<ApiResponse<{ message: string; time: string }>>(
      "/attendance/check-in",
      data,
    ),

  checkOut: (data: CheckOutRequest) =>
    api.post<ApiResponse<{ message: string; time: string }>>(
      "/attendance/check-out",
      data,
    ),

  getStatus: () => api.get<ApiResponse<AttendanceStatus>>("/attendance/status"),

  getHistory: (
    params: PaginationParams & { date_from?: string; date_to?: string },
  ) =>
    api.get<{ success: boolean; data: AttendanceRecord[]; pagination: { page: number; per_page: number; total: number; total_pages: number } }>(
      "/attendance/history",
      { params },
    ),
};
