import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import useToast from "../hooks/useToast";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const username = form.username.trim();
    const password = form.password;

    const fe = {};
    if (!username) fe.username = ["Username is required."];
    if (!password) fe.password = ["Password is required."];

    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome back!");
      nav("/");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Invalid credentials.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Login
        </Typography>

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              error={!!fieldErrors.username}
              helperText={fieldErrors.username?.[0] || ""}
              fullWidth
              required
              autoComplete="username"
              disabled={loading}
            />

            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              error={!!fieldErrors.password}
              helperText={fieldErrors.password?.[0] || ""}
              fullWidth
              required
              autoComplete="current-password"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={<LoginIcon />}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          No account? <Link to="/register">Register</Link>
        </Typography>
      </Paper>
    </Container>
  );
}
