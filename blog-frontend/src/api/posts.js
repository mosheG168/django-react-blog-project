// src/api/posts.js
import api from "./client";

/* ---------------- Endpoints ---------------- */

export async function listPosts({
  page = 1,
  page_size, // optional
  search,
  tag,
  tag_id,
  author_id,
  ordering = "-created_at",
} = {}) {
  const params = { page, ordering };
  if (page_size != null) params.page_size = page_size;

  // only include non-empty values (keeps URLs clean)
  if (search && String(search).trim()) params.search = String(search).trim();
  if (tag && String(tag).trim()) params.tag = String(tag).trim();
  if (tag_id != null && String(tag_id).trim())
    params.tag_id = String(tag_id).trim();
  if (author_id != null && String(author_id).trim())
    params.author_id = String(author_id).trim();

  const { data } = await api.get("/posts/", { params });
  return data;
}

/** Get single post detail (includes likes_count, liked_by_me, and (conditionally) likers) */
export async function getPost(id) {
  const { data } = await api.get(`/posts/${id}/`);
  return data;
}

/* ---------------- Private endpoints ---------------- */

/** Create a new post — payload MUST include tag_inputs (array of IDs or names) */
export async function createPost(payload) {
  // payload: { title, text, tag_inputs: string[] }
  const { data } = await api.post("/posts/", payload);
  return data;
}

/** Update a post (PATCH). Include tag_inputs only if changing tags */
export async function updatePost(id, patch) {
  const { data } = await api.patch(`/posts/${id}/`, patch);
  return data;
}

/** Get the current user’s posts */
export async function myPosts() {
  const { data } = await api.get("/posts/mine/");
  return data;
}

export async function deletePost(id) {
  await api.delete(`/posts/${id}/`);
  return true;
}

/* ---------------- Likes ---------------- */

/** Like a post (idempotent on server) */
export async function likePost(postId) {
  const { data } = await api.post("/post-user-likes/", {
    post: Number(postId),
  });
  return data; // like object
}

/** Unlike a post */
export async function unlikePost(postId) {
  await api.delete(`/post-user-likes/${Number(postId)}/by-post/`);
  return true;
}

/**
 * Check if current user liked a post
 * NOTE: Redundant if you already use getPost(id).liked_by_me.
 */
export async function didILike(postId) {
  const { data } = await api.get("/post-user-likes/", {
    params: { post: Number(postId) },
  });
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data?.count === "number") return data.count > 0;
  if (Array.isArray(data?.results)) return data.results.length > 0;
  return false;
}

/**
 * Get "who liked" (owner/manager-only)
 * Reads from the post detail (serializer returns `likers` when authorized).
 */
export async function getLikers(postId) {
  const post = await getPost(postId);
  return Array.isArray(post?.likers) ? post.likers : [];
}
