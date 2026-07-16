import { Platform } from "react-native";
import { Asset } from "../types/asset";

let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

const STORAGE_KEY = "unotek_profile_assets";

// Initial dummy data matching maintenance assets
const DUMMY_DATA: Asset[] = [
  {
    id: 1,
    name: "MacBook Pro M1 2020",
    code: "AST-2023-009",
    category: "hardware",
    status: "active",
  },
  {
    id: 2,
    name: "Kursi Kerja Ergonomis J9",
    code: "AST-2024-041",
    category: "facility",
    status: "active",
  },
  {
    id: 3,
    name: "Monitor Dell UltraSharp U2422H",
    code: "AST-2024-012",
    category: "hardware",
    status: "warning",
  },
];

export const assetService = {
  async getStorageData(): Promise<Asset[]> {
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

  async saveStorageData(data: Asset[]): Promise<void> {
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

  async list(): Promise<Asset[]> {
    return this.getStorageData();
  },

  async getById(id: number): Promise<Asset | null> {
    const list = await this.list();
    return list.find((item) => item.id === id) || null;
  },

  async create(req: Omit<Asset, "id">): Promise<Asset> {
    const list = await this.list();
    const newId = list.length > 0 ? Math.max(...list.map((item) => item.id)) + 1 : 1;

    const newAsset: Asset = {
      id: newId,
      ...req,
    };

    list.push(newAsset);
    await this.saveStorageData(list);
    return newAsset;
  },

  async update(id: number, req: Partial<Asset>): Promise<Asset> {
    const list = await this.list();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error("Asset tidak ditemukan");
    }

    list[idx] = {
      ...list[idx],
      ...req,
    };

    await this.saveStorageData(list);
    return list[idx];
  },

  async delete(id: number): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error("Asset tidak ditemukan");
    }

    const filtered = list.filter((item) => item.id !== id);
    await this.saveStorageData(filtered);
  },
};
