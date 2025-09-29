import axios from "axios";
import api from "./client";

const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);
const publicApi = axios.create({ baseURL: `${base}/api` });

export async function listTags(params = {}) {
  const { data } = await publicApi.get("/tags/", { params });
  return data;
}

export async function suggestTags(q = "") {
  const { data } = await publicApi.get("/posts/tag_suggest/", {
    params: q ? { q } : {},
  });
  return data;
}

export async function createTag(payload) {
  const { data } = await api.post("/tags/", payload);
  return data;
}

export async function deleteTag(id) {
  const { data } = await api.delete(`/tags/${id}/`);
  return data;
}
