import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  TimeOff,
  TimeOffType,
  TimeOffBalanceResponse,
  CreateTimeOffRequest,
  UpdateTimeOffRequest,
} from "../types/timeOff";

export const timeOffService = {
  list: (params?: {
    page?: number;
    per_page?: number;
    state?: string;
    date_from?: string;
    date_to?: string;
    team?: boolean;
  }) => api.get<{ success: boolean; data: TimeOff[]; pagination: { page: number; per_page: number; total: number; total_pages: number } }>("/time-off", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<TimeOff>>(`/time-off/${id}`),

  create: (data: CreateTimeOffRequest) =>
    api.post<ApiResponse<TimeOff>>("/time-off", data),

  update: (id: number, data: UpdateTimeOffRequest) =>
    api.put<ApiResponse<TimeOff>>(`/time-off/${id}`, data),

  cancel: (id: number) =>
    api.delete<ApiResponse<null>>(`/time-off/${id}`),

  approve: (id: number) =>
    api.post<ApiResponse<{ message: string }>>(`/time-off/${id}/approve`),

  refuse: (id: number) =>
    api.post<ApiResponse<{ message: string }>>(`/time-off/${id}/refuse`),

  getTypes: () => api.get<ApiResponse<TimeOffType[]>>("/time-off/types"),

  getBalance: () => api.get<ApiResponse<TimeOffBalanceResponse>>("/time-off/balance"),
};
