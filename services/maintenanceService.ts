import { Platform } from "react-native";
import { Equipment, MaintenanceRequest, MaintenanceStage, MaintenanceTeam } from "../types/maintenance";
import { api } from "./api";
import type { ApiResponse } from "../types/api";

let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

const STORAGE_KEY = "unotek_maintenance_requests";
const IMAGES_STORAGE_KEY = "unotek_maintenance_images";

// ──────────────────────────────────────────────
// Local secure storage helper for images mapping
// ──────────────────────────────────────────────
async function getLocalImagesMap(): Promise<Record<number, string[]>> {
  if (Platform.OS === "web") {
    const data = localStorage.getItem(IMAGES_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }
  try {
    const store = await ensureSecureStore();
    const data = await store.getItemAsync(IMAGES_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

async function saveLocalImagesMap(map: Record<number, string[]>): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(map));
    return;
  }
  try {
    const store = await ensureSecureStore();
    await store.setItemAsync(IMAGES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// ──────────────────────────────────────────────
// Helpers to map server models to app UI models
// ──────────────────────────────────────────────
const mapCategory = (categoryName?: string): "hardware" | "software" | "facility" | "other" => {
  if (!categoryName) return "other";
  const name = categoryName.toLowerCase();
  if (name.includes("hard") || name.includes("comp") || name.includes("laptop") || name.includes("pc")) return "hardware";
  if (name.includes("soft") || name.includes("app") || name.includes("licens")) return "software";
  if (name.includes("fac") || name.includes("build") || name.includes("room") || name.includes("furn") || name.includes("kursi") || name.includes("meja")) return "facility";
  return "other";
};

const priorityToUrgency = (priority?: string): "low" | "medium" | "high" | "critical" => {
  switch (priority) {
    case "0": return "low";
    case "1": return "medium";
    case "2": return "high";
    case "3": return "critical";
    default: return "low";
  }
};

const urgencyToPriority = (urgency?: "low" | "medium" | "high" | "critical"): string => {
  switch (urgency) {
    case "low": return "0";
    case "medium": return "1";
    case "high": return "2";
    case "critical": return "3";
    default: return "0";
  }
};

const stageToState = (stageName?: string): "draft" | "submitted" | "in_progress" | "done" | "refused" => {
  if (!stageName) return "submitted";
  const name = stageName.toLowerCase();
  if (name.includes("draft")) return "draft";
  if (name.includes("new") || name.includes("ajuk") || name.includes("request")) return "submitted";
  if (name.includes("progress") || name.includes("proses") || name.includes("jalan")) return "in_progress";
  if (name.includes("repaired") || name.includes("selesai") || name.includes("done") || name.includes("solve")) return "done";
  if (name.includes("scrap") || name.includes("tolak") || name.includes("refuse")) return "refused";
  return "submitted";
};

async function mapServerRequest(item: any, imagesMap: Record<number, string[]>): Promise<MaintenanceRequest> {
  const urgency = priorityToUrgency(item.priority);
  const state = stageToState(item.stage?.name);

  return {
    id: item.id,
    title: item.name,
    description: item.description || "",
    urgency,
    state,
    date: item.request_date || (item.created_at ? item.created_at.substring(0, 10) : ""),
    notes: item.notes || "",
    asset_name: item.equipment?.name || "Peralatan Umum",
    asset_code: item.equipment?.code || "-",
    category: mapCategory(item.equipment?.category?.name),
    images: imagesMap[item.id] || [],
    equipment_id: item.equipment_id,
    stage_id: item.stage_id,
    maintenance_team_id: item.maintenance_team_id,
    maintenance_type: item.maintenance_type || "corrective",
  };
}

export const maintenanceService = {
  async getStorageData(): Promise<MaintenanceRequest[]> {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    }
    try {
      const store = await ensureSecureStore();
      const data = await store.getItemAsync(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async saveStorageData(data: MaintenanceRequest[]): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return;
    }
    try {
      const store = await ensureSecureStore();
      await store.setItemAsync(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  async list(): Promise<MaintenanceRequest[]> {
    let serverRequests: MaintenanceRequest[] = [];
    try {
      const res = await api.get<{ success: boolean; data: any[] }>("/maintenance-requests", {
        params: { page: 1, per_page: 100 }
      });
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const imagesMap = await getLocalImagesMap();
        serverRequests = await Promise.all(
          res.data.data.map((item) => mapServerRequest(item, imagesMap))
        );
      }
    } catch (err) {
      console.warn("Failed to fetch maintenance requests from server:", err);
    }

    const localDrafts = await this.getStorageData();

    // Sort: newest draft first, then newest server request
    return [...localDrafts, ...serverRequests];
  },

  async getById(id: number): Promise<MaintenanceRequest | null> {
    const drafts = await this.getStorageData();
    const draft = drafts.find((item) => item.id === id);
    if (draft) return draft;

    const res = await api.get<ApiResponse<any>>(`/maintenance-requests/${id}`);
    if (res.data && res.data.success && res.data.data) {
      const imagesMap = await getLocalImagesMap();
      return mapServerRequest(res.data.data, imagesMap);
    }
    return null;
  },

  async create(req: Omit<MaintenanceRequest, "id" | "state" | "date" | "notes"> & { state?: MaintenanceRequest["state"] }): Promise<MaintenanceRequest> {
    if (req.state === "draft") {
      const list = await this.list();
      const drafts = list.filter(item => item.state === "draft");
      const newId = drafts.length > 0 ? Math.max(...drafts.map(item => item.id)) + 1 : 1000;
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const newRequest: MaintenanceRequest = {
        id: newId,
        ...req,
        state: "draft",
        date: formattedDate,
        notes: undefined
      };

      const draftsList = await this.getStorageData();
      draftsList.unshift(newRequest);
      await this.saveStorageData(draftsList);
      return newRequest;
    }

    // Submit directly to API
    const res = await api.post<ApiResponse<any>>("/maintenance-requests", {
      name: req.title,
      equipment_id: req.equipment_id,
      maintenance_type: req.maintenance_type || "corrective",
      description: req.description,
      priority: urgencyToPriority(req.urgency),
      maintenance_team_id: req.maintenance_team_id,
      stage_id: req.stage_id,
    });

    const serverReq = res.data.data;
    if (req.images && req.images.length > 0) {
      const imagesMap = await getLocalImagesMap();
      imagesMap[serverReq.id] = req.images;
      await saveLocalImagesMap(imagesMap);
    }

    const imagesMap = await getLocalImagesMap();
    return mapServerRequest(serverReq, imagesMap);
  },

  async update(id: number, req: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const drafts = await this.getStorageData();
    const draftIdx = drafts.findIndex(item => item.id === id);

    if (draftIdx !== -1) {
      drafts[draftIdx] = {
        ...drafts[draftIdx],
        ...req
      };
      await this.saveStorageData(drafts);
      return drafts[draftIdx];
    }

    const payload: any = {
      name: req.title,
      priority: req.urgency ? urgencyToPriority(req.urgency) : undefined,
      description: req.description,
      equipment_id: req.equipment_id,
      stage_id: req.stage_id,
      maintenance_type: req.maintenance_type,
      maintenance_team_id: req.maintenance_team_id,
    };

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const res = await api.put<ApiResponse<any>>(`/maintenance-requests/${id}`, payload);
    const serverReq = res.data.data;

    if (req.images) {
      const imagesMap = await getLocalImagesMap();
      imagesMap[id] = req.images;
      await saveLocalImagesMap(imagesMap);
    }

    const imagesMap = await getLocalImagesMap();
    return mapServerRequest(serverReq, imagesMap);
  },

  async delete(id: number): Promise<void> {
    const drafts = await this.getStorageData();
    const draftIdx = drafts.findIndex(item => item.id === id);

    if (draftIdx !== -1) {
      const filtered = drafts.filter(item => item.id !== id);
      await this.saveStorageData(filtered);
    } else {
      await api.delete<ApiResponse<null>>(`/maintenance-requests/${id}`);
      const imagesMap = await getLocalImagesMap();
      if (imagesMap[id]) {
        delete imagesMap[id];
        await saveLocalImagesMap(imagesMap);
      }
    }
  },

  async submit(id: number): Promise<MaintenanceRequest> {
    const drafts = await this.getStorageData();
    const draft = drafts.find(item => item.id === id);
    if (!draft) {
      throw new Error("Draft tidak ditemukan");
    }

    const res = await api.post<ApiResponse<any>>("/maintenance-requests", {
      name: draft.title,
      equipment_id: draft.equipment_id,
      maintenance_type: draft.maintenance_type || "corrective",
      description: draft.description,
      priority: urgencyToPriority(draft.urgency),
      maintenance_team_id: draft.maintenance_team_id,
      stage_id: draft.stage_id,
    });

    const serverReq = res.data.data;
    if (draft.images && draft.images.length > 0) {
      const imagesMap = await getLocalImagesMap();
      imagesMap[serverReq.id] = draft.images;
      await saveLocalImagesMap(imagesMap);
    }

    // Delete draft from local store
    const filtered = drafts.filter(item => item.id !== id);
    await this.saveStorageData(filtered);

    const imagesMap = await getLocalImagesMap();
    return mapServerRequest(serverReq, imagesMap);
  },

  async listEquipments(search?: string): Promise<Equipment[]> {
    const res = await api.get<{ success: boolean; data: any[] }>("/equipments", {
      params: { page: 1, per_page: 100, search }
    });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async listStages(): Promise<MaintenanceStage[]> {
    const res = await api.get<ApiResponse<any[]>>("/maintenance-stages");
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async listTeams(): Promise<MaintenanceTeam[]> {
    const res = await api.get<ApiResponse<any[]>>("/maintenance-teams");
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  }
};
