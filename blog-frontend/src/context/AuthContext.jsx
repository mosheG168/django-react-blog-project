// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
  register as apiRegister,
} from "../api/auth";
import { getTokens, clearTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Django auth user (id, username, email, is_staff, is_superuser)
  const [profile, setProfile] = useState(null); // UserProfile (id, role, bio, birth_date...)
  const [loading, setLoading] = useState(true);

  // ---- Initial session restore ----
  useEffect(() => {
    let alive = true;
    const tokens = getTokens();
    if (!tokens?.access) {
      if (alive) setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await apiMe();
        if (!alive) return;
        setUser(data?.user ?? null);
        setProfile(data?.profile ?? null);
      } catch (err) {
        if (!alive) return;
        // 401 → treat as logged out
        if (err?.response?.status === 401) {
          clearTokens();
        }
        setUser(null);
        setProfile(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- Auth flows ----
  const login = async (username, password) => {
    await apiLogin(username.trim(), password); // stores tokens internally
    const data = await apiMe();
    setUser(data.user);
    setProfile(data.profile);
  };

  const register = async (fields) => {
    // fields: { username, email, password }
    await apiRegister({
      username: fields.username.trim(),
      email: fields.email.trim(),
      password: fields.password,
    }); // stores tokens internally
    const data = await apiMe();
    setUser(data.user);
    setProfile(data.profile);
  };

  const logout = () => {
    apiLogout(); // clears tokens
    setUser(null);
    setProfile(null);
  };

  // ---- Role flags (manager = מנהל) ----
  // Treat Django staff/superuser as managers too (admin panel users).
  const isManager = !!(
    profile?.role === "manager" ||
    user?.is_staff ||
    user?.is_superuser
  );

  // Back-compat alias (your UI already uses isAdmin)
  const isAdmin = isManager;

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthed: !!user,
      isAdmin, // alias of isManager
      isManager, // explicit name for clarity
      canManagePosts: isManager, // only manager can CRUD posts
      canModerateComments: isManager, // only manager can delete comments
      login,
      register,
      logout,
    }),
    [user, profile, loading, isManager, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
