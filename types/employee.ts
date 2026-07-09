export interface Employee {
  id: number;
  name: string;
  work_email: string | null;
  work_phone: string | null;
  mobile_phone?: string | null;
  job_title: string | null;
  department_id?: number | null;
  department?: {
    id: number;
    name: string;
  } | null;
  private_email?: string | null;
  private_phone?: string | null;
  birthday?: string | null;
  sex?: "male" | "female" | null;
  marital?: "single" | "married" | "cohabitant" | "widower" | "divorced" | null;
  identification_id?: string | null;
}
