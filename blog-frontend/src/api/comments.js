// src/api/comments.js
import api from "./client";

/** List comments for a post (paginated or array) */
export async function listComments(postId, { ordering = "-id", signal } = {}) {
  const { data } = await api.get("/comments/", {
    params: { post: postId, ordering },
    signal,
  });
  return Array.isArray(data) ? data : (data?.results ?? []);
}

/** Add a comment to a post */
export async function addComment(postId, text) {
  const { data } = await api.post("/comments/", { post: postId, text });
  return data;
}

/** Delete a comment by ID */
export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}/`);
  return true;
}
