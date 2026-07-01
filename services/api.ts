import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";

// ──────────────────────────────────────────────
// Secure storage helpers (expo-secure-store with web fallback)
// ──────────────────────────────────────────────
let SecureStore: typeof import("expo-secure-store") | null = null;

async function ensureSecureStore() {
  if (!SecureStore) {
    SecureStore = await import("expo-secure-store");
  }
  return SecureStore;
}

async function getToken(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  try {
    const store = await ensureSecureStore();
    return store.getItemAsync(key);
  } catch {
    // Fallback for environments where secure-store is unavailable
    return null;
  }
}

async function setToken(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  try {
    const store = await ensureSecureStore();
    await store.setItemAsync(key, value);
  } catch {
    // Silently fail — token will be missing on next request
  }
}

async function removeToken(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  try {
    const store = await ensureSecureStore();
    await store.deleteItemAsync(key);
  } catch {
    // Silently fail
  }
}

// ──────────────────────────────────────────────
// In-memory token cache (fast path, survives within session)
// ──────────────────────────────────────────────
let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

const STORAGE_KEYS = {
  ACCESS: "access_token",
  REFRESH: "refresh_token",
};

export async function loadTokensFromStorage(): Promise<{
  access: string | null;
  refresh: string | null;
}> {
  const [access, refresh] = await Promise.all([
    getToken(STORAGE_KEYS.ACCESS),
    getToken(STORAGE_KEYS.REFRESH),
  ]);
  accessToken = access;
  refreshTokenValue = refresh;
  return { access, refresh };
}

export async function setTokens(
  access: string,
  refresh: string,
): Promise<void> {
  accessToken = access;
  refreshTokenValue = refresh;
  await Promise.all([
    setToken(STORAGE_KEYS.ACCESS, access),
    setToken(STORAGE_KEYS.REFRESH, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshTokenValue = null;
  await Promise.all([
    removeToken(STORAGE_KEYS.ACCESS),
    removeToken(STORAGE_KEYS.REFRESH),
  ]);
}

// ──────────────────────────────────────────────
// Auth failure callback (registered by AuthContext)
// ──────────────────────────────────────────────
let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(callback: () => void): void {
  onAuthFailure = callback;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://pmdev.unotek.co.id/api/v1/";

export { API_URL };

// ──────────────────────────────────────────────
// Token refresh state (prevent race conditions)
// ──────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

async function refreshAccessToken(): Promise<string> {
  if (!refreshTokenValue) {
    throw new Error("No refresh token available");
  }

  // Use a fresh axios instance to avoid interceptor loops
  const response = await axios.post(
    `${API_URL}auth/refresh`,
    { refresh_token: refreshTokenValue },
  );

  const newAccess: string = response.data.data.access_token;
  accessToken = newAccess;
  await setToken(STORAGE_KEYS.ACCESS, newAccess);
  return newAccess;
}

// ──────────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ──────────────────────────────────────────────
// Request interceptor — attach Bearer token
// ──────────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Load token from in-memory cache (fast path)
    if (!accessToken) {
      accessToken = await getToken(STORAGE_KEYS.ACCESS);
    }

    // Attach token, but skip for auth endpoints (login, refresh, logout)
    if (accessToken && config.url) {
      const isAuthEndpoint =
        config.url.includes("/auth/login") ||
        config.url.includes("/auth/refresh");

      if (!isAuthEndpoint) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ──────────────────────────────────────────────
// Response interceptor — 401 → refresh → retry
// ──────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 and skip if already retried or if it's the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      const result = await api(originalRequest);

      // Resolve all queued requests
      refreshQueue.forEach((q) => q.resolve(newToken));
      refreshQueue = [];

      return result;
    } catch (refreshError) {
      // Reject all queued requests
      refreshQueue.forEach((q) => q.reject(refreshError));
      refreshQueue = [];

      // Clear tokens and trigger auth failure
      await clearTokens();
      if (onAuthFailure) {
        onAuthFailure();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { api };
