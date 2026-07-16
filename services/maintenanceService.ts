import { Platform } from "react-native";
import { MaintenanceRequest } from "../types/maintenance";

let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

const STORAGE_KEY = "unotek_maintenance_requests";

// Initial dummy data
const DUMMY_DATA: MaintenanceRequest[] = [
  {
    id: 101,
    asset_name: "MacBook Pro M1 2020",
    asset_code: "AST-2023-009",
    category: "hardware",
    title: "Keyboard double-typing (chattering)",
    description: "Tombol 'E' dan 'I' sering mengetik dua kali ketika ditekan sekali. Sangat mengganggu ketika sedang mengetik kode program.",
    urgency: "high",
    state: "in_progress",
    date: "2026-07-10",
    notes: "Teknisi sedang memesan replacement keyboard switch. Estimasi selesai tanggal 18 Juli.",
    images: []
  },
  {
    id: 102,
    asset_name: "Kursi Kerja Ergonomis J9",
    asset_code: "AST-2024-041",
    category: "facility",
    title: "Gas lift hydraulic bocor / merosot",
    description: "Kursi terus turun sendiri ke posisi paling rendah setelah diduduki selama beberapa menit. Tidak bisa menahan beban.",
    urgency: "medium",
    state: "done",
    date: "2026-07-05",
    notes: "Sudah diganti sparepart hidrolik baru oleh vendor pada 8 Juli 2026. Kursi sudah berfungsi stabil kembali.",
    images: []
  },
  {
    id: 103,
    asset_name: "Monitor Dell UltraSharp U2422H",
    asset_code: "AST-2024-012",
    category: "hardware",
    title: "Layar berkedip (flickering) setelah panas",
    description: "Layar monitor mulai berkedip-kedip setelah digunakan sekitar 2 jam. Sudah dicoba ganti kabel HDMI/DisplayPort tapi masalah tetap ada.",
    urgency: "critical",
    state: "draft",
    date: "2026-07-15",
    images: []
  }
];

export const maintenanceService = {
  async getStorageData(): Promise<MaintenanceRequest[]> {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_DATA));
        return DUMMY_DATA;
      }
      return JSON.parse(data);
    }
    try {
      const store = await ensureSecureStore();
      const data = await store.getItemAsync(STORAGE_KEY);
      if (!data) {
        await store.setItemAsync(STORAGE_KEY, JSON.stringify(DUMMY_DATA));
        return DUMMY_DATA;
      }
      return JSON.parse(data);
    } catch {
      return DUMMY_DATA;
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
    return this.getStorageData();
  },

  async getById(id: number): Promise<MaintenanceRequest | null> {
    const list = await this.list();
    return list.find((item) => item.id === id) || null;
  },

  async create(req: Omit<MaintenanceRequest, "id" | "state" | "date" | "notes"> & { state?: MaintenanceRequest["state"] }): Promise<MaintenanceRequest> {
    const list = await this.list();
    const newId = list.length > 0 ? Math.max(...list.map(item => item.id)) + 1 : 1;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    
    const newRequest: MaintenanceRequest = {
      id: newId,
      ...req,
      state: req.state || "draft",
      date: formattedDate,
      notes: undefined
    };

    list.unshift(newRequest); // Add to beginning
    await this.saveStorageData(list);
    return newRequest;
  },

  async update(id: number, req: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const list = await this.list();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) {
      throw new Error("Data tidak ditemukan");
    }

    // Only draft state can be edited (unless updating state/notes internally by tech mockup)
    if (list[idx].state !== "draft" && !req.state && req.state === undefined && !req.notes && req.notes === undefined) {
      throw new Error("Hanya pengajuan dengan status Draft yang dapat diubah.");
    }

    list[idx] = {
      ...list[idx],
      ...req
    };

    await this.saveStorageData(list);
    return list[idx];
  },

  async delete(id: number): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) {
      throw new Error("Data tidak ditemukan");
    }

    if (list[idx].state !== "draft") {
      throw new Error("Hanya pengajuan dengan status Draft yang dapat dihapus.");
    }

    const filtered = list.filter(item => item.id !== id);
    await this.saveStorageData(filtered);
  },

  async submit(id: number): Promise<MaintenanceRequest> {
    return this.update(id, { state: "submitted" });
  }
};
