import React from "react";
import { TextField, Chip, CircularProgress, Autocomplete } from "@mui/material";
import { suggestTags } from "../api/tags";

export default function TagSelector({
  value, // string[]  (IDs as strings or names)
  onChange, // (next: string[]) => void
  error,
  helperText,
  label = "Categories (min 1)",
}) {
  const [options, setOptions] = React.useState([]); // [{id,name,count}]
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const debouncedFetch = React.useMemo(() => {
    let t;
    return (q) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await suggestTags(q);
          setOptions(res || []);
        } finally {
          setLoading(false);
        }
      }, 250);
    };
  }, []);

  const selectedMixed = React.useMemo(() => {
    const byName = new Map(options.map((o) => [o.name.toLowerCase(), o]));
    return (value || []).map((v) => {
      const s = String(v).trim();
      if (/^\d+$/.test(s)) {
        return options.find((o) => String(o.id) === s) || s;
      }
      return byName.get(s.toLowerCase()) || s;
    });
  }, [value, options]);

  // Add a raw string into the selection with CI uniqueness
  const addFreeText = React.useCallback(
    (raw) => {
      const s = String(raw || "").trim();
      if (!s) return;
      const seen = new Set((value || []).map((v) => String(v).toLowerCase()));
      if (!seen.has(s.toLowerCase())) {
        onChange([...(value || []), s]);
      }
    },
    [onChange, value]
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      filterSelectedOptions
      options={options}
      value={selectedMixed}
      inputValue={inputValue}
      getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
      onInputChange={(_, q, reason) => {
        // ✅ Only update when user is typing; ignore 'reset'/'clear' that would blank the input
        if (reason === "input") {
          setInputValue(q);
          debouncedFetch(q);
        }
      }}
      onChange={(_, newValue) => {
        // Prefer names so backend can create if needed
        const next = newValue
          .map((v) =>
            typeof v === "string" ? v.trim() : String(v.name || "").trim()
          )
          .filter(Boolean);

        const seen = new Set();
        const unique = [];
        for (const s of next) {
          const k = s.toLowerCase();
          if (!seen.has(k)) {
            seen.add(k);
            unique.push(s);
          }
        }
        onChange(unique);
      }}
      // Auto-commit whatever the user has typed when leaving the field
      onBlur={() => {
        if (inputValue.trim()) {
          addFreeText(inputValue);
          setInputValue("");
        }
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((opt, i) => {
          const label = typeof opt === "string" ? opt : opt.name;
          return (
            <Chip
              {...getTagProps({ index: i })}
              key={i}
              label={label}
              size="small"
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={
            error ? helperText : "Type and press Enter — or just click Save"
          }
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
