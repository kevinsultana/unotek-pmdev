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
  state: "draft" | "reported" | "approved" | "done" | "refused";
  state_label?: string;
  attachment_ids?: number[];
  attachments?: ExpenseAttachment[];
}

export interface CreateExpenseRequest {
  name: string;
  product_id: number;
  total_amount_currency: number;
  date?: string;
  reference?: string;
  description?: string;
  quantity?: number;
  attachment_ids?: number[];
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;
