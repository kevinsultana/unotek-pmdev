import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type { Employee } from "../types/employee";

export const employeeService = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    department_id?: number;
  }) =>
    api.get<{
      success: boolean;
      data: Employee[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>("/employees", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Employee>>(`/employees/${id}`),

  create: (data: Partial<Employee>) =>
    api.post<ApiResponse<Employee>>("/employees", data),

  update: (id: number, data: Partial<Employee>) =>
    api.put<ApiResponse<Employee>>(`/employees/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/employees/${id}`),
};
