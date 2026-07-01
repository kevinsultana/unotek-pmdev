import { api } from "./api";
import type { ApiResponse } from "../types/api";

export const perusahaanService = {
  // Speculative endpoints — may not exist on the server
  listEmployees: (params?: { search?: string }) =>
    api.get<ApiResponse<unknown[]>>("/users", { params }),

  listEvents: () =>
    api.get<ApiResponse<unknown[]>>("/announcements"),
};
