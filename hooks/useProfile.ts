import { useAuth } from "./useAuth";

export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  return { profile: user ?? null, isLoading: !isAuthenticated };
}
