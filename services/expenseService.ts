import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  Expense,
  ExpenseCategory,
  ExpenseAttachment,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from "../types/expense";

export const expenseService = {
  list: (params?: {
    page?: number;
    per_page?: number;
    state?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }) =>
    api.get<{
      success: boolean;
      data: Expense[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>("/expenses", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Expense>>(`/expenses/${id}`),

  create: (data: CreateExpenseRequest) =>
    api.post<ApiResponse<Expense>>("/expenses", data),

  update: (id: number, data: UpdateExpenseRequest) =>
    api.put<ApiResponse<Expense>>(`/expenses/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/expenses/${id}`),

  submit: (id: number) =>
    api.post<ApiResponse<{ message: string }>>(`/expenses/${id}/submit`),

  approve: (id: number) =>
    api.post<ApiResponse<{ message: string }>>(`/expenses/${id}/approve`),

  refuse: (id: number, reason?: string) =>
    api.post<ApiResponse<{ message: string }>>(`/expenses/${id}/refuse`, {
      reason,
    }),

  uploadAttachment: async (fileUri: string, expenseId?: number) => {
    const formData = new FormData();
    const uriParts = fileUri.split(".");
    const fileExtension = uriParts[uriParts.length - 1] || "jpg";
    
    // Typecast to any to satisfy React Native FormData append signature
    formData.append("file", {
      uri: fileUri,
      name: `attachment_${Date.now()}.${fileExtension}`,
      type: `image/${fileExtension === "png" ? "png" : "jpeg"}`,
    } as any);

    if (expenseId !== undefined) {
      formData.append("expense_id", String(expenseId));
    }

    return api.post<ApiResponse<ExpenseAttachment>>(
      "/expenses/upload-attachment",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  listAttachments: (expenseId: number) =>
    api.get<ApiResponse<ExpenseAttachment[]>>(`/expenses/${expenseId}/attachments`),

  deleteAttachment: (attachmentId: number) =>
    api.delete<ApiResponse<null>>(`/expenses/attachments/${attachmentId}`),

  listCategories: () =>
    api.get<ApiResponse<ExpenseCategory[]>>("/expenses/categories"),
};
