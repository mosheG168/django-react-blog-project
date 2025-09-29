import { useEffect, useState } from "react";
import { myPosts } from "../api/posts";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Stack,
  Skeleton,
  Alert,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAuth } from "../context/AuthContext";

export default function MyPosts() {
  const { loading: authLoading, isAuthed } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;

    if (authLoading) return;

    if (!isAuthed) {
      setLoading(false);
      setItems([]);
      setErr({ message: "Please log in to view your posts." });
      return;
    }

    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const data = await myPosts();
        if (!alive) return;
        setItems(Array.isArray(data) ? data : (data?.results ?? []));
      } catch (e) {
        if (!alive) return;
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "Failed to load your posts.";
        setErr({ message: msg });
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authLoading, isAuthed]);

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        My Posts
      </Typography>

      {err && (
        <Alert
          severity={isAuthed ? "error" : "info"}
          sx={{ mb: 2 }}
          action={
            !isAuthed ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => nav("/login")}
              >
                Login
              </Button>
            ) : null
          }
        >
          {err.message}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card variant="outlined">
                <CardContent>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="text" width="40%" height={18} />
                  <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ mt: 1.5 }}
                  />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rounded" width={90} height={32} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : items.length ? (
        <Grid container spacing={2}>
          {items.map((p) => (
            <Grid item xs={12} md={6} lg={4} key={p.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1.5 }}>
                    {(p.text ?? "").slice(0, 160)}
                    {(p.text ?? "").length > 160 ? "…" : ""}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    component={Link}
                    to={`/posts/${p.id}`}
                    size="small"
                    startIcon={<VisibilityIcon />}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack alignItems="center" sx={{ py: 8, color: "text.secondary" }}>
          <Typography variant="h6" gutterBottom>
            You haven’t posted anything yet.
          </Typography>
          <Typography variant="body2">
            Create a new post from the “New Post” page (managers only).
          </Typography>
        </Stack>
      )}
    </Container>
  );
}
