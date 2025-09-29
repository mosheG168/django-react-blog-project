// src/pages/EditPost.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  Skeleton,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import useToast from "../hooks/useToast";
import TagSelector from "../components/TagSelector";
import { useAuth } from "../context/AuthContext";
import { getPost, updatePost } from "../api/posts";

export default function EditPost() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { loading: authLoading, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  // TagSelector expects array of names/ids (we'll use names for free-text create)
  const [tagInputs, setTagInputs] = useState([]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Load existing post
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPost(id)
      .then((data) => {
        if (!alive) return;
        setTitle(data.title || "");
        setText(data.text || "");
        // Prefer names so backend can create if new; fallback to ids if missing
        const names = (data.tags || [])
          .map((t) => t?.name?.trim())
          .filter(Boolean);
        setTagInputs(
          names.length ? names : (data.tags || []).map((t) => String(t.id))
        );
      })
      .catch((err) => {
        console.error(err);
        setFormError("Failed to load the post.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  // Guard: wait for auth resolution
  if (authLoading) return null;

  // Hard guard: only admins can access
  if (!isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Not allowed
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Only an administrator can edit posts.
          </Alert>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            startIcon={<ArrowBackIcon />}
          >
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setFieldErrors({ title: ["Title is required."] });
      toast.warning("Please give your post a title.");
      return;
    }
    if (!tagInputs.length) {
      setFieldErrors({
        tag_inputs: ["At least one category tag is required."],
      });
      toast.warning("Pick at least one category tag.");
      return;
    }

    setSaving(true);
    try {
      const patch = {
        title,
        text,
        tag_inputs: tagInputs, // names or ids
      };
      const updated = await updatePost(Number(id), patch);
      toast.success("Post updated ✅");
      nav(`/posts/${updated.id}`, { replace: true });
    } catch (err) {
      const res = err?.response?.data;
      setFormError(res?.detail || err?.message || "Could not update the post.");
      const fe = {};
      if (res && typeof res === "object") {
        Object.keys(res).forEach((k) => {
          if (k !== "detail" && Array.isArray(res[k])) fe[k] = res[k];
        });
      }
      setFieldErrors(fe);
      toast.error(res?.detail || "Could not update the post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="h5" fontWeight={800}>
            Edit Post
          </Typography>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => nav(-1)}
          >
            Back
          </Button>
        </Stack>

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="text" width="50%" height={36} />
            <Skeleton variant="rectangular" height={160} />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="rounded" width={140} height={36} />
          </Stack>
        ) : (
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!fieldErrors.title}
                helperText={fieldErrors.title?.[0] || ""}
                required
                fullWidth
              />

              <TextField
                label="Text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                multiline
                minRows={6}
                error={!!fieldErrors.text}
                helperText={fieldErrors.text?.[0] || ""}
                fullWidth
              />

              <TagSelector
                value={tagInputs}
                onChange={setTagInputs}
                error={!!fieldErrors.tag_inputs}
                helperText={fieldErrors.tag_inputs?.[0] || ""}
                label="Categories"
              />

              {formError && <Alert severity="error">{formError}</Alert>}

              <Stack direction="row" spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => nav(`/posts/${id}`)}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
}
