"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken } from "@/lib/api";
import type { Staff } from "@/lib/types";

interface AuthContextValue {
  staff: Staff | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Staff>("/auth/me")
      .then(setStaff)
      .catch(() => setStaff(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { access_token } = await api.post<{ access_token: string }>("/auth/login", {
      email,
      password,
    });
    setToken(access_token);
    const me = await api.get<Staff>("/auth/me");
    setStaff(me);
  }

  function logout() {
    setToken(null);
    setStaff(null);
  }

  return (
    <AuthContext.Provider value={{ staff, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
