import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import useToast from "../hooks/useToast";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

export default function Register() {
  const { register } = useAuth(); // Option A: backed by /api/auth/register/
  const nav = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    // client-side guardrails
    const fe = {};
    if (!payload.username) fe.username = ["Username is required."];
    if (!payload.email) fe.email = ["Email is required."];
    if (!payload.password) fe.password = ["Password is required."];

    // lightweight email check
    if (payload.email && !/\S+@\S+\.\S+/.test(payload.email)) {
      fe.email = ["Please enter a valid email address."];
    }

    // password policy hint (mirrors backend)
    // ≥8 chars, at least one lowercase, one uppercase, one digit, one special
    if (
      payload.password &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(
        payload.password
      )
    ) {
      fe.password = [
        "Min 8 chars, include lower/upper case, a digit, and a symbol.",
      ];
    }

    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      await register(payload); // should create user + profile and return JWT
      toast.success("Account created. Welcome! 🎉");
      nav("/");
    } catch (err) {
      // Surface server messages and field errors if present
      const res = err?.response?.data;
      const msg =
        res?.detail ||
        res?.message ||
        res?.non_field_errors?.[0] ||
        err?.message ||
        "Registration failed.";
      setFormError(msg);

      if (res && typeof res === "object") {
        const fe2 = {};
        for (const k of Object.keys(res)) {
          if (k !== "detail" && Array.isArray(res[k])) fe2[k] = res[k];
        }
        if (Object.keys(fe2).length) setFieldErrors(fe2);
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Register
        </Typography>

        <form onSubmit={onSubmit}>
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
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              error={!!fieldErrors.email}
              helperText={fieldErrors.email?.[0] || ""}
              fullWidth
              required
              autoComplete="email"
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
              helperText={
                fieldErrors.password?.[0] ||
                "Min 8 chars, use lower/upper case, a digit, and a symbol."
              }
              fullWidth
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create account"}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Already have an account? <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </Container>
  );
}
