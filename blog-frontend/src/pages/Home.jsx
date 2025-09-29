import { useEffect, useRef, useState, useMemo } from "react";
import { listPosts } from "../api/posts";
import { suggestTags } from "../api/tags";
import {
  Box,
  Container,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Pagination,
  Stack,
  Skeleton,
  Chip,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { Link } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import useToast from "../hooks/useToast";

const PAGE_SIZE = 10;

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("");
  const [tagOptions, setTagOptions] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState({ count: 0, results: [] });
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const debouncedSearch = useDebounced(search, 350);

  const effective = useMemo(() => {
    const m = debouncedSearch.match(/#([\w-]+)/);
    return {
      search: m ? "" : debouncedSearch.trim(),
      tag: m ? m[1] : tag?.trim() || "",
    };
  }, [debouncedSearch, tag]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await listPosts({
          page,
          page_size: PAGE_SIZE,
          search: effective.search || undefined,
          ordering,
          tag: effective.tag || undefined,
        });

        if (cancelled) return;

        const count = Array.isArray(data)
          ? data.length
          : typeof data?.count === "number"
            ? data.count
            : (data?.results?.length ?? 0);

        const results = Array.isArray(data) ? data : (data?.results ?? []);
        setResp({ count, results });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.detail ||
          err?.message ||
          "Failed to load posts.";
        toastRef.current?.error(msg);
        setResp({ count: 0, results: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, ordering, effective.search, effective.tag]); // ← dependencies

  const totalPages = Math.max(1, Math.ceil((resp.count || 0) / PAGE_SIZE));

  const handleTagSuggest = useMemo(() => {
    let t;
    return (q) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        setTagLoading(true);
        try {
          const data = await suggestTags(q);
          setTagOptions(data || []);
        } finally {
          setTagLoading(false);
        }
      }, 250);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setTagLoading(true);
        const data = await suggestTags("");
        setTagOptions(data || []);
      } finally {
        setTagLoading(false);
      }
    })();
  }, []);

  const clearFilters = () => {
    setSearch("");
    setTag("");
    setOrdering("-created_at");
    setPage(1);
  };

  const clearHashtagFromSearch = () => {
    const next = (search || "")
      .replace(/(^|\s)#([\w-]+)\b/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    setSearch(next);
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Posts
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search (try text or #tag)"
          size="small"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Autocomplete
          freeSolo
          size="small"
          options={tagOptions}
          getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
          value={tag ? { id: 0, name: tag } : null}
          onInputChange={(_, q, reason) => {
            if (reason === "input") handleTagSuggest(q);
          }}
          onChange={(_, newVal) => {
            setPage(1);
            setTag(
              newVal ? (typeof newVal === "string" ? newVal : newVal.name) : ""
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Tag"
              placeholder="Type to search tags"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {tagLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
          )}
          isOptionEqualToValue={(o, v) =>
            o.name?.toLowerCase() === v.name?.toLowerCase()
          }
        />

        <TextField
          select
          label="Sort"
          size="small"
          value={ordering}
          onChange={(e) => {
            setPage(1);
            setOrdering(e.target.value);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="-created_at">Newest</MenuItem>
          <MenuItem value="created_at">Oldest</MenuItem>
          <MenuItem value="title">Title A→Z</MenuItem>
          <MenuItem value="-title">Title Z→A</MenuItem>
          <MenuItem value="-likes_count">Most Liked</MenuItem>
          <MenuItem value="likes_count">Least Liked</MenuItem>
        </TextField>

        <Button variant="outlined" onClick={clearFilters}>
          Reset
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
        {effective.tag && (
          <Chip
            label={`Tag: ${effective.tag}`}
            size="small"
            onDelete={() => {
              setTag("");
              clearHashtagFromSearch();
              setPage(1);
            }}
          />
        )}
        {effective.search && (
          <Chip
            label={`Search: ${effective.search}`}
            size="small"
            onDelete={() => setSearch("")}
          />
        )}
      </Stack>

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
      ) : resp.results?.length ? (
        <>
          <Grid container spacing={2}>
            {resp.results.map((p) => (
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
                      {p.author_username
                        ? p.author_username
                        : `Author #${p.author_id}`}{" "}
                      ·
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : "—"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.5 }}>
                      {(p.text ?? "").slice(0, 160)}
                      {(p.text ?? "").length > 160 ? "…" : ""}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mt: 1 }}
                      flexWrap="wrap"
                    >
                      {(p.tags || []).map((t) => (
                        <Chip
                          key={t.id}
                          size="small"
                          label={t.name}
                          onClick={() => {
                            setTag(t.name);
                            clearHashtagFromSearch();
                            setPage(1);
                          }}
                        />
                      ))}
                    </Stack>

                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block" }}
                    >
                      ❤️ {p.likes_count ?? 0}{" "}
                      {p.liked_by_me ? "• You liked this" : ""}
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

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              color="primary"
              page={page}
              count={totalPages}
              onChange={(_, val) => setPage(val)}
            />
          </Box>
        </>
      ) : (
        <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="h6" gutterBottom>
            No posts found
          </Typography>
          <Typography variant="body2">
            Try adjusting your search or tag filter.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
