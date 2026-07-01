import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
} from "../types/auth";

export const authService = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", data),

  refresh: (data: RefreshRequest) =>
    api.post<ApiResponse<RefreshResponse>>("/auth/refresh", data),

  logout: () => api.post<ApiResponse<null>>("/auth/logout"),
};
