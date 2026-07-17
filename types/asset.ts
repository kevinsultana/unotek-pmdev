export interface Asset {
  id: number;
  name: string;
  code: string;
  category: "hardware" | "facility" | "vehicle" | "other";
  status: "active" | "warning" | "broken"; // active = Sedang Digunakan, warning = Rusak Ringan, broken = Rusak Total
  category_id?: number;
  employee_id?: number;
  note?: string;
  cost?: number;
}
