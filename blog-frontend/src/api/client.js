import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: false,
});

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

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config || {};
    const status = error?.response?.status;

    if (status !== 401 || !original.__auth_required || original._retry) {
      throw error;
    }

    const tokens = getTokens();
    if (!tokens?.refresh) {
      clearTokens();
      throw error;
    }

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
