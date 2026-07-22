import { Platform } from "react-native";
import type { PipelineItem, PipelineListParams, PipelineStage, PipelinePriority } from "../types/pipeline";

let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

const STORAGE_KEY = "unotek_pipeline_items";

const INITIAL_PIPELINES: PipelineItem[] = [
  {
    id: "pip-1",
    title: "Pengadaan Server & Infrastructure UNOTEK 2026",
    client: "PT Bank Nusantara Tbk",
    amount: 350000000,
    stage: "Proposal",
    priority: "High",
    probability: 75,
    expectedCloseDate: "2026-08-30",
    notes: "Sudah kirim draft penawaran teknis. Menunggu feedback Direksi IT.",
    createdAt: "2026-07-15",
  },
  {
    id: "pip-2",
    title: "Pengembangan Custom ERP Module HR & Payroll",
    client: "PT Agro Utama Industri",
    amount: 180000000,
    stage: "Negotiation",
    priority: "High",
    probability: 90,
    expectedCloseDate: "2026-08-10",
    notes: "Negosiasi termin pembayaran 3 tahap.",
    createdAt: "2026-07-18",
  },
  {
    id: "pip-3",
    title: "Sistem Manajemen Kehadiran & IoT Biometric",
    client: "Dinas Perhubungan Provinsi",
    amount: 95000000,
    stage: "Qualification",
    priority: "Medium",
    probability: 50,
    expectedCloseDate: "2026-09-15",
    notes: "Presentasi produk tahap awal dan penyelarasan spesifikasi perangkat.",
    createdAt: "2026-07-20",
  },
  {
    id: "pip-4",
    title: "Aplikasi Mobile PM & Monitoring Proyek",
    client: "CV Solusi Konstruksi Utama",
    amount: 120000000,
    stage: "Won",
    priority: "High",
    probability: 100,
    expectedCloseDate: "2026-07-22",
    notes: "Kontrak ditandatangani. Siap masuk fase kickoff.",
    createdAt: "2026-07-01",
  },
];

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
  // Default initial data
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
  list: async (params?: PipelineListParams): Promise<PipelineItem[]> => {
    let items = await getStoredItems();
    if (params?.stage && params.stage !== "All") {
      items = items.filter((i) => i.stage === params.stage);
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

  getById: async (id: string): Promise<PipelineItem | undefined> => {
    const items = await getStoredItems();
    return items.find((i) => i.id === id);
  },

  create: async (
    data: Omit<PipelineItem, "id" | "createdAt">
  ): Promise<PipelineItem> => {
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

  update: async (
    id: string,
    data: Partial<Omit<PipelineItem, "id" | "createdAt">>
  ): Promise<PipelineItem> => {
    const items = await getStoredItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Pipeline tidak ditemukan");

    const updatedItem = { ...items[index], ...data };
    items[index] = updatedItem;
    await saveStoredItems(items);
    return updatedItem;
  },

  delete: async (id: string): Promise<boolean> => {
    const items = await getStoredItems();
    const filtered = items.filter((i) => i.id !== id);
    await saveStoredItems(filtered);
    return true;
  },

  addAttachment: async (
    pipelineId: string,
    attachment: Omit<import("../types/pipeline").PipelineAttachment, "id" | "createdAt">
  ): Promise<import("../types/pipeline").PipelineAttachment> => {
    const items = await getStoredItems();
    const index = items.findIndex((i) => i.id === pipelineId);
    if (index === -1) throw new Error("Pipeline tidak ditemukan");

    const newAtt: import("../types/pipeline").PipelineAttachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const existingAtts = items[index].attachments || [];
    items[index].attachments = [newAtt, ...existingAtts];
    await saveStoredItems(items);
    return newAtt;
  },

  removeAttachment: async (
    pipelineId: string,
    attachmentId: string
  ): Promise<boolean> => {
    const items = await getStoredItems();
    const index = items.findIndex((i) => i.id === pipelineId);
    if (index === -1) throw new Error("Pipeline tidak ditemukan");

    const existingAtts = items[index].attachments || [];
    items[index].attachments = existingAtts.filter((a) => a.id !== attachmentId);
    await saveStoredItems(items);
    return true;
  },
};
