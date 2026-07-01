import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type { ProfileResponse } from "../types/profile";

export const profileService = {
  getProfile: () => api.get<ApiResponse<ProfileResponse>>("/profile"),
};
