import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type { Asset } from "../types/asset";

const mapCategory = (categoryName?: string): "hardware" | "facility" | "vehicle" | "other" => {
  if (!categoryName) return "other";
  const name = categoryName.toLowerCase();
  if (name.includes("hard") || name.includes("comp") || name.includes("laptop") || name.includes("pc")) return "hardware";
  if (name.includes("fac") || name.includes("build") || name.includes("room") || name.includes("furn") || name.includes("kursi") || name.includes("meja")) return "facility";
  if (name.includes("mobil") || name.includes("motor") || name.includes("car") || name.includes("vehic")) return "vehicle";
  return "other";
};

export function mapEquipmentToAsset(eq: any): Asset {
  return {
    id: eq.id,
    name: eq.name,
    code: eq.serial_no || eq.code || "-",
    category: mapCategory(eq.category?.name),
    category_name: eq.category?.name || "Lainnya",
    status: eq.active !== false ? "active" : "broken",
    category_id: eq.category_id,
    employee_id: eq.employee_id,
    note: eq.note || "",
    cost: eq.cost || 0,
    assign_date: eq.assign_date || null,
  };
}

export const assetService = {
  async list(params?: { employee_id?: number; page?: number; per_page?: number }): Promise<Asset[]> {
    const res = await api.get<{ success: boolean; data: any[] }>("/equipments", {
      params: { page: 1, per_page: 100, ...params }
    });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data.map(mapEquipmentToAsset);
    }
    return [];
  },

  async getById(id: number): Promise<Asset | null> {
    const res = await api.get<ApiResponse<any>>(`/equipments/${id}`);
    if (res.data && res.data.success && res.data.data) {
      return mapEquipmentToAsset(res.data.data);
    }
    return null;
  },

  async create(data: {
    name: string;
    serial_no: string;
    category_id?: number;
    employee_id?: number;
    note?: string;
    cost?: number;
  }): Promise<Asset> {
    const res = await api.post<ApiResponse<any>>("/equipments", data);
    return mapEquipmentToAsset(res.data.data);
  },

  async update(id: number, data: Partial<{
    name: string;
    serial_no: string;
    category_id?: number;
    employee_id?: number;
    note?: string;
    cost?: number;
    active?: boolean;
  }>): Promise<Asset> {
    const res = await api.put<ApiResponse<any>>(`/equipments/${id}`, data);
    return mapEquipmentToAsset(res.data.data);
  },

  async delete(id: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/equipments/${id}`);
  },

  async listCategories(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>("/equipment-categories", {
      params: { page: 1, per_page: 100 }
    });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  }
};
