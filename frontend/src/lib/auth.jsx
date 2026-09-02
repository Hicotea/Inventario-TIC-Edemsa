import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAuthToken, getStoredToken, showError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      return;
    }
    try {
      const [meRes, permRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/auth/permissions"),
      ]);
      setUser(meRes.data);
      setPermissions(permRes.data?.permissions || []);
    } catch (e) {
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuthToken(data.access_token);
      setUser(data.user);
      const permRes = await api.get("/auth/permissions");
      setPermissions(permRes.data?.permissions || []);
      return { ok: true };
    } catch (e) {
      showError(e, "Invalid email or password.");
      return { ok: false, error: e?.friendlyMessage };
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setPermissions([]);
    window.location.replace("/login");
  }, []);

  const hasPerm = useCallback(
    (p) => user?.role === "admin" || permissions.includes(p),
    [user, permissions]
  );

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, hasPerm, isAdmin, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
