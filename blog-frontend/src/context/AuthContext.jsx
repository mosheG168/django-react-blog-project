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
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (username, password) => {
    await apiLogin(username.trim(), password);
    const data = await apiMe();
    setUser(data.user);
    setProfile(data.profile);
  };

  const register = async (fields) => {
    await apiRegister({
      username: fields.username.trim(),
      email: fields.email.trim(),
      password: fields.password,
    });
    const data = await apiMe();
    setUser(data.user);
    setProfile(data.profile);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setProfile(null);
  };

  const isManager = !!(
    profile?.role === "manager" ||
    user?.is_staff ||
    user?.is_superuser
  );

  const isAdmin = isManager;

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthed: !!user,
      isAdmin,
      isManager,
      canManagePosts: isManager,
      canModerateComments: isManager,
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
