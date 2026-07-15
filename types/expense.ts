export interface ExpenseCategory {
  id: number;
  name: string;
  standard_price?: number;
  uom?: string | null;
}

export interface ExpenseAttachment {
  id: number;
  name: string;
  mimetype?: string;
  file_size?: number;
  url: string;
}

export interface ExpenseLine {
  id: number;
  name: string;
  product_id: number;
  product?: {
    id: number;
    name: string;
  } | null;
  quantity: number;
  price_unit: number;
  total_amount?: number;
  attachments?: ExpenseAttachment[];
}

export interface CreateExpenseLineRequest {
  name: string;
  product_id: number;
  quantity?: number;
  price_unit: number;
}

export interface Expense {
  id: number;
  name: string;
  total_amount_currency: number;
  date: string;
  reference: string | null;
  description: string | null;
  quantity: number;
  product?: {
    id: number;
    name: string;
  } | null;
  state: "draft" | "submitted" | "approved" | "done" | "refused";
  state_label?: string;
  attachment_ids?: number[];
  attachments?: ExpenseAttachment[];
  lines?: ExpenseLine[];
}

export interface CreateExpenseRequest {
  name: string;
  product_id?: number;
  total_amount_currency?: number;
  date?: string;
  reference?: string;
  description?: string;
  quantity?: number;
  attachment_ids?: number[];
  lines?: CreateExpenseLineRequest[];
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;
