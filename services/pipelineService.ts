import { Platform } from "react-native";
import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  CrmLead,
  CrmLeadCreatePayload,
  CrmLeadUpdatePayload,
  CrmLostReason,
  CrmStage,
  PipelineAttachment,
  PipelineItem,
  PipelineListParams,
  PipelinePriority,
  PipelineStage,
} from "../types/pipeline";

let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

const STORAGE_KEY = "unotek_pipeline_items";

const DEFAULT_STAGES: CrmStage[] = [
  { id: 1, name: "Lead", sequence: 1 },
  { id: 2, name: "Qualification", sequence: 2 },
  { id: 3, name: "Proposal", sequence: 3 },
  { id: 4, name: "Negotiation", sequence: 4 },
  { id: 5, name: "Won", sequence: 5, is_won: true },
  { id: 6, name: "Lost", sequence: 6 },
];

const DEFAULT_LOST_REASONS: CrmLostReason[] = [
  { id: 1, name: "Klien Memilih Kompetitor" },
  { id: 2, name: "Harga Terlalu Tinggi / Budget Tidak Cukup" },
  { id: 3, name: "Spesifikasi Produk Tidak Sesuai" },
  { id: 4, name: "Proyek Dibatalkan / Penundaan Klien" },
  { id: 5, name: "Lainnya" },
];

const INITIAL_PIPELINES: PipelineItem[] = [
  {
    id: "pip-1",
    title: "Pengadaan Server & Infrastructure UNOTEK 2026",
    client: "PT Bank Nusantara Tbk",
    email_from: "contact@banknusantara.co.id",
    phone: "+6281234567890",
    amount: 350000000,
    stage: "Proposal",
    stageId: 3,
    priority: "High",
    probability: 75,
    expectedCloseDate: "2026-08-30",
    notes: "Sudah kirim draft penawaran teknis. Menunggu feedback Direksi IT.",
    createdAt: "2026-07-15",
    wonStatus: "pending",
  },
  {
    id: "pip-2",
    title: "Pengembangan Custom ERP Module HR & Payroll",
    client: "PT Agro Utama Industri",
    email_from: "hrd@agroutama.com",
    phone: "+6281198765432",
    amount: 180000000,
    stage: "Negotiation",
    stageId: 4,
    priority: "High",
    probability: 90,
    expectedCloseDate: "2026-08-10",
    notes: "Negosiasi termin pembayaran 3 tahap.",
    createdAt: "2026-07-18",
    wonStatus: "pending",
  },
  {
    id: "pip-3",
    title: "Sistem Manajemen Kehadiran & IoT Biometric",
    client: "Dinas Perhubungan Provinsi",
    email_from: "dishub@prov.go.id",
    phone: "+6282133445566",
    amount: 95000000,
    stage: "Qualification",
    stageId: 2,
    priority: "Medium",
    probability: 50,
    expectedCloseDate: "2026-09-15",
    notes: "Presentasi produk tahap awal dan penyelarasan spesifikasi perangkat.",
    createdAt: "2026-07-20",
    wonStatus: "pending",
  },
  {
    id: "pip-4",
    title: "Aplikasi Mobile PM & Monitoring Proyek",
    client: "CV Solusi Konstruksi Utama",
    email_from: "project@solusikonstruksi.id",
    phone: "+6281355667788",
    amount: 120000000,
    stage: "Won",
    stageId: 5,
    priority: "High",
    probability: 100,
    expectedCloseDate: "2026-07-22",
    notes: "Kontrak ditandatangani. Siap masuk fase kickoff.",
    createdAt: "2026-07-01",
    wonStatus: "won",
  },
];

// Helper to map backend CrmLead to unified PipelineItem
export function mapCrmLeadToPipelineItem(lead: CrmLead): PipelineItem {
  let stageName: PipelineStage = "Lead";
  if (typeof lead.stage === "string") {
    stageName = (lead.stage as PipelineStage) || "Lead";
  } else if (lead.stage && typeof lead.stage === "object") {
    stageName = (lead.stage.name as PipelineStage) || "Lead";
  } else if (lead.stage_name) {
    stageName = (lead.stage_name as PipelineStage) || "Lead";
  }

  let priority: PipelinePriority = "Medium";
  const prioStr = String(lead.priority ?? "1");
  if (prioStr === "0") priority = "Low";
  else if (prioStr === "1") priority = "Medium";
  else if (prioStr === "2" || prioStr === "3") priority = "High";

  const rawAtts: any[] = Array.isArray(lead.attachments) ? lead.attachments : [];
  const mappedAtts: PipelineAttachment[] = rawAtts.map((att: any) => {
    const fileUrl = att.url || att.download_url || att.uri || "";
    const mime = (att.mimetype || att.type || "").toLowerCase();
    const isImg = mime.includes("image") || !!(att.name || "").match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const sizeMb = att.file_size ? `${(att.file_size / 1024 / 1024).toFixed(2)} MB` : att.size;

    return {
      id: String(att.id || `att-${Date.now()}`),
      name: att.name || "Lampiran Dokumen",
      uri: fileUrl,
      type: isImg ? "image" : "document",
      size: sizeMb,
      createdAt: att.created_at ? att.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    };
  });

  return {
    id: String(lead.id),
    title: lead.name || "Tanpa Judul Prospek",
    client: lead.contact_name || lead.partner_name || "Klien Tidak Diketahui",
    email_from: lead.email_from || "",
    phone: lead.phone || lead.mobile || "",
    amount: lead.expected_revenue || 0,
    stage: stageName,
    stageId: typeof lead.stage === "object" && lead.stage?.id ? lead.stage.id : lead.stage_id,
    priority,
    probability: lead.probability ?? 50,
    expectedCloseDate: lead.date_deadline || new Date().toISOString().split("T")[0],
    notes: lead.description || "",
    attachments: mappedAtts,
    createdAt: lead.created_at ? lead.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    wonStatus: lead.won_status || "pending",
  };
}

async function getStoredItems(): Promise<PipelineItem[]> {
  try {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } else {
      const store = await ensureSecureStore();
      const data = await store.getItemAsync(STORAGE_KEY);
      if (data) return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading pipeline storage", err);
  }
  await saveStoredItems(INITIAL_PIPELINES);
  return INITIAL_PIPELINES;
}

async function saveStoredItems(items: PipelineItem[]): Promise<void> {
  try {
    const jsonStr = JSON.stringify(items);
    if (Platform.OS === "web") {
      localStorage.setItem(STORAGE_KEY, jsonStr);
    } else {
      const store = await ensureSecureStore();
      await store.setItemAsync(STORAGE_KEY, jsonStr);
    }
  } catch (err) {
    console.error("Error saving pipeline storage", err);
  }
}

export const pipelineService = {
  // Fetch CRM Stages from API with local fallback
  fetchStages: async (): Promise<CrmStage[]> => {
    try {
      const res = await api.get<ApiResponse<CrmStage[]> | CrmStage[]>("/crm-stages");
      const data = (res.data as any)?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STAGES;
  },

  // Fetch Lost Reasons from API with local fallback
  fetchLostReasons: async (): Promise<CrmLostReason[]> => {
    try {
      const res = await api.get<ApiResponse<CrmLostReason[]> | CrmLostReason[]>("/crm-lost-reasons");
      const data = (res.data as any)?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_LOST_REASONS;
  },

  // Fetch List of CRM Leads with filters
  list: async (params?: PipelineListParams): Promise<PipelineItem[]> => {
    try {
      const queryParams: Record<string, any> = {
        page: params?.page || 1,
        per_page: params?.per_page || 50,
      };
      if (params?.search?.trim()) queryParams.search = params.search.trim();
      if (params?.stage_id) queryParams.stage_id = params.stage_id;
      if (params?.type) queryParams.type = params.type;
      if (params?.priority !== undefined) queryParams.priority = params.priority;
      if (params?.won_status) queryParams.won_status = params.won_status;

      const res = await api.get<ApiResponse<CrmLead[]> | { data: CrmLead[] } | CrmLead[]>("/crm-leads", {
        params: queryParams,
      });

      let rawList: CrmLead[] = [];
      const resData = res.data as any;
      if (Array.isArray(resData)) {
        rawList = resData;
      } else if (resData?.data && Array.isArray(resData.data)) {
        rawList = resData.data;
      } else if (resData?.data?.data && Array.isArray(resData.data.data)) {
        rawList = resData.data.data;
      }

      if (rawList.length > 0) {
        let mapped = rawList.map(mapCrmLeadToPipelineItem);
        if (params?.stage && params.stage !== "All") {
          mapped = mapped.filter((i) => i.stage === params.stage);
        }
        return mapped;
      }
    } catch (err) {
      console.warn("API /crm-leads failed, falling back to local storage:", err);
    }

    // Local Storage Fallback
    let items = await getStoredItems();
    if (params?.stage && params.stage !== "All") {
      items = items.filter((i) => i.stage === params.stage);
    }
    if (params?.stage_id) {
      items = items.filter((i) => String(i.stageId) === String(params.stage_id));
    }
    if (params?.search?.trim()) {
      const query = params.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.client.toLowerCase().includes(query) ||
          (i.notes && i.notes.toLowerCase().includes(query))
      );
    }
    return items;
  },

  // Get CRM Lead Detail by ID
  getById: async (id: string | number): Promise<PipelineItem | undefined> => {
    try {
      const res = await api.get<ApiResponse<CrmLead> | { data: CrmLead } | CrmLead>(`/crm-leads/${id}`);
      const resData = res.data as any;
      const rawLead: CrmLead = resData?.data || resData;
      if (rawLead && rawLead.id) {
        return mapCrmLeadToPipelineItem(rawLead);
      }
    } catch {
      // Fallback
    }

    const items = await getStoredItems();
    return items.find((i) => String(i.id) === String(id));
  },

  // Create CRM Lead (POST /api/v1/crm-leads)
  create: async (
    data: Omit<PipelineItem, "id" | "createdAt"> & { stageId?: number | string }
  ): Promise<PipelineItem> => {
    const payload: CrmLeadCreatePayload = {
      name: data.title,
      type: "opportunity",
      contact_name: data.client,
      email_from: data.email_from || undefined,
      phone: data.phone || undefined,
      expected_revenue: data.amount,
      probability: data.probability,
      priority: data.priority === "High" ? "2" : data.priority === "Medium" ? "1" : "0",
      stage_id: data.stageId,
      date_deadline: data.expectedCloseDate,
      description: data.notes,
    };

    try {
      const res = await api.post<ApiResponse<CrmLead> | { data: CrmLead }>("/crm-leads", payload);
      const resData = res.data as any;
      const rawLead = resData?.data || resData;
      if (rawLead && rawLead.id) {
        return mapCrmLeadToPipelineItem(rawLead);
      }
    } catch (err) {
      console.warn("API POST /crm-leads failed, saving locally:", err);
    }

    const items = await getStoredItems();
    const newItem: PipelineItem = {
      ...data,
      id: `pip-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newItem, ...items];
    await saveStoredItems(updated);
    return newItem;
  },

  // Update CRM Lead (PUT /api/v1/crm-leads/:id)
  update: async (
    id: string | number,
    data: Partial<Omit<PipelineItem, "id" | "createdAt">> & { stageId?: number | string }
  ): Promise<PipelineItem> => {
    const payload: CrmLeadUpdatePayload = {};
    if (data.title !== undefined) payload.name = data.title;
    if (data.client !== undefined) payload.contact_name = data.client;
    if (data.email_from !== undefined) payload.email_from = data.email_from;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.amount !== undefined) payload.expected_revenue = data.amount;
    if (data.probability !== undefined) payload.probability = data.probability;
    if (data.priority !== undefined) {
      payload.priority = data.priority === "High" ? "2" : data.priority === "Medium" ? "1" : "0";
    }
    if (data.stageId !== undefined) payload.stage_id = data.stageId;
    if (data.expectedCloseDate !== undefined) payload.date_deadline = data.expectedCloseDate;
    if (data.notes !== undefined) payload.description = data.notes;

    if (Object.keys(payload).length > 0) {
      try {
        const res = await api.put<ApiResponse<CrmLead> | { data: CrmLead }>(`/crm-leads/${id}`, payload);
        const resData = res.data as any;
        const rawLead = resData?.data || resData;
        if (rawLead && rawLead.id) {
          return mapCrmLeadToPipelineItem(rawLead);
        }
      } catch (err) {
        // Backend optional validation fallback
      }
    }

    const items = await getStoredItems();
    const index = items.findIndex((i) => String(i.id) === String(id));
    if (index !== -1) {
      const updatedItem = { ...items[index], ...data };
      items[index] = updatedItem;
      await saveStoredItems(items);
      return updatedItem;
    }

    return {
      id: String(id),
      title: data.title || "",
      client: data.client || "",
      amount: data.amount || 0,
      stage: (data.stage || "Lead") as PipelineStage,
      priority: (data.priority || "Medium") as PipelinePriority,
      probability: data.probability || 50,
      expectedCloseDate: data.expectedCloseDate || "",
      notes: data.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      ...data,
    };
  },

  // Delete CRM Lead
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(`/crm-leads/${id}`);
    } catch {
      // Ignore API failure for local fallback
    }

    const items = await getStoredItems();
    const filtered = items.filter((i) => String(i.id) !== String(id));
    await saveStoredItems(filtered);
    return true;
  },

  // Move Stage Endpoint
  moveStage: async (
    id: string | number,
    stageId: number | string,
    probability?: number,
    leadName?: string
  ): Promise<boolean> => {
    try {
      await api.post(`/crm-leads/${id}/move-stage`, { stage_id: stageId });
      if (probability !== undefined) {
        const payload: Record<string, any> = { probability };
        if (leadName) payload.name = leadName;
        await api.put(`/crm-leads/${id}`, payload).catch(() => {});
      }
    } catch (err) {
      // Fallback
    }
    const items = await getStoredItems();
    const index = items.findIndex((i) => String(i.id) === String(id));
    if (index !== -1) {
      items[index].stageId = stageId;
      if (probability !== undefined) {
        items[index].probability = probability;
      }
      await saveStoredItems(items);
    }
    return true;
  },

  // Mark as Won Endpoint
  markWon: async (id: string | number): Promise<boolean> => {
    try {
      await api.post(`/crm-leads/${id}/mark-won`);
    } catch {
      // Fallback
    }
    const items = await getStoredItems();
    const index = items.findIndex((i) => String(i.id) === String(id));
    if (index !== -1) {
      items[index].stage = "Won";
      items[index].probability = 100;
      items[index].wonStatus = "won";
      await saveStoredItems(items);
    }
    return true;
  },

  // Mark as Lost Endpoint
  markLost: async (
    id: string | number,
    lostReasonId?: number,
    lostFeedback?: string
  ): Promise<boolean> => {
    try {
      await api.post(`/crm-leads/${id}/mark-lost`, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
    } catch {
      // Fallback
    }
    const items = await getStoredItems();
    const index = items.findIndex((i) => String(i.id) === String(id));
    if (index !== -1) {
      items[index].stage = "Lost";
      items[index].probability = 0;
      items[index].wonStatus = "lost";
      await saveStoredItems(items);
    }
    return true;
  },

  // Attachments
  addAttachment: async (
    pipelineId: string | number,
    attachment: Omit<PipelineAttachment, "id" | "createdAt">
  ): Promise<PipelineAttachment> => {
    try {
      const formData = new FormData();
      formData.append("lead_id", String(pipelineId));
      formData.append("file", {
        uri: attachment.uri,
        name: attachment.name,
        type: attachment.type === "image" ? "image/jpeg" : "application/pdf",
      } as any);

      await api.post("/crm-leads/upload-attachment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.warn("API /crm-leads/upload-attachment failed, saving locally:", err);
    }

    const newAtt: PipelineAttachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const items = await getStoredItems();
    const index = items.findIndex((i) => String(i.id) === String(pipelineId));
    if (index !== -1) {
      const existingAtts = items[index].attachments || [];
      items[index].attachments = [newAtt, ...existingAtts];
      await saveStoredItems(items);
    }
    return newAtt;
  },

  removeAttachment: async (
    pipelineId: string | number,
    attachmentId: string | number
  ): Promise<boolean> => {
    try {
      await api.delete(`/crm-leads/attachments/${attachmentId}`);
    } catch {
      // Fallback
    }

    const items = await getStoredItems();
    const index = items.findIndex((i) => String(i.id) === String(pipelineId));
    if (index !== -1) {
      const existingAtts = items[index].attachments || [];
      items[index].attachments = existingAtts.filter((a) => String(a.id) !== String(attachmentId));
      await saveStoredItems(items);
    }
    return true;
  },
};
