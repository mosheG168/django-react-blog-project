// src/api/client.js
import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

// Centralized axios instance
const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: false,
});

/* ---------------- Token helpers ---------------- */
export function getTokens() {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setTokens(tokens) {
  localStorage.setItem("auth", JSON.stringify(tokens));
}
export function clearTokens() {
  localStorage.removeItem("auth");
}

/* ---------------- Request interceptor ---------------- */
// Attach Authorization on ALL requests when we have a token.
// This lets the backend compute fields like `liked_by_me` on GET /posts.
api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${tokens.access}`;
    config.__auth_required = true;
  } else {
    config.__auth_required = false;
  }
  return config;
});

/* ---------------- Response interceptor ---------------- */
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config || {};
    const status = error?.response?.status;

    // Skip refresh if not auth-related or already retried
    if (status !== 401 || !original.__auth_required || original._retry) {
      throw error;
    }

    const tokens = getTokens();
    if (!tokens?.refresh) {
      clearTokens();
      throw error;
    }

    // Avoid multiple refresh calls at once
    if (!refreshing) {
      refreshing = axios
        .post(`${baseURL}/api/token/refresh/`, { refresh: tokens.refresh })
        .then((r) => {
          const next = { ...tokens, access: r.data.access };
          setTokens(next);
          refreshing = null;
          return next.access;
        })
        .catch((e) => {
          clearTokens();
          refreshing = null;
          throw e;
        });
    }

    try {
      const newAccess = await refreshing;
      original._retry = true;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      throw error;
    }
  }
);

export default api;
