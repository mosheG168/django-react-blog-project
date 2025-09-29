// src/api/tags.js
import axios from "axios";
import api from "./client"; // keep for private endpoints (create/delete tags etc.)

const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);
const publicApi = axios.create({ baseURL: `${base}/api` });

/** GET /tags/ → [{ id, name, ... }] */
export async function listTags(params = {}) {
  const { data } = await publicApi.get("/tags/", { params });
  return data;
}

/** GET /posts/tag_suggest/?q=foo → [{ id, name, count }] */
export async function suggestTags(q = "") {
  const { data } = await publicApi.get("/posts/tag_suggest/", {
    params: q ? { q } : {},
  });
  return data;
}

/** POST /tags/ → { id, name, ... } (private, requires auth) */
export async function createTag(payload) {
  const { data } = await api.post("/tags/", payload);
  return data;
}

/** DELETE /tags/:id/ (private, requires auth) */
export async function deleteTag(id) {
  const { data } = await api.delete(`/tags/${id}/`);
  return data;
}
