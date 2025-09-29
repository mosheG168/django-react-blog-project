// src/pages/PostDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast";
import { getPost, likePost, unlikePost, deletePost } from "../api/posts";
import { listComments, addComment, deleteComment } from "../api/comments";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Stack,
  Divider,
  IconButton,
  Alert,
  Skeleton,
} from "@mui/material";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const [comments, setComments] = useState([]); // always an array
  const [loadingComments, setLoadingComments] = useState(true);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  // filled icon when true
  const [liked, setLiked] = useState(false);

  // Load post (and initialize liked from server)
  useEffect(() => {
    let alive = true;
    setLoadingPost(true);
    getPost(id)
      .then((data) => {
        if (!alive) return;
        setPost(data);
        setLiked(Boolean(data?.liked_by_me));
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load post.");
      })
      .finally(() => alive && setLoadingPost(false));
    return () => {
      alive = false;
    };
  }, [id, toast]);

  // Load comments for this post
  useEffect(() => {
    const ac = new AbortController();
    setLoadingComments(true);
    listComments(id, { signal: ac.signal })
      .then((arr) => setComments(Array.isArray(arr) ? arr : []))
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error(err);
        toast.error("Failed to load comments.");
        setComments([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingComments(false);
      });
    return () => ac.abort();
  }, [id, toast]);

  const onComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const created = await addComment(Number(id), text.trim());
      setComments((prev) => [created, ...(prev || [])]);
      setText("");
      toast.success("Comment posted");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Could not post the comment.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onDeleteComment = async (cid) => {
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await deleteComment(cid);
      setComments((prev) => prev.filter((c) => c.id !== cid));
      toast.success("Comment deleted");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete comment.");
    } finally {
      setBusy(false);
    }
  };

  // Admin: delete post
  const onDeletePost = async () => {
    if (!post) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setBusy(true);
    try {
      await deletePost(post.id);
      toast.success("Post deleted");
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Could not delete post.");
    } finally {
      setBusy(false);
    }
  };

  // Toggle like/unlike with filled/outline icon and snackbars
  const onToggleLike = async () => {
    if (!post || !user) return;
    setBusy(true);
    try {
      if (liked) {
        await unlikePost(post.id);
        setLiked(false);
        setPost((p) => ({
          ...p,
          likes_count: Math.max(0, (p?.likes_count || 1) - 1),
        }));
        toast.info("Like removed");
      } else {
        await likePost(post.id);
        setLiked(true);
        setPost((p) => ({ ...p, likes_count: (p?.likes_count || 0) + 1 }));
        toast.success("Liked 👍");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not update like");
    } finally {
      setBusy(false);
    }
  };

  // Skeleton while loading post
  if (loadingPost) {
    return (
      <Container sx={{ py: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Skeleton variant="text" width="40%" height={36} />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="rectangular" sx={{ mt: 2 }} height={160} />
        </Paper>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">Post not found.</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {post.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {post.author_username ?? `Author #${post.author_id}`} ·{" "}
              {post.created_at
                ? new Date(post.created_at).toLocaleString()
                : "—"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {user && (
              <>
                <IconButton
                  disabled={busy}
                  onClick={onToggleLike}
                  color={liked ? "primary" : "default"}
                  aria-label={liked ? "Unlike" : "Like"}
                >
                  {liked ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />}
                </IconButton>
                <Typography variant="body2">
                  {post?.likes_count ?? 0} likes
                </Typography>
              </>
            )}

            {isAdmin && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  disabled={busy}
                  onClick={onDeletePost}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        </Stack>

        <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
          {post.text}
        </Typography>

        {/* Tags (if present) */}
        {Array.isArray(post?.tags) && post.tags.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}
          >
            {post.tags.map((t) => (
              <Button
                key={t.id}
                size="small"
                variant="outlined"
                onClick={() =>
                  navigate(`/posts?tag=${encodeURIComponent(t.name)}`)
                }
              >
                {t.name}
              </Button>
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Comments</Typography>

        {/* Comment form */}
        {user ? (
          <Box component="form" onSubmit={onComment} sx={{ mt: 1, mb: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write a comment…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button type="submit" variant="contained" disabled={busy}>
                Send
              </Button>
            </Stack>
          </Box>
        ) : (
          <Alert sx={{ mt: 1, mb: 2 }} severity="info">
            Please log in to comment.
          </Alert>
        )}

        {/* Comments list */}
        {loadingComments ? (
          <Stack spacing={1}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="90%" />
              </Paper>
            ))}
          </Stack>
        ) : Array.isArray(comments) && comments.length ? (
          <Stack spacing={1}>
            {comments.map((c) => (
              <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="caption" color="text.secondary">
                    {c.author_username
                      ? `By ${c.author_username}`
                      : `By profile #${c.author_id}`}
                  </Typography>
                  {isAdmin && (
                    <IconButton
                      size="small"
                      color="error"
                      disabled={busy}
                      onClick={() => onDeleteComment(c.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Typography variant="body2">{c.text}</Typography>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No comments yet — be the first to comment.
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
