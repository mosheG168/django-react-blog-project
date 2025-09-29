import api, { setTokens, clearTokens } from "./client";

/** Option A: custom AuthViewSet endpoints */
export async function login(username, password) {
  const { data } = await api.post("/auth/login/", { username, password });
  // expect { access, refresh, ... }
  if (data?.access && data?.refresh)
    setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export async function register({ username, email, password }) {
  const { data } = await api.post("/auth/register/", {
    username,
    email,
    password,
  });
  // expect { access, refresh, user: {...} } per your AuthViewSet
  if (data?.access && data?.refresh)
    setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export async function me() {
  const { data } = await api.get("/me/");
  return data; // { user, profile }
}

export function logout() {
  clearTokens();
}
