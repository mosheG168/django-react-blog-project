import React from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useSearchParams } from "react-router-dom";

function useDebouncedCallback(cb, delay = 400) {
  const timeout = React.useRef();
  return React.useCallback(
    (...args) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

export default function PostsSearchBar() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [q, setQ] = React.useState(sp.get("q") ?? "");

  const doSearch = React.useCallback(
    (query) => {
      const m = query.match(/#([\w-]+)/);
      const params = new URLSearchParams(sp);
      params.delete("page");

      if (m) {
        params.set("tag", m[1]);
        params.delete("search");
      } else {
        if (query.trim()) {
          params.set("search", query.trim());
        } else {
          params.delete("search");
          params.delete("tag");
        }
      }

      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }

      nav(`/posts?${params.toString()}`);
    },
    [nav, sp]
  );

  const debounced = useDebouncedCallback(doSearch, 400);

  const handleChange = (e) => {
    const next = e.target.value;
    setQ(next);
    debounced(next);
  };

  const handleSubmit = () => {
    doSearch(q);
  };

  return (
    <TextField
      placeholder="Search posts… try text or #tag"
      size="small"
      fullWidth
      value={q}
      onChange={handleChange}
      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleSubmit} aria-label="search">
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
