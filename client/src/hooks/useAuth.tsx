import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AuthUser = { id: number; username: string; isAdmin: number; isPremium: number; generationsUsed: number; bonusGenerations: number; bonusSaves: number };

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery<{ user: AuthUser } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to check auth");
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
  });

  const user = data?.user ?? null;

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const result = await res.json();
    queryClient.setQueryData(["/api/auth/me"], result);
    queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
    queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { username, password });
    const result = await res.json();
    queryClient.setQueryData(["/api/auth/me"], result);
    queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
    queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
    queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
  }, []);

  const refreshUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
