// Generic API response wrapper — Postman format
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Standard pagination params
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// Standard paginated response
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
