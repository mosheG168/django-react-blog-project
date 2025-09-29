import api from "./client";

export async function listComments(postId, { ordering = "-id", signal } = {}) {
  const { data } = await api.get("/comments/", {
    params: { post: postId, ordering },
    signal,
  });
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function addComment(postId, text) {
  const { data } = await api.post("/comments/", { post: postId, text });
  return data;
}

export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}/`);
  return true;
}
