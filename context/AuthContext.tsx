import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import {
  loadTokensFromStorage,
  setTokens,
  clearTokens,
  setOnAuthFailure,
} from "../services/api";
import type { ProfileResponse } from "../types/profile";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ProfileResponse | null;
}

export interface AuthContextValue extends AuthState {
  login: (login: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────
export const AuthContext = createContext<AuthContextValue | null>(null);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await profileService.getProfile();
      setState((prev) => ({ ...prev, user: res.data.data }));
    } catch {
      // Profile fetch failed — keep existing user data
    }
  }, []);

  // ── Bootstrap: check stored tokens on mount ──
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const tokens = await loadTokensFromStorage();
        if (tokens.access && tokens.refresh) {
          // Validate by fetching profile
          const res = await profileService.getProfile();
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: res.data.data,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        // Token invalid or expired — clear and stay on login
        await clearTokens();
        setState({ isAuthenticated: false, isLoading: false, user: null });
      }
    };

    bootstrap();
  }, []);

  // ── Register auth failure callback for interceptor ──
  useEffect(() => {
    setOnAuthFailure(() => {
      setState({ isAuthenticated: false, isLoading: false, user: null });
    });
  }, []);

  // ── Login ──
  const login = useCallback(async (login: string, password: string, rememberMe?: boolean) => {
    const res = await authService.login({ login, password });
    const { access_token, refresh_token } = res.data.data;

    // If Remember Me is OFF, store only access_token (session-only).
    // If ON (default), store both tokens so refresh works after app restart.
    if (rememberMe !== false) {
      await setTokens(access_token, refresh_token);
    } else {
      // Store only access token — refresh token is not saved,
      // so on next app start the session won't restore.
      await setTokens(access_token, "");
    }

    // Fetch profile after successful login
    const profileRes = await profileService.getProfile();
    setState({
      isAuthenticated: true,
      isLoading: false,
      user: profileRes.data.data,
    });
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if logout API fails, clear local tokens
    }
    await clearTokens();
    setState({ isAuthenticated: false, isLoading: false, user: null });
  }, []);

  // ── Memoized context value ──
  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refreshUser }),
    [state, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
