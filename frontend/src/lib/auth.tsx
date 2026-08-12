"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api, type User } from "./api";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem("luma_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed?.id && parsed?.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("luma_token");
    const cached = readCachedUser();

    if (!token) {
      setLoading(false);
      return;
    }

    if (cached) setUser(cached);

    api
      .me()
      .then((res) => {
        setUser(res.user);
        localStorage.setItem("luma_user", JSON.stringify(res.user));
      })
      .catch((err) => {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 401) {
          localStorage.removeItem("luma_token");
          localStorage.removeItem("luma_user");
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem("luma_token", res.token);
    localStorage.setItem("luma_user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.signup({ name, email, password });
      localStorage.setItem("luma_token", res.token);
      localStorage.setItem("luma_user", JSON.stringify(res.user));
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("luma_token");
    localStorage.removeItem("luma_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
