import { Platform } from "react-native";
import { api } from "./api";
import type { ApiResponse, PaginatedData } from "../types/api";
import type {
  Contact,
  ContactCreateParams,
  ContactListParams,
  ContactTag,
  ContactUpdateParams,
} from "../types/contact";

let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

const STORAGE_KEY = "unotek_contacts_list";

// Initial mock contacts for fallback / demo
const INITIAL_MOCK_CONTACTS: Contact[] = [
  {
    id: 101,
    name: "PT. Bank Nusantara Tbk",
    company_type: "company",
    email: "contact@banknusantara.co.id",
    phone: "+62215551234",
    website: "https://www.banknusantara.co.id",
    vat: "01.234.567.8-012.000",
    street: "Jl. Jend. Sudirman No. 45",
    city: "Jakarta Selatan",
    zip: "12190",
    comment: "Klien perbankan utama sektor enterprise",
    active: true,
    created_at: "2026-01-10",
  },
  {
    id: 102,
    name: "Budi Santoso",
    company_type: "person",
    email: "budi.santoso@banknusantara.co.id",
    phone: "+62215551234",
    mobile: "+6281234567890",
    function: "Head of IT & Technology",
    parent_id: 101,
    company_name: "PT. Bank Nusantara Tbk",
    street: "Jl. Jend. Sudirman No. 45",
    city: "Jakarta Selatan",
    zip: "12190",
    comment: "PIC utama pengadaan infrastructure",
    active: true,
    created_at: "2026-01-11",
  },
  {
    id: 103,
    name: "Siti Rahmawati",
    company_type: "person",
    email: "siti.rahma@banknusantara.co.id",
    phone: "+62215551235",
    mobile: "+6281899887766",
    function: "Procurement Manager",
    parent_id: 101,
    company_name: "PT. Bank Nusantara Tbk",
    street: "Jl. Jend. Sudirman No. 45",
    city: "Jakarta Selatan",
    zip: "12190",
    comment: "Kontak untuk administrasi kontrak & penawaran",
    active: true,
    created_at: "2026-01-12",
  },
  {
    id: 201,
    name: "PT. Agro Utama Industri",
    company_type: "company",
    email: "info@agroutama.com",
    phone: "+62218889900",
    website: "https://www.agroutama.com",
    vat: "02.987.654.3-045.000",
    street: "Kawasan Industri Jababeka 2 Block C",
    city: "Cikarang",
    zip: "17530",
    comment: "Perusahaan manufaktur & perkebunan",
    active: true,
    created_at: "2026-02-01",
  },
  {
    id: 202,
    name: "Hendrik Wijaya",
    company_type: "person",
    email: "hendrik@agroutama.com",
    phone: "+62218889900",
    mobile: "+6281198765432",
    function: "Director of Operations",
    parent_id: 201,
    company_name: "PT. Agro Utama Industri",
    street: "Kawasan Industri Jababeka 2 Block C",
    city: "Cikarang",
    zip: "17530",
    comment: "Pengambil keputusan HR & ERP project",
    active: true,
    created_at: "2026-02-05",
  },
  {
    id: 301,
    name: "CV. Solusi Konstruksi Utama",
    company_type: "company",
    email: "info@solusikonstruksi.id",
    phone: "+62227776655",
    website: "https://www.solusikonstruksi.id",
    vat: "03.111.222.3-444.000",
    street: "Jl. Soekarno Hatta No. 128",
    city: "Bandung",
    zip: "40235",
    comment: "Kontraktor dan pengembang infrastruktur regional",
    active: true,
    created_at: "2026-03-15",
  },
];

async function loadLocalContacts(): Promise<Contact[]> {
  try {
    if (Platform.OS === "web") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } else {
      const store = await ensureSecureStore();
      const raw = await store.getItemAsync(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed loading contacts from local storage:", e);
  }
  return INITIAL_MOCK_CONTACTS;
}

async function saveLocalContacts(contacts: Contact[]): Promise<void> {
  try {
    const raw = JSON.stringify(contacts);
    if (Platform.OS === "web") {
      localStorage.setItem(STORAGE_KEY, raw);
    } else {
      const store = await ensureSecureStore();
      await store.setItemAsync(STORAGE_KEY, raw);
    }
  } catch (e) {
    console.warn("Failed saving contacts to local storage:", e);
  }
}

export const contactService = {
  /**
   * Fetch list of contacts with pagination and optional filters:
   * - company_type: 'company' | 'person'
   * - search: string
   * - parent_id: number
   * - active: boolean
   */
  async list(params: ContactListParams = {}): Promise<PaginatedData<Contact>> {
    try {
      const response = await api.get<ApiResponse<PaginatedData<Contact> | Contact[]>>(
        "contacts",
        { params }
      );

      if (response.data && response.data.success && response.data.data) {
        const rawData = response.data.data;
        if (Array.isArray(rawData)) {
          return {
            items: rawData,
            total: rawData.length,
            page: params.page || 1,
            per_page: params.per_page || 20,
            total_pages: 1,
          };
        }
        return rawData;
      }
    } catch (error) {
      console.warn("API list contacts error, using local storage fallback:", error);
    }

    // Fallback to local storage
    const allContacts = await loadLocalContacts();
    let filtered = allContacts.filter((c) => c.active !== false);

    if (params.company_type) {
      filtered = filtered.filter((c) => c.company_type === params.company_type);
    }

    if (params.parent_id) {
      filtered = filtered.filter((c) => {
        const pId = typeof c.parent_id === "object" ? c.parent_id?.id : c.parent_id;
        return pId === params.parent_id;
      });
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.vat?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
      );
    }

    const page = params.page || 1;
    const perPage = params.per_page || 20;
    const startIndex = (page - 1) * perPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + perPage);

    return {
      items: paginatedItems,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage) || 1,
    };
  },

  /**
   * Fetch single contact detail by ID
   */
  async getById(id: number): Promise<Contact> {
    try {
      const response = await api.get<ApiResponse<Contact>>(`contacts/${id}`);
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`API get contact ${id} error, fallback to local storage:`, error);
    }

    const all = await loadLocalContacts();
    const found = all.find((c) => c.id === id);
    if (!found) {
      throw new Error(`Contact with ID ${id} not found.`);
    }

    // If company, attach linked persons
    if (found.company_type === "company") {
      const persons = all.filter((c) => {
        const pId = typeof c.parent_id === "object" ? c.parent_id?.id : c.parent_id;
        return c.company_type === "person" && pId === id && c.active !== false;
      });
      return { ...found, child_ids: persons, persons };
    }

    return found;
  },

  /**
   * Fetch persons (child contacts) linked to a specific company ID
   */
  async getPersonsForCompany(companyId: number): Promise<Contact[]> {
    try {
      const response = await api.get<ApiResponse<PaginatedData<Contact> | Contact[]>>(
        "contacts",
        {
          params: {
            company_type: "person",
            parent_id: companyId,
          },
        }
      );

      if (response.data && response.data.success && response.data.data) {
        const rawData = response.data.data;
        if (Array.isArray(rawData)) return rawData;
        return rawData.items || [];
      }
    } catch (error) {
      console.warn("API getPersonsForCompany error, fallback to local storage:", error);
    }

    const all = await loadLocalContacts();
    return all.filter((c) => {
      const pId = typeof c.parent_id === "object" ? c.parent_id?.id : c.parent_id;
      return c.company_type === "person" && pId === companyId && c.active !== false;
    });
  },

  /**
   * Create new contact (Company or Person)
   */
  async create(payload: ContactCreateParams): Promise<Contact> {
    try {
      const response = await api.post<ApiResponse<Contact>>("contacts", payload);
      if (response.data && response.data.success && response.data.data) {
        // Also update local storage
        const all = await loadLocalContacts();
        await saveLocalContacts([response.data.data, ...all]);
        return response.data.data;
      }
    } catch (error) {
      console.warn("API create contact error, saving to local storage fallback:", error);
    }

    const all = await loadLocalContacts();
    const newId = Date.now();
    const newContact: Contact = {
      id: newId,
      name: payload.name,
      company_type: payload.company_type || "company",
      email: payload.email,
      phone: payload.phone,
      mobile: payload.mobile,
      website: payload.website,
      vat: payload.vat,
      function: payload.function,
      street: payload.street,
      street2: payload.street2,
      city: payload.city,
      zip: payload.zip,
      state_id: payload.state_id,
      country_id: payload.country_id,
      parent_id: payload.parent_id,
      company_name: payload.company_name,
      comment: payload.comment,
      category_ids: payload.category_ids,
      active: true,
      created_at: new Date().toISOString().split("T")[0],
    };

    const updatedList = [newContact, ...all];
    await saveLocalContacts(updatedList);
    return newContact;
  },

  /**
   * Update existing contact
   */
  async update(id: number, payload: ContactUpdateParams): Promise<Contact> {
    try {
      const response = await api.put<ApiResponse<Contact>>(`contacts/${id}`, payload);
      if (response.data && response.data.success && response.data.data) {
        const all = await loadLocalContacts();
        const updated = all.map((c) => (c.id === id ? { ...c, ...response.data.data } : c));
        await saveLocalContacts(updated);
        return response.data.data;
      }
    } catch (error) {
      console.warn(`API update contact ${id} error, using local storage fallback:`, error);
    }

    const all = await loadLocalContacts();
    let updatedContact: Contact | null = null;
    const updatedList = all.map((c) => {
      if (c.id === id) {
        updatedContact = {
          ...c,
          ...payload,
          updated_at: new Date().toISOString().split("T")[0],
        };
        return updatedContact;
      }
      return c;
    });

    await saveLocalContacts(updatedList);
    if (!updatedContact) throw new Error(`Contact ${id} not found for update`);
    return updatedContact;
  },

  /**
   * Delete / Archive contact (sets active = false)
   */
  async delete(id: number): Promise<boolean> {
    try {
      const response = await api.delete<ApiResponse<any>>(`contacts/${id}`);
      if (response.data && response.data.success) {
        const all = await loadLocalContacts();
        const updated = all.filter((c) => c.id !== id);
        await saveLocalContacts(updated);
        return true;
      }
    } catch (error) {
      console.warn(`API delete contact ${id} error, fallback to local storage:`, error);
    }

    const all = await loadLocalContacts();
    const updated = all.filter((c) => c.id !== id);
    await saveLocalContacts(updated);
    return true;
  },

  /**
   * Fetch contact tags dropdown list
   */
  async getTags(): Promise<ContactTag[]> {
    try {
      const response = await api.get<ApiResponse<ContactTag[]>>("contact-tags");
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn("API contact-tags error:", error);
    }
    return [
      { id: 1, name: "VIP" },
      { id: 2, name: "Vendor" },
      { id: 3, name: "Customer" },
      { id: 4, name: "Prospect" },
    ];
  },
};
