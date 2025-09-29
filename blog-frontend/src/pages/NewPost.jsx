// src/pages/NewPost.jsx
import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api/client";
import useToast from "../hooks/useToast";
import TagSelector from "../components/TagSelector";
import { useAuth } from "../context/AuthContext";

import {
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export default function NewPost() {
  const { loading, isAdmin } = useAuth(); // ← added
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tagInputs, setTagInputs] = useState([]); // array of tag IDs or names
  const [saving, setSaving] = useState(false);

  // field-level errors coming from DRF (e.g., { title: ["..."], tag_inputs: ["..."] })
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const toast = useToast();
  const nav = useNavigate();

  // If auth is still resolving, render nothing (keeps UX smooth)
  if (loading) return null;

  // Hard guard: only admins can access this page
  if (!isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Not allowed
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Only an administrator can create posts.
          </Alert>
          <Button component={RouterLink} to="/" variant="contained">
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

    const tTitle = title.trim();
    const tText = text.trim();

    // basic client-side checks (match backend MinLengthValidator(5))
    const fe = {};
    if (!tTitle) fe.title = ["Title is required."];
    else if (tTitle.length < 5)
      fe.title = ["Title must be at least 5 characters."];

    if (!tText) fe.text = ["Text is required."];
    else if (tText.length < 5)
      fe.text = ["Text must be at least 5 characters."];

    if (!tagInputs.length) {
      fe.tag_inputs = ["At least one category tag is required."];
    }

    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      // show a concise toast too
      toast.warning("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const { data: created } = await api.post("/posts/", {
        title: tTitle,
        text: tText,
        tag_inputs: tagInputs, // ✅ required by your backend
      });

      toast.success("Post created ✅");
      nav(`/posts/${created.id}`);
    } catch (err) {
      const res = err?.response?.data;

      // Handle unauthorized nicely
      if (err?.response?.status === 401) {
        toast.error("Your session expired. Please log in again.");
        nav("/login");
        return;
      }

      // top-level error message (e.g., detail)
      setFormError(res?.detail || err?.message || "Could not create the post.");

      // collect field errors from DRF response
      const fe2 = {};
      if (res && typeof res === "object") {
        Object.keys(res).forEach((k) => {
          if (k !== "detail" && Array.isArray(res[k])) fe2[k] = res[k];
        });
      }
      setFieldErrors(fe2);

      // toast a concise message as well
      toast.error(res?.detail || "Could not create the post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          New Post
        </Typography>

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
            />

            {formError && <Alert severity="error">{formError}</Alert>}

            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? "Saving..." : "Create Post"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
